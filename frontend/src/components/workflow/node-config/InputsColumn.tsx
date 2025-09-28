import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types'
import { ArrowLeft, Info } from 'lucide-react'

interface InputsColumnProps {
  node: WorkflowNode
}

export function InputsColumn({ node }: InputsColumnProps) {
  const { workflow, getNodeExecutionResult } = useWorkflowStore()

  // Get connected input nodes
  const inputConnections = workflow?.connections.filter(conn => conn.targetNodeId === node.id) || []
  const inputNodes = inputConnections.map(conn => 
    workflow?.nodes.find(n => n.id === conn.sourceNodeId)
  ).filter(Boolean) as WorkflowNode[]

  const getNodeStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Error</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Running</Badge>
      case 'skipped':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Skipped</Badge>
      default:
        return <Badge variant="outline">Idle</Badge>
    }
  }

  return (
    <div className="flex w-full h-full border-r border-gray-200 flex-col">
      <div className="p-4 border-b h-[72px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium">Inputs</h3>
            <Badge variant="outline">{inputNodes.length}</Badge>
          </div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="bottom" align="end">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Input Connections</h4>
                <p className="text-sm text-gray-600">
                  This panel shows data coming into this node from previous nodes in the workflow. 
                  Each connection displays the source node, output port, and the actual data being passed.
                </p>
                <div className="text-xs text-gray-500">
                  • Connect nodes to see input data<br/>
                  • Execute workflow to view live data<br/>
                  • Click "View Data" to inspect details
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      
      <div className="h-[calc(100dvh-222px)] overflow-y-auto p-4">
        {inputNodes.length > 0 ? (
          <div className="space-y-3">
            {inputNodes.map((inputNode, index) => {
              const connection = inputConnections[index]
              const inputNodeExecutionResult = getNodeExecutionResult(inputNode.id)
              
              return (
                <Card key={inputNode.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: '#6b7280' }}
                      >
                        {inputNode.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate">{inputNode.name}</span>
                    </div>
                    {inputNodeExecutionResult && getNodeStatusBadge(inputNodeExecutionResult.status)}
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    Output: <code className="bg-gray-100 px-1 rounded">{connection.sourceOutput}</code>
                    {' → '}
                    Input: <code className="bg-gray-100 px-1 rounded">{connection.targetInput}</code>
                  </div>

                  {inputNodeExecutionResult?.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer">View Data</summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-24 whitespace-pre-wrap">
                        {JSON.stringify(inputNodeExecutionResult.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <ArrowLeft className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No input connections</p>
            <p className="text-xs text-gray-400">Connect nodes to see input data</p>
          </div>
        )}
      </div>
    </div>
  )
}