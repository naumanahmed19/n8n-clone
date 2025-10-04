import { CSSProperties, useCallback } from 'react';
import { EdgeLabelRenderer } from 'reactflow';
import { Button } from '@/components/ui/button';
import { useAddNodeDialogStore, useWorkflowStore } from '@/stores';
import { Trash2 } from 'lucide-react';

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
  const { workflow, removeConnection } = useWorkflowStore();

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

  return (
    <EdgeLabelRenderer>
      <div
        className="nodrag nopan pointer-events-auto absolute flex gap-1"
        style={{
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          ...style,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Button
          onClick={handleAddClick}
          size="icon"
          variant="secondary"
          className="border h-6 w-6 rounded-xl hover:bg-card shadow-sm"
        >
          +
        </Button>
        <Button
          onClick={handleDeleteClick}
          size="icon"
          variant="destructive"
          className="h-6 w-6 rounded-xl shadow-sm"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </EdgeLabelRenderer>
  );
}
