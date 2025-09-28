import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types'
import { getNodeExecutionCapability } from '@/utils/nodeTypeClassification'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Code,
  FolderOpen,
  GitBranch,
  Info,
  Settings,
  Zap,
  FileText,
  Table
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface InputsColumnProps {
  node: WorkflowNode
}

interface SchemaViewerProps {
  data: any
  level: number
  keyName?: string
}

function SchemaViewer({ data, level, keyName }: SchemaViewerProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels
  
  const getValueType = (value: any): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return `array[${value.length}]`
    return typeof value
  }
  
  const getValuePreview = (value: any): string => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'string') return `"${value.length > 20 ? value.slice(0, 20) + '...' : value}"`
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return `[${value.length} items]`
    if (typeof value === 'object') return `{${Object.keys(value).length} keys}`
    return String(value)
  }
  
  const isComplexType = (value: any): boolean => {
    return value !== null && (typeof value === 'object' || Array.isArray(value))
  }
  
  const indentStyle = { paddingLeft: `${level * 12}px` }
  
  if (!isComplexType(data)) {
    // Simple value - just display inline
    return (
      <div style={indentStyle} className="flex items-center gap-2 py-0.5">
        {keyName && (
          <>
            <span className="font-mono text-blue-600 text-xs">{keyName}</span>
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <span className="text-xs font-mono bg-muted px-1 rounded">
          {getValuePreview(data)}
        </span>
        <span className="text-xs text-muted-foreground italic">
          ({getValueType(data)})
        </span>
      </div>
    )
  }
  
  // Complex object or array
  return (
    <div style={indentStyle}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer group">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            {keyName && (
              <>
                <span className="font-mono text-blue-600 text-xs">{keyName}</span>
                <span className="text-muted-foreground">:</span>
              </>
            )}
            <span className="text-xs font-mono bg-muted px-1 rounded">
              {Array.isArray(data) ? `[${data.length}]` : `{${Object.keys(data).length}}`}
            </span>
            <span className="text-xs text-muted-foreground italic">
              ({getValueType(data)})
            </span>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-1">
            {Array.isArray(data) ? (
              // Array handling
              data.map((item, index) => (
                <SchemaViewer
                  key={index}
                  data={item}
                  level={level + 1}
                  keyName={`[${index}]`}
                />
              ))
            ) : (
              // Object handling
              Object.entries(data).map(([key, value]) => (
                <SchemaViewer
                  key={key}
                  data={value}
                  level={level + 1}
                  keyName={key}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function getRelevantData(executionData: any): any {
  // Extract the most relevant data from execution result
  // Usually the actual data is nested within execution metadata
  
  // If it's an array, get the first item (common in n8n)
  if (Array.isArray(executionData) && executionData.length > 0) {
    const firstItem = executionData[0]
    
    // If the first item has a 'json' property, use that (common n8n pattern)
    if (firstItem && typeof firstItem === 'object' && firstItem.json) {
      return firstItem.json
    }
    
    // If the first item has a 'main' property with data
    if (firstItem && typeof firstItem === 'object' && firstItem.main) {
      return getRelevantData(firstItem.main)
    }
    
    return firstItem
  }
  
  // If it's an object with 'json' property
  if (executionData && typeof executionData === 'object' && executionData.json) {
    return executionData.json
  }
  
  // If it's an object with 'main' property
  if (executionData && typeof executionData === 'object' && executionData.main) {
    return getRelevantData(executionData.main)
  }
  
  // Return as-is if we can't find a better structure
  return executionData
}

export function InputsColumn({ node }: InputsColumnProps) {
  const { workflow, getNodeExecutionResult } = useWorkflowStore()

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'schema' | 'json' | 'table'>('schema')

  // Get connected input nodes
  const inputConnections = workflow?.connections.filter(conn => conn.targetNodeId === node.id) || []
  const inputNodes = inputConnections.map(conn => 
    workflow?.nodes.find(n => n.id === conn.sourceNodeId)
  ).filter(Boolean) as WorkflowNode[]

  // Create node items with connections
  const nodeItems = useMemo(() => {
    return inputNodes.map((inputNode, index) => ({
      node: inputNode,
      connection: inputConnections[index]
    }))
  }, [inputNodes, inputConnections])

  // Initialize expanded state for all nodes
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {}
    nodeItems.forEach(item => {
      if (!(item.node.id in expandedCategories)) {
        initialExpanded[item.node.id] = false // Start collapsed by default
      }
    })
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedCategories(prev => ({ ...prev, ...initialExpanded }))
    }
  }, [nodeItems, expandedCategories])

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

  const getNodeIcon = (nodeType: string) => {
    const capability = getNodeExecutionCapability(nodeType)
    switch (capability) {
      case 'trigger':
        return <Zap className="h-4 w-4 text-muted-foreground" />
      case 'action':
        return <Settings className="h-4 w-4 text-muted-foreground" />
      case 'transform':
        return <Code className="h-4 w-4 text-muted-foreground" />
      case 'condition':
        return <GitBranch className="h-4 w-4 text-muted-foreground" />
      default:
        return <FolderOpen className="h-4 w-4 text-muted-foreground" />
    }
  }



  if (inputNodes.length === 0) {
    return (
      <div className="flex w-full h-full border-r border-gray-200 flex-col">
        <div className="p-4 border-b h-[72px] flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium">Inputs</h3>
              <Badge variant="outline">0</Badge>
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
                    This panel shows categorized input connections to this node, organized by node types.
                  </p>
                  <div className="text-xs text-gray-500">
                    • Nodes grouped by category (Triggers, Actions, etc.)<br/>
                    • Click categories to expand/collapse<br/>
                    • Execute workflow to view live data<br/>
                    • Click "View Data" to inspect details
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
        
        <div className="h-[calc(100dvh-222px)] overflow-y-auto p-4">
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <ArrowLeft className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No input connections</p>
            <p className="text-xs text-gray-400">Connect nodes to see categorized input data</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full border-r border-gray-200 flex-col">
      <div className="border-b">
        <div className="p-4 flex items-center justify-between">
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
                  This panel shows input connections with different view modes: Schema, JSON, and Table.
                </p>
                <div className="text-xs text-gray-500">
                  • Schema: Structured node view<br/>
                  • JSON: Raw execution data<br/>
                  • Table: Tabular data representation<br/>
                  • Click tabs to switch views
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="px-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schema" className="flex items-center gap-2 text-xs">
              <Settings className="h-3 w-3" />
              Schema
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2 text-xs">
              <Code className="h-3 w-3" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2 text-xs">
              <Table className="h-3 w-3" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <div className="h-[calc(100dvh-262px)] overflow-y-auto">
          
          {/* Schema Tab */}
          <TabsContent value="schema" className="m-0 p-0">
            <div className="space-y-0">
              {nodeItems.map((item) => {
                const { node: inputNode, connection } = item
                const nodeExecutionResult = getNodeExecutionResult(inputNode.id)
                
                return (
                  <Collapsible
                    key={inputNode.id}
                    open={expandedCategories[inputNode.id]}
                    onOpenChange={(open) => {
                      setExpandedCategories(prev => ({
                        ...prev,
                        [inputNode.id]: open
                      }))
                    }}
                    className="border-b last:border-b-0"
                  >
                    {/* Node Header */}
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors text-left group">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {expandedCategories[inputNode.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {getNodeIcon(inputNode.type)}
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: '#6b7280' }}
                        >
                          {inputNode.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {inputNode.name}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Output: <code className="bg-muted px-1 rounded">{connection.sourceOutput}</code>
                                {' → '}
                                Input: <code className="bg-muted px-1 rounded">{connection.targetInput}</code>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span 
                          className={`w-2 h-2 rounded-full ${
                            inputNode.disabled ? 'bg-muted-foreground' : 'bg-green-500'
                          }`}
                          title={inputNode.disabled ? "Disabled" : "Enabled"}
                        />
                      </div>
                      
                      {nodeExecutionResult && (
                        <div className="flex-shrink-0">
                          {getNodeStatusBadge(nodeExecutionResult.status)}
                        </div>
                      )}
                    </CollapsibleTrigger>

                    {/* Node Content */}
                    <CollapsibleContent className="space-y-0">
                      <div className="p-4 bg-muted/30">
                        {/* Schema View - Structured display */}
                        {nodeExecutionResult?.data && (
                          <div className="text-xs">
                            <div className="font-medium mb-2 text-muted-foreground">Data Schema:</div>
                            <SchemaViewer data={getRelevantData(nodeExecutionResult.data)} level={0} />
                          </div>
                        )}
                        
                        {!nodeExecutionResult?.data && (
                          <div className="text-xs text-muted-foreground">
                            <div className="font-medium mb-1">Data Schema:</div>
                            <p className="italic">No execution data available. Run the workflow to see schema.</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </TabsContent>

          {/* JSON Tab */}
          <TabsContent value="json" className="m-0 p-0">
            <div className="p-4">
              {nodeItems.map((item) => {
                const { node: inputNode } = item
                const nodeExecutionResult = getNodeExecutionResult(inputNode.id)
                
                return (
                  <div key={inputNode.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      {getNodeIcon(inputNode.type)}
                      <span className="text-sm font-medium">{inputNode.name}</span>
                      {nodeExecutionResult && getNodeStatusBadge(nodeExecutionResult.status)}
                    </div>
                    
                    {nodeExecutionResult?.data ? (
                      <pre className="text-xs bg-muted p-3 rounded border overflow-auto max-h-64 whitespace-pre-wrap">
                        {JSON.stringify(nodeExecutionResult.data, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-xs text-muted-foreground italic p-3 bg-muted rounded border">
                        No execution data available
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* Table Tab */}
          <TabsContent value="table" className="m-0 p-0">
            <div className="p-4">
              <div className="text-xs">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-300 p-2 text-left">Node</th>
                      <th className="border border-gray-300 p-2 text-left">Type</th>
                      <th className="border border-gray-300 p-2 text-left">Status</th>
                      <th className="border border-gray-300 p-2 text-left">Data Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeItems.map((item) => {
                      const { node: inputNode } = item
                      const nodeExecutionResult = getNodeExecutionResult(inputNode.id)
                      
                      return (
                        <tr key={inputNode.id} className="hover:bg-muted/50">
                          <td className="border border-gray-300 p-2">
                            <div className="flex items-center gap-2">
                              {getNodeIcon(inputNode.type)}
                              <span className="font-medium">{inputNode.name}</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2">
                            <Badge variant="outline" className="text-xs">
                              {inputNode.type}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 p-2">
                            {nodeExecutionResult ? 
                              getNodeStatusBadge(nodeExecutionResult.status) :
                              <Badge variant="outline">Not Run</Badge>
                            }
                          </td>
                          <td className="border border-gray-300 p-2">
                            {nodeExecutionResult?.data ? (
                              <Badge className="bg-green-100 text-green-800">Yes</Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
        </div>
      </Tabs>
    </div>
  )
}