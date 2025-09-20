# Design Document

## Overview

The node hover controls feature will add interactive controls to workflow nodes using ReactFlow's built-in NodeToolbar component, providing quick access to execution and management functions. This design focuses on trigger nodes (which can be executed individually) and all node types (which can be enabled/disabled). The implementation will extend the existing CustomNode component to include ReactFlow's NodeToolbar with custom toolbar buttons that integrate with the existing execution and workflow management systems.

## Architecture

### Component Structure

```
CustomNode (existing)
├── ReactFlow NodeToolbar (built-in)
│   ├── ExecuteToolbarButton (new)
│   └── DisableToggleToolbarButton (new)
└── Existing node content
```

### State Management

The ReactFlow NodeToolbar will integrate with the existing Zustand workflow store, utilizing:
- `executeWorkflow()` for individual node execution
- `updateNode()` for enabling/disabling nodes
- `executionState` for tracking execution status
- `getNodeExecutionResult()` for real-time execution feedback

### Event Flow

1. **Hover Detection**: ReactFlow NodeToolbar automatically handles show/hide on node hover
2. **Execute Action**: Click on play button → calls execution service for single node
3. **Disable Toggle**: Click on disable button → updates node state in workflow store
4. **Visual Feedback**: Real-time updates based on execution state and node status

## Components and Interfaces

### ReactFlow NodeToolbar Integration

ReactFlow's NodeToolbar component will be used with the following configuration:

```typescript
import { NodeToolbar } from 'reactflow'

// Usage within CustomNode
<NodeToolbar
  isVisible={data.nodeGroup?.includes('trigger') || true} // Show for all nodes
  position={Position.Top}
  offset={10}
>
  {/* Custom toolbar buttons */}
</NodeToolbar>
```

**Built-in Features:**
- Automatic hover detection and visibility management
- Proper positioning relative to nodes
- Smooth animations and transitions
- Accessibility support
- Responsive positioning based on viewport

### ExecuteToolbarButton Component

```typescript
interface ExecuteToolbarButtonProps {
  nodeId: string
  nodeType: string
  isExecuting: boolean
  canExecute: boolean
  onExecute: (nodeId: string) => void
}
```

**Responsibilities:**
- Display play icon or loading spinner based on execution state
- Handle click events for node execution
- Show appropriate tooltips ("Execute node", "Executing...", "Cannot execute")
- Only render for trigger-type nodes that support individual execution

### DisableToggleToolbarButton Component

```typescript
interface DisableToggleToolbarButtonProps {
  nodeId: string
  disabled: boolean
  onToggle: (nodeId: string, disabled: boolean) => void
}
```

**Responsibilities:**
- Display enable/disable icon based on current state
- Handle toggle functionality
- Show appropriate tooltips ("Disable node", "Enable node")
- Render for all node types

### Enhanced CustomNode Component

The existing CustomNode component will be extended with:

```typescript
interface CustomNodeData {
  // Existing properties...
  label: string
  nodeType: string
  parameters: Record<string, any>
  disabled: boolean
  status?: 'idle' | 'running' | 'success' | 'error'
  
  // New properties for node toolbar
  nodeGroup?: string[]
  canExecuteIndividually?: boolean
  executionResult?: NodeExecutionResult
}
```

## Data Models

### Node Execution Context

```typescript
interface SingleNodeExecutionRequest {
  nodeId: string
  workflowId: string
  inputData?: any
  parameters?: Record<string, any>
}

interface SingleNodeExecutionResult {
  nodeId: string
  status: 'success' | 'error' | 'running'
  data?: any
  error?: string
  startTime: number
  endTime?: number
  duration?: number
}
```

### Node Type Classification

```typescript
enum NodeExecutionCapability {
  TRIGGER = 'trigger',           // Can be executed individually (Manual Trigger, Webhook Trigger)
  ACTION = 'action',             // Cannot be executed individually (HTTP Request, Set)
  TRANSFORM = 'transform',       // Cannot be executed individually (JSON, Code)
  CONDITION = 'condition'        // Cannot be executed individually (IF, Switch)
}

interface NodeTypeMetadata {
  type: string
  group: string[]
  executionCapability: NodeExecutionCapability
  canExecuteIndividually: boolean
  canBeDisabled: boolean
}
```

## Error Handling

### Execution Errors

```typescript
interface NodeExecutionError {
  nodeId: string
  type: 'validation' | 'network' | 'timeout' | 'security' | 'unknown'
  message: string
  details?: any
  timestamp: number
}
```

**Error Scenarios:**
1. **Validation Errors**: Invalid node parameters or missing required fields
2. **Network Errors**: Failed HTTP requests or connectivity issues
3. **Timeout Errors**: Node execution exceeds configured timeout
4. **Security Errors**: Blocked requests or unauthorized access attempts
5. **Workflow State Errors**: Attempting to execute during full workflow execution

### Error Display Strategy

- **Immediate Feedback**: Show error icon in node toolbar with tooltip
- **Detailed Errors**: Display full error message in execution panel
- **Error Recovery**: Provide retry option for transient errors
- **Error Logging**: Log all execution errors for debugging

## Testing Strategy

### Unit Tests

1. **ExecuteToolbarButton Component**
   - Execute button functionality for trigger nodes
   - State transitions (idle → executing → complete/error)
   - Click handling and disabled states
   - Icon and tooltip updates

2. **DisableToggleToolbarButton Component**
   - Toggle functionality for all nodes
   - Visual state updates
   - Click handling and state management
   - Icon and tooltip updates

3. **CustomNode Integration**
   - ReactFlow NodeToolbar integration
   - Conditional button rendering based on node type
   - Event handling and callbacks

### Integration Tests

1. **Workflow Store Integration**
   - Node execution through hover controls
   - Node disable/enable functionality
   - Real-time status updates

2. **Execution Service Integration**
   - Single node execution requests
   - Error handling and recovery
   - Execution result processing

### End-to-End Tests

1. **User Interaction Flows**
   - Hover to reveal ReactFlow NodeToolbar
   - Execute trigger node via toolbar button
   - Disable/enable nodes via toolbar button
   - Keyboard navigation and accessibility

2. **Visual Regression Tests**
   - ReactFlow NodeToolbar integration
   - Custom button styling and positioning
   - Animation smoothness
   - Theme compatibility

## Implementation Details

### CSS/Styling Approach

Since we're using ReactFlow's NodeToolbar, we only need to style our custom buttons:

```scss
.toolbar-button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &.executing {
    background: #3b82f6;
    color: white;
    cursor: not-allowed;
  }
  
  &.disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }
  
  &.active {
    background: #10b981;
    color: white;
  }
}

// ReactFlow NodeToolbar comes with built-in styling
.react-flow__node-toolbar {
  display: flex;
  gap: 4px;
  // ReactFlow handles positioning, visibility, and animations
}
```

### Animation Strategy

ReactFlow's NodeToolbar handles toolbar animations automatically. We only need to handle:
- **Button Hover**: Scale up (1.0 → 1.1) over 150ms
- **State Changes**: Color transitions over 200ms
- **Loading States**: Smooth icon transitions for execute button

### Positioning Logic

ReactFlow's NodeToolbar handles positioning automatically with these options:

```typescript
import { Position } from 'reactflow'

// Available positions
Position.Top      // Above the node
Position.Bottom   // Below the node  
Position.Left     // Left of the node
Position.Right    // Right of the node

// Usage
<NodeToolbar
  position={Position.Top}
  offset={10} // Distance from node
  align="center" // Alignment relative to node
>
```

ReactFlow automatically handles viewport boundary detection and repositioning.

### Accessibility Implementation

```typescript
// Keyboard navigation support
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    // Allow tabbing through controls
    event.stopPropagation()
  }
  
  if (event.key === 'Enter' || event.key === ' ') {
    // Activate focused control
    event.preventDefault()
    handleControlActivation()
  }
  
  if (event.key === 'Escape') {
    // Hide controls
    setControlsVisible(false)
  }
}

// ARIA attributes - ReactFlow NodeToolbar handles toolbar-level accessibility
<NodeToolbar position={Position.Top}>
  <button
    className="toolbar-button"
    aria-label={`Execute ${nodeLabel}`}
    aria-disabled={!canExecute}
    title="Execute node"
  >
    {/* Execute button content */}
  </button>
  <button
    className="toolbar-button"
    aria-label={disabled ? `Enable ${nodeLabel}` : `Disable ${nodeLabel}`}
    title={disabled ? "Enable node" : "Disable node"}
  >
    {/* Disable toggle button content */}
  </button>
</NodeToolbar>
```

### Performance Considerations

1. **ReactFlow Optimization**: NodeToolbar is optimized by ReactFlow for performance
2. **Conditional Rendering**: Only render toolbar buttons based on node type
3. **Memoization**: Memoize button states and callbacks
4. **Event Handling**: Efficient event handling for button clicks
5. **Icon Optimization**: Use lightweight icons and avoid heavy animations

### Integration Points

1. **Workflow Store Methods**
   - `executeNode(nodeId: string, inputData?: any)` - New method for single node execution
   - `updateNode(nodeId: string, updates: Partial<WorkflowNode>)` - Existing method for disable/enable
   - `getNodeExecutionResult(nodeId: string)` - Existing method for status

2. **Execution Service Extensions**
   - Single node execution endpoint
   - Real-time status updates via WebSocket
   - Error handling and recovery

3. **Node Type Registry**
   - Classification of nodes by execution capability
   - Metadata for hover control visibility
   - Icon and color mappings

This design leverages ReactFlow's built-in NodeToolbar component to provide a robust foundation for implementing hover controls that enhance the user experience while maintaining consistency with ReactFlow patterns and the existing codebase architecture.