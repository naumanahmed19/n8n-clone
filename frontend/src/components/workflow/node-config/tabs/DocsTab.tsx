import { NodeDocumentation } from '@/components/node/NodeDocumentation'
import { NodeType } from '@/types'

interface DocsTabProps {
  nodeType: NodeType
}

export function DocsTab({ nodeType }: DocsTabProps) {
  return (
    <div className="h-full p-4">
      <NodeDocumentation nodeType={nodeType} />
    </div>
  )
}
