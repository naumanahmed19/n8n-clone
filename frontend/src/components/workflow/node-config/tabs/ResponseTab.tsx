import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types'
import { Database } from 'lucide-react'

interface ResponseTabProps {
  node: WorkflowNode
}

export function ResponseTab({ node }: ResponseTabProps) {
  const { getNodeExecutionResult } = useWorkflowStore()
  const nodeExecutionResult = getNodeExecutionResult(node.id)

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
    <div className="h-[calc(100dvh-222px)] overflow-y-auto p-4">
      <div className="space-y-4">
        {nodeExecutionResult ? (
          <div className="space-y-4">
            {/* Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Execution Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="mt-1">
                      {getNodeStatusBadge(nodeExecutionResult.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <div className="mt-1 font-medium">{nodeExecutionResult.duration}ms</div>
                  </div>
                </div>
                
                {nodeExecutionResult.startTime && (
                  <div className="mt-4 text-sm">
                    <span className="text-gray-500">Started:</span>
                    <div className="mt-1">{new Date(nodeExecutionResult.startTime).toLocaleString()}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Section */}
            {nodeExecutionResult.error && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-800">Error Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono bg-red-50 p-3 rounded">
                    {typeof nodeExecutionResult.error === 'string' 
                      ? nodeExecutionResult.error 
                      : JSON.stringify(nodeExecutionResult.error, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Response Data Section */}
            {nodeExecutionResult.data && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center justify-between">
                    <span>Response Data</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(nodeExecutionResult.data, null, 2))
                      }}
                    >
                      📋 Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <pre className="text-xs bg-blue-50 p-3 rounded overflow-auto font-mono whitespace-pre-wrap">
                      {JSON.stringify(nodeExecutionResult.data, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Database className="w-12 h-12 text-gray-300 mb-4" />
            <div className="text-lg font-medium text-gray-700 mb-2">No execution data</div>
            <div className="text-sm text-gray-500">
              Execute the workflow to see the response data for this node
            </div>
          </div>
        )}
      </div>
    </div>
  )
}