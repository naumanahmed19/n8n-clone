import { ChatInterfaceNode } from '@/components/workflow/nodes'
import { ReactFlowProvider } from 'reactflow'
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'

// Define the node types mapping
const nodeTypes = {
  chatInterface: ChatInterfaceNode,
}

// Example initial nodes
const initialNodes: Node[] = [
  {
    id: 'chat-1',
    type: 'chatInterface',
    position: { x: 250, y: 100 },
    data: {
      label: 'AI Chat Assistant',
      nodeType: 'chatInterface',
      parameters: {
        model: 'GPT-4',
        systemPrompt: 'You are a helpful assistant.',
      },
      placeholder: 'Ask me anything...',
      disabled: false,
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Hello! How can I help you today?',
          timestamp: new Date(),
        },
      ],
    },
  },
]

const initialEdges: Edge[] = []

export function ChatInterfaceNodeDemo() {
  return (
    <div className="w-full h-screen">
      <ReactFlowProvider>
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

export default ChatInterfaceNodeDemo
