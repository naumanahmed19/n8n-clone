# Implementation Plan

- [x] 1. Create toolbar button components





  - Create ExecuteToolbarButton component with play icon and loading states
  - Create DisableToggleToolbarButton component with enable/disable icons
  - Implement consistent button styling and hover effects
  - Add proper ARIA labels and tooltips for accessibility
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Implement node type classification system





  - Create utility function to determine if a node can be executed individually
  - Add node type metadata for execution capabilities (trigger vs action vs transform)
  - Implement logic to show/hide execute button based on node type
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
-

- [x] 3. Integrate ReactFlow NodeToolbar into CustomNode




  - Import and add ReactFlow NodeToolbar component to CustomNode
  - Configure toolbar positioning and visibility settings
  - Conditionally render toolbar buttons based on node type and capabilities
  - Ensure toolbar appears on hover and disappears when mouse leaves
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implement single node execution functionality





  - Create executeNode method in workflow store for individual node execution
  - Add API endpoint for single node execution in backend
  - Implement execution state tracking for individual nodes
  - Handle execution results and error states for single nodes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Implement node disable/enable functionality




  - Connect DisableToggleToolbarButton to existing updateNode workflow store method
  - Update node visual state when disabled/enabled
  - Persist node enabled/disabled state with workflow data
  - Handle disabled node styling and behavior
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Add visual feedback and state management





  - Implement loading states for execute button during node execution
  - Add success/error visual feedback after node execution
  - Update button states based on real-time execution results
  - Handle execution conflicts (disable individual execution during workflow execution)
  - _Requirements: 1.3, 1.4, 1.5, 6.4_

- [x] 7. Style toolbar buttons and ensure theme compatibility




  - Implement CSS styles for toolbar buttons with proper contrast
  - Add hover effects and state-based styling (executing, disabled, active)
  - Ensure buttons work with different themes and maintain visibility
  - Test button appearance against various node background colors
  - _Requirements: 4.1, 4.2, 4.3, 4.5_





- [ ] 8. Add keyboard accessibility and ARIA support

  - Implement keyboard navigation for toolbar buttons (Tab, Enter, Space)
  - Add proper ARIA labels and descriptions for screen readers


  - Ensure toolbar buttons are focusable and announce their state
  - Test with screen readers and keyboard-only navigation
  - _Requirements: 4.4_

- [x] 9. Implement error handling and user feedback



  - Add error display in toolbar buttons (error icon with tooltip)
  - Handle execution errors gracefully with user-friendly messages
  - Implement retry functionality for failed executions
  - Log execution errors for debugging while showing clean UI messages
  - _Requirements: 1.5_
-

- [x] 10. Add comprehensive tests for toolbar functionality




  - Write unit tests for ExecuteToolbarButton and DisableToggleToolbarButton components
  - Test node type classification and button visibility logic
  - Create integration tests for single node execution and disable/enable functionality
  - Add end-to-end tests for user interaction flows (hover, click, keyboard navigation)
  - _Requirements: All requirements validation_