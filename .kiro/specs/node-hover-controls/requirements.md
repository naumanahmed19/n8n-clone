# Requirements Document

## Introduction

This feature will add interactive hover controls to workflow nodes, specifically trigger type nodes, that display execution and management options similar to n8n's interface. When users hover over trigger nodes, they will see small control buttons for executing the node and enabling/disabling the node, providing quick access to common node operations without needing to open context menus or property panels.

## Requirements

### Requirement 1

**User Story:** As a workflow developer, I want to see execution controls when hovering over trigger nodes, so that I can quickly execute individual nodes for testing without navigating through menus.

#### Acceptance Criteria

1. WHEN a user hovers over a trigger type node THEN the system SHALL display a small play button overlay on the node
2. WHEN a user clicks the play button THEN the system SHALL execute only that specific trigger node
3. WHEN a trigger node is currently executing THEN the play button SHALL be replaced with a loading indicator
4. WHEN a trigger node execution completes THEN the system SHALL show the execution result and return the play button to its normal state
5. IF a trigger node execution fails THEN the system SHALL display an error indicator and show the error details on hover

### Requirement 2

**User Story:** As a workflow developer, I want to quickly enable or disable nodes through hover controls, so that I can easily manage which nodes are active in my workflow without opening property panels.

#### Acceptance Criteria

1. WHEN a user hovers over any node THEN the system SHALL display a disable/enable toggle button
2. WHEN a user clicks the disable button on an enabled node THEN the system SHALL disable the node and update its visual state
3. WHEN a user clicks the enable button on a disabled node THEN the system SHALL enable the node and update its visual state
4. WHEN a node is disabled THEN the system SHALL display it with reduced opacity and a disabled visual indicator
5. WHEN a node state changes THEN the system SHALL persist the enabled/disabled state with the workflow data

### Requirement 3

**User Story:** As a workflow developer, I want hover controls to appear smoothly and intuitively, so that the interface feels responsive and doesn't interfere with my workflow editing experience.

#### Acceptance Criteria

1. WHEN a user hovers over a node THEN the control buttons SHALL appear with a smooth fade-in animation
2. WHEN a user moves the mouse away from a node THEN the control buttons SHALL disappear with a smooth fade-out animation
3. WHEN control buttons are visible THEN they SHALL be positioned consistently relative to the node without overlapping important node content
4. WHEN multiple nodes are close together THEN the hover controls SHALL not interfere with each other or cause visual conflicts
5. WHEN a user is dragging a node THEN the hover controls SHALL not appear or interfere with the drag operation

### Requirement 4

**User Story:** As a workflow developer, I want hover controls to be visually distinct and accessible, so that I can easily identify and interact with them regardless of the node's current state or theme.

#### Acceptance Criteria

1. WHEN hover controls are displayed THEN they SHALL have sufficient contrast against the node background for visibility
2. WHEN a control button is interactive THEN it SHALL provide visual feedback on hover (color change, scale, etc.)
3. WHEN a control button is disabled or unavailable THEN it SHALL be visually distinguished with appropriate styling
4. WHEN controls are displayed THEN they SHALL include tooltips explaining their function
5. WHEN the interface uses different themes THEN the hover controls SHALL adapt their styling to maintain visibility and consistency

### Requirement 5

**User Story:** As a workflow developer, I want hover controls to only appear on appropriate node types, so that the interface remains clean and relevant controls are shown for each node type.

#### Acceptance Criteria

1. WHEN hovering over trigger type nodes THEN the system SHALL display both play and disable/enable controls
2. WHEN hovering over action type nodes THEN the system SHALL display only the disable/enable control
3. WHEN hovering over condition or logic nodes THEN the system SHALL display only the disable/enable control
4. WHEN hovering over output or webhook nodes THEN the system SHALL display appropriate controls based on their execution capabilities
5. IF a node type doesn't support individual execution THEN the system SHALL not display the play button for that node

### Requirement 6

**User Story:** As a workflow developer, I want hover controls to integrate with the existing execution system, so that individual node execution works seamlessly with the overall workflow execution infrastructure.

#### Acceptance Criteria

1. WHEN a user executes a single node via hover controls THEN the system SHALL use the same execution engine as full workflow execution
2. WHEN a single node is executing THEN the system SHALL update the node's visual status to show execution progress
3. WHEN single node execution completes THEN the system SHALL store the execution result for display in execution panels
4. WHEN a workflow is currently executing THEN individual node execution controls SHALL be disabled to prevent conflicts
5. WHEN single node execution produces output THEN the system SHALL make this data available for inspection and debugging