import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useNodeConfigDialogStore, useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types'
import {
  Copy,
  Database,
  Edit,
  Pin,
  PinOff,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface OutputColumnProps {
  node: WorkflowNode
}

export function OutputColumn({ node }: OutputColumnProps) {
  const { getNodeExecutionResult } = useWorkflowStore()
  const {
    mockData,
    mockDataPinned,
    mockDataEditor,
    openMockDataEditor,
    closeMockDataEditor,
    updateMockDataContent,
    updateMockData,
    toggleMockDataPinned
  } = useNodeConfigDialogStore()

  const nodeExecutionResult = getNodeExecutionResult(node.id)

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

  // Determine what data to show - mock data if pinned and available, otherwise execution result
  const displayData = mockDataPinned && mockData ? mockData : nodeExecutionResult?.data
  const isShowingMockData = mockDataPinned && mockData

  return (
    <div className="flex w-full h-full border-l flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Output Data</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Pin Mock Data Toggle */}
          {mockData && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-background border">
              <Switch
                checked={mockDataPinned}
                onCheckedChange={toggleMockDataPinned}
              />
              <div className="flex items-center gap-1">
                {mockDataPinned ? (
                  <Pin className="h-3 w-3 text-orange-600" />
                ) : (
                  <PinOff className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-xs font-medium">
                  {mockDataPinned ? 'Pinned' : 'Pin Mock'}
                </span>
              </div>
            </div>
          )}
          
          {/* Edit Mock Data Button */}
          <Button
            onClick={openMockDataEditor}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            <span className="text-xs">Edit Mock</span>
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 h-full flex flex-col space-y-4">
            {/* Mock Data Editor */}
            {mockDataEditor.isOpen && (
              <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <h3 className="text-sm font-medium">Mock Data Editor</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={closeMockDataEditor}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Define JSON data to use as output. When pinned, this overrides execution results.
                </p>
                <Textarea
                  value={mockDataEditor.content}
                  onChange={(e) => updateMockDataContent(e.target.value)}
                  placeholder='{\n  "message": "Hello World",\n  "data": {\n    "success": true\n  }\n}'
                  className="font-mono text-xs min-h-[120px] resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleMockDataSave}
                    size="sm"
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleMockDataClear}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            {/* Main Output Display */}
            {displayData ? (
              <div className="flex flex-col h-full space-y-4">
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      <h3 className="text-sm font-medium">
                        {isShowingMockData ? 'Mock Data Output' : 'Execution Output'}
                      </h3>
                    </div>
                    <Badge 
                      variant={isShowingMockData ? "secondary" : "default"}
                      className={isShowingMockData ? "bg-amber-100 text-amber-800" : ""}
                    >
                      {isShowingMockData ? 'Mock' : nodeExecutionResult?.status || 'Ready'}
                    </Badge>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(displayData, null, 2))
                      toast.success('Copied to clipboard')
                    }}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>

                <div className="rounded-md border bg-muted/30 p-3 flex-1 min-h-0">
                  <ScrollArea className="h-full w-full">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(displayData, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
                
                {isShowingMockData && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground flex-shrink-0">
                    <span>💡 This mock data is currently pinned and will be used for connected nodes</span>
                    <Button
                      onClick={openMockDataEditor}
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-sm mb-2">No Output Data</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                  Execute the workflow or create mock data to see output
                </p>
                <Button
                  onClick={openMockDataEditor}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Create Mock Data
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}