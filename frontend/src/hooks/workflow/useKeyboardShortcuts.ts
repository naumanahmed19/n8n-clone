import { useWorkflowStore } from "@/stores";
import { useCallback, useEffect } from "react";

interface UseKeyboardShortcutsProps {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onAddNode?: () => void;
  disabled?: boolean;
}

/**
 * Custom hook for keyboard shortcuts
 * Handles keyboard shortcuts for workflow operations
 */
export function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onDelete,
  onAddNode,
  disabled = false,
}: UseKeyboardShortcutsProps) {
  const { selectedNodeId, removeNode, closeNodeProperties } =
    useWorkflowStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't process shortcuts if disabled (e.g., in read-only mode)
      if (disabled) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "z":
            event.preventDefault();
            if (event.shiftKey) {
              onRedo();
            } else {
              onUndo();
            }
            break;
          case "y":
            event.preventDefault();
            onRedo();
            break;
          case "s":
            event.preventDefault();
            onSave();
            break;
          case "k":
            event.preventDefault();
            onAddNode?.();
            break;
        }
      }

      if (event.key === "Delete" && selectedNodeId) {
        event.preventDefault();
        onDelete();
      }
    },
    [onSave, onUndo, onRedo, onDelete, onAddNode, selectedNodeId, disabled]
  );

  // Delete action handler
  const handleDelete = useCallback(() => {
    if (disabled) return; // Don't delete in read-only mode
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      closeNodeProperties();
    }
  }, [selectedNodeId, removeNode, closeNodeProperties, disabled]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    handleDelete,
  };
}
