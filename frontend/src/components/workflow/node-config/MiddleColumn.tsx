import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNodeConfigDialogStore, useWorkflowStore } from '@/stores'
import { NodeType, WorkflowNode } from '@/types'
import { NodeValidator } from '@/utils/nodeValidation'
import {
    AlertCircle,
    Database,
    FileText,
    Info,
    Loader2,
    Play,
    Settings
} from 'lucide-react'
import { ConfigTab } from './tabs/ConfigTab'
import { DocsTab } from './tabs/DocsTab'
import { ResponseTab } from './tabs/ResponseTab'
import { TestTab } from './tabs/TestTab'

interface MiddleColumnProps {
  node: WorkflowNode
  nodeType: NodeType
  onDelete: () => void
  onExecute: () => void
}

export function MiddleColumn({ node, nodeType, onDelete, onExecute }: MiddleColumnProps) {
  const { 
    nodeName, 
    isDisabled, 
    isEditingName, 
    isExecuting,
    validationErrors,
    activeTab,
    updateNodeName,
    updateDisabled,
    setIsEditingName,
    setActiveTab
  } = useNodeConfigDialogStore()

  const { 
    getNodeExecutionResult,
    executionState
  } = useWorkflowStore()

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
    <div className="flex w-full h-full flex-col">
      {/* Node Title Section */}
      <div className="p-4 border-b bg-gray-50/50 h-[72px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: nodeType.color || '#666' }}
            >
              {nodeType.icon || nodeType.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <Input
                  value={nodeName}
                  onChange={(e) => updateNodeName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingName(false)
                    }
                  }}
                  className={`text-sm font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                    NodeValidator.getFieldError(validationErrors, 'name') ? 'text-red-600' : ''
                  }`}
                  placeholder="Node name..."
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => setIsEditingName(true)}
                  className="text-sm font-semibold cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                >
                  {nodeName || nodeType.displayName}
                </div>
              )}
              {NodeValidator.getFieldError(validationErrors, 'name') && (
                <div className="flex items-center space-x-1 mt-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs">{NodeValidator.getFieldError(validationErrors, 'name')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Execute Node Button */}
            <Button
              onClick={onExecute}
              disabled={isExecuting || executionState.status === 'running' || validationErrors.length > 0}
              size="sm"
              className="flex items-center space-x-1"
            >
              {isExecuting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span className="text-xs">Run Node</span>
            </Button>
            
            {/* Enable Node Toggle */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <div>
                  <Switch
                    checked={!isDisabled}
                    onCheckedChange={(checked) => updateDisabled(!checked)}
                    className="scale-75"
                  />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-48 p-2">
                <div className="text-xs">
                  <p className="font-medium">{isDisabled ? 'Node Disabled' : 'Node Enabled'}</p>
                  <p className="text-gray-500 mt-1">
                    {isDisabled 
                      ? 'This node will be skipped during execution'
                      : 'This node will execute normally'
                    }
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            {nodeExecutionResult && getNodeStatusBadge(nodeExecutionResult.status)}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Info className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80" side="bottom" align="end">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center space-x-2">
                    <Info className="w-4 h-4" />
                    <span>{nodeType.displayName}</span>
                  </h4>
                  <p className="text-sm text-gray-600">
                    {nodeType.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    • Configure node parameters<br/>
                    • Set up credentials if required<br/>
                    • Test node execution<br/>
                    • View response data and documentation
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 border-b border-gray-200">
          <div className="flex space-x-0 -mb-px">
            <TabsList className="h-auto p-0 bg-transparent grid w-full grid-cols-4 shadow-none">
              <TabsTrigger 
                value="config" 
                className="flex items-center space-x-1.5 px-3 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent shadow-none transition-all duration-200 text-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="font-medium">Config</span>
              </TabsTrigger>
              <TabsTrigger 
                value="test" 
                className="flex items-center space-x-1.5 px-3 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent shadow-none transition-all duration-200 text-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="font-medium">Test</span>
              </TabsTrigger>
              <TabsTrigger 
                value="response" 
                className="flex items-center space-x-1.5 px-3 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent shadow-none transition-all duration-200 text-sm"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="font-medium">Response</span>
              </TabsTrigger>
              <TabsTrigger 
                value="docs" 
                className="flex items-center space-x-1.5 px-3 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent shadow-none transition-all duration-200 text-sm"
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium">Docs</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="config" className="h-full mt-0">
            <ConfigTab node={node} nodeType={nodeType} onDelete={onDelete} />
          </TabsContent>

          <TabsContent value="test" className="h-full mt-0">
            <TestTab node={node} nodeType={nodeType} />
          </TabsContent>

          <TabsContent value="response" className="h-full mt-0">
            <ResponseTab node={node} />
          </TabsContent>

          <TabsContent value="docs" className="h-full mt-0">
            <DocsTab nodeType={nodeType} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}