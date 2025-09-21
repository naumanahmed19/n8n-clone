import {
  ExecutionEventData,
  executionWebSocket,
} from "@/services/ExecutionWebSocket";
import { ProgressTracker } from "@/services/ProgressTracker";
import { ValidationResult, workflowFileService } from "@/services/workflowFile";
import {
  // NodeExecutionState,
  ExecutionFlowStatus,
  ExecutionState,
  FlowExecutionState,
  NodeExecutionResult,
  NodeExecutionStatus,
  NodeVisualState,
  Workflow,
  WorkflowConnection,
  WorkflowEditorState,
  WorkflowExecutionResult,
  WorkflowHistoryEntry,
  WorkflowNode,
} from "@/types";
import {
  validateImportFile as validateImportFileUtil,
  validateTitle as validateTitleUtil,
} from "@/utils/errorHandling";
import {
  handleWorkflowError,
  validateWorkflow,
  validateWorkflowForExecution,
} from "@/utils/workflowErrorHandling";
import {
  ensureWorkflowMetadata,
  updateWorkflowTitle,
  validateMetadata,
} from "@/utils/workflowMetadata";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Import socket service types
interface ExecutionLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  nodeId?: string;
  message: string;
  data?: any;
}

interface WorkflowStore extends WorkflowEditorState {
  // Title management state
  workflowTitle: string;
  isTitleDirty: boolean;
  titleValidationError: string | null;

  // Import/Export state
  isExporting: boolean;
  isImporting: boolean;
  importProgress: number;
  exportProgress: number;
  importError: string | null;
  exportError: string | null;

  // Execution state
  executionState: ExecutionState;
  lastExecutionResult: WorkflowExecutionResult | null;
  realTimeResults: Map<string, NodeExecutionResult>;
  executionLogs: ExecutionLogEntry[];

  // Flow execution state
  flowExecutionState: FlowExecutionState;
  progressTracker: ProgressTracker;

  // Node interaction state
  showPropertyPanel: boolean;
  propertyPanelNodeId: string | null;
  contextMenuVisible: boolean;
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuNodeId: string | null;

  // Actions
  setWorkflow: (workflow: Workflow | null) => void;
  updateWorkflow: (updates: Partial<Workflow>) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (nodeId: string) => void;
  addConnection: (connection: WorkflowConnection) => void;
  removeConnection: (connectionId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setDirty: (dirty: boolean) => void;

  // Title management actions
  updateTitle: (title: string) => void;
  saveTitle: () => void;
  setTitleDirty: (dirty: boolean) => void;
  validateTitle: (title: string) => { isValid: boolean; error: string | null };
  sanitizeTitle: (title: string) => string;

  // History management
  saveToHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Import/Export actions
  exportWorkflow: () => Promise<void>;
  importWorkflow: (file: File) => Promise<void>;
  validateImportFile: (file: File) => Promise<ValidationResult>;
  setImportProgress: (progress: number) => void;
  setExportProgress: (progress: number) => void;
  clearImportExportErrors: () => void;

  // Execution actions
  executeWorkflow: () => Promise<void>;
  executeNode: (
    nodeId: string,
    inputData?: any,
    mode?: "single" | "workflow"
  ) => Promise<void>;
  stopExecution: () => Promise<void>;
  cancelExecution: (executionId?: string) => Promise<void>;
  pauseExecution: (executionId?: string) => Promise<void>;
  resumeExecution: (executionId?: string) => Promise<void>;
  setExecutionState: (state: Partial<ExecutionState>) => void;
  clearExecutionState: (preserveLogs?: boolean) => void;
  setExecutionProgress: (progress: number) => void;
  setExecutionError: (error: string) => void;
  updateNodeExecutionResult: (
    nodeId: string,
    result: Partial<NodeExecutionResult>
  ) => void;
  addExecutionLog: (log: ExecutionLogEntry) => void;
  clearExecutionLogs: () => void;
  getNodeExecutionResult: (nodeId: string) => NodeExecutionResult | undefined;

  // Real-time execution updates
  subscribeToExecution: (executionId: string) => Promise<void>;
  unsubscribeFromExecution: (executionId: string) => Promise<void>;
  setupSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  initializeRealTimeUpdates: () => void;
  handleExecutionEvent: (data: ExecutionEventData) => void;

  // Flow execution methods
  updateNodeExecutionState: (
    nodeId: string,
    status: NodeExecutionStatus,
    data?: any
  ) => void;
  getNodeVisualState: (nodeId: string) => NodeVisualState;
  getAllNodeVisualStates: () => Map<string, NodeVisualState>;
  getExecutionFlowStatus: (executionId: string) => ExecutionFlowStatus | null;
  initializeFlowExecution: (executionId: string, nodeIds: string[]) => void;
  resetFlowExecution: () => void;

  // Multiple execution management
  selectExecution: (executionId: string) => void;
  getActiveExecutions: () => Map<string, ExecutionFlowStatus>;
  removeCompletedExecution: (executionId: string) => void;
  cleanupOldExecutions: (maxAge?: number) => void;

  // Workflow activation
  toggleWorkflowActive: () => void;
  setWorkflowActive: (active: boolean) => void;

  // Validation
  validateWorkflow: () => { isValid: boolean; errors: string[] };
  validateConnection: (sourceId: string, targetId: string) => boolean;

  // Node interaction actions
  setShowPropertyPanel: (show: boolean) => void;
  setPropertyPanelNode: (nodeId: string | null) => void;
  showContextMenu: (nodeId: string, position: { x: number; y: number }) => void;
  hideContextMenu: () => void;
  openNodeProperties: (nodeId: string) => void;
  closeNodeProperties: () => void;

  // Error handling
  handleError: (
    error: unknown,
    operation: string,
    showToast?: (
      type: "error" | "warning",
      title: string,
      options?: any
    ) => void
  ) => void;
  getWorkflowHealth: () => {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

const MAX_HISTORY_SIZE = 50;

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      workflow: null,
      selectedNodeId: null,
      isLoading: false,
      isDirty: false,
      history: [],
      historyIndex: -1,

      // Title management state
      workflowTitle: "",
      isTitleDirty: false,
      titleValidationError: null,

      // Import/Export state
      isExporting: false,
      isImporting: false,
      importProgress: 0,
      exportProgress: 0,
      importError: null,
      exportError: null,

      // Execution state
      executionState: {
        status: "idle",
        progress: 0,
        startTime: undefined,
        endTime: undefined,
        error: undefined,
        executionId: undefined,
      },
      lastExecutionResult: null,
      realTimeResults: new Map(),
      executionLogs: [],

      // Flow execution state
      flowExecutionState: {
        activeExecutions: new Map(),
        nodeVisualStates: new Map(),
        executionHistory: [],
        realTimeUpdates: true,
        selectedExecution: undefined,
      },
      progressTracker: new ProgressTracker(),

      // Node interaction state
      showPropertyPanel: false,
      propertyPanelNodeId: null,
      contextMenuVisible: false,
      contextMenuPosition: null,
      contextMenuNodeId: null,

      // Actions
      setWorkflow: (workflow) => {
        let processedWorkflow = workflow;

        // Ensure workflow has proper metadata
        if (workflow) {
          processedWorkflow = ensureWorkflowMetadata(workflow);
        }

        const title =
          processedWorkflow?.metadata?.title || processedWorkflow?.name || "";
        set({
          workflow: processedWorkflow,
          isDirty: false,
          workflowTitle: title,
          isTitleDirty: false,
          titleValidationError: null,
          // Reset node interaction state when loading new workflow
          selectedNodeId: null,
          showPropertyPanel: false,
          propertyPanelNodeId: null,
          contextMenuVisible: false,
          contextMenuPosition: null,
          contextMenuNodeId: null,
        });
        if (processedWorkflow) {
          get().saveToHistory("Load workflow");
        }
      },

      updateWorkflow: (updates) => {
        const current = get().workflow;
        if (!current) return;

        const updated = { ...current, ...updates };
        set({ workflow: updated, isDirty: true });
      },

      addNode: (node) => {
        const current = get().workflow;
        if (!current) return;

        const updated = {
          ...current,
          nodes: [...current.nodes, node],
        };
        set({ workflow: updated, isDirty: true });
        get().saveToHistory(`Add node: ${node.name}`);
      },

      updateNode: (nodeId, updates) => {
        const current = get().workflow;
        if (!current) return;

        const updated = {
          ...current,
          nodes: current.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
        };
        set({ workflow: updated, isDirty: true });
        get().saveToHistory(`Update node: ${nodeId}`);
      },

      removeNode: (nodeId) => {
        const current = get().workflow;
        if (!current) return;

        const updated = {
          ...current,
          nodes: current.nodes.filter((node) => node.id !== nodeId),
          connections: current.connections.filter(
            (conn) =>
              conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
          ),
        };

        // Clean up node interaction state if the removed node was selected
        const stateUpdates: any = {
          workflow: updated,
          isDirty: true,
          selectedNodeId: null,
        };

        if (get().propertyPanelNodeId === nodeId) {
          stateUpdates.showPropertyPanel = false;
          stateUpdates.propertyPanelNodeId = null;
        }

        if (get().contextMenuNodeId === nodeId) {
          stateUpdates.contextMenuVisible = false;
          stateUpdates.contextMenuNodeId = null;
          stateUpdates.contextMenuPosition = null;
        }

        set(stateUpdates);
        get().saveToHistory(`Remove node: ${nodeId}`);
      },

      addConnection: (connection) => {
        const current = get().workflow;
        if (!current) return;

        // Validate connection before adding
        if (
          !get().validateConnection(
            connection.sourceNodeId,
            connection.targetNodeId
          )
        ) {
          return;
        }

        const updated = {
          ...current,
          connections: [...current.connections, connection],
        };
        set({ workflow: updated, isDirty: true });
        get().saveToHistory("Add connection");
      },

      removeConnection: (connectionId) => {
        const current = get().workflow;
        if (!current) return;

        const updated = {
          ...current,
          connections: current.connections.filter(
            (conn) => conn.id !== connectionId
          ),
        };
        set({ workflow: updated, isDirty: true });
        get().saveToHistory("Remove connection");
      },

      setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setDirty: (dirty) => {
        set({ isDirty: dirty });
      },

      // Title management actions
      updateTitle: (title) => {
        const sanitized = get().sanitizeTitle(title);
        const validation = get().validateTitle(sanitized);

        set({
          workflowTitle: sanitized,
          isTitleDirty: true,
          titleValidationError: validation.error,
        });
      },

      saveTitle: () => {
        const { workflowTitle, workflow, titleValidationError } = get();

        if (!workflow || titleValidationError) {
          return;
        }

        // Update workflow title through metadata management
        const updated = updateWorkflowTitle(workflow, workflowTitle);
        set({
          workflow: updated,
          isDirty: true,
          isTitleDirty: false,
        });
        get().saveToHistory(`Update title: ${workflowTitle}`);
      },

      setTitleDirty: (dirty) => {
        set({ isTitleDirty: dirty });
      },

      validateTitle: (title) => {
        const validationErrors = validateTitleUtil(title);

        if (validationErrors.length > 0) {
          return { isValid: false, error: validationErrors[0].message };
        }

        return { isValid: true, error: null };
      },

      sanitizeTitle: (title) => {
        // Remove leading/trailing whitespace
        let sanitized = title.trim();

        // Replace multiple consecutive spaces with single space
        sanitized = sanitized.replace(/\s+/g, " ");

        // Remove or replace invalid characters
        sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, "");

        // Truncate if too long
        if (sanitized.length > 100) {
          sanitized = sanitized.substring(0, 100).trim();
        }

        return sanitized;
      },

      // History management
      saveToHistory: (action) => {
        const { workflow, history, historyIndex } = get();
        if (!workflow) return;

        const newEntry: WorkflowHistoryEntry = {
          workflow: JSON.parse(JSON.stringify(workflow)), // Deep clone
          timestamp: Date.now(),
          action,
        };

        // Remove any history after current index (when undoing then making new changes)
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newEntry);

        // Limit history size
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const previousEntry = history[historyIndex - 1];
          set({
            workflow: JSON.parse(JSON.stringify(previousEntry.workflow)),
            historyIndex: historyIndex - 1,
            isDirty: true,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextEntry = history[historyIndex + 1];
          set({
            workflow: JSON.parse(JSON.stringify(nextEntry.workflow)),
            historyIndex: historyIndex + 1,
            isDirty: true,
          });
        }
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      // Import/Export actions
      exportWorkflow: async () => {
        const { workflow } = get();
        if (!workflow) {
          set({ exportError: "No workflow to export" });
          return;
        }

        set({
          isExporting: true,
          exportProgress: 0,
          exportError: null,
        });

        try {
          // Simulate progress for user feedback
          set({ exportProgress: 25 });

          // Validate workflow before export
          const validation = get().validateWorkflow();
          if (!validation.isValid) {
            throw new Error(
              `Cannot export invalid workflow: ${validation.errors.join(", ")}`
            );
          }

          set({ exportProgress: 50 });

          // Export using the file service
          await workflowFileService.exportWorkflow(workflow);

          set({ exportProgress: 100 });

          // Clear progress after a short delay
          setTimeout(() => {
            set({ exportProgress: 0, isExporting: false });
          }, 1000);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown export error";
          set({
            exportError: errorMessage,
            isExporting: false,
            exportProgress: 0,
          });
        }
      },

      importWorkflow: async (file: File) => {
        set({
          isImporting: true,
          importProgress: 0,
          importError: null,
        });

        try {
          // Validate file first
          set({ importProgress: 20 });
          const validation = await workflowFileService.validateWorkflowFile(
            file
          );

          if (!validation.isValid) {
            throw new Error(
              `Invalid workflow file: ${validation.errors.join(", ")}`
            );
          }

          // Show warnings if any
          if (validation.warnings.length > 0) {
            console.warn("Import warnings:", validation.warnings);
          }

          set({ importProgress: 50 });

          // Import the workflow
          const importedWorkflow = await workflowFileService.importWorkflow(
            file
          );

          set({ importProgress: 80 });

          // Check if current workflow has unsaved changes
          const { isDirty, isTitleDirty } = get();
          if (isDirty || isTitleDirty) {
            // In a real implementation, you might want to show a confirmation dialog
            // For now, we'll proceed with the import
            console.warn("Importing workflow will overwrite unsaved changes");
          }

          // Set the imported workflow
          get().setWorkflow(importedWorkflow);

          set({ importProgress: 100 });

          // Clear progress after a short delay
          setTimeout(() => {
            set({ importProgress: 0, isImporting: false });
          }, 1000);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown import error";
          set({
            importError: errorMessage,
            isImporting: false,
            importProgress: 0,
          });
        }
      },

      validateImportFile: async (file: File) => {
        try {
          // First do basic file validation
          const basicValidation = validateImportFileUtil(file);
          if (basicValidation.length > 0) {
            return {
              isValid: false,
              errors: basicValidation.map((error) => error.message),
              warnings: [],
            };
          }

          // Then do content validation
          return await workflowFileService.validateWorkflowFile(file);
        } catch (error) {
          return {
            isValid: false,
            errors: [
              error instanceof Error
                ? error.message
                : "Unknown validation error",
            ],
            warnings: [],
          };
        }
      },

      setImportProgress: (progress: number) => {
        set({ importProgress: Math.max(0, Math.min(100, progress)) });
      },

      setExportProgress: (progress: number) => {
        set({ exportProgress: Math.max(0, Math.min(100, progress)) });
      },

      clearImportExportErrors: () => {
        set({
          importError: null,
          exportError: null,
        });
      },

      // Flow execution methods
      updateNodeExecutionState: (
        nodeId: string,
        status: NodeExecutionStatus,
        data?: any
      ) => {
        const { progressTracker, executionState } = get();
        const executionId = executionState.executionId || "current";

        progressTracker.updateNodeStatus(executionId, nodeId, status, data);

        // Update visual states
        const visualState = progressTracker.getNodeVisualState(nodeId);
        const currentFlowState = get().flowExecutionState;
        currentFlowState.nodeVisualStates.set(nodeId, visualState);

        set({ flowExecutionState: { ...currentFlowState } });
      },

      getNodeVisualState: (nodeId: string) => {
        return get().progressTracker.getNodeVisualState(nodeId);
      },

      getAllNodeVisualStates: () => {
        return get().progressTracker.getAllNodeVisualStates();
      },

      getExecutionFlowStatus: (executionId: string) => {
        const { flowExecutionState } = get();
        return flowExecutionState.activeExecutions.get(executionId) || null;
      },

      initializeFlowExecution: (executionId: string, nodeIds: string[]) => {
        const { progressTracker, workflow } = get();

        if (!workflow) return;

        // Build dependency map from workflow connections
        const dependencies = new Map<string, string[]>();
        nodeIds.forEach((nodeId) => {
          const nodeDeps = workflow.connections
            .filter((conn) => conn.targetNodeId === nodeId)
            .map((conn) => conn.sourceNodeId);
          dependencies.set(nodeId, nodeDeps);
        });

        // Initialize progress tracker for this execution
        progressTracker.initializeNodeStates(nodeIds, dependencies);

        // Create initial flow status
        const flowStatus = progressTracker.getExecutionFlowStatus(executionId);

        // Update flow execution state - support multiple concurrent executions
        const currentFlowState = get().flowExecutionState;
        currentFlowState.activeExecutions.set(executionId, flowStatus);

        // Set as selected execution if no current selection or if this is the first execution
        if (
          !currentFlowState.selectedExecution ||
          currentFlowState.activeExecutions.size === 1
        ) {
          currentFlowState.selectedExecution = executionId;
        }

        // Update node visual states for this execution
        currentFlowState.nodeVisualStates =
          progressTracker.getAllNodeVisualStates();

        set({ flowExecutionState: { ...currentFlowState } });

        // Log execution initialization
        get().addExecutionLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Initialized flow execution: ${executionId} with ${nodeIds.length} nodes`,
          data: {
            executionId,
            nodeCount: nodeIds.length,
            dependencies: Array.from(dependencies.entries()),
          },
        });
      },

      resetFlowExecution: () => {
        const { progressTracker } = get();
        progressTracker.reset();

        set({
          flowExecutionState: {
            activeExecutions: new Map(),
            nodeVisualStates: new Map(),
            executionHistory: [],
            realTimeUpdates: true,
            selectedExecution: undefined,
          },
        });
      },

      // Multiple execution management
      selectExecution: (executionId: string) => {
        const currentFlowState = get().flowExecutionState;
        if (currentFlowState.activeExecutions.has(executionId)) {
          currentFlowState.selectedExecution = executionId;
          set({ flowExecutionState: { ...currentFlowState } });

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Selected execution: ${executionId}`,
          });
        }
      },

      getActiveExecutions: () => {
        return get().flowExecutionState.activeExecutions;
      },

      removeCompletedExecution: (executionId: string) => {
        const currentFlowState = get().flowExecutionState;
        const execution = currentFlowState.activeExecutions.get(executionId);

        if (
          execution &&
          (execution.overallStatus === "completed" ||
            execution.overallStatus === "failed" ||
            execution.overallStatus === "cancelled")
        ) {
          // Add to history before removing
          const historyEntry = {
            executionId,
            workflowId: get().workflow?.id || "",
            triggerType: "manual" as const,
            startTime: Date.now() - 300000, // Estimate 5 minutes ago
            endTime: Date.now(),
            status: execution.overallStatus,
            executedNodes: execution.completedNodes,
            executionPath: execution.executionPath,
            metrics: get().progressTracker.getExecutionMetrics(executionId),
          };

          currentFlowState.executionHistory.unshift(historyEntry);
          // Keep only last 50 executions
          if (currentFlowState.executionHistory.length > 50) {
            currentFlowState.executionHistory =
              currentFlowState.executionHistory.slice(0, 50);
          }

          // Remove from active executions
          currentFlowState.activeExecutions.delete(executionId);

          // Update selected execution if this was the selected one
          if (currentFlowState.selectedExecution === executionId) {
            // Select the most recent active execution or none
            const remaining = Array.from(
              currentFlowState.activeExecutions.keys()
            );
            currentFlowState.selectedExecution =
              remaining.length > 0 ? remaining[0] : undefined;
          }

          set({ flowExecutionState: { ...currentFlowState } });

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Removed completed execution: ${executionId}`,
          });
        }
      },

      cleanupOldExecutions: (maxAge: number = 3600000) => {
        // Default 1 hour
        const currentFlowState = get().flowExecutionState;
        const now = Date.now();
        let cleaned = 0;

        for (const [
          executionId,
          execution,
        ] of currentFlowState.activeExecutions) {
          // Clean up executions that are completed and older than maxAge
          if (
            execution.overallStatus === "completed" ||
            execution.overallStatus === "failed" ||
            execution.overallStatus === "cancelled"
          ) {
            // Estimate execution time based on when it might have started
            const estimatedStartTime = now - 300000; // Assume 5 minutes ago if we don't have exact time
            if (now - estimatedStartTime > maxAge) {
              get().removeCompletedExecution(executionId);
              cleaned++;
            }
          }
        }

        if (cleaned > 0) {
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Cleaned up ${cleaned} old executions`,
          });
        }
      },

      // Execution actions
      executeWorkflow: async () => {
        const { workflow, executionState } = get();

        if (!workflow) {
          get().setExecutionError("No workflow to execute");
          return;
        }

        // Prevent multiple simultaneous executions
        if (executionState.status === "running") {
          console.warn("Workflow is already executing");
          return;
        }

        // Log workflow activation status
        if (!workflow.active) {
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: "Executing inactive workflow in manual/test mode",
          });
        }

        // Validate workflow before execution using enhanced validation
        const validation = validateWorkflowForExecution(workflow);
        if (!validation.isValid) {
          const errorMessage = `Cannot execute invalid workflow: ${validation.errors
            .map((e) => e.message)
            .join(", ")}`;
          get().setExecutionError(errorMessage);
          return;
        }

        // Log warnings if any
        if (validation.warnings.length > 0) {
          console.warn(
            "Execution warnings:",
            validation.warnings.map((w) => w.message)
          );
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: `Execution warnings: ${validation.warnings
              .map((w) => w.message)
              .join(", ")}`,
          });
        }

        const startTime = Date.now();

        // Clear previous execution data only when starting a new execution
        get().clearExecutionLogs();
        set({ realTimeResults: new Map() });

        // CRITICAL: Clear node visual states only when starting a new execution
        // This ensures that success/failed icons from previous executions are cleared
        // but preserved when just unsubscribing from real-time updates
        const currentFlowState = get().flowExecutionState;
        set({
          flowExecutionState: {
            ...currentFlowState,
            nodeVisualStates: new Map(), // Clear node states for new execution
          },
        });

        try {
          // Import execution service
          const { executionService } = await import("@/services/execution");

          // Find manual trigger nodes to prepare trigger data
          const manualTriggerNodes = workflow.nodes.filter(
            (node) => node.type === "manual-trigger"
          );
          let triggerData: any = {};

          if (manualTriggerNodes.length > 0) {
            // For manual triggers, prepare trigger data
            triggerData = executionService.prepareTriggerData({
              triggeredBy: "user",
              workflowName: workflow.name,
              nodeCount: workflow.nodes.length,
              timestamp: new Date().toISOString(),
            });

            get().addExecutionLog({
              timestamp: new Date().toISOString(),
              level: "info",
              message: `Prepared trigger data for ${manualTriggerNodes.length} manual trigger node(s)`,
              data: { triggerNodeCount: manualTriggerNodes.length },
            });
          }

          // Set initial execution state
          get().setExecutionState({
            status: "running",
            progress: 0,
            startTime,
            endTime: undefined,
            error: undefined,
            executionId: undefined, // Will be set when we get response
          });

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Starting execution of workflow: ${workflow.name}`,
            data: { workflowId: workflow.id, nodeCount: workflow.nodes.length },
          });

          // Start execution via API
          const executionResponse = await executionService.executeWorkflow({
            workflowId: workflow.id,
            triggerData,
            options: {
              timeout: 300000, // 5 minutes
              priority: "normal",
              manual: true, // Allow execution even if workflow is inactive (manual test execution)
            },
          });

          // Update execution state with real execution ID
          get().setExecutionState({
            executionId: executionResponse.executionId,
          });

          // Subscribe to real-time updates IMMEDIATELY
          await get().subscribeToExecution(executionResponse.executionId);

          // Initialize flow execution tracking
          const nodeIds = workflow.nodes.map((node) => node.id);
          get().initializeFlowExecution(executionResponse.executionId, nodeIds);

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Execution started with ID: ${executionResponse.executionId}`,
            data: { executionId: executionResponse.executionId },
          });

          console.log(
            `Started real execution ${executionResponse.executionId} for workflow ${workflow.id}`
          );

          // Poll for execution progress with enhanced progress tracking
          const finalProgress = await executionService.pollExecutionProgress(
            executionResponse.executionId,
            (progress) => {
              // Update progress in real-time
              const progressPercentage =
                progress.totalNodes > 0
                  ? Math.round(
                      (progress.completedNodes / progress.totalNodes) * 100
                    )
                  : 0;

              // Map backend status to frontend status
              let frontendStatus: ExecutionState["status"] = "running";
              if (progress.status === "success") frontendStatus = "success";
              else if (progress.status === "error") frontendStatus = "error";
              else if (progress.status === "cancelled")
                frontendStatus = "cancelled";

              get().setExecutionState({
                progress: progressPercentage,
                status: frontendStatus,
              });

              // Log progress updates
              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "info",
                message: `Progress: ${progress.completedNodes}/${progress.totalNodes} nodes completed (${progressPercentage}%)`,
                data: {
                  completedNodes: progress.completedNodes,
                  totalNodes: progress.totalNodes,
                  failedNodes: progress.failedNodes,
                  currentNode: progress.currentNode,
                },
              });

              // Log current node if available
              if (progress.currentNode) {
                const currentNodeName =
                  workflow.nodes.find((n) => n.id === progress.currentNode)
                    ?.name || progress.currentNode;

                // CRITICAL: Update visual progress for the currently executing node
                // This ensures real-time progress indicators are shown in the node UI
                get().updateNodeExecutionState(
                  progress.currentNode,
                  NodeExecutionStatus.RUNNING,
                  {
                    progress: progress.nodeProgress || 50, // Use node-specific progress or default to 50%
                    startTime: Date.now() - (progress.nodeElapsedTime || 1000), // Estimate start time
                  }
                );

                get().addExecutionLog({
                  timestamp: new Date().toISOString(),
                  level: "info",
                  nodeId: progress.currentNode,
                  message: `Executing node: ${currentNodeName}`,
                  data: {
                    nodeId: progress.currentNode,
                    nodeName: currentNodeName,
                    nodeProgress: progress.nodeProgress,
                    nodeElapsedTime: progress.nodeElapsedTime,
                  },
                });
              }

              console.log(
                `Execution progress: ${progress.completedNodes}/${progress.totalNodes} nodes completed`
              );
            },
            1000 // Poll every second
          );

          const endTime = Date.now();
          const duration = endTime - startTime;

          // Get detailed execution results
          const executionDetails = await executionService.getExecutionDetails(
            executionResponse.executionId
          );

          // Map backend status to frontend status for final result
          let finalStatus: WorkflowExecutionResult["status"] = "error";
          if (finalProgress.status === "success") finalStatus = "success";
          else if (finalProgress.status === "cancelled")
            finalStatus = "cancelled";

          // Create execution result from real data with enhanced error handling
          const nodeResults: NodeExecutionResult[] =
            executionDetails.nodeExecutions.map((nodeExec) => {
              // Map backend node status to frontend node status
              let nodeStatus: NodeExecutionResult["status"] = "skipped"; // Default to skipped instead of error

              // Handle various success status values from backend
              const successStatuses = [
                "success",
                "completed",
                "SUCCESS",
                "COMPLETED",
              ];
              const errorStatuses = ["error", "failed", "ERROR", "FAILED"];

              if (successStatuses.includes(nodeExec.status)) {
                nodeStatus = "success";
              } else if (errorStatuses.includes(nodeExec.status)) {
                nodeStatus = "error";
              } else if (!nodeExec.startedAt) {
                nodeStatus = "skipped"; // If node didn't run, mark as skipped
              }

              const nodeResult: NodeExecutionResult = {
                nodeId: nodeExec.nodeId,
                nodeName:
                  workflow.nodes.find((n) => n.id === nodeExec.nodeId)?.name ||
                  "Unknown",
                status: nodeStatus,
                startTime: nodeExec.startedAt
                  ? new Date(nodeExec.startedAt).getTime()
                  : startTime,
                endTime: nodeExec.finishedAt
                  ? new Date(nodeExec.finishedAt).getTime()
                  : endTime,
                duration:
                  nodeExec.finishedAt && nodeExec.startedAt
                    ? new Date(nodeExec.finishedAt).getTime() -
                      new Date(nodeExec.startedAt).getTime()
                    : 0,
                data: nodeExec.outputData,
                error: nodeExec.error,
              };

              // Update real-time results
              get().updateNodeExecutionResult(nodeExec.nodeId, nodeResult);

              // CRITICAL: Update node visual states for final execution results
              // This ensures that success/failed icons persist after execution completion
              const visualStatus =
                nodeStatus === "success"
                  ? NodeExecutionStatus.COMPLETED
                  : nodeStatus === "error"
                  ? NodeExecutionStatus.FAILED
                  : NodeExecutionStatus.SKIPPED;

              get().updateNodeExecutionState(nodeExec.nodeId, visualStatus, {
                progress: nodeStatus === "success" ? 100 : undefined,
                error: nodeExec.error,
                outputData: nodeExec.outputData,
                startTime: nodeExec.startedAt
                  ? new Date(nodeExec.startedAt).getTime()
                  : startTime,
                endTime: nodeExec.finishedAt
                  ? new Date(nodeExec.finishedAt).getTime()
                  : endTime,
              });

              // Log node completion
              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: nodeStatus === "error" ? "error" : "info",
                nodeId: nodeExec.nodeId,
                message: `Node ${nodeResult.nodeName} ${
                  nodeStatus === "success"
                    ? "completed successfully"
                    : nodeStatus === "error"
                    ? "failed"
                    : "was skipped"
                }`,
                data: {
                  nodeId: nodeExec.nodeId,
                  status: nodeStatus,
                  duration: nodeResult.duration,
                  error: nodeExec.error,
                },
              });

              return nodeResult;
            });

          const executionResult: WorkflowExecutionResult = {
            executionId: executionResponse.executionId,
            workflowId: workflow.id,
            status: finalStatus,
            startTime,
            endTime,
            duration,
            nodeResults,
            error: finalProgress.error?.message,
          };

          // Map final progress status to execution state status
          let executionStatus: ExecutionState["status"] = "error";
          if (finalProgress.status === "success") executionStatus = "success";
          else if (finalProgress.status === "cancelled")
            executionStatus = "cancelled";

          // Log final execution result
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: executionStatus === "success" ? "info" : "error",
            message: `Execution ${
              executionStatus === "success"
                ? "completed successfully"
                : executionStatus === "cancelled"
                ? "was cancelled"
                : "failed"
            }`,
            data: {
              executionId: executionResponse.executionId,
              status: executionStatus,
              duration,
              totalNodes: nodeResults.length,
              successfulNodes: nodeResults.filter((n) => n.status === "success")
                .length,
              failedNodes: nodeResults.filter((n) => n.status === "error")
                .length,
              error: finalProgress.error?.message,
            },
          });

          // Set final execution state
          set({
            executionState: {
              status: executionStatus,
              progress: 100,
              startTime,
              endTime,
              error: finalProgress.error?.message,
              executionId: executionResponse.executionId,
            },
            lastExecutionResult: executionResult,
          });

          // Save execution to history
          get().saveToHistory(`Execute workflow: ${workflow.name}`);

          // Keep subscription active for a while to show execution events
          // Unsubscribe after 30 seconds to let users see the execution logs
          setTimeout(async () => {
            try {
              await get().unsubscribeFromExecution(
                executionResponse.executionId
              );
            } catch (error) {
              console.warn("Failed to unsubscribe from execution:", error);
            }
          }, 30000); // 30 seconds delay

          // Clear execution state after a delay for successful executions
          if (finalProgress.status === "success") {
            setTimeout(() => {
              get().clearExecutionState(); // Preserves logs by default
            }, 3000);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown execution error";
          const endTime = Date.now();

          console.error("Workflow execution failed:", error);

          // Log execution failure
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "error",
            message: `Execution failed: ${errorMessage}`,
            data: {
              error: errorMessage,
              stack: error instanceof Error ? error.stack : undefined,
            },
          });

          // Create failed execution result
          const executionResult: WorkflowExecutionResult = {
            executionId:
              get().executionState.executionId || `failed_${Date.now()}`,
            workflowId: workflow.id,
            status: "error",
            startTime,
            endTime,
            duration: endTime - startTime,
            nodeResults: Array.from(get().realTimeResults.values()),
            error: errorMessage,
          };

          set({
            executionState: {
              status: "error",
              progress: 0,
              startTime,
              endTime,
              error: errorMessage,
              executionId: get().executionState.executionId,
            },
            lastExecutionResult: executionResult,
          });

          // Keep subscription active even on error for a while to show execution events
          // Unsubscribe after 30 seconds to let users see what went wrong
          const currentExecutionId = get().executionState.executionId;
          if (currentExecutionId) {
            setTimeout(async () => {
              try {
                await get().unsubscribeFromExecution(currentExecutionId);
              } catch (error) {
                console.warn("Failed to unsubscribe from execution:", error);
              }
            }, 30000); // 30 seconds delay
          }
        }
      },

      executeNode: async (
        nodeId: string,
        inputData?: any,
        mode: "single" | "workflow" = "single"
      ) => {
        const { workflow, executionState } = get();

        if (!workflow) {
          get().setExecutionError("No workflow to execute node from");
          return;
        }

        // Prevent execution during workflow execution
        if (executionState.status === "running") {
          console.warn(
            "Cannot execute individual node while workflow is running"
          );
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: "Cannot execute individual node while workflow is running",
          });
          return;
        }

        // Find the node
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) {
          get().setExecutionError(`Node not found: ${nodeId}`);
          return;
        }

        const startTime = Date.now();

        try {
          // Import execution service
          const { executionService } = await import("@/services/execution");

          // Set node execution state
          get().updateNodeExecutionResult(nodeId, {
            nodeId,
            nodeName: node.name,
            status: "success", // Will be updated based on result
            startTime,
            endTime: startTime,
            duration: 0,
            data: undefined,
            error: undefined,
          });

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            nodeId,
            message: `Starting execution of node: ${node.name}`,
            data: { nodeId, nodeType: node.type },
          });

          // Execute based on mode
          if (mode === "workflow") {
            // For workflow mode, use the main workflow execution endpoint
            // This is essentially the same as executeWorkflow() but triggered from a specific node

            // Clear previous execution data and states like main executeWorkflow
            get().clearExecutionLogs();
            set({ realTimeResults: new Map() });

            // Clear node visual states for new execution
            const currentFlowState = get().flowExecutionState;
            set({
              flowExecutionState: {
                ...currentFlowState,
                nodeVisualStates: new Map(),
              },
            });

            // Set initial execution state - CRITICAL for UI feedback
            get().setExecutionState({
              status: "running",
              progress: 0,
              startTime,
              endTime: undefined,
              error: undefined,
              executionId: undefined, // Will be set when we get response
            });

            get().addExecutionLog({
              timestamp: new Date().toISOString(),
              level: "info",
              nodeId,
              message: `Starting workflow execution from trigger node: ${node.name}`,
              data: { nodeId, nodeType: node.type, mode },
            });

            try {
              // Prepare proper trigger data for workflow execution
              const triggerData = executionService.prepareTriggerData({
                triggeredBy: "user",
                workflowName: workflow.name,
                nodeCount: workflow.nodes.length,
                triggerNodeId: nodeId,
                triggerNodeType: node.type,
              });

              // Start the workflow execution
              const executionResponse = await executionService.executeWorkflow({
                workflowId: workflow.id,
                triggerData,
                triggerNodeId: nodeId,
                options: {
                  timeout: 300000, // 5 minutes
                  manual: true,
                },
              });

              // Update execution state with real execution ID
              get().setExecutionState({
                executionId: executionResponse.executionId,
              });

              // Subscribe to real-time updates IMMEDIATELY
              await get().subscribeToExecution(executionResponse.executionId);

              // Initialize flow execution tracking
              const nodeIds = workflow.nodes.map((node) => node.id);
              get().initializeFlowExecution(
                executionResponse.executionId,
                nodeIds
              );

              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "info",
                nodeId,
                message: `Workflow execution started: ${executionResponse.executionId}`,
                data: {
                  nodeId,
                  executionId: executionResponse.executionId,
                  mode: "workflow",
                },
              });

              console.log(
                `Started workflow execution ${executionResponse.executionId} from trigger node ${nodeId}`
              );

              // Poll for completion with progress updates and UI state updates
              const finalProgress =
                await executionService.pollExecutionProgress(
                  executionResponse.executionId,
                  (progress) => {
                    // Update progress in real-time like main executeWorkflow
                    const progressPercentage =
                      progress.totalNodes > 0
                        ? Math.round(
                            (progress.completedNodes / progress.totalNodes) *
                              100
                          )
                        : 0;

                    // Map backend status to frontend status
                    let frontendStatus: ExecutionState["status"] = "running";
                    if (progress.status === "success")
                      frontendStatus = "success";
                    else if (progress.status === "error")
                      frontendStatus = "error";
                    else if (progress.status === "cancelled")
                      frontendStatus = "cancelled";
                    else if (progress.status === "partial")
                      frontendStatus = "success"; // Treat partial as success

                    get().setExecutionState({
                      progress: progressPercentage,
                      status: frontendStatus,
                    });

                    // Update execution logs with progress
                    get().addExecutionLog({
                      timestamp: new Date().toISOString(),
                      level: "info",
                      nodeId,
                      message: `Workflow progress: ${progress.completedNodes}/${progress.totalNodes} nodes completed (${progressPercentage}%)`,
                      data: {
                        executionId: executionResponse.executionId,
                        progress: progressPercentage,
                        status: progress.status,
                        completedNodes: progress.completedNodes,
                        totalNodes: progress.totalNodes,
                        failedNodes: progress.failedNodes,
                        currentNode: progress.currentNode,
                      },
                    });

                    // Update current node visual state if available
                    if (progress.currentNode) {
                      const currentNodeName =
                        workflow.nodes.find(
                          (n) => n.id === progress.currentNode
                        )?.name || progress.currentNode;

                      get().updateNodeExecutionState(
                        progress.currentNode,
                        NodeExecutionStatus.RUNNING,
                        {
                          progress: 50, // Default progress for running node
                          startTime: Date.now() - 1000, // Estimate start time
                        }
                      );

                      get().addExecutionLog({
                        timestamp: new Date().toISOString(),
                        level: "info",
                        nodeId: progress.currentNode,
                        message: `Executing node: ${currentNodeName}`,
                        data: {
                          nodeId: progress.currentNode,
                          nodeName: currentNodeName,
                        },
                      });
                    }

                    console.log(
                      `Workflow progress: ${progress.completedNodes}/${progress.totalNodes} nodes completed`
                    );
                  }
                );

              const endTime = Date.now();
              const duration = endTime - startTime;

              // Get detailed execution results
              const executionDetails =
                await executionService.getExecutionDetails(
                  executionResponse.executionId
                );

              // Update all node visual states based on final results
              executionDetails.nodeExecutions.forEach((nodeExec) => {
                // Handle both frontend and backend status formats
                const statusString = nodeExec.status as string;
                const nodeStatus =
                  statusString === "SUCCESS" || statusString === "success"
                    ? "success"
                    : statusString === "ERROR" || statusString === "error"
                    ? "error"
                    : "skipped";

                const visualStatus =
                  nodeStatus === "success"
                    ? NodeExecutionStatus.COMPLETED
                    : nodeStatus === "error"
                    ? NodeExecutionStatus.FAILED
                    : NodeExecutionStatus.SKIPPED;

                get().updateNodeExecutionState(nodeExec.nodeId, visualStatus, {
                  progress: nodeStatus === "success" ? 100 : undefined,
                  error: nodeExec.error,
                  outputData: nodeExec.outputData,
                  startTime: nodeExec.startedAt
                    ? new Date(nodeExec.startedAt).getTime()
                    : startTime,
                  endTime: nodeExec.finishedAt
                    ? new Date(nodeExec.finishedAt).getTime()
                    : endTime,
                });

                // Update real-time results
                get().updateNodeExecutionResult(nodeExec.nodeId, {
                  nodeId: nodeExec.nodeId,
                  nodeName:
                    workflow.nodes.find((n) => n.id === nodeExec.nodeId)
                      ?.name || "Unknown",
                  status: nodeStatus,
                  startTime: nodeExec.startedAt
                    ? new Date(nodeExec.startedAt).getTime()
                    : startTime,
                  endTime: nodeExec.finishedAt
                    ? new Date(nodeExec.finishedAt).getTime()
                    : endTime,
                  duration:
                    nodeExec.finishedAt && nodeExec.startedAt
                      ? new Date(nodeExec.finishedAt).getTime() -
                        new Date(nodeExec.startedAt).getTime()
                      : 0,
                  data: nodeExec.outputData,
                  error: nodeExec.error,
                });
              });

              // Determine final execution status
              let finalStatus: ExecutionState["status"] = "success";
              if (finalProgress.status === "error") finalStatus = "error";
              else if (finalProgress.status === "cancelled")
                finalStatus = "cancelled";
              // Treat partial as success since some nodes succeeded

              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level:
                  finalProgress.status === "success"
                    ? "info"
                    : finalProgress.status === "partial"
                    ? "warn"
                    : "error",
                nodeId,
                message: `Workflow execution ${
                  finalProgress.status === "success"
                    ? "completed successfully"
                    : finalProgress.status === "partial"
                    ? "completed with some failures"
                    : "failed"
                } from trigger node: ${node.name}`,
                data: {
                  nodeId,
                  executionId: executionResponse.executionId,
                  status: finalProgress.status,
                  totalNodes: finalProgress.totalNodes,
                  completedNodes: finalProgress.completedNodes,
                  failedNodes: finalProgress.failedNodes,
                  duration,
                  error: finalProgress.error,
                },
              });

              // Set final execution state
              set({
                executionState: {
                  status: finalStatus,
                  progress: 100,
                  startTime,
                  endTime,
                  error: finalProgress.error?.message,
                  executionId: executionResponse.executionId,
                },
              });

              console.log(
                `Workflow execution ${finalProgress.status}: ${executionResponse.executionId}`
              );

              // Keep subscription active for a while to show execution events
              setTimeout(async () => {
                try {
                  await get().unsubscribeFromExecution(
                    executionResponse.executionId
                  );
                } catch (error) {
                  console.warn("Failed to unsubscribe from execution:", error);
                }
              }, 30000); // 30 seconds delay

              // Clear execution state after a delay for successful executions
              if (finalStatus === "success") {
                setTimeout(() => {
                  get().clearExecutionState(); // Preserves logs by default
                }, 3000);
              }
            } catch (error) {
              const endTime = Date.now();
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

              console.error("Workflow execution error:", error);

              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "error",
                nodeId,
                message: `Workflow execution failed: ${errorMessage}`,
                data: {
                  nodeId,
                  error: errorMessage,
                  mode: "workflow",
                },
              });

              // Set error execution state
              set({
                executionState: {
                  status: "error",
                  progress: 0,
                  startTime,
                  endTime,
                  error: errorMessage,
                  executionId: get().executionState.executionId,
                },
              });

              // Keep subscription active even on error for a while
              const currentExecutionId = get().executionState.executionId;
              if (currentExecutionId) {
                setTimeout(async () => {
                  try {
                    await get().unsubscribeFromExecution(currentExecutionId);
                  } catch (error) {
                    console.warn(
                      "Failed to unsubscribe from execution:",
                      error
                    );
                  }
                }, 30000);
              }
            }
          } else {
            // For single mode, use the single node execution endpoint
            const result = await executionService.executeSingleNode({
              workflowId: workflow.id,
              nodeId,
              inputData: inputData || { main: [[]] },
              parameters: node.parameters,
              mode,
            });

            // Update node execution result
            get().updateNodeExecutionResult(nodeId, {
              nodeId,
              nodeName: node.name,
              status: result.status === "success" ? "success" : "error",
              startTime: result.startTime,
              endTime: result.endTime,
              duration: result.duration,
              data: result.data,
              error: result.error,
            });

            // CRITICAL: Update node visual states for single node execution
            // This ensures that success/failed icons persist after single node execution
            const visualStatus =
              result.status === "success"
                ? NodeExecutionStatus.COMPLETED
                : NodeExecutionStatus.FAILED;

            get().updateNodeExecutionState(nodeId, visualStatus, {
              progress: result.status === "success" ? 100 : undefined,
              error: result.error,
              outputData: result.data,
              startTime: result.startTime,
              endTime: result.endTime,
            });

            get().addExecutionLog({
              timestamp: new Date().toISOString(),
              level: result.status === "success" ? "info" : "error",
              nodeId,
              message: `Node execution ${
                result.status === "success"
                  ? "completed successfully"
                  : "failed"
              }: ${node.name}`,
              data: {
                nodeId,
                status: result.status,
                duration: result.duration,
                error: result.error,
              },
            });

            console.log(`Single node execution ${result.status}: ${nodeId}`);
            console.warn(
              "Note: This is single node execution - use executeWorkflow() for full workflow execution"
            );
          }
        } catch (error) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown execution error";

          console.error("Single node execution failed:", error);

          // Update node execution result with error
          get().updateNodeExecutionResult(nodeId, {
            nodeId,
            nodeName: node.name,
            status: "error",
            startTime,
            endTime,
            duration,
            data: undefined,
            error: errorMessage,
          });

          // CRITICAL: Update node visual states for failed single node execution
          // This ensures that failed icons persist after single node execution error
          get().updateNodeExecutionState(nodeId, NodeExecutionStatus.FAILED, {
            error: errorMessage,
            startTime,
            endTime,
          });

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "error",
            nodeId,
            message: `Node execution failed: ${node.name} - ${errorMessage}`,
            data: { nodeId, error: errorMessage, duration },
          });
        }
      },

      stopExecution: async () => {
        const { executionState } = get();

        if (
          executionState.status !== "running" ||
          !executionState.executionId
        ) {
          console.warn("No execution to stop");
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: "No active execution to stop",
          });
          return;
        }

        get().addExecutionLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Attempting to cancel execution: ${executionState.executionId}`,
        });

        try {
          // Import execution service
          const { executionService } = await import("@/services/execution");

          // Cancel execution via API
          await executionService.cancelExecution(executionState.executionId);

          const endTime = Date.now();
          const startTime = executionState.startTime || endTime;

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Execution cancellation request sent successfully",
          });

          // Get execution details to capture any partial results
          let nodeResults: NodeExecutionResult[] = [];
          try {
            const executionDetails = await executionService.getExecutionDetails(
              executionState.executionId
            );
            nodeResults = executionDetails.nodeExecutions.map((nodeExec) => {
              // Map backend node status to frontend node status
              let nodeStatus: NodeExecutionResult["status"] = "skipped";

              // Handle various success status values from backend
              const successStatuses = [
                "success",
                "completed",
                "SUCCESS",
                "COMPLETED",
              ];
              const errorStatuses = ["error", "failed", "ERROR", "FAILED"];

              if (successStatuses.includes(nodeExec.status)) {
                nodeStatus = "success";
              } else if (errorStatuses.includes(nodeExec.status)) {
                nodeStatus = "error";
              }

              const nodeResult: NodeExecutionResult = {
                nodeId: nodeExec.nodeId,
                nodeName:
                  get().workflow?.nodes.find((n) => n.id === nodeExec.nodeId)
                    ?.name || "Unknown",
                status: nodeStatus,
                startTime: nodeExec.startedAt
                  ? new Date(nodeExec.startedAt).getTime()
                  : startTime,
                endTime: nodeExec.finishedAt
                  ? new Date(nodeExec.finishedAt).getTime()
                  : endTime,
                duration:
                  nodeExec.finishedAt && nodeExec.startedAt
                    ? new Date(nodeExec.finishedAt).getTime() -
                      new Date(nodeExec.startedAt).getTime()
                    : 0,
                data: nodeExec.outputData,
                error: nodeExec.error,
              };

              // Update real-time results
              get().updateNodeExecutionResult(nodeExec.nodeId, nodeResult);

              // CRITICAL: Update node visual states for cancelled execution results
              // This ensures that success/failed icons persist even after cancellation
              const visualStatus =
                nodeStatus === "success"
                  ? NodeExecutionStatus.COMPLETED
                  : nodeStatus === "error"
                  ? NodeExecutionStatus.FAILED
                  : NodeExecutionStatus.CANCELLED;

              get().updateNodeExecutionState(nodeExec.nodeId, visualStatus, {
                progress: nodeStatus === "success" ? 100 : undefined,
                error: nodeExec.error,
                outputData: nodeExec.outputData,
                startTime: nodeExec.startedAt
                  ? new Date(nodeExec.startedAt).getTime()
                  : startTime,
                endTime: nodeExec.finishedAt
                  ? new Date(nodeExec.finishedAt).getTime()
                  : endTime,
              });

              return nodeResult;
            });
          } catch (detailsError) {
            console.warn(
              "Could not fetch execution details for cancelled execution:",
              detailsError
            );
            get().addExecutionLog({
              timestamp: new Date().toISOString(),
              level: "warn",
              message:
                "Could not fetch final execution details after cancellation",
            });
            // Use real-time results as fallback
            nodeResults = Array.from(get().realTimeResults.values());
          }

          // Create cancelled execution result
          const executionResult: WorkflowExecutionResult = {
            executionId: executionState.executionId,
            workflowId: get().workflow?.id || "",
            status: "cancelled",
            startTime,
            endTime,
            duration: endTime - startTime,
            nodeResults,
            error: "Execution cancelled by user",
          };

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Execution cancelled successfully. Duration: ${
              endTime - startTime
            }ms`,
            data: {
              executionId: executionState.executionId,
              duration: endTime - startTime,
              completedNodes: nodeResults.filter((n) => n.status === "success")
                .length,
              totalNodes: nodeResults.length,
            },
          });

          set({
            executionState: {
              status: "cancelled",
              progress: executionState.progress || 0,
              startTime,
              endTime,
              error: "Execution cancelled by user",
              executionId: executionState.executionId,
            },
            lastExecutionResult: executionResult,
          });

          // Save cancellation to history
          get().saveToHistory("Cancel workflow execution");

          // Keep subscription active for a while after cancellation to show final status
          // Unsubscribe after 10 seconds for cancelled executions
          setTimeout(async () => {
            try {
              if (executionState.executionId) {
                await get().unsubscribeFromExecution(
                  executionState.executionId
                );
              }
            } catch (error) {
              console.warn("Failed to unsubscribe from execution:", error);
            }
          }, 10000); // 10 seconds delay for cancellation

          // Clear execution state after a delay
          setTimeout(() => {
            get().clearExecutionState(); // Preserves logs by default
          }, 2000);

          console.log(`Cancelled execution ${executionState.executionId}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to stop execution";
          console.error("Failed to cancel execution:", error);

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "error",
            message: `Failed to cancel execution: ${errorMessage}`,
            data: { error: errorMessage },
          });

          get().setExecutionError(errorMessage);
        }
      },

      // Enhanced execution control methods
      cancelExecution: async (executionId?: string) => {
        const { executionState } = get();
        const targetExecutionId = executionId || executionState.executionId;

        if (!targetExecutionId) {
          console.warn("No execution ID provided for cancellation");
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: "No execution ID provided for cancellation",
          });
          return;
        }

        get().addExecutionLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Cancelling execution: ${targetExecutionId}`,
        });

        try {
          // Import execution service
          const { executionService } = await import("@/services/execution");

          // Cancel execution via API
          await executionService.cancelExecution(targetExecutionId);

          // Update flow execution state
          const currentFlowState = get().flowExecutionState;
          const flowStatus =
            currentFlowState.activeExecutions.get(targetExecutionId);
          if (flowStatus) {
            flowStatus.overallStatus = "cancelled";
            currentFlowState.activeExecutions.set(
              targetExecutionId,
              flowStatus
            );
            set({ flowExecutionState: { ...currentFlowState } });
          }

          // Update execution state if this is the current execution
          if (targetExecutionId === executionState.executionId) {
            get().setExecutionState({
              status: "cancelled",
              error: "Execution cancelled by user",
            });
          }

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Execution ${targetExecutionId} cancelled successfully`,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to cancel execution";
          console.error("Failed to cancel execution:", error);

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "error",
            message: `Failed to cancel execution ${targetExecutionId}: ${errorMessage}`,
            data: { error: errorMessage, executionId: targetExecutionId },
          });

          get().setExecutionError(errorMessage);
        }
      },

      pauseExecution: async (executionId?: string) => {
        const { executionState } = get();
        const targetExecutionId = executionId || executionState.executionId;

        if (!targetExecutionId) {
          console.warn("No execution ID provided for pausing");
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: "No execution ID provided for pausing",
          });
          return;
        }

        get().addExecutionLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Pausing execution: ${targetExecutionId}`,
        });

        try {
          // Import execution service
          const { executionService } = await import("@/services/execution");

          // Call backend pause API
          await executionService.pauseExecution(targetExecutionId);

          // Update execution state
          if (executionState.executionId === targetExecutionId) {
            set({
              executionState: {
                ...executionState,
                status: "paused",
              },
            });
          }

          // Update flow execution state
          const currentFlowState = get().flowExecutionState;
          const flowStatus =
            currentFlowState.activeExecutions.get(targetExecutionId);
          if (flowStatus) {
            // Mark as paused in local state
            flowStatus.currentlyExecuting = []; // Clear currently executing nodes
            currentFlowState.activeExecutions.set(
              targetExecutionId,
              flowStatus
            );
            set({ flowExecutionState: { ...currentFlowState } });
          }

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Execution ${targetExecutionId} paused successfully`,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to pause execution";
          console.error("Failed to pause execution:", error);

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "error",
            message: `Failed to pause execution ${targetExecutionId}: ${errorMessage}`,
            data: { error: errorMessage, executionId: targetExecutionId },
          });

          get().setExecutionError(errorMessage);
        }
      },

      resumeExecution: async (executionId?: string) => {
        const { executionState } = get();
        const targetExecutionId = executionId || executionState.executionId;

        if (!targetExecutionId) {
          console.warn("No execution ID provided for resuming");
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: "No execution ID provided for resuming",
          });
          return;
        }

        get().addExecutionLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Resuming execution: ${targetExecutionId}`,
        });

        try {
          // Import execution service
          const { executionService } = await import("@/services/execution");

          // Call backend resume API
          await executionService.resumeExecution(targetExecutionId);

          // Update execution state
          if (executionState.executionId === targetExecutionId) {
            set({
              executionState: {
                ...executionState,
                status: "running",
              },
            });
          }

          // Update flow execution state
          const currentFlowState = get().flowExecutionState;
          const flowStatus =
            currentFlowState.activeExecutions.get(targetExecutionId);
          if (flowStatus) {
            // Mark as running again in local state
            flowStatus.overallStatus = "running";
            currentFlowState.activeExecutions.set(
              targetExecutionId,
              flowStatus
            );
            set({ flowExecutionState: { ...currentFlowState } });
          }

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Execution ${targetExecutionId} resumed successfully`,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to resume execution";
          console.error("Failed to resume execution:", error);

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "error",
            message: `Failed to resume execution ${targetExecutionId}: ${errorMessage}`,
            data: { error: errorMessage, executionId: targetExecutionId },
          });

          get().setExecutionError(errorMessage);
        }
      },

      setExecutionState: (state: Partial<ExecutionState>) => {
        const currentState = get().executionState;
        set({
          executionState: { ...currentState, ...state },
        });
      },

      clearExecutionState: (preserveLogs = true) => {
        const currentLogs = preserveLogs ? get().executionLogs : [];

        set({
          executionState: {
            status: "idle",
            progress: 0,
            startTime: undefined,
            endTime: undefined,
            error: undefined,
            executionId: undefined,
          },
          realTimeResults: new Map(),
          executionLogs: currentLogs, // Preserve logs by default
          // Note: Node visual states are not cleared here by design
          // They are only cleared when starting a new execution in executeWorkflow()
          // This ensures success/failed icons remain visible after unsubscribing
        });
      },

      setExecutionProgress: (progress: number) => {
        const clampedProgress = Math.max(0, Math.min(100, progress));
        get().setExecutionState({ progress: clampedProgress });
      },

      setExecutionError: (error: string) => {
        const endTime = Date.now();
        const startTime = get().executionState.startTime || endTime;

        // Add error to execution logs
        get().addExecutionLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: error,
        });

        set({
          executionState: {
            status: "error",
            progress: 0,
            startTime,
            endTime,
            error,
            executionId: get().executionState.executionId,
          },
        });
      },

      updateNodeExecutionResult: (
        nodeId: string,
        result: Partial<NodeExecutionResult>
      ) => {
        const currentResults = get().realTimeResults;
        const existingResult = currentResults.get(nodeId);

        const updatedResult: NodeExecutionResult = {
          nodeId,
          nodeName: result.nodeName || existingResult?.nodeName || "Unknown",
          status: result.status || existingResult?.status || "skipped", // Use "skipped" instead of "error" as default
          startTime:
            result.startTime || existingResult?.startTime || Date.now(),
          endTime: result.endTime || existingResult?.endTime || Date.now(),
          duration: result.duration || existingResult?.duration || 0,
          data: result.data !== undefined ? result.data : existingResult?.data,
          error:
            result.error !== undefined ? result.error : existingResult?.error,
        };

        const newResults = new Map(currentResults);
        newResults.set(nodeId, updatedResult);

        set({ realTimeResults: newResults });
      },

      addExecutionLog: (log: ExecutionLogEntry) => {
        const currentLogs = get().executionLogs;
        const newLogs = [...currentLogs, log];

        // Limit log size to prevent memory issues (keep last 1000 entries)
        if (newLogs.length > 1000) {
          newLogs.splice(0, newLogs.length - 1000);
        }

        set({ executionLogs: newLogs });
      },

      clearExecutionLogs: () => {
        // CRITICAL: This should ONLY be called when starting a new execution
        // Logs are preserved when unsubscribing from executions and after execution completion
        // This ensures the last execution's logs remain visible until a new execution starts
        set({ executionLogs: [] });
      },

      getNodeExecutionResult: (nodeId: string) => {
        return get().realTimeResults.get(nodeId);
      },

      // Real-time execution updates
      subscribeToExecution: async (executionId: string) => {
        try {
          // Connect to WebSocket if not already connected
          if (!executionWebSocket.isConnected()) {
            await executionWebSocket.connect();
          }

          // Subscribe to execution updates
          await executionWebSocket.subscribeToExecution(executionId);

          // Set up event listener for this execution
          executionWebSocket.addEventListener(
            executionId,
            (data: ExecutionEventData) => {
              get().handleExecutionEvent(data);
            }
          );

          // Store unsubscribe function for cleanup
          const currentFlowState = get().flowExecutionState;
          if (!currentFlowState.activeExecutions.has(executionId)) {
            currentFlowState.activeExecutions.set(executionId, {
              executionId,
              overallStatus: "running",
              progress: 0,
              nodeStates: new Map(),
              currentlyExecuting: [],
              completedNodes: [],
              failedNodes: [],
              queuedNodes: [],
              executionPath: [],
            });
          }

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Subscribed to real-time updates for execution: ${executionId}`,
          });
        } catch (error) {
          console.error("Failed to subscribe to execution updates:", error);
          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: "Failed to subscribe to real-time execution updates",
          });
        }
      },

      unsubscribeFromExecution: async (executionId: string) => {
        try {
          await executionWebSocket.unsubscribeFromExecution(executionId);
          executionWebSocket.removeExecutionListeners(executionId);

          // Preserve current execution logs before any operations
          const currentLogs = get().executionLogs.slice(); // Create a copy

          // Preserve execution data before removing from active executions
          const currentFlowState = get().flowExecutionState;
          const executionData =
            currentFlowState.activeExecutions.get(executionId);

          // CRITICAL: Preserve node visual states by copying them before clearing the execution
          // This ensures success/failed icons remain visible until the next execution
          const preservedNodeStates = new Map(
            currentFlowState.nodeVisualStates
          );

          if (executionData) {
            // Move execution to history to preserve logs and state
            const historyEntry = {
              executionId,
              workflowId: get().workflow?.id || "",
              triggerType: "manual",
              startTime: Date.now(),
              endTime:
                executionData.overallStatus === "running"
                  ? undefined
                  : Date.now(),
              status: executionData.overallStatus,
              executedNodes: Array.from(executionData.nodeStates.keys()),
              executionPath: executionData.executionPath,
              metrics: {
                totalNodes: executionData.nodeStates.size,
                completedNodes: Array.from(
                  executionData.nodeStates.values()
                ).filter((n) => n.status === NodeExecutionStatus.COMPLETED)
                  .length,
                failedNodes: Array.from(
                  executionData.nodeStates.values()
                ).filter((n) => n.status === NodeExecutionStatus.FAILED).length,
                averageNodeDuration: 0,
                longestRunningNode: "",
                bottleneckNodes: [],
                parallelismUtilization: 0,
              },
            };
            currentFlowState.executionHistory.unshift(historyEntry);
          }

          // Remove from active executions but keep in history
          currentFlowState.activeExecutions.delete(executionId);

          // Only clear selected execution if it matches the unsubscribed one
          if (currentFlowState.selectedExecution === executionId) {
            currentFlowState.selectedExecution = undefined;
          }

          set({
            flowExecutionState: {
              ...currentFlowState,
              // CRITICAL: Keep the preserved node visual states to maintain success/failed icons
              nodeVisualStates: preservedNodeStates,
            },
            // Ensure logs are preserved after unsubscribing
            executionLogs: currentLogs,
          });

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Unsubscribed from real-time updates for execution: ${executionId}. Logs and node states preserved until next execution.`,
          });
        } catch (error) {
          console.error("Failed to unsubscribe from execution updates:", error);
        }
      },

      handleExecutionEvent: (data: ExecutionEventData) => {
        console.log("=== FRONTEND PROCESSING EVENT ===", {
          type: data.type,
          nodeId: data.nodeId,
          executionId: data.executionId,
          currentExecutionId: get().executionState.executionId,
        });

        const { executionState, progressTracker } = get();

        switch (data.type) {
          case "node-started":
            console.log("=== PROCESSING NODE-STARTED EVENT ===", {
              nodeId: data.nodeId,
              executionId: data.executionId,
            });
            if (data.nodeId) {
              // Set node visual state to running with loading indicator
              get().updateNodeExecutionState(
                data.nodeId,
                NodeExecutionStatus.RUNNING,
                {
                  startTime: Date.now(),
                  progress: 0,
                }
              );

              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "info",
                nodeId: data.nodeId,
                message: `Starting execution of node: ${
                  data.data?.node?.name || data.nodeId
                }`,
                data: data.data,
              });
            }
            break;

          case "node-completed":
            console.log("=== PROCESSING NODE-COMPLETED EVENT ===", {
              nodeId: data.nodeId,
              executionId: data.executionId,
            });
            if (data.nodeId) {
              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "info",
                nodeId: data.nodeId,
                message: `Node execution completed successfully: ${
                  data.data?.node?.name || data.nodeId
                }`,
                data: data.data,
              });
            }
            break;

          case "node-failed":
            console.log("=== PROCESSING NODE-FAILED EVENT ===", {
              nodeId: data.nodeId,
              executionId: data.executionId,
            });
            if (data.nodeId) {
              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "error",
                nodeId: data.nodeId,
                message: `Node execution failed: ${
                  data.data?.node?.name || data.nodeId
                } - ${data.error?.message || "Unknown error"}`,
                data: data.data,
              });
            }
            break;

          case "node-status-update":
            if (data.nodeId && data.status) {
              get().updateNodeExecutionState(data.nodeId, data.status, {
                progress: data.progress,
                error: data.error,
                inputData: data.data?.inputData,
                outputData: data.data?.outputData,
                startTime: data.data?.startTime,
                endTime: data.data?.endTime,
              });

              // Log node status change
              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level:
                  data.status === NodeExecutionStatus.FAILED ? "error" : "info",
                nodeId: data.nodeId,
                message: `Node status changed to: ${data.status}`,
                data: data.data,
              });
            }
            break;

          case "execution-progress":
            console.log("📊 Execution progress:", data);
            if (data.progress !== undefined) {
              get().setExecutionProgress(data.progress);

              // Update visual state for current running node and overall progress
              if (data.progress && typeof data.progress === "object") {
                const progress = data.progress as any; // Cast to access ExecutionProgress properties

                // If there's a current node, update its visual state to show progress
                if (progress.currentNode) {
                  const progressPercentage = Math.round(
                    (progress.completedNodes / progress.totalNodes) * 100
                  );
                  const elapsedTime = progress.startedAt
                    ? Date.now() - new Date(progress.startedAt).getTime()
                    : 0;

                  get().updateNodeExecutionState(
                    progress.currentNode,
                    NodeExecutionStatus.RUNNING,
                    {
                      progress: progressPercentage,
                      startTime: elapsedTime,
                      duration: elapsedTime,
                    }
                  );
                }
              }
            }
            break;

          case "execution-complete":
            // Update overall execution status
            const finalStatus = data.error ? "error" : "success";
            get().setExecutionState({
              status: finalStatus,
              progress: 100,
              endTime: Date.now(),
              error: data.error?.message,
            });

            // Add to execution history
            const currentFlowState = get().flowExecutionState;
            const flowStatus = currentFlowState.activeExecutions.get(
              data.executionId
            );
            if (flowStatus) {
              const historyEntry = {
                executionId: data.executionId,
                workflowId: executionState.executionId || "",
                triggerType: "manual",
                startTime: executionState.startTime || Date.now(),
                endTime: Date.now(),
                status: finalStatus,
                executedNodes: flowStatus.completedNodes,
                executionPath: flowStatus.executionPath,
                metrics: progressTracker.getExecutionMetrics(data.executionId),
              };

              currentFlowState.executionHistory.unshift(historyEntry);
              // Keep only last 50 executions
              if (currentFlowState.executionHistory.length > 50) {
                currentFlowState.executionHistory =
                  currentFlowState.executionHistory.slice(0, 50);
              }

              set({ flowExecutionState: { ...currentFlowState } });
            }
            break;

          case "execution-error":
            get().setExecutionError(data.error?.message || "Execution failed");
            break;
        }
      },

      setupSocketListeners: () => {
        const setupListeners = async () => {
          try {
            const { socketService } = await import("@/services/socket");

            // Handle execution events (legacy and flow execution)
            socketService.on("execution-event", (event: any) => {
              const { executionState } = get();

              // Only process events for the current execution
              if (event.executionId !== executionState.executionId) {
                return;
              }

              get().addExecutionLog({
                timestamp: new Date(event.timestamp).toISOString(),
                level: "info",
                nodeId: event.nodeId,
                message: `Execution event: ${event.type}`,
                data: {
                  type: event.type,
                  nodeId: event.nodeId,
                  data: event.data,
                },
              });

              // Update execution state based on event type
              switch (event.type) {
                case "started":
                  get().setExecutionState({ status: "running" });
                  break;
                case "completed":
                  // Handle flow execution completion
                  if (event.data?.executedNodes && event.data?.failedNodes) {
                    // This is a flow execution completion event
                    get().addExecutionLog({
                      timestamp: new Date().toISOString(),
                      level: "info",
                      message: `Flow execution completed: ${event.data.executedNodes.length} nodes executed, ${event.data.failedNodes.length} failed`,
                      data: {
                        executedNodes: event.data.executedNodes,
                        failedNodes: event.data.failedNodes,
                        duration: event.data.duration,
                      },
                    });
                  }
                  get().setExecutionState({ status: "success", progress: 100 });
                  break;
                case "failed":
                  get().setExecutionState({
                    status: "error",
                    error: event.error?.message || "Execution failed",
                  });
                  break;
                case "cancelled":
                  get().setExecutionState({
                    status: "cancelled",
                    error: "Execution was cancelled",
                  });
                  break;
                case "node-status-update":
                  // Handle flow execution pause/resume events
                  if (event.data?.status === "paused") {
                    get().addExecutionLog({
                      timestamp: new Date().toISOString(),
                      level: "info",
                      message: "Execution paused",
                    });
                  } else if (event.data?.status === "resumed") {
                    get().addExecutionLog({
                      timestamp: new Date().toISOString(),
                      level: "info",
                      message: "Execution resumed",
                    });
                  }
                  break;
                case "cancelled":
                  get().setExecutionState({
                    status: "cancelled",
                    error: "Execution cancelled",
                  });
                  break;
                case "node-started":
                  if (event.nodeId) {
                    const nodeName =
                      get().workflow?.nodes.find((n) => n.id === event.nodeId)
                        ?.name || "Unknown";
                    // Don't update status until completion - avoid setting to "error" prematurely
                    get().updateNodeExecutionResult(event.nodeId, {
                      nodeId: event.nodeId,
                      nodeName,
                      // status: undefined, // Let existing status remain or wait for completion
                      startTime: new Date(event.timestamp).getTime(),
                    });
                  }
                  break;
                case "node-completed":
                  if (event.nodeId) {
                    const nodeName =
                      get().workflow?.nodes.find((n) => n.id === event.nodeId)
                        ?.name || "Unknown";
                    get().updateNodeExecutionResult(event.nodeId, {
                      nodeId: event.nodeId,
                      nodeName,
                      status: "success",
                      endTime: new Date(event.timestamp).getTime(),
                      data: event.data,
                    });
                  }
                  break;
                case "node-failed":
                  if (event.nodeId) {
                    const nodeName =
                      get().workflow?.nodes.find((n) => n.id === event.nodeId)
                        ?.name || "Unknown";
                    get().updateNodeExecutionResult(event.nodeId, {
                      nodeId: event.nodeId,
                      nodeName,
                      status: "error",
                      endTime: new Date(event.timestamp).getTime(),
                      error: event.error?.message || "Node execution failed",
                    });
                  }
                  break;
              }
            });

            // Handle execution progress updates
            socketService.on("execution-progress", (progress: any) => {
              const { executionState } = get();

              // Only process progress for the current execution
              if (progress.executionId !== executionState.executionId) {
                return;
              }

              const progressPercentage =
                progress.totalNodes > 0
                  ? Math.round(
                      (progress.completedNodes / progress.totalNodes) * 100
                    )
                  : 0;

              // Map backend status to frontend status
              let frontendStatus: ExecutionState["status"] = "running";
              if (progress.status === "success") frontendStatus = "success";
              else if (progress.status === "error") frontendStatus = "error";
              else if (progress.status === "cancelled")
                frontendStatus = "cancelled";

              get().setExecutionState({
                progress: progressPercentage,
                status: frontendStatus,
              });

              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "info",
                message: `Real-time progress update: ${progress.completedNodes}/${progress.totalNodes} nodes completed`,
                data: {
                  completedNodes: progress.completedNodes,
                  totalNodes: progress.totalNodes,
                  failedNodes: progress.failedNodes,
                  currentNode: progress.currentNode,
                },
              });
            });

            // Handle execution logs
            socketService.on("execution-log", (logEntry: any) => {
              const { executionState } = get();

              // Only process logs for the current execution
              if (logEntry.executionId !== executionState.executionId) {
                return;
              }

              get().addExecutionLog({
                timestamp: new Date(logEntry.timestamp).toISOString(),
                level: logEntry.level,
                nodeId: logEntry.nodeId,
                message: logEntry.message,
                data: logEntry.data,
              });
            });

            // Handle node execution events (enhanced for flow execution)
            socketService.on("node-execution-event", (nodeEvent: any) => {
              const { executionState } = get();

              // Only process events for the current execution
              if (nodeEvent.executionId !== executionState.executionId) {
                return;
              }

              const nodeName =
                get().workflow?.nodes.find((n) => n.id === nodeEvent.nodeId)
                  ?.name || "Unknown";

              switch (nodeEvent.type) {
                case "started":
                  // Update node execution result
                  get().updateNodeExecutionResult(nodeEvent.nodeId, {
                    nodeId: nodeEvent.nodeId,
                    nodeName,
                    // Don't set status to "error" - wait for completion event
                    startTime: new Date(nodeEvent.timestamp).getTime(),
                  });

                  // Update flow execution state for visual indicators
                  get().updateNodeExecutionState(
                    nodeEvent.nodeId,
                    NodeExecutionStatus.RUNNING,
                    {
                      startTime: new Date(nodeEvent.timestamp).getTime(),
                      inputData: nodeEvent.data?.inputData,
                    }
                  );

                  get().addExecutionLog({
                    timestamp: new Date(nodeEvent.timestamp).toISOString(),
                    level: "info",
                    nodeId: nodeEvent.nodeId,
                    message: `Node started: ${nodeName}`,
                    data: { nodeId: nodeEvent.nodeId, nodeName },
                  });
                  break;

                case "completed":
                  // Update node execution result
                  get().updateNodeExecutionResult(nodeEvent.nodeId, {
                    nodeId: nodeEvent.nodeId,
                    nodeName,
                    status: "success",
                    endTime: new Date(nodeEvent.timestamp).getTime(),
                    data: nodeEvent.data,
                  });

                  // Update flow execution state for visual indicators
                  get().updateNodeExecutionState(
                    nodeEvent.nodeId,
                    NodeExecutionStatus.COMPLETED,
                    {
                      endTime: new Date(nodeEvent.timestamp).getTime(),
                      outputData: nodeEvent.data?.outputData || nodeEvent.data,
                      duration: nodeEvent.data?.duration,
                    }
                  );

                  get().addExecutionLog({
                    timestamp: new Date(nodeEvent.timestamp).toISOString(),
                    level: "info",
                    nodeId: nodeEvent.nodeId,
                    message: `Node completed: ${nodeName}`,
                    data: {
                      nodeId: nodeEvent.nodeId,
                      nodeName,
                      outputData: nodeEvent.data,
                    },
                  });
                  break;

                case "failed":
                  // Update node execution result
                  get().updateNodeExecutionResult(nodeEvent.nodeId, {
                    nodeId: nodeEvent.nodeId,
                    nodeName,
                    status: "error",
                    endTime: new Date(nodeEvent.timestamp).getTime(),
                    error: nodeEvent.error?.message || "Node execution failed",
                  });

                  // Update flow execution state for visual indicators
                  get().updateNodeExecutionState(
                    nodeEvent.nodeId,
                    NodeExecutionStatus.FAILED,
                    {
                      endTime: new Date(nodeEvent.timestamp).getTime(),
                      error: nodeEvent.error,
                      errorMessage:
                        nodeEvent.error?.message || "Node execution failed",
                    }
                  );

                  get().addExecutionLog({
                    timestamp: new Date(nodeEvent.timestamp).toISOString(),
                    level: "error",
                    nodeId: nodeEvent.nodeId,
                    message: `Node failed: ${nodeName} - ${
                      nodeEvent.error?.message || "Unknown error"
                    }`,
                    data: {
                      nodeId: nodeEvent.nodeId,
                      nodeName,
                      error: nodeEvent.error,
                    },
                  });
                  break;
              }
            });

            // Handle socket connection events
            socketService.on("socket-connected", () => {
              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "info",
                message: "Real-time connection established",
              });
            });

            socketService.on("socket-disconnected", (data: any) => {
              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "warn",
                message: `Real-time connection lost: ${data.reason}`,
              });
            });

            socketService.on("socket-error", (data: any) => {
              get().addExecutionLog({
                timestamp: new Date().toISOString(),
                level: "error",
                message: `Real-time connection error: ${data.error}`,
              });
            });
          } catch (error) {
            console.error("Failed to setup socket listeners:", error);
          }
        };

        setupListeners();
      },

      cleanupSocketListeners: () => {
        const cleanup = async () => {
          try {
            const { socketService } = await import("@/services/socket");

            // Remove all event listeners
            socketService.off("execution-event", () => {});
            socketService.off("execution-progress", () => {});
            socketService.off("execution-log", () => {});
            socketService.off("node-execution-event", () => {});
            socketService.off("socket-connected", () => {});
            socketService.off("socket-disconnected", () => {});
            socketService.off("socket-error", () => {});
          } catch (error) {
            console.error("Failed to cleanup socket listeners:", error);
          }
        };

        cleanup();
      },

      initializeRealTimeUpdates: () => {
        // Setup socket listeners for real-time updates
        get().setupSocketListeners();
      },

      // Workflow activation methods
      toggleWorkflowActive: () => {
        const { workflow } = get();
        if (!workflow) return;

        const newActiveState = !workflow.active;
        get().updateWorkflow({ active: newActiveState });
        get().saveToHistory(
          `${newActiveState ? "Activate" : "Deactivate"} workflow`
        );

        get().addExecutionLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Workflow ${newActiveState ? "activated" : "deactivated"}`,
        });
      },

      setWorkflowActive: (active: boolean) => {
        const { workflow } = get();
        if (!workflow) return;

        if (workflow.active !== active) {
          get().updateWorkflow({ active });
          get().saveToHistory(`${active ? "Activate" : "Deactivate"} workflow`);

          get().addExecutionLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Workflow ${active ? "activated" : "deactivated"}`,
          });
        }
      },

      // Validation
      validateWorkflow: () => {
        const { workflow } = get();
        const workflowErrors = validateWorkflow(workflow);
        const metadataErrors = workflow
          ? validateMetadata(workflow.metadata)
          : [];

        const allErrors = [...workflowErrors, ...metadataErrors];

        return {
          isValid: allErrors.length === 0,
          errors: allErrors.map((error) => error.message),
        };
      },

      validateConnection: (sourceId, targetId) => {
        const { workflow } = get();
        if (!workflow) return false;

        // Prevent self-connection
        if (sourceId === targetId) return false;

        // Check if connection already exists
        const existingConnection = workflow.connections.find(
          (c) => c.sourceNodeId === sourceId && c.targetNodeId === targetId
        );
        if (existingConnection) return false;

        // Check for circular dependency
        const wouldCreateCircle = (
          currentId: string,
          targetId: string,
          visited = new Set<string>()
        ): boolean => {
          if (currentId === targetId) return true;
          if (visited.has(currentId)) return false;
          visited.add(currentId);

          const outgoing = workflow.connections.filter(
            (c) => c.sourceNodeId === currentId
          );
          return outgoing.some((conn) =>
            wouldCreateCircle(conn.targetNodeId, targetId, visited)
          );
        };

        return !wouldCreateCircle(targetId, sourceId);
      },

      // Node interaction actions
      setShowPropertyPanel: (show: boolean) => {
        set({ showPropertyPanel: show });
        if (!show) {
          set({ propertyPanelNodeId: null });
        }
      },

      setPropertyPanelNode: (nodeId: string | null) => {
        set({
          propertyPanelNodeId: nodeId,
          showPropertyPanel: nodeId !== null,
        });
      },

      showContextMenu: (nodeId: string, position: { x: number; y: number }) => {
        set({
          contextMenuVisible: true,
          contextMenuNodeId: nodeId,
          contextMenuPosition: position,
          selectedNodeId: nodeId,
        });
      },

      hideContextMenu: () => {
        set({
          contextMenuVisible: false,
          contextMenuNodeId: null,
          contextMenuPosition: null,
        });
      },

      openNodeProperties: (nodeId: string) => {
        set({
          propertyPanelNodeId: nodeId,
          showPropertyPanel: true,
          selectedNodeId: nodeId,
        });
        // Hide context menu if it's open
        get().hideContextMenu();
      },

      closeNodeProperties: () => {
        set({
          showPropertyPanel: false,
          propertyPanelNodeId: null,
        });
      },

      // Error handling
      handleError: (error, operation, showToast) => {
        handleWorkflowError(error, operation, showToast);
      },

      getWorkflowHealth: () => {
        const { workflow } = get();
        const {
          getWorkflowHealthScore,
        } = require("@/utils/workflowErrorHandling");
        return getWorkflowHealthScore(workflow);
      },
    }),
    { name: "workflow-store" }
  )
);
