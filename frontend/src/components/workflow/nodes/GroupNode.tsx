import {
  NodeProps,
  NodeResizer,
  NodeToolbar,
  useReactFlow,
} from '@xyflow/react'
import { Trash2, Ungroup } from 'lucide-react'
import { memo, useCallback } from 'react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useDetachNodes } from '@/hooks/workflow'
import { useWorkflowStore } from '@/stores'

function GroupNode({ id }: NodeProps) {
  const detachNodes = useDetachNodes()
  const { getNodes, setNodes } = useReactFlow()
  const { saveToHistory, setDirty } = useWorkflowStore()

  // Check if this group has child nodes
  const childNodes = getNodes().filter((node) => node.parentId === id)
  const hasChildNodes = childNodes.length > 0

  const onDetach = useCallback(() => {
    const childNodeIds = childNodes.map((node) => node.id)
    detachNodes(childNodeIds, id)
  }, [childNodes, detachNodes, id])

  const onDeleteGroup = useCallback(() => {
    // Take snapshot for undo/redo
    saveToHistory('Delete group')

    // Get all nodes
    const allNodes = getNodes()
    
    // Detach child nodes and convert to absolute positions
    const nextNodes = allNodes.map((n) => {
      if (n.parentId === id) {
        const parentNode = allNodes.find(node => node.id === id)
        
        return {
          ...n,
          position: {
            x: n.position.x + (parentNode?.position.x ?? 0),
            y: n.position.y + (parentNode?.position.y ?? 0),
          },
          expandParent: undefined,
          parentId: undefined,
          extent: undefined,
        }
      }
      return n
    })

    // Remove the group node itself
    setNodes(nextNodes.filter((n) => n.id !== id))

    // Mark workflow as dirty
    setDirty(true)
  }, [id, getNodes, setNodes, saveToHistory, setDirty])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="group-node">
          <NodeResizer />
          {hasChildNodes && (
            <NodeToolbar className="nodrag">
              <button className="group-node-button" onClick={onDetach}>
                Ungroup
              </button>
            </NodeToolbar>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {hasChildNodes && (
          <>
            <ContextMenuItem
              onClick={onDetach}
              className="cursor-pointer"
            >
              <Ungroup className="mr-2 h-4 w-4" />
              Ungroup
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          onClick={onDeleteGroup}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Group
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default memo(GroupNode)
