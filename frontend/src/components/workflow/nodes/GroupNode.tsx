import {
  NodeProps,
  NodeResizer,
  NodeToolbar,
  useReactFlow,
} from '@xyflow/react'
import { memo } from 'react'

import { useDetachNodes } from '@/hooks/workflow'

function GroupNode({ id }: NodeProps) {
  const detachNodes = useDetachNodes()
  const { getNodes } = useReactFlow()

  // Check if this group has child nodes
  const childNodes = getNodes().filter((node) => node.parentId === id)
  const hasChildNodes = childNodes.length > 0

  const onDetach = () => {
    const childNodeIds = childNodes.map((node) => node.id)
    detachNodes(childNodeIds, id)
  }

  return (
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
  )
}

export default memo(GroupNode)
