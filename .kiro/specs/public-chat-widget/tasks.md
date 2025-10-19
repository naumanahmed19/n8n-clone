# Implementation Plan

- [x] 1. Set up chat widget build infrastructure





  - Create Vite configuration for chat widget bundle (vite.config.chat-widget.ts)
  - Add build script to package.json for chat widget compilation
  - Set up output directory structure for chat widget distribution files
  - _Requirements: 8.1, 8.2_

- [x] 2. Extend Chat Interface Node with public widget parameters






  - [x] 2.1 Add chatUrl parameter with WebhookUrlGenerator component to Chat Interface Node





    - Modify backend/src/nodes/Chat/ChatNode.ts to include chatUrl property
    - Configure WebhookUrlGenerator component with urlType: "chat"
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.2 Add widgetEmbedCode parameter with WidgetEmbedGenerator component


    - Add widgetEmbedCode property that depends on chatUrl parameter
    - Configure WidgetEmbedGenerator with widgetType: "chat"
    - _Requirements: 1.2, 1.3_
  
  - [x] 2.3 Add chat widget configuration parameters


    - Add chatTitle, chatDescription, welcomeMessage, placeholderText parameters
    - Add widgetTheme, widgetPosition, bubbleColor, headerColor parameters
    - _Requirements: 7.1, 7.2_

- [x] 3. Create backend API routes for public chat widgets





  - [x] 3.1 Implement GET /api/public/chats/:chatId endpoint


    - Create backend/src/routes/public-chats.ts following public-forms.ts pattern
    - Search active workflows for chat nodes with matching chatUrl parameter
    - Return chat configuration including title, theme, colors, and settings
    - _Requirements: 6.1, 6.2_
  
  - [x] 3.2 Implement POST /api/public/chats/:chatId/message endpoint


    - Handle message submission and validation (max 1000 characters)
    - Update chat node's userMessage parameter with submitted message
    - Execute workflow using ExecutionService.executeWorkflow method
    - Return AI response from workflow execution result
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [x] 3.3 Add rate limiting for chat endpoints


    - Configure rate limits: 30 requests/minute for chat fetch, 10 messages/minute for submissions
    - Use same rate limiting pattern as public forms
    - _Requirements: 5.3_

- [x] 4. Create PublicChatWidget React component





  - [x] 4.1 Implement chat bubble UI component


    - Create floating chat bubble with message icon
    - Position bubble based on widgetPosition configuration
    - Apply custom bubbleColor from chat configuration
    - Handle click events to toggle chat popup visibility
    - _Requirements: 2.1, 2.2, 3.1_
  
  - [x] 4.2 Implement chat popup interface


    - Create expandable chat popup with header, message area, and input controls
    - Display chat title and description from configuration
    - Show welcome message when chat first opens
    - Apply custom headerColor and theme styling
    - _Requirements: 2.2, 3.2, 7.4_
  
  - [x] 4.3 Implement message handling and display


    - Create message list component with user and AI message bubbles
    - Handle message input with Enter key and Send button support
    - Display typing indicators during message processing
    - Auto-scroll to latest messages
    - _Requirements: 2.3, 2.4, 2.5, 3.3, 3.4_
  
  - [x] 4.4 Implement API communication


    - Fetch chat configuration from GET /api/public/chats/:chatId
    - Send messages to POST /api/public/chats/:chatId/message
    - Handle loading states and error responses
    - Display error messages as system messages in chat
    - _Requirements: 2.3, 5.1, 5.4_
-

- [x] 5. Create N8nChatWidget wrapper class




  - [x] 5.1 Implement widget initialization and lifecycle methods


    - Create N8nChatWidget class with init(), destroy(), and update() methods
    - Handle both manual initialization and auto-detection of data attributes
    - Mount React component using ReactDOM.createRoot
    - _Requirements: 4.1, 8.3_
  
  - [x] 5.2 Implement auto-initialization functionality


    - Scan DOM for elements with data-n8n-chat attributes on page load
    - Extract configuration from data attributes (chatId, apiUrl, theme, position)
    - Initialize chat widgets automatically for each found element
    - _Requirements: 8.3, 8.4_
  
  - [x] 5.3 Add configuration and callback support


    - Support configuration options: chatId, apiUrl, theme, position
    - Implement callback functions: onMessage, onResponse, onError
    - Handle theme detection and application (light/dark/auto)
    - _Requirements: 4.5, 7.3, 7.4_

- [x] 6. Enhance WidgetEmbedGenerator for chat widgets





  - [x] 6.1 Extend WidgetEmbedGenerator component to support chat widgets


    - Add widgetType prop to distinguish between form and chat widgets
    - Generate chat-specific embed code with data-n8n-chat attributes
    - Update embed code templates for chat widget script URL
    - _Requirements: 1.3, 1.5_
  
  - [x] 6.2 Create chat widget embed code templates


    - Generate auto-initialization embed code with data attributes
    - Generate manual initialization code with JavaScript API
    - Include configuration options for theme, position, and callbacks
    - _Requirements: 1.3, 8.4_

- [ ] 7. Implement responsive design and mobile support
  - [ ] 7.1 Add mobile-responsive chat interface
    - Expand chat popup to full screen on mobile devices (max-width: 768px)
    - Ensure touch-friendly button sizes and input controls
    - Optimize message display for small screens
    - _Requirements: 4.3_
  
  - [ ] 7.2 Implement theme support and style isolation
    - Create scoped CSS classes to prevent conflicts with host website
    - Support light, dark, and auto theme detection
    - Apply theme classes to chat widget container
    - _Requirements: 4.2, 7.3_

- [ ] 8. Add comprehensive error handling
  - [ ] 8.1 Implement frontend error handling
    - Handle network errors, chat not found, and workflow inactive scenarios
    - Display user-friendly error messages in chat interface
    - Implement retry mechanisms for transient failures
    - _Requirements: 5.1, 5.4_
  
  - [ ] 8.2 Add backend error responses and validation
    - Validate message length and format before processing
    - Return appropriate HTTP status codes for different error scenarios
    - Log errors for monitoring and debugging purposes
    - _Requirements: 5.2, 5.5_

- [ ] 9. Create comprehensive test suite
  - [ ] 9.1 Write unit tests for widget components
    - Test N8nChatWidget class initialization and lifecycle methods
    - Test PublicChatWidget React component rendering and interactions
    - Test message handling, API communication, and error scenarios
    - _Requirements: All_
  
  - [ ] 9.2 Write integration tests for backend API
    - Test chat configuration retrieval and workflow lookup
    - Test message processing and workflow execution
    - Test rate limiting and error handling
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 9.3 Create end-to-end testing scenarios
    - Test complete chat flow from widget initialization to AI response
    - Test embed code generation and widget deployment
    - Test cross-browser compatibility and mobile responsiveness
    - _Requirements: All_

- [ ] 10. Create documentation and examples
  - [ ] 10.1 Create widget deployment documentation
    - Document embed code generation process
    - Provide examples for different website types (WordPress, static HTML, React)
    - Document configuration options and customization
    - _Requirements: 1.2, 1.3, 7.1, 7.2_
  
  - [ ] 10.2 Create demo and example files
    - Create local development demo HTML file
    - Create production-ready example with different configurations
    - Document troubleshooting common issues
    - _Requirements: 8.4, 8.5_