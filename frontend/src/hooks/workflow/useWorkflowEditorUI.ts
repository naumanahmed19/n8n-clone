import { useWorkflowToolbarStore } from "@/stores";
import { useCallback, useState } from "react";

/**
 * Custom hook for managing UI state in the workflow editor
 * Handles panel visibility, sizes, ReactFlow view settings, and other UI state
 */
export function useWorkflowEditorUI() {
  // Get UI state from toolbar store
  const {
    showNodePalette,
    showExecutionsPanel,
    toggleNodePalette,
    toggleExecutionsPanel,
  } = useWorkflowToolbarStore();

  // Local UI state for ReactFlow view
  const [showMinimap, setShowMinimap] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [backgroundVariant, setBackgroundVariant] = useState<
    "dots" | "lines" | "cross"
  >("dots");

  // Execution panel state
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [executionPanelSize, setExecutionPanelSize] = useState(4); // Start minimized

  // Execution panel toggle handler
  const handleToggleExecutionPanel = useCallback(() => {
    if (showExecutionPanel) {
      // If panel is expanded, minimize it
      setExecutionPanelSize(4); // Minimum size for just the header
      setShowExecutionPanel(false);
    } else {
      // If panel is minimized, expand it to default size
      setExecutionPanelSize(30);
      setShowExecutionPanel(true);
    }
  }, [showExecutionPanel]);

  // ReactFlow view handlers
  const handleToggleMinimap = useCallback(() => {
    setShowMinimap(!showMinimap);
  }, [showMinimap]);

  const handleToggleBackground = useCallback(() => {
    setShowBackground(!showBackground);
  }, [showBackground]);

  const handleToggleControls = useCallback(() => {
    setShowControls(!showControls);
  }, [showControls]);

  const handleChangeBackgroundVariant = useCallback(
    (variant: "dots" | "lines" | "cross" | "none") => {
      if (variant === "none") {
        setShowBackground(false);
      } else {
        setShowBackground(true);
        setBackgroundVariant(variant);
      }
    },
    []
  );

  return {
    // Panel visibility
    showNodePalette,
    showExecutionsPanel,
    showExecutionPanel,

    // Panel controls
    toggleNodePalette,
    toggleExecutionsPanel,
    handleToggleExecutionPanel,

    // Panel sizes
    executionPanelSize,
    setExecutionPanelSize,

    // ReactFlow view settings
    showMinimap,
    showBackground,
    showControls,
    backgroundVariant,

    // ReactFlow view controls
    handleToggleMinimap,
    handleToggleBackground,
    handleToggleControls,
    handleChangeBackgroundVariant,

    // Setters for direct control
    setShowMinimap,
    setShowBackground,
    setShowControls,
    setBackgroundVariant,
  };
}
