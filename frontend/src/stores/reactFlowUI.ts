import { ReactFlowInstance } from "@xyflow/react";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

interface ReactFlowUIState {
  // ReactFlow instance
  reactFlowInstance: ReactFlowInstance | null;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;

  // UI visibility settings
  showMinimap: boolean;
  showBackground: boolean;
  showControls: boolean;
  backgroundVariant: "dots" | "lines" | "cross";

  // Canvas interaction settings
  panOnDrag: boolean;
  zoomOnScroll: boolean;

  // Execution panel state
  showExecutionPanel: boolean;
  executionPanelSize: number;

  // Toggle functions
  toggleMinimap: () => void;
  toggleBackground: () => void;
  toggleControls: () => void;
  togglePanOnDrag: () => void;
  toggleZoomOnScroll: () => void;
  changeBackgroundVariant: (
    variant: "dots" | "lines" | "cross" | "none"
  ) => void;
  toggleExecutionPanel: () => void;

  // Setters
  setShowMinimap: (show: boolean) => void;
  setShowBackground: (show: boolean) => void;
  setShowControls: (show: boolean) => void;
  setBackgroundVariant: (variant: "dots" | "lines" | "cross") => void;
  setExecutionPanelSize: (size: number) => void;

  // ReactFlow controls
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  zoomToFit: () => void;
}

export const useReactFlowUIStore = createWithEqualityFn<ReactFlowUIState>(
  (set, get) => ({
    // Initial state
    reactFlowInstance: null,
    showMinimap: true,
    showBackground: true,
    showControls: true,
    backgroundVariant: "dots",
    panOnDrag: true,
    zoomOnScroll: true,
    showExecutionPanel: false,
    executionPanelSize: 4,

    // Set ReactFlow instance
    setReactFlowInstance: (instance) => set({ reactFlowInstance: instance }),

    // Toggle functions
    toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
    toggleBackground: () =>
      set((state) => ({ showBackground: !state.showBackground })),
    toggleControls: () =>
      set((state) => ({ showControls: !state.showControls })),
    togglePanOnDrag: () => set((state) => ({ panOnDrag: !state.panOnDrag })),
    toggleZoomOnScroll: () =>
      set((state) => ({ zoomOnScroll: !state.zoomOnScroll })),

    changeBackgroundVariant: (variant) => {
      if (variant === "none") {
        set({ showBackground: false });
      } else {
        set({ showBackground: true, backgroundVariant: variant });
      }
    },

    toggleExecutionPanel: () => {
      const { showExecutionPanel } = get();
      if (showExecutionPanel) {
        // If panel is expanded, minimize it
        set({ executionPanelSize: 4, showExecutionPanel: false });
      } else {
        // If panel is minimized, expand it to default size
        set({ executionPanelSize: 30, showExecutionPanel: true });
      }
    },

    // Setters
    setShowMinimap: (show) => set({ showMinimap: show }),
    setShowBackground: (show) => set({ showBackground: show }),
    setShowControls: (show) => set({ showControls: show }),
    setBackgroundVariant: (variant) => set({ backgroundVariant: variant }),
    setExecutionPanelSize: (size) => set({ executionPanelSize: size }),

    // ReactFlow controls
    zoomIn: () => {
      const { reactFlowInstance } = get();
      reactFlowInstance?.zoomIn();
    },

    zoomOut: () => {
      const { reactFlowInstance } = get();
      reactFlowInstance?.zoomOut();
    },

    fitView: () => {
      const { reactFlowInstance } = get();
      reactFlowInstance?.fitView();
    },

    zoomToFit: () => {
      const { reactFlowInstance } = get();
      reactFlowInstance?.fitView({ padding: 0.1 });
    },
  }),
  shallow
);
