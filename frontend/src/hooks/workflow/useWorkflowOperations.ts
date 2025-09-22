import { workflowService } from "@/services";
import { useAuthStore, useWorkflowStore } from "@/stores";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Custom hook for workflow operations (save, import/export, validation)
 * Encapsulates workflow CRUD operations and file handling
 */
export function useWorkflowOperations() {
  const {
    workflow,
    workflowTitle,
    isTitleDirty,
    saveTitle,
    setWorkflow,
    setDirty,
    validateWorkflow,
    exportWorkflow,
    importWorkflow,
    isExporting,
    isImporting,
  } = useWorkflowStore();

  const { user } = useAuthStore();

  // Save workflow function
  const saveWorkflow = useCallback(async () => {
    if (!workflow || !user) return false;

    try {
      // Save title changes first if needed
      if (isTitleDirty) {
        saveTitle();
      }

      if (workflow.id === "new") {
        // Create new workflow
        const workflowData = {
          name: workflowTitle || workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
          active: workflow.active,
        };

        const savedWorkflow = await workflowService.createWorkflow(
          workflowData
        );
        setWorkflow(savedWorkflow);
        setDirty(false);

        // Update URL to reflect the new workflow ID
        window.history.replaceState(
          null,
          "",
          `/workflows/${savedWorkflow.id}/edit`
        );
        toast.success("Workflow created successfully");
      } else {
        // Update existing workflow
        const workflowData = {
          name: workflowTitle || workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
          active: workflow.active,
        };

        const updatedWorkflow = await workflowService.updateWorkflow(
          workflow.id,
          workflowData
        );
        setWorkflow(updatedWorkflow);
        setDirty(false);
        toast.success("Workflow saved successfully");
      }
      return true;
    } catch (error) {
      console.error("Failed to save workflow:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save workflow. Please try again.";
      toast.error(errorMessage);
      return false;
    }
  }, [
    workflow,
    user,
    workflowTitle,
    isTitleDirty,
    saveTitle,
    setWorkflow,
    setDirty,
  ]);

  // Validate workflow function
  const validateAndShowResult = useCallback(() => {
    const result = validateWorkflow();
    if (result.isValid) {
      toast.success("Workflow is valid!");
    } else {
      toast.error(`Workflow has errors: ${result.errors.join(", ")}`);
    }
    return result;
  }, [validateWorkflow]);

  // Export workflow function
  const handleExport = useCallback(async () => {
    try {
      await exportWorkflow();
      toast.success("Workflow exported successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Export failed";
      toast.error(errorMessage);
    }
  }, [exportWorkflow]);

  // Import workflow function
  const handleImport = useCallback(
    async (file: File) => {
      try {
        await importWorkflow(file);
        toast.success("Workflow imported successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Import failed";
        toast.error(errorMessage);
      }
    },
    [importWorkflow]
  );

  return {
    // Core operations
    saveWorkflow,
    validateAndShowResult,
    handleExport,
    handleImport,

    // State
    isExporting,
    isImporting,

    // Derived state
    canSave: Boolean(workflow && user),
    hasUnsavedChanges: useWorkflowStore(
      (state) => state.isDirty || state.isTitleDirty
    ),
  };
}
