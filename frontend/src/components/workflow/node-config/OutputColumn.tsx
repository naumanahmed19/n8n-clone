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
  PinOff,
  ExternalLink,
  ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface OutputColumnProps {
  node: WorkflowNode
}

// Helper component to render image preview in output
function ImagePreviewOutput({ data }: { data: any }) {
  const [imageError, setImageError] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const imageUrl = data?.imageUrl as string

  if (!imageUrl) {
    return null
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    })
  }

  return (
    <div className="space-y-3">
      {/* Image Preview Card */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {!imageError ? (
          <div className="relative group">
            <img
              src={imageUrl}
              alt={data?.altText || 'Preview'}
              className="w-full h-auto max-h-96 object-contain bg-gray-50"
              onError={() => setImageError(true)}
              onLoad={handleImageLoad}
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-gray-900 px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">Open full size</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Failed to load image</p>
            <p className="text-xs text-gray-500 mt-1 truncate">{imageUrl}</p>
          </div>
        )}
        
        {/* Image Info */}
        {!imageError && (
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Image URL:</p>
                <p className="text-xs text-gray-900 font-mono truncate">{imageUrl}</p>
              </div>
              {imageDimensions && (
                <div>
                  <p className="text-xs text-gray-500">Dimensions:</p>
                  <p className="text-xs text-gray-900">{imageDimensions.width}px × {imageDimensions.height}px</p>
                </div>
              )}
              {data?.altText && (
                <div>
                  <p className="text-xs text-gray-500">Alt Text:</p>
                  <p className="text-xs text-gray-900">{data.altText}</p>
                </div>
              )}
              {data?.metadata && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                  {data.metadata.dimensions && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Dimensions:</p>
                      <p className="text-xs text-gray-900 font-semibold">{data.metadata.dimensions}</p>
                    </div>
                  )}
                  {data.metadata.contentType && (
                    <div>
                      <p className="text-xs text-gray-500">Type:</p>
                      <p className="text-xs text-gray-900">{data.metadata.contentType}</p>
                    </div>
                  )}
                  {data.metadata.sizeFormatted && (
                    <div>
                      <p className="text-xs text-gray-500">Size:</p>
                      <p className="text-xs text-gray-900">{data.metadata.sizeFormatted}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
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

  // Helper function to safely extract node output data
  const extractNodeOutputData = (nodeExecutionResult: any) => {
    try {
      // Handle the new standardized format from backend
      if (nodeExecutionResult?.data?.main || nodeExecutionResult?.data?.branches) {
        const { main, branches, metadata } = nodeExecutionResult.data;
        
        // For branching nodes (like IF), return the branches structure for separate display
        if (metadata?.hasMultipleBranches && branches) {
          return {
            type: 'branches',
            branches: branches,
            metadata: metadata
          };
        }
        
        // For regular nodes, extract the JSON data from main
        if (main && main.length > 0) {
          // If main contains objects with 'json' property, extract that
          if (main[0]?.json) {
            return main[0].json;
          }
          // Otherwise return the first main item directly
          return main[0];
        }
      }
      
      // Fallback for legacy format handling
      if (nodeExecutionResult?.data?.[0]?.main?.[0]?.json) {
        return nodeExecutionResult.data[0].main[0].json;
      }
      
      if (Array.isArray(nodeExecutionResult?.data) && nodeExecutionResult.data.length > 0) {
        return nodeExecutionResult.data[0];
      }
      
      if (nodeExecutionResult?.data && typeof nodeExecutionResult.data === 'object') {
        return nodeExecutionResult.data;
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

                    {/* Check if this is an image preview node and render accordingly */}
                    {displayData?.imageUrl ? (
                      <div className="flex-1 min-h-0 space-y-4">
                        {/* Image Preview */}
                        <ImagePreviewOutput data={displayData} />
                        
                        {/* JSON Output (Collapsible) */}
                        <details className="border rounded-lg">
                          <summary className="cursor-pointer p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                            <span className="text-sm font-medium">View JSON Output</span>
                          </summary>
                          <div className="p-3 border-t">
                            <ScrollArea className="h-64 w-full">
                              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                {JSON.stringify(displayData, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        </details>
                      </div>
                    ) : (
                      /* Regular JSON output for non-image nodes */
                      <div className="rounded-md border bg-muted/30 p-3 flex-1 min-h-0">
                        <ScrollArea className="h-full w-full">
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {JSON.stringify(displayData, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
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