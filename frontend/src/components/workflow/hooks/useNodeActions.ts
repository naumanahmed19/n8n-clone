import { useAddNodeDialogStore } from "@/stores/addNodeDialog";
import { useWorkflowStore } from "@/stores/workflow";
import { useDetachNodes } from "@/hooks/workflow";

export function useNodeActions(nodeId: string) {
  const executeNode = useWorkflowStore((state) => state.executeNode);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const addNode = useWorkflowStore((state) => state.addNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const toggleNodeLock = useWorkflowStore((state) => state.toggleNodeLock);
  const openNodeProperties = useWorkflowStore(
    (state) => state.openNodeProperties
  );
  const workflow = useWorkflowStore((state) => state.workflow);

  const { openDialog } = useAddNodeDialogStore();
  const detachNodes = useDetachNodes();

  const handleToggleDisabled = (nodeId: string, disabled: boolean) => {
    updateNode(nodeId, { disabled });
  };

  const handleOpenProperties = () => {
    // Open regular properties panel for all nodes (including chat)
    openNodeProperties(nodeId);
  };

  const handleExecuteFromContext = () => {
    executeNode(nodeId, undefined, "single");
  };

  const handleDuplicate = () => {
    const nodeToClone = workflow?.nodes.find((n) => n.id === nodeId);
    if (nodeToClone) {
      const clonedNode = {
        ...nodeToClone,
        id: `node-${Date.now()}`,
        name: `${nodeToClone.name} (Copy)`,
        position: {
          x: nodeToClone.position.x + 50,
          y: nodeToClone.position.y + 50,
        },
      };
      addNode(clonedNode);
    }
  };

  const handleDelete = () => {
    removeNode(nodeId);
  };

  const handleToggleLock = () => {
    toggleNodeLock(nodeId);
  };

  const handleUngroup = () => {
    detachNodes([nodeId], undefined);
  };

  const handleOutputClick = (
    event: React.MouseEvent<HTMLDivElement>,
    outputHandle: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const position = {
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    };

    openDialog(position, {
      sourceNodeId: nodeId,
      targetNodeId: "",
      sourceOutput: outputHandle,
      targetInput: "main",
    });
  };

  return {
    handleToggleDisabled,
    handleOpenProperties,
    handleExecuteFromContext,
    handleDuplicate,
    handleDelete,
    handleToggleLock,
    handleUngroup,
    handleOutputClick,
  };
}
