import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JsonEditor } from '@/components/ui/json-editor'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useNodeConfigDialogStore, useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types'
import {
  Copy,
  Database,
  Edit,
  Pin,
  PinOff
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

  // Helper function to safely extract node output data from standardized format
  const extractNodeOutputData = (nodeExecutionResult: any) => {
    try {
      if (!nodeExecutionResult?.data) {
        return null;
      }

      const { data } = nodeExecutionResult;
      
      // Handle direct standardized format: {main: [...], branches?: {...}, metadata: {...}}
      if (data.metadata) {
        // For branching nodes, return the full structure for branch display
        if (data.metadata.hasMultipleBranches && data.branches) {
          return {
            type: 'branches',
            branches: data.branches,
            metadata: data.metadata
          };
        }
        
        // For regular nodes, extract the first item's json data if it exists
        if (data.main && data.main.length > 0 && data.main[0]?.json) {
          const jsonData = data.main[0].json;
          
          // Special handling for HTTP nodes - extract only the 'data' property
          if (data.metadata.nodeType === 'http-request' && jsonData.data !== undefined) {
            return jsonData.data;
          }
          
          return jsonData;
        }
        
        // If no json property, return the whole item
        if (data.main && data.main.length > 0) {
          return data.main[0];
        }
      }
      
      // Handle case where data itself is the main array (e.g., from outputData field)
      if (data.main && Array.isArray(data.main)) {
        if (data.main.length > 0) {
          // If the items have a json property, extract it
          if (data.main[0]?.json) {
            const jsonData = data.main[0].json;
            
            // Special handling for HTTP nodes - extract only the 'data' property
            if (jsonData.data !== undefined && 
                (jsonData.status !== undefined || jsonData.headers !== undefined || jsonData.ok !== undefined)) {
              return jsonData.data;
            }
            
            return jsonData;
          }
          // Otherwise return the raw item
          return data.main[0];
        }
      }
      
      // Fallback: if data is an array directly
      if (Array.isArray(data) && data.length > 0) {
        // Check for nested structure like [{main: [...]}]
        if (data[0]?.main?.[0]?.json) {
          const jsonData = data[0].main[0].json;
          
          // Special handling for HTTP nodes - extract only the 'data' property
          if (jsonData.data !== undefined && 
              (jsonData.status !== undefined || jsonData.headers !== undefined || jsonData.ok !== undefined)) {
            return jsonData.data;
          }
          
          return jsonData;
        }
        // Return first item if it exists
        return data[0];
      }
      
      // If data is an object and not an array, return it directly
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        // Skip metadata-only objects
        if (Object.keys(data).length === 1 && data.metadata) {
          return null;
        }
        
        // Special handling for HTTP response objects - extract only the 'data' property
        if (data.data !== undefined && 
            (data.status !== undefined || data.headers !== undefined || data.ok !== undefined)) {
          return data.data;
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to extract node output data:', error);
      return null;
    }
  }

  // Determine what data to show - mock data if pinned and available, otherwise execution result
  const displayData = mockDataPinned && mockData 
    ? mockData 
    : extractNodeOutputData(nodeExecutionResult)
  const isShowingMockData = mockDataPinned && mockData
  const isBranchingNode = displayData?.type === 'branches'

  return (
    <div className="flex w-full h-full border-l flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Output Data</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={openMockDataEditor}
            className="h-7 px-2 text-xs gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>

          {/* Copy Button */}
          {displayData && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const copyData = isBranchingNode ? displayData.branches : displayData;
                navigator.clipboard.writeText(JSON.stringify(copyData, null, 2))
                toast.success('Copied to clipboard')
              }}
              className="h-7 px-2 text-xs gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
          )}

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
       
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {/* Mock Data Editor - Full Width/Height when open */}
        {mockDataEditor.isOpen ? (
          <div className="h-full flex flex-col bg-card">
            {/* Editor Header */}
         
          
            {/* Editor Content */}
            <div className="flex-1  flex flex-col min-h-0">
              <JsonEditor
                value={mockDataEditor.content}
                onValueChange={updateMockDataContent}
                placeholder='{\n  "message": "Hello World",\n  "data": {\n    "success": true\n  }\n}'
   

                className="flex-1"
                required
              />
            </div>
            
            {/* Editor Actions */}
            <div className="p-4 border-t bg-muted/10">
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
          </div>
        ) : (
          /* Main Output Display - Only shown when editor is closed */
          <ScrollArea className="h-full">
            <div className="p-4 h-full flex flex-col space-y-4">
              {/* Pin Message at Top */}
              {isShowingMockData && (
                <div className="flex items-center justify-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 flex-shrink-0">
                  <span>💡 This mock data is currently pinned and will be used for connected nodes</span>
                </div>
              )}

              {displayData ? (
                isBranchingNode ? (
                  /* Branching Node Display - Show each branch separately */
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Database className="h-4 w-4" />
                          <h3 className="text-sm font-medium">
                            Branch Outputs ({displayData.metadata?.nodeType || 'Conditional'})
                          </h3>
                        </div>
                        <Badge variant="default">
                          {Object.keys(displayData.branches || {}).length} Branches
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 space-y-3">
                      {Object.entries(displayData.branches || {}).map(([branchName, branchData]) => (
                        <div key={branchName} className="border rounded-lg">
                          {/* Branch Header */}
                          <div className="flex items-center justify-between p-3 bg-muted/50 border-b rounded-t-lg">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                branchName === 'true' ? 'bg-green-500' : 
                                branchName === 'false' ? 'bg-red-500' : 'bg-blue-500'
                              }`} />
                              <span className="font-medium text-sm capitalize">{branchName} Path</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {Array.isArray(branchData) ? branchData.length : 0} items
                            </Badge>
                          </div>
                          
                          {/* Branch Content */}
                          <div className="p-3">
                            {Array.isArray(branchData) && branchData.length > 0 ? (
                              <ScrollArea className="h-32 w-full">
                                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                  {JSON.stringify(branchData, null, 2)}
                                </pre>
                              </ScrollArea>
                            ) : (
                              <div className="text-xs text-muted-foreground italic text-center py-4">
                                No data in this branch
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Regular Node Display - Single output */
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
                    </div>

                    <div className="rounded-md border bg-muted/30 p-3 flex-1 min-h-0">
                      <ScrollArea className="h-full w-full">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {JSON.stringify(displayData, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                )
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
        )}
      </div>
    </div>
  )
}