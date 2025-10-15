import {
  NodeProps,
  NodeResizer,
  NodeToolbar,
  useReactFlow,
  useStore,
} from '@xyflow/react'
import { memo } from 'react'

import { useDetachNodes } from '@/hooks/workflow'

function GroupNode({ id }: NodeProps) {
  const detachNodes = useDetachNodes()
  const { getNodes } = useReactFlow()

  const hasChildNodes = useStore((store) => {
    const childNodeCount = store.parentLookup.get(id)?.size ?? 0
    return childNodeCount > 0
  })

  const onDetach = () => {
    const childNodeIds = getNodes()
      .filter((node) => node.parentId === id)
      .map((node) => node.id)

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
