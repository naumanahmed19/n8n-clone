import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Key,
  Variable,
  Check,
  X,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UnifiedCredentialSelector } from "../credential/UnifiedCredentialSelector";
import { workflowService } from "../../services/workflow";
import { useToast } from "../../hooks/useToast";

interface TemplateCredentialRequirement {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  credentialType: string;
  credentialFieldName: string;
  displayName: string;
  description?: string;
  required: boolean;
}

interface TemplateVariableRequirement {
  name: string;
  description?: string;
  defaultValue?: any;
  required: boolean;
  nodeIds: string[];
  nodeNames: string[];
  propertyPath: string;
}

interface WorkflowTemplateMetadata {
  workflowId: string;
  workflowName: string;
  description?: string;
  credentials: TemplateCredentialRequirement[];
  variables: TemplateVariableRequirement[];
  nodeCount: number;
  triggerTypes: string[];
  tags?: string[];
  complexity: "simple" | "medium" | "complex";
  estimatedSetupTime: string;
  setupChecklist: string[];
}

interface WorkflowSetupPanelProps {
  workflowId: string;
  onConfigurationSaved?: () => void;
}

interface CredentialSelection {
  [nodeId: string]: string | null;
}

interface VariableValues {
  [variableName: string]: string;
}

export const WorkflowSetupPanel: React.FC<WorkflowSetupPanelProps> = ({
  workflowId,
  onConfigurationSaved,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metadata, setMetadata] = useState<WorkflowTemplateMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [credentialSelections, setCredentialSelections] = useState<CredentialSelection>({});
  const [variableValues, setVariableValues] = useState<VariableValues>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isExpanded && !metadata) {
      loadData();
    }
  }, [isExpanded, workflowId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const templateData = await workflowService.getWorkflowTemplate(workflowId);
      setMetadata(templateData);

      const initialVariables: VariableValues = {};
      templateData.variables.forEach((variable: TemplateVariableRequirement) => {
        initialVariables[variable.name] = variable.defaultValue || "";
      });
      setVariableValues(initialVariables);
    } catch (err: any) {
      showError("Failed to load", {
        message: err.message || "Failed to load template data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSelect = (nodeId: string, credentialId: string | undefined) => {
    setCredentialSelections((prev) => ({
      ...prev,
      [nodeId]: credentialId || null,
    }));
  };

  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  const handleSaveConfiguration = async () => {
    if (!metadata) return;

    try {
      setSaving(true);
      const workflow = await workflowService.getWorkflow(workflowId);

      const updatedNodes = workflow.nodes.map((node: any) => {
        const updatedNode = { ...node };

        if (!updatedNode.parameters) {
          updatedNode.parameters = {};
        }

        // Find the credential requirement for this node to get the correct field name
        const credReq = metadata.credentials.find((c) => c.nodeId === node.id);
        const selectedCredId = credentialSelections[node.id];

        if (selectedCredId && credReq) {
          // Use the actual field name from the node definition
          updatedNode.parameters[credReq.credentialFieldName] = selectedCredId;
        }

        updatedNode.parameters = replaceVariablesInObject(
          updatedNode.parameters,
          variableValues
        );

        return updatedNode;
      });

      await workflowService.updateWorkflow(workflowId, {
        nodes: updatedNodes,
      });

      showSuccess("Configuration Saved", {
        message: "Workflow has been configured successfully.",
      });

      setIsExpanded(false);

      if (onConfigurationSaved) {
        onConfigurationSaved();
      }
    } catch (err: any) {
      showError("Save Failed", {
        message: err.message || "Failed to save configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  const replaceVariablesInObject = (obj: any, variables: VariableValues): any => {
    if (typeof obj === "string") {
      let result = obj;
      Object.entries(variables).forEach(([name, value]) => {
        const pattern = new RegExp(`\\{\\{${name}\\}\\}`, "g");
        result = result.replace(pattern, value);
      });
      return result;
    } else if (Array.isArray(obj)) {
      return obj.map((item) => replaceVariablesInObject(item, variables));
    } else if (typeof obj === "object" && obj !== null) {
      const result: any = {};
      Object.entries(obj).forEach(([key, value]) => {
        result[key] = replaceVariablesInObject(value, variables);
      });
      return result;
    }
    return obj;
  };



  const isSetupComplete = (): boolean => {
    if (!metadata) return false;

    const requiredCredentials = metadata.credentials.filter((c) => c.required);
    const allCredentialsSelected = requiredCredentials.every(
      (cred) => credentialSelections[cred.nodeId]
    );

    const requiredVariables = metadata.variables.filter((v) => v.required);
    const allVariablesSet = requiredVariables.every(
      (variable) => variableValues[variable.name]?.trim()
    );

    return allCredentialsSelected && allVariablesSet;
  };

  const hasRequirements = metadata && (metadata.credentials.length > 0 || metadata.variables.length > 0);

  // Don't show if no requirements
  if (metadata && !hasRequirements) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      {!isExpanded ? (
        // Collapsed button
        <Button
          onClick={() => setIsExpanded(true)}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          <Wrench className="h-5 w-5 mr-2" />
          Setup Workflow
        </Button>
      ) : (
        // Expanded panel
        <Card className="shadow-2xl max-h-[80vh] overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Wrench className="h-5 w-5" />
                <span>Setup Workflow</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                {/* Credentials */}
                {metadata && metadata.credentials.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm font-semibold">
                      <Key className="h-4 w-4" />
                      <span>Credentials</span>
                    </div>
                    {metadata.credentials.map((cred) => {
                      const selectedCredId = credentialSelections[cred.nodeId];
                      const isConfigured = !!selectedCredId;

                      return (
                        <div key={cred.nodeId} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{cred.nodeName}</span>
                                {cred.required && (
                                  <Badge variant="destructive" className="text-xs h-5">
                                    Required
                                  </Badge>
                                )}
                                {isConfigured && (
                                  <Badge variant="default" className="text-xs h-5 bg-green-600">
                                    <Check className="h-3 w-3" />
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {cred.displayName}
                              </p>
                            </div>
                          </div>

                          <UnifiedCredentialSelector
                            allowedTypes={[cred.credentialType]}
                            value={selectedCredId || undefined}
                            onChange={(value) => handleCredentialSelect(cred.nodeId, value)}
                            placeholder="Select credential..."
                            required={cred.required}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Variables */}
                {metadata && metadata.variables.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm font-semibold">
                      <Variable className="h-4 w-4" />
                      <span>Variables</span>
                    </div>
                    {metadata.variables.map((variable) => {
                      const value = variableValues[variable.name] || "";
                      const isConfigured = !!value.trim();

                      return (
                        <div key={variable.name} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {`{{${variable.name}}}`}
                                </code>
                                {variable.required && (
                                  <Badge variant="destructive" className="text-xs h-5">
                                    Required
                                  </Badge>
                                )}
                                {isConfigured && (
                                  <Badge variant="default" className="text-xs h-5 bg-green-600">
                                    <Check className="h-3 w-3" />
                                  </Badge>
                                )}
                              </div>
                              {variable.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {variable.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <Input
                            value={value}
                            onChange={(e) =>
                              handleVariableChange(variable.name, e.target.value)
                            }
                            placeholder={`Enter ${variable.name}...`}
                            className="h-9"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Status */}
                {metadata && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2 text-sm">
                      {isSetupComplete() ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Ready</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-600 font-medium">Incomplete</span>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={handleSaveConfiguration}
                      disabled={!isSetupComplete() || saving}
                      size="sm"
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
