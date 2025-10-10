import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Globe, TestTube } from "lucide-react";
import { useEffect, useState } from "react";

interface WebhookUrlGeneratorProps {
  value?: string; // webhookId
  onChange?: (value: string) => void;
  disabled?: boolean;
  path?: string;
  mode?: "test" | "production";
}

export function WebhookUrlGenerator({
  value,
  onChange,
  disabled = false,
  path = "",
  mode = "test",
}: WebhookUrlGeneratorProps) {
  const [webhookId, setWebhookId] = useState<string>(value || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTest, setCopiedTest] = useState(false);
  const [copiedProd, setCopiedProd] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"test" | "production">(mode);

  // Get base URLs from environment or use defaults
  const getBaseUrl = (environment: "test" | "production") => {
    if (environment === "test") {
      return import.meta.env.VITE_WEBHOOK_TEST_URL || 
             import.meta.env.VITE_API_URL?.replace('/api', '/webhook') || 
             "http://localhost:4000/webhook";
    } else {
      return import.meta.env.VITE_WEBHOOK_PROD_URL || 
             import.meta.env.VITE_WEBHOOK_BASE_URL || 
             "https://your-domain.com/webhook";
    }
  };

  // Generate webhook ID if not exists
  useEffect(() => {
    if (!webhookId) {
      generateWebhookId();
    }
  }, []);

  const generateWebhookId = async () => {
    setIsGenerating(true);
    try {
      // Generate a unique webhook ID (UUID v4)
      const newWebhookId = crypto.randomUUID();
      setWebhookId(newWebhookId);
      
      // Notify parent component
      if (onChange) {
        onChange(newWebhookId);
      }
    } catch (error) {
      console.error("Error generating webhook ID:", error);
      // Fallback to simple ID generation
      const fallbackId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setWebhookId(fallbackId);
      if (onChange) {
        onChange(fallbackId);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Construct full webhook URLs
  const constructWebhookUrl = (environment: "test" | "production") => {
    const baseUrl = getBaseUrl(environment);
    const cleanPath = path?.trim().replace(/^\/+/, "") || "";
    const url = `${baseUrl}/${webhookId}${cleanPath ? "/" + cleanPath : ""}`;
    return url;
  };

  const testWebhookUrl = constructWebhookUrl("test");
  const productionWebhookUrl = constructWebhookUrl("production");

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: "test" | "production") => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === "test") {
        setCopiedTest(true);
        setTimeout(() => setCopiedTest(false), 2000);
      } else {
        setCopiedProd(true);
        setTimeout(() => setCopiedProd(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      
      if (type === "test") {
        setCopiedTest(true);
        setTimeout(() => setCopiedTest(false), 2000);
      } else {
        setCopiedProd(true);
        setTimeout(() => setCopiedProd(false), 2000);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Webhook URLs
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Use these URLs to trigger your workflow from external services
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-3">
        <Button
          type="button"
          variant={selectedMode === "test" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedMode("test")}
          disabled={disabled}
          className="flex-1"
        >
          <TestTube className="w-3 h-3 mr-1" />
          Test URL
        </Button>
        <Button
          type="button"
          variant={selectedMode === "production" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedMode("production")}
          disabled={disabled}
          className="flex-1"
        >
          <Globe className="w-3 h-3 mr-1" />
          Production URL
        </Button>
      </div>

      {/* Test Webhook URL */}
      {selectedMode === "test" && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-blue-900 flex items-center gap-1">
                <TestTube className="w-3 h-3" />
                Test Environment
              </Label>
              <span className="text-xs text-blue-600 font-mono">localhost</span>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={testWebhookUrl}
                readOnly
                disabled={disabled}
                className="font-mono text-xs bg-white border-blue-300"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(testWebhookUrl, "test")}
                disabled={disabled || !webhookId}
                className="shrink-0 border-blue-300 hover:bg-blue-100"
              >
                {copiedTest ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-blue-700">
              Use this URL for testing your webhook during development
            </p>
          </div>
        </Card>
      )}

      {/* Production Webhook URL */}
      {selectedMode === "production" && (
        <Card className="p-3 bg-green-50 border-green-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-green-900 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Production Environment
              </Label>
              <span className="text-xs text-green-600 font-mono">live</span>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={productionWebhookUrl}
                readOnly
                disabled={disabled}
                className="font-mono text-xs bg-white border-green-300"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(productionWebhookUrl, "production")}
                disabled={disabled || !webhookId}
                className="shrink-0 border-green-300 hover:bg-green-100"
              >
                {copiedProd ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-green-700">
              Use this URL in production for live webhook triggers
            </p>
          </div>
        </Card>
      )}

      {/* Webhook ID Display */}
      <div className="pt-2 border-t">
        <Label className="text-xs font-medium text-muted-foreground">
          Webhook ID
        </Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={webhookId}
            readOnly
            disabled={disabled}
            className="font-mono text-xs text-muted-foreground"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateWebhookId}
            disabled={disabled || isGenerating}
            className="shrink-0"
          >
            {isGenerating ? "Generating..." : "Regenerate"}
          </Button>
        </div>
        <p className="text-xs text-amber-600 mt-1">
          ⚠️ Regenerating will invalidate the old webhook URL
        </p>
      </div>

      {/* Info Box */}
      <Card className="p-3 bg-muted/50">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">How to use:</p>
          <ol className="list-decimal list-inside space-y-0.5 ml-2">
            <li>Copy the webhook URL for your environment</li>
            <li>Configure it in your external service</li>
            <li>Send HTTP requests to trigger this workflow</li>
            <li>View execution results in the workflow history</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
