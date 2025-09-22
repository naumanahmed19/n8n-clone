import { useWorkflowStore } from "@/stores";
import { useCallback, useEffect } from "react";

interface UseKeyboardShortcutsProps {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
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
}: UseKeyboardShortcutsProps) {
  const { selectedNodeId, removeNode, closeNodeProperties } =
    useWorkflowStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
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
        }
      }

      if (event.key === "Delete" && selectedNodeId) {
        event.preventDefault();
        onDelete();
      }
    },
    [onSave, onUndo, onRedo, onDelete, selectedNodeId]
  );

  // Delete action handler
  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      closeNodeProperties();
    }
  }, [selectedNodeId, removeNode, closeNodeProperties]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    handleDelete,
  };
}
