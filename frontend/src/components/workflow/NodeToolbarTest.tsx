import React from 'react'
import { ReactFlowProvider } from 'reactflow'
import { CustomNode } from './CustomNode'

// Simple test component to verify NodeToolbar integration
export function NodeToolbarTest() {
  const testNodeData = {
    label: 'Test Manual Trigger',
    nodeType: 'Manual Trigger',
    parameters: {},
    disabled: false,
    status: 'idle' as const,
    icon: 'T',
    color: '#4CAF50'
  }

  const nodeProps = {
    id: 'test-node-1',
    data: testNodeData,
    selected: false,
    type: 'customNode',
    position: { x: 100, y: 100 },
    positionAbsolute: { x: 100, y: 100 },
    dragging: false,
    isConnectable: true,
    zIndex: 1,
    xPos: 100,
    yPos: 100
  }

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">NodeToolbar Integration Test</h2>
      <p className="mb-4">Hover over the node below to see the toolbar:</p>
      
      <ReactFlowProvider>
        <div className="border border-gray-300 p-4 bg-gray-50 relative" style={{ width: 300, height: 200 }}>
          <CustomNode {...nodeProps} />
        </div>
      </ReactFlowProvider>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Expected behavior:</p>
        <ul className="list-disc list-inside">
          <li>Hover over the node to see the toolbar appear above it</li>
          <li>Should show both Execute and Disable buttons for Manual Trigger</li>
          <li>Buttons should have proper tooltips and accessibility</li>
        </ul>
      </div>
    </div>
  )
}