import { useAddNodeDialogStore, useWorkflowStore } from '@/stores';
import { EdgeLabelRenderer } from '@xyflow/react';
import { Plus, Trash2 } from 'lucide-react';
import { CSSProperties, useCallback } from 'react';

interface EdgeButtonProps {
  x: number;
  y: number;
  id?: string;
  source?: string;
  target?: string;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
  style?: CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function EdgeButton({
  x,
  y,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  style,
  onMouseEnter,
  onMouseLeave,
}: EdgeButtonProps) {
  const { openDialog } = useAddNodeDialogStore();
  // OPTIMIZATION: Use Zustand selectors to prevent unnecessary re-renders
  const workflow = useWorkflowStore(state => state.workflow);
  const removeConnection = useWorkflowStore(state => state.removeConnection);
  const readOnly = useWorkflowStore(state => state.readOnly);
  
  // Don't render buttons in read-only mode (only when viewing past execution)
  const isReadOnly = readOnly;

  const handleAddClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Open the dialog with insertion context
      if (source && target) {
        openDialog(
          { x, y },
          {
            sourceNodeId: source,
            targetNodeId: target,
            sourceOutput: sourceHandleId || undefined,
            targetInput: targetHandleId || undefined,
          }
        );
      }
    },
    [openDialog, x, y, source, target, sourceHandleId, targetHandleId]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Find the connection to remove
      const connection = workflow?.connections.find(
        conn =>
          conn.sourceNodeId === source &&
          conn.targetNodeId === target &&
          (conn.sourceOutput === sourceHandleId || (!conn.sourceOutput && !sourceHandleId)) &&
          (conn.targetInput === targetHandleId || (!conn.targetInput && !targetHandleId))
      );

      if (connection) {
        removeConnection(connection.id);
      }
    },
    [workflow, removeConnection, source, target, sourceHandleId, targetHandleId]
  );

  // Don't render buttons in read-only mode
  if (isReadOnly) {
    return null;
  }

  return (
    <EdgeLabelRenderer>
      <div
        className="nodrag nopan pointer-events-auto absolute z-50 flex items-center gap-1 rounded-lg border bg-card px-1.5 py-1.5 shadow-lg"
        style={{
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          ...style,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <button
          onClick={handleAddClick}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          title="Add node"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        <button
          onClick={handleDeleteClick}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          title="Delete connection"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </EdgeLabelRenderer>
  );
}
