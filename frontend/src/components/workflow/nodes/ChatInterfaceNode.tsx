import { BaseNode, BaseNodeContent, BaseNodeFooter, BaseNodeHeader, BaseNodeHeaderTitle } from '@/components/base-node'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useExecutionControls } from '@/hooks/workflow'
import { useWorkflowStore } from '@/stores'
import { MessageCircle, Send, Sparkles, User } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Handle, NodeProps, Position } from 'reactflow'

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
  messages?: Message[]
  placeholder?: string
  systemPrompt?: string
  model?: string
  status?: 'idle' | 'running' | 'success' | 'error' | 'skipped'
  executionResult?: any
  lastExecutionData?: any
}

export function ChatInterfaceNode({ data, selected, id }: NodeProps<ChatInterfaceNodeData>) {
  const { executionState, updateNode } = useWorkflowStore()
  const { executeWorkflow } = useExecutionControls()
  const isReadOnly = !!executionState.executionId
  const isExecuting = executionState.status === 'running'
  
  // Get parameters from node configuration
  const placeholder = data.parameters?.placeholder || data.placeholder || 'Type a message...'
  
  // Check if we have execution results (workflow was run)
  const executionResult = data.executionResult || data.lastExecutionData
  const hasExecutionData = executionResult && executionResult.data
  
  // Debug: Log the execution data structure
  console.log('ChatInterfaceNode - Full data:', data)
  console.log('ChatInterfaceNode - executionResult:', executionResult)
  console.log('ChatInterfaceNode - hasExecutionData:', hasExecutionData)
  
  // Use execution data if available, otherwise use local state for interactive mode
  const [localMessages, setLocalMessages] = useState<Message[]>(data.messages || [])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Determine which messages to display
  let displayMessages: Message[] = localMessages
  
  if (hasExecutionData) {
    // Show data from workflow execution
    const executionData = executionResult.data
    console.log('ChatInterfaceNode - executionData:', executionData)
    
    // Just show the user message that was sent
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
    
    console.log('ChatInterfaceNode - displayMessages:', displayMessages)
  }

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isExecuting) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    // Add user message to local state for immediate feedback
    setLocalMessages(prev => [...prev, userMessage])
    
    const messageToSend = inputValue
    setInputValue('')
    setIsTyping(true)

    try {
      // First, update the node parameters with the user message
      // This ensures the backend gets the latest message when executing
      updateNode(id, {
        parameters: {
          ...data.parameters,
          userMessage: messageToSend
        },
        disabled: false // Explicitly keep the node enabled
      })

      // Wait a tiny bit for the state to propagate
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Now execute the workflow with this node as trigger
      console.log('Executing workflow with node:', id, 'message:', messageToSend)
      await executeWorkflow(id)
      
      console.log('Workflow execution completed')
      setIsTyping(false)
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      setIsTyping(false)
      
      // Show error message
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

  return (
    <>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
        isConnectable={!isReadOnly}
      />

      <BaseNode className={`w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <BaseNodeHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <BaseNodeHeaderTitle>{data.label || 'Chat Interface'}</BaseNodeHeaderTitle>
          </div>
          <div className="flex items-center gap-1">
            {hasExecutionData && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                <span>✓</span>
                <span>Sent</span>
              </div>
            )}
          </div>
        </BaseNodeHeader>

        <BaseNodeContent className="p-0">
          {/* Chat Messages Area */}
          <ScrollArea className="h-[200px] px-3 py-2">
            {displayMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Type to start...</p>
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
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[75%] ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-secondary text-foreground">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </BaseNodeContent>

        <BaseNodeFooter className="flex-col p-2 gap-2">
          {/* Debug Info - Show output data structure */}
          {hasExecutionData && (
            <div className="text-xs text-muted-foreground bg-secondary p-2 rounded w-full">
              <div className="font-semibold mb-1">📤 Output:</div>
              <div className="space-y-1">
                {executionResult.data.message && (
                  <div>Message: {executionResult.data.message}</div>
                )}
                {executionResult.data.timestamp && (
                  <div>Time: {new Date(executionResult.data.timestamp).toLocaleTimeString()}</div>
                )}
              </div>
            </div>
          )}
          
          {/* Input field */}
          <div className="flex gap-2 w-full">
            <Input
              type="text"
              placeholder={isExecuting ? 'Processing...' : placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isReadOnly || isTyping || isExecuting}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isReadOnly || isTyping || isExecuting}
            >
              {isExecuting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </BaseNodeFooter>
      </BaseNode>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
        isConnectable={!isReadOnly}
      />
    </>
  )
}

ChatInterfaceNode.displayName = 'ChatInterfaceNode'
