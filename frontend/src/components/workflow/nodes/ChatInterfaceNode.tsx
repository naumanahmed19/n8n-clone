import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useExecutionControls } from '@/hooks/workflow'
import { useWorkflowStore } from '@/stores'
import { ChevronDown, ChevronUp, MessageCircle, Send, User } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Handle, NodeProps, Position } from 'reactflow'
import { NodeContextMenu } from '../components/NodeContextMenu'
import { useNodeActions } from '../hooks/useNodeActions'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceNodeData {
  label: string
  nodeType: string
  parameters: Record<string, any>
  disabled: boolean
  status?: 'idle' | 'running' | 'success' | 'error' | 'skipped'
  executionResult?: any
  lastExecutionData?: any
  // Custom properties for chat
  icon?: string
  color?: string
}

export function ChatInterfaceNode({ data, selected, id }: NodeProps<ChatInterfaceNodeData>) {
  const { executionState, updateNode } = useWorkflowStore()
  const { executeWorkflow } = useExecutionControls()
  const isReadOnly = !!executionState.executionId
  const isExecuting = executionState.status === 'running'
  
  // Use node actions hook for context menu functionality
  const {
    handleOpenProperties,
    handleExecuteFromContext,
    handleDuplicate,
    handleDelete,
    handleOutputClick
  } = useNodeActions(id)
  
  // Track expanded state (stored in node parameters to persist)
  const [isExpanded, setIsExpanded] = useState(data.parameters?.isExpanded ?? false)
  
  // Get parameters from node configuration
  const placeholder = data.parameters?.placeholder || 'Type a message...'
  
  // Check if we have execution results
  const executionResult = data.executionResult || data.lastExecutionData
  const hasExecutionData = executionResult && executionResult.data
  
  // Use execution data if available, otherwise use local state
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Determine which messages to display
  let displayMessages: Message[] = localMessages
  
  if (hasExecutionData) {
    const executionData = executionResult.data
    if (executionData.message || executionData.userMessage) {
      displayMessages = [
        {
          id: 'exec-user',
          role: 'user',
          content: executionData.userMessage || executionData.message,
          timestamp: new Date(executionData.timestamp || Date.now())
        }
      ]
    }
  }

  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    // Save expanded state to node parameters
    updateNode(id, {
      parameters: {
        ...data.parameters,
        isExpanded: newExpanded
      }
    })
  }, [isExpanded, id, data.parameters, updateNode])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isExecuting) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setLocalMessages(prev => [...prev, userMessage])
    
    const messageToSend = inputValue
    setInputValue('')
    setIsTyping(true)

    try {
      updateNode(id, {
        parameters: {
          ...data.parameters,
          userMessage: messageToSend
        },
        disabled: false
      })

      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('Executing workflow with node:', id, 'message:', messageToSend)
      await executeWorkflow(id)
      
      console.log('Workflow execution completed')
      setIsTyping(false)
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      setIsTyping(false)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: Failed to execute workflow. ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setLocalMessages(prev => [...prev, errorMessage])
    }
  }, [inputValue, isExecuting, id, data.parameters, updateNode, executeWorkflow])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Handle double-click to open properties dialog
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    handleOpenProperties()
  }, [handleOpenProperties])

  // Compact view (collapsed)
  if (!isExpanded) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative">
            <Handle
              type="target"
              position={Position.Left}
              id="input"
              className="w-3 h-3 !bg-blue-500 border-2 border-white"
              isConnectable={!isReadOnly}
            />

            <div
              onDoubleClick={handleDoubleClick}
              className={`relative bg-white rounded-lg border-2 shadow-md transition-all duration-200 ${
                selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
              }`}
              style={{ width: '180px' }}
            >
              {/* Compact Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{data.label || 'Chat'}</span>
                    {hasExecutionData && (
                      <span className="text-xs text-green-600">✓ Sent</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleExpand}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Handle
              type="source"
              position={Position.Right}
              id="output"
              className="w-3 h-3 !bg-green-500 border-2 border-white"
              isConnectable={!isReadOnly}
              onClick={(e) => handleOutputClick(e, 'output')}
            />
          </div>
        </ContextMenuTrigger>
        
        <NodeContextMenu
          onOpenProperties={handleOpenProperties}
          onExecute={handleExecuteFromContext}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          readOnly={isReadOnly}
        />
      </ContextMenu>
    )
  }

  // Expanded view (full chat interface)
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative">
          <Handle
            type="target"
            position={Position.Left}
            id="input"
            className="w-3 h-3 !bg-blue-500 border-2 border-white"
            isConnectable={!isReadOnly}
          />

          <div
            onDoubleClick={handleDoubleClick}
            className={`relative bg-white rounded-lg border-2 shadow-lg transition-all duration-200 ${
              selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
            }`}
            style={{ width: '320px' }}
          >
            {/* Expanded Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{data.label || 'Chat'}</span>
                  {hasExecutionData && (
                    <span className="text-xs text-green-600">✓ Message Sent</span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleExpand}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>

            {/* Chat Messages Area */}
            <ScrollArea className="h-[250px] p-3">
              {displayMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-xs text-center">Type a message below to start</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {displayMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-3 py-2 max-w-[75%] ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                        <span className="text-[10px] opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-2 justify-start">
                      <div className="rounded-lg px-3 py-2 bg-secondary text-foreground">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Output Info */}
            {hasExecutionData && (
              <div className="px-3 py-2 bg-secondary/50 border-t text-[10px] text-muted-foreground">
                <div className="font-medium mb-0.5">📤 Output Available</div>
                <div>Message: {executionResult.data.message}</div>
              </div>
            )}
            
            {/* Input Area */}
            <div className="flex gap-2 p-3 border-t bg-gray-50">
              <Input
                type="text"
                placeholder={isExecuting ? 'Processing...' : placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isReadOnly || isTyping || isExecuting}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isReadOnly || isTyping || isExecuting}
                className="h-9 px-3"
              >
                {isExecuting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Handle
            type="source"
            position={Position.Right}
            id="output"
            className="w-3 h-3 !bg-green-500 border-2 border-white"
            isConnectable={!isReadOnly}
            onClick={(e) => handleOutputClick(e, 'output')}
          />
        </div>
      </ContextMenuTrigger>
      
      <NodeContextMenu
        onOpenProperties={handleOpenProperties}
        onExecute={handleExecuteFromContext}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        readOnly={isReadOnly}
      />
    </ContextMenu>
  )
}

ChatInterfaceNode.displayName = 'ChatInterfaceNode'
