import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types'
import { getNodeExecutionCapability } from '@/utils/nodeTypeClassification'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Info,
  FolderOpen,
  MoreHorizontal,
  Zap,
  Settings,
  Code,
  GitBranch,
  Clock
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

interface InputsColumnProps {
  node: WorkflowNode
}



export function InputsColumn({ node }: InputsColumnProps) {
  const { workflow, getNodeExecutionResult } = useWorkflowStore()

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

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
      
      <div className="h-[calc(100dvh-222px)] overflow-y-auto p-0">
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
                    {/* Data Preview */}
                    {nodeExecutionResult?.data && (
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium mb-2">Execution Data:</div>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs mb-2">
                              {expandedCategories[`${inputNode.id}-data`] ? 'Hide Data' : 'Show Data'}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="text-xs bg-muted p-3 rounded border overflow-auto max-h-32 whitespace-pre-wrap">
                              {JSON.stringify(nodeExecutionResult.data, null, 2)}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    )}
                    
                    {/* No Data Message */}
                    {!nodeExecutionResult?.data && (
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium mb-1">Execution Data:</div>
                        <p className="italic">No execution data available. Run the workflow to see data.</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </div>
    </div>
  )
}