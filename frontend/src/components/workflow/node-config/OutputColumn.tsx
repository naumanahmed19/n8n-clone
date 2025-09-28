import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useNodeConfigDialogStore, useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types'
import {
  ArrowRight,
  Database,
  Edit,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface OutputColumnProps {
  node: WorkflowNode
}

export function OutputColumn({ node }: OutputColumnProps) {
  const { workflow, getNodeExecutionResult } = useWorkflowStore()
  const {
    mockData,
    mockDataEditor,
    openMockDataEditor,
    closeMockDataEditor,
    updateMockDataContent,
    updateMockData
  } = useNodeConfigDialogStore()

  const nodeExecutionResult = getNodeExecutionResult(node.id)

  // Get connected output nodes
  const outputConnections = workflow?.connections.filter(conn => conn.sourceNodeId === node.id) || []
  const outputNodes = outputConnections.map(conn => 
    workflow?.nodes.find(n => n.id === conn.targetNodeId)
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

  const handleMockDataSave = () => {
    try {
      const parsed = JSON.parse(mockDataEditor.content)
      updateMockData(parsed)
      closeMockDataEditor()
      toast.success('Mock data saved successfully')
    } catch (error) {
      toast.error('Invalid JSON format. Please check your syntax.')
    }
  }

  const handleMockDataClear = () => {
    updateMockData(null)
    closeMockDataEditor()
    toast.success('Mock data cleared')
  }

  return (
    <div className="flex w-full h-full border-l border-gray-200 flex-col">
      <div className="p-4 border-b h-[72px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium">Output Data</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <Button
              onClick={openMockDataEditor}
              size="sm"
              variant="outline"
              className="flex items-center space-x-1"
            >
              <Edit className="w-3 h-3" />
              <span>Mock Data</span>
            </Button>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {/* Mock Data Editor */}
        {mockDataEditor.isOpen && (
          <div className="mb-6">
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-orange-800">Set Mock Output Data</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={closeMockDataEditor}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-xs text-orange-700">
                    Enter JSON data that will be used as output for the next nodes. This will override execution results.
                  </p>
                  <Textarea
                    value={mockDataEditor.content}
                    onChange={(e) => updateMockDataContent(e.target.value)}
                    placeholder='{\n  "status": "success",\n  "data": {\n    "message": "Hello World"\n  }\n}'
                    className="font-mono text-sm"
                    rows={8}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleMockDataSave}
                      size="sm"
                      className="flex-1"
                    >
                      Save Mock Data
                    </Button>
                    <Button
                      onClick={handleMockDataClear}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Output Data - Mock or Execution */}
        {(mockData || nodeExecutionResult?.data) && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
              <Database className="w-4 h-4 text-green-600" />
              <span>Current Output Data</span>
              <Badge className={mockData ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                {mockData ? 'Mock Data' : nodeExecutionResult?.status}
              </Badge>
            </h4>
            <Card className={mockData ? "border-orange-200 bg-orange-50/30" : "border-green-200 bg-green-50/30"}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {mockData ? 'Mock Output Data' : 'Execution Output Data'}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const dataToShow = mockData || nodeExecutionResult?.data
                      navigator.clipboard.writeText(JSON.stringify(dataToShow, null, 2))
                      toast.success('Copied to clipboard')
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    📋 Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <pre className="text-xs bg-white p-3 rounded border overflow-auto font-mono whitespace-pre-wrap">
                    {JSON.stringify(mockData || nodeExecutionResult?.data, null, 2)}
                  </pre>
                </ScrollArea>
                {mockData && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-orange-600">This mock data will be used as output for connected nodes.</p>
                    <Button
                      onClick={openMockDataEditor}
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connected Output Nodes */}
        {outputNodes.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center space-x-2">
              <ArrowRight className="w-4 h-4 text-blue-600" />
              <span>Connected Outputs</span>
            </h4>
            
            <div className="space-y-3">
              {outputNodes.map((outputNode, index) => {
                const connection = outputConnections[index]
                const outputNodeExecutionResult = getNodeExecutionResult(outputNode.id)
                
                return (
                  <Card key={outputNode.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: '#6b7280' }}
                        >
                          {outputNode.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium truncate">{outputNode.name}</span>
                      </div>
                      {outputNodeExecutionResult && getNodeStatusBadge(outputNodeExecutionResult.status)}
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      Output: <code className="bg-gray-100 px-1 rounded">{connection.sourceOutput}</code>
                      {' → '}
                      Input: <code className="bg-gray-100 px-1 rounded">{connection.targetInput}</code>
                    </div>

                    {/* Show current node's output data that would be sent to this output node */}
                    {nodeExecutionResult?.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">View Sent Data</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-24 whitespace-pre-wrap">
                          {JSON.stringify(nodeExecutionResult.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center space-y-3">
            <ArrowRight className="w-8 h-8 text-gray-300" />
            <div>
              <p className="text-sm text-gray-500 mb-1">No output data</p>
              <p className="text-xs text-gray-400 mb-3">Execute the node or set mock data</p>
              <Button
                onClick={openMockDataEditor}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                <Edit className="w-3 h-3" />
                <span>Add Mock Data</span>
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}