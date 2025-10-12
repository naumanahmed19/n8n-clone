import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExecutionControls } from '@/hooks/workflow'
import { useWorkflowStore } from '@/stores'
import { MessageCircle, Send, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NodeProps } from 'reactflow'
import { BaseNodeWrapper } from './BaseNodeWrapper'

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
  locked?: boolean
  status?: 'idle' | 'running' | 'success' | 'error' | 'skipped'
  executionResult?: any
  lastExecutionData?: any
  // Dynamic handles from node definition
  inputs?: string[]
  outputs?: string[]
  executionCapability?: 'trigger' | 'action' | 'transform' | 'condition'
  // Custom properties for chat
  icon?: string
  color?: string
}

export function ChatInterfaceNode({ data, selected, id }: NodeProps<ChatInterfaceNodeData>) {
  const { executionState, updateNode, workflow, lastExecutionResult } = useWorkflowStore()
  const { executeWorkflow } = useExecutionControls()
  // For chat nodes, only set read-only during actual execution, not just when execution ID exists
  const isReadOnly = false // Chat should always be interactive
  const isExecuting = executionState.status === 'running'
  
  // Track expanded state (stored in node parameters to persist)
  const [isExpanded, setIsExpanded] = useState(data.parameters?.isExpanded ?? false)
  
  // Get parameters from node configuration
  const placeholder = data.parameters?.placeholder || 'Type a message...'
  
  // State for input and UI
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [lastProcessedExecutionId, setLastProcessedExecutionId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false) // Prevent infinite loops

  // Get stored messages from node parameters
  const storedMessages = (data.parameters?.conversationHistory as Message[]) || []

  // Get connected node's output (e.g., OpenAI response)
  const getConnectedNodeResponse = useCallback(() => {
    if (!workflow || !lastExecutionResult) return null
    
    // Find connections where this chat node is the source
    const outgoingConnections = workflow.connections.filter(
      conn => conn.sourceNodeId === id
    )
    
    if (outgoingConnections.length === 0) return null
    
    // Get the first connected node's execution result
    const connectedNodeId = outgoingConnections[0].targetNodeId
    const connectedNodeExecution = lastExecutionResult.nodeResults?.find(
      nr => nr.nodeId === connectedNodeId
    )
    
    if (!connectedNodeExecution || !connectedNodeExecution.data) return null
    
    // Extract response from the execution data
    let data = connectedNodeExecution.data
    
    // If data has a 'main' output array, get the first item's json
    if (data.main && Array.isArray(data.main) && data.main.length > 0) {
      const mainOutput = data.main[0]
      if (mainOutput.json) {
        data = mainOutput.json
      }
    }
    
    // Try different response formats
    if (data.response) return data.response
    if (data.message) return data.message
    if (data.text) return data.text
    
    // If output is an array, get first item
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0]
      return firstItem.response || firstItem.message || firstItem.text || JSON.stringify(firstItem)
    }
    
    return null
  }, [workflow, lastExecutionResult, id])

  // Append new messages from execution to conversation history
  useEffect(() => {
    if (!lastExecutionResult || !workflow) return
    
    const executionId = lastExecutionResult.executionId
    
    // Don't process the same execution twice
    if (executionId === lastProcessedExecutionId) return
    
    // Prevent infinite loops - if already processing, exit
    if (processingRef.current) return
    
    // Only process execution results for THIS specific chat node
    const triggerNodeId = lastExecutionResult.triggerNodeId
    
    // If triggerNodeId is set and doesn't match this node, ignore this execution
    if (triggerNodeId && triggerNodeId !== id) return
    
    // Set processing flag
    processingRef.current = true
    
    const chatNodeResult = lastExecutionResult.nodeResults?.find(nr => nr.nodeId === id)
    
    if (!chatNodeResult) {
      console.error(`ChatNode ${id}: Not found in execution results`, {
        triggerNodeId,
        executedNodes: lastExecutionResult.nodeResults?.map(nr => nr.nodeId)
      })
      setLastProcessedExecutionId(executionId)
      processingRef.current = false
      return
    }
    
    if (chatNodeResult && chatNodeResult.data) {
      // Get user message from chat node's output
      let userMessage = null
      const chatData = chatNodeResult.data
      
      // Extract user message from chat node's output: data.main[0].json
      if (chatData.main && Array.isArray(chatData.main) && chatData.main.length > 0) {
        const mainOutput = chatData.main[0]
        if (mainOutput.json) {
          userMessage = mainOutput.json.userMessage || mainOutput.json.message
        }
      }
      
      if (userMessage) {
        // Check if this message already exists in history
        const currentMessages = (data.parameters?.conversationHistory as Message[]) || []
        const userMsgId = `${executionId}-user`
        const alreadyExists = currentMessages.some(msg => msg.id === userMsgId)
        
        if (alreadyExists) {
          setLastProcessedExecutionId(executionId)
          processingRef.current = false
          return
        }
        
        const newMessages: Message[] = []
        
        // Add user message
        newMessages.push({
          id: userMsgId,
          role: 'user',
          content: userMessage,
          timestamp: new Date(chatNodeResult.startTime || Date.now())
        })
        
        // Add AI response if available
        const aiResponse = getConnectedNodeResponse()
        
        if (aiResponse) {
          newMessages.push({
            id: `${executionId}-assistant`,
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(chatNodeResult.endTime || Date.now())
          })
        }
        
        // Append to conversation history
        const updatedHistory = [...currentMessages, ...newMessages]
        
        // Update node parameters with new conversation history
        updateNode(id, {
          parameters: {
            ...data.parameters,
            conversationHistory: updatedHistory
          }
        })
        
        setLastProcessedExecutionId(executionId)
        
        // Clear processing flag after a short delay to prevent immediate re-trigger
        setTimeout(() => {
          processingRef.current = false
        }, 100)
      } else {
        // Clear processing flag if no user message
        processingRef.current = false
      }
    } else {
      // Clear processing flag if no chat result data
      processingRef.current = false
    }
    // Only depend on lastExecutionResult changes - not on workflow or data.parameters
    // We get workflow from the closure scope, don't need it as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastExecutionResult, id])

  // Use stored conversation history for display
  const displayMessages: Message[] = storedMessages

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [displayMessages.length, isTyping])

  // Turn off typing indicator when execution completes and we have a response
  useEffect(() => {
    if (!isExecuting && isTyping) {
      const aiResponse = getConnectedNodeResponse()
      if (aiResponse || executionState.status === 'error') {
        setIsTyping(false)
      }
    }
  }, [isExecuting, isTyping, executionState.status, getConnectedNodeResponse])

  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback(() => {
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
      const result = await executeWorkflow(id)
      
      console.log('Workflow execution completed', result)
      setIsTyping(false)
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      setIsTyping(false)
      
      // Add error message to conversation history
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: Failed to execute workflow. ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      
      const updatedHistory = [...storedMessages, errorMessage]
      updateNode(id, {
        parameters: {
          ...data.parameters,
          conversationHistory: updatedHistory
        }
      })
    }
  }, [inputValue, isExecuting, id, data.parameters, updateNode, executeWorkflow, storedMessages])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Prepare header info text
  const headerInfo = displayMessages.length > 0 
    ? `${displayMessages.length} message${displayMessages.length !== 1 ? 's' : ''}`
    : undefined

  // Expanded content (chat interface)
  const expandedContent = (
    <>
      {/* Chat Messages Area */}
      <div
        ref={scrollAreaRef}
        className="h-[250px] p-3 overflow-y-auto"
      >
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
                    {new Date(message.timestamp).toLocaleTimeString([], { 
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
      </div>
      
      {/* Input Area */}
      <div className="flex gap-2 p-3 border-t bg-gray-50">
        <Input
          type="text"
          placeholder={isExecuting ? 'Processing...' : placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isTyping || isExecuting}
          className="flex-1 h-9 text-sm"
        />
        <Button
          size="sm"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isTyping || isExecuting}
          className="h-9 px-3"
        >
          {isExecuting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </>
  )

  return (
    <BaseNodeWrapper
      id={id}
      selected={selected}
      data={data}
      isReadOnly={isReadOnly}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
      Icon={MessageCircle}
      iconColor="bg-blue-500"
      collapsedWidth="180px"
      expandedWidth="320px"
      headerInfo={headerInfo}
      expandedContent={expandedContent}
      showInputHandle={true}
      showOutputHandle={true}
      inputHandleColor="!bg-blue-500"
      outputHandleColor="!bg-green-500"
    />
  )
}

ChatInterfaceNode.displayName = 'ChatInterfaceNode'
