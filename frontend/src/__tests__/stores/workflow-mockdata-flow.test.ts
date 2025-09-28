import { useWorkflowStore } from "@/stores/workflow";
import { Workflow } from "@/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("WorkflowStore - Mock Data Flow", () => {
  beforeEach(() => {
    // Reset the store
    useWorkflowStore.setState({
      workflow: null,
      realTimeResults: new Map(),
      persistentNodeResults: new Map(),
    });
  });

  it("should return mock data when node has pinned mock data", () => {
    const mockWorkflow: Workflow = {
      id: "workflow-1",
      name: "Test Workflow",
      description: "Test workflow description",
      userId: "user-1",
      nodes: [
        {
          id: "node-1",
          type: "manual-trigger",
          name: "Manual Trigger",
          parameters: {},
          position: { x: 100, y: 100 },
          credentials: [],
          disabled: false,
          mockData: { message: "Hello World", success: true },
          mockDataPinned: true,
        },
        {
          id: "node-2",
          type: "http-request",
          name: "HTTP Request",
          parameters: {},
          position: { x: 300, y: 100 },
          credentials: [],
          disabled: false,
        },
      ],
      connections: [
        {
          id: "conn-1",
          sourceNodeId: "node-1",
          sourceOutput: "main",
          targetNodeId: "node-2",
          targetInput: "main",
        },
      ],
      settings: {},
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    // Set up the store with a workflow
    useWorkflowStore.getState().setWorkflow(mockWorkflow);

    // Get node execution result for node with pinned mock data
    const nodeResult = useWorkflowStore
      .getState()
      .getNodeExecutionResult("node-1");

    expect(nodeResult).toBeDefined();
    expect(nodeResult?.nodeId).toBe("node-1");
    expect(nodeResult?.nodeName).toBe("Manual Trigger");
    expect(nodeResult?.status).toBe("skipped"); // Should be "skipped" for mock data
    expect(nodeResult?.data).toEqual({ message: "Hello World", success: true });
    expect(nodeResult?.error).toBeUndefined();
  });

  it("should not return mock data when node has mock data but not pinned", () => {
    const mockWorkflow: Workflow = {
      id: "workflow-1",
      name: "Test Workflow",
      description: "Test workflow description",
      userId: "user-1",
      nodes: [
        {
          id: "node-1",
          type: "manual-trigger",
          name: "Manual Trigger",
          parameters: {},
          position: { x: 100, y: 100 },
          credentials: [],
          disabled: false,
          mockData: { message: "Hello World", success: true },
          mockDataPinned: false, // Not pinned
        },
      ],
      connections: [],
      settings: {},
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    // Set up the store with a workflow
    useWorkflowStore.getState().setWorkflow(mockWorkflow);

    // Get node execution result - should be undefined since no execution result and mock not pinned
    const nodeResult = useWorkflowStore
      .getState()
      .getNodeExecutionResult("node-1");

    expect(nodeResult).toBeUndefined();
  });

  it("should prioritize actual execution results over mock data", () => {
    const mockWorkflow: Workflow = {
      id: "workflow-1",
      name: "Test Workflow",
      description: "Test workflow description",
      userId: "user-1",
      nodes: [
        {
          id: "node-1",
          type: "manual-trigger",
          name: "Manual Trigger",
          parameters: {},
          position: { x: 100, y: 100 },
          credentials: [],
          disabled: false,
          mockData: { message: "Mock Data", success: true },
          mockDataPinned: true,
        },
      ],
      connections: [],
      settings: {},
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    // Set up the store with a workflow
    useWorkflowStore.getState().setWorkflow(mockWorkflow);

    // Add a real-time execution result
    useWorkflowStore.getState().updateNodeExecutionResult("node-1", {
      nodeId: "node-1",
      nodeName: "Manual Trigger",
      status: "success",
      startTime: Date.now() - 1000,
      endTime: Date.now(),
      duration: 1000,
      data: { message: "Real Execution Data", success: true },
      error: undefined,
    });

    // Get node execution result - should be the real execution result, not mock data
    const nodeResult = useWorkflowStore
      .getState()
      .getNodeExecutionResult("node-1");

    expect(nodeResult).toBeDefined();
    expect(nodeResult?.status).toBe("success"); // Should be "success" from actual execution
    expect(nodeResult?.data).toEqual({
      message: "Real Execution Data",
      success: true,
    });
  });

  it("should return undefined when node has no mock data and no execution results", () => {
    const mockWorkflow: Workflow = {
      id: "workflow-1",
      name: "Test Workflow",
      description: "Test workflow description",
      userId: "user-1",
      nodes: [
        {
          id: "node-1",
          type: "manual-trigger",
          name: "Manual Trigger",
          parameters: {},
          position: { x: 100, y: 100 },
          credentials: [],
          disabled: false,
          // No mockData
        },
      ],
      connections: [],
      settings: {},
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    // Set up the store with a workflow
    useWorkflowStore.getState().setWorkflow(mockWorkflow);

    // Get node execution result - should be undefined
    const nodeResult = useWorkflowStore
      .getState()
      .getNodeExecutionResult("node-1");

    expect(nodeResult).toBeUndefined();
  });

  it("should show confirmation dialog when executing single node with pinned mock data", async () => {
    // Mock the confirmation service
    const mockConfirmationService = {
      confirmExecuteWithPinnedData: vi.fn().mockResolvedValue(false), // User cancels
    };

    // Mock the import of confirmation service
    vi.doMock("@/services/confirmationService", () => ({
      confirmationService: mockConfirmationService,
    }));

    const mockWorkflow: Workflow = {
      id: "workflow-1",
      name: "Test Workflow",
      description: "Test workflow description",
      userId: "user-1",
      nodes: [
        {
          id: "node-1",
          type: "http-request",
          name: "HTTP Request",
          parameters: {},
          position: { x: 100, y: 100 },
          credentials: [],
          disabled: false,
          mockData: { message: "Mock Response", status: 200 },
          mockDataPinned: true,
        },
      ],
      connections: [],
      settings: {},
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    // Set up the store with a workflow
    useWorkflowStore.getState().setWorkflow(mockWorkflow);

    // Try to execute the node (should show confirmation and be cancelled)
    await useWorkflowStore.getState().executeNode("node-1");

    // Verify confirmation dialog was shown with correct node name
    expect(
      mockConfirmationService.confirmExecuteWithPinnedData
    ).toHaveBeenCalledWith("HTTP Request");

    // Verify execution was cancelled (no execution state changes)
    const executionState = useWorkflowStore.getState().executionState;
    expect(executionState.status).toBe("idle");
  });
});
