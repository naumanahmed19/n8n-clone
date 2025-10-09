/**
 * Chat Interface Node Usage Examples
 * 
 * This file contains various usage examples for the Chat Interface Node
 */

// ============================================================================
// Example 1: Basic Chat Interface
// ============================================================================

export const basicChatExample = {
  id: 'chat-basic',
  type: 'chatInterface',
  position: { x: 250, y: 100 },
  data: {
    label: 'Simple Chat',
    nodeType: 'chatInterface',
    placeholder: 'Type your message...',
    disabled: false,
    parameters: {},
  },
}

// ============================================================================
// Example 2: Chat with Initial Messages
// ============================================================================

export const chatWithHistoryExample = {
  id: 'chat-history',
  type: 'chatInterface',
  position: { x: 250, y: 100 },
  data: {
    label: 'Customer Support',
    nodeType: 'chatInterface',
    model: 'GPT-4',
    placeholder: 'How can we help?',
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Welcome to our support center! How can I assist you today?',
        timestamp: new Date('2025-10-09T10:00:00'),
      },
      {
        id: '2',
        role: 'user',
        content: 'I need help with my account',
        timestamp: new Date('2025-10-09T10:01:00'),
      },
      {
        id: '3',
        role: 'assistant',
        content: 'I\'d be happy to help you with your account. What specific issue are you experiencing?',
        timestamp: new Date('2025-10-09T10:01:30'),
      },
    ],
    disabled: false,
    parameters: {
      systemPrompt: 'You are a helpful customer support representative.',
    },
  },
}

// ============================================================================
// Example 3: Multi-Node Workflow with Chat Interface
// ============================================================================

export const chatWorkflowExample = {
  nodes: [
    // Input Data Node
    {
      id: 'input-1',
      type: 'input',
      position: { x: 50, y: 100 },
      data: {
        label: 'User Context',
        nodeType: 'input',
        disabled: false,
        parameters: {
          contextData: {
            userId: '12345',
            preferences: 'technical support',
          },
        },
      },
    },
    // Chat Interface Node
    {
      id: 'chat-1',
      type: 'chatInterface',
      position: { x: 300, y: 100 },
      data: {
        label: 'AI Assistant',
        nodeType: 'chatInterface',
        model: 'GPT-4',
        systemPrompt: 'You are a technical support specialist.',
        placeholder: 'Describe your issue...',
        disabled: false,
        parameters: {
          temperature: 0.7,
          maxTokens: 2000,
        },
      },
    },
    // Output Processing Node
    {
      id: 'output-1',
      type: 'output',
      position: { x: 650, y: 100 },
      data: {
        label: 'Save Conversation',
        nodeType: 'output',
        disabled: false,
        parameters: {
          destination: 'database',
        },
      },
    },
  ],
  edges: [
    {
      id: 'e1-2',
      source: 'input-1',
      target: 'chat-1',
      type: 'default',
    },
    {
      id: 'e2-3',
      source: 'chat-1',
      target: 'output-1',
      type: 'default',
    },
  ],
}

// ============================================================================
// Example 4: Different Chat Personas
// ============================================================================

export const chatPersonasExample = {
  nodes: [
    // Friendly Assistant
    {
      id: 'chat-friendly',
      type: 'chatInterface',
      position: { x: 50, y: 50 },
      data: {
        label: 'Friendly Helper',
        nodeType: 'chatInterface',
        model: 'GPT-3.5',
        systemPrompt: 'You are a friendly and encouraging assistant who loves to help people.',
        placeholder: 'Ask me anything! 😊',
        disabled: false,
        parameters: {},
      },
    },
    // Technical Expert
    {
      id: 'chat-technical',
      type: 'chatInterface',
      position: { x: 50, y: 250 },
      data: {
        label: 'Technical Expert',
        nodeType: 'chatInterface',
        model: 'GPT-4',
        systemPrompt: 'You are a senior software engineer who provides detailed technical explanations.',
        placeholder: 'Ask technical questions...',
        disabled: false,
        parameters: {},
      },
    },
    // Creative Writer
    {
      id: 'chat-creative',
      type: 'chatInterface',
      position: { x: 50, y: 450 },
      data: {
        label: 'Creative Writer',
        nodeType: 'chatInterface',
        model: 'GPT-4',
        systemPrompt: 'You are a creative writer who helps with storytelling and content creation.',
        placeholder: 'Let\'s create something amazing...',
        disabled: false,
        parameters: {},
      },
    },
  ],
}

// ============================================================================
// Example 5: Conditional Chat Routing
// ============================================================================

export const conditionalChatExample = {
  nodes: [
    // Initial Chat
    {
      id: 'chat-initial',
      type: 'chatInterface',
      position: { x: 100, y: 200 },
      data: {
        label: 'General Support',
        nodeType: 'chatInterface',
        model: 'GPT-3.5',
        placeholder: 'How can we help?',
        disabled: false,
        parameters: {},
      },
    },
    // Router Node
    {
      id: 'router-1',
      type: 'router',
      position: { x: 400, y: 200 },
      data: {
        label: 'Route by Intent',
        nodeType: 'router',
        disabled: false,
        parameters: {},
      },
    },
    // Technical Support Chat
    {
      id: 'chat-technical',
      type: 'chatInterface',
      position: { x: 650, y: 100 },
      data: {
        label: 'Technical Support',
        nodeType: 'chatInterface',
        model: 'GPT-4',
        systemPrompt: 'You are a technical support specialist.',
        disabled: false,
        parameters: {},
      },
    },
    // Sales Chat
    {
      id: 'chat-sales',
      type: 'chatInterface',
      position: { x: 650, y: 300 },
      data: {
        label: 'Sales Support',
        nodeType: 'chatInterface',
        model: 'GPT-4',
        systemPrompt: 'You are a sales representative.',
        disabled: false,
        parameters: {},
      },
    },
  ],
  edges: [
    { id: 'e1-2', source: 'chat-initial', target: 'router-1' },
    { id: 'e2-3', source: 'router-1', target: 'chat-technical', label: 'technical' },
    { id: 'e2-4', source: 'router-1', target: 'chat-sales', label: 'sales' },
  ],
}

// ============================================================================
// Example 6: Chat with Real-time Features
// ============================================================================

export const realtimeChatExample = {
  id: 'chat-realtime',
  type: 'chatInterface',
  position: { x: 250, y: 100 },
  data: {
    label: 'Real-time AI Chat',
    nodeType: 'chatInterface',
    model: 'GPT-4',
    systemPrompt: 'You are a helpful assistant with access to real-time data.',
    placeholder: 'Ask me about current information...',
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I can help you with current information and real-time data. What would you like to know?',
        timestamp: new Date(),
      },
    ],
    disabled: false,
    parameters: {
      enableStreaming: true,
      temperature: 0.8,
      maxTokens: 3000,
      functions: ['get_current_time', 'get_weather', 'search_web'],
    },
  },
}

// ============================================================================
// Export all examples
// ============================================================================

export const allExamples = {
  basic: basicChatExample,
  withHistory: chatWithHistoryExample,
  workflow: chatWorkflowExample,
  personas: chatPersonasExample,
  conditional: conditionalChatExample,
  realtime: realtimeChatExample,
}

export default allExamples
