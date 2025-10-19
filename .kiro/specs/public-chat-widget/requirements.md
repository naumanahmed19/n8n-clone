# Requirements Document

## Introduction

This feature enables users to create embeddable public chat widgets from Chat Interface nodes in their workflows. Following the existing public form widget pattern, users will be able to embed interactive chat interfaces on any website using a simple script tag, allowing visitors to engage in AI-powered conversations that trigger workflow executions. The implementation will use the existing sample-chat-widget.js as a foundation and integrate with the current Chat Interface node system.

## Glossary

- **Chat_Widget_System**: The complete system that enables embedding chat interfaces on external websites
- **Chat_Interface_Node**: The existing workflow node that provides interactive chat functionality within the workflow editor
- **Public_Chat_Widget**: The embeddable JavaScript widget that renders a floating chat bubble and popup interface on external websites
- **Widget_Bundle**: The compiled JavaScript file containing the chat widget code and dependencies, similar to n8n-form-widget.umd.js
- **Host_Website**: Any external website where the chat widget is embedded
- **Chat_Session**: A conversation instance between a visitor and the AI system through the widget
- **Chat_Bubble**: The floating circular button that opens the chat interface when clicked
- **Chat_Popup**: The expandable chat interface that displays messages and input field
- **API_Endpoint**: Backend routes that handle chat widget requests and message processing

## Requirements

### Requirement 1

**User Story:** As a workflow creator, I want to generate embeddable chat widget code from my Chat Interface node, so that I can deploy interactive chat experiences on any website.

#### Acceptance Criteria

1. THE Chat_Interface_Node SHALL include a "Chat URL" parameter that uses the WebhookUrlGenerator component to generate unique public chat identifiers
2. THE Chat_Interface_Node SHALL include a "Widget Embed Code" parameter that uses the WidgetEmbedGenerator component to display ready-to-copy embed code
3. THE Chat_Widget_System SHALL generate embed code that includes a script tag pointing to the chat widget bundle with the unique chat identifier
4. WHERE the workflow is deactivated, THE Chat_Widget_System SHALL return HTTP 403 error responses for the corresponding chat widget endpoint
5. THE WidgetEmbedGenerator component SHALL depend on the chatUrl parameter to generate the correct embed code with the chat identifier

### Requirement 2

**User Story:** As a website owner, I want to embed a chat widget on my website using a simple script tag, so that visitors can interact with AI-powered conversations without complex integration.

#### Acceptance Criteria

1. THE Public_Chat_Widget SHALL initialize automatically when the widget script is loaded and create a floating Chat_Bubble in the bottom-right corner
2. WHEN a visitor clicks the Chat_Bubble, THE Public_Chat_Widget SHALL display the Chat_Popup with message history and input field
3. WHEN a visitor types a message and presses enter or clicks send, THE Public_Chat_Widget SHALL POST the message to /api/public/chats/:chatId/message endpoint
4. THE Public_Chat_Widget SHALL display user messages immediately in the chat interface with right-aligned styling
5. WHEN the workflow execution completes, THE Public_Chat_Widget SHALL display the AI response message with left-aligned styling in the chat interface

### Requirement 3

**User Story:** As a website visitor, I want to engage in natural conversations through the embedded chat widget, so that I can get assistance or information through an intuitive interface.

#### Acceptance Criteria

1. THE Public_Chat_Widget SHALL display a floating Chat_Bubble with a message icon that is always visible on the Host_Website
2. WHEN the visitor clicks the Chat_Bubble, THE Public_Chat_Widget SHALL expand to show a Chat_Popup with message history and input controls
3. THE Public_Chat_Widget SHALL support both Enter key and Send button for message submission
4. THE Public_Chat_Widget SHALL automatically scroll to the latest message when new messages are added
5. THE Public_Chat_Widget SHALL provide a close button to collapse the Chat_Popup back to the Chat_Bubble

### Requirement 4

**User Story:** As a developer, I want the chat widget to work seamlessly across different websites and frameworks, so that I can integrate it into various web technologies without compatibility issues.

#### Acceptance Criteria

1. THE Public_Chat_Widget SHALL function on websites using any JavaScript framework or no framework using vanilla JavaScript
2. THE Public_Chat_Widget SHALL use scoped CSS classes and inline styles to prevent conflicts with Host_Website styling
3. THE Public_Chat_Widget SHALL be responsive and adapt to mobile devices by expanding to full screen on small screens
4. THE Public_Chat_Widget SHALL handle CORS requests properly for cross-domain communication with the backend API
5. THE Public_Chat_Widget SHALL provide configuration options through data attributes or JavaScript initialization parameters

### Requirement 5

**User Story:** As a system administrator, I want the chat widget to handle errors gracefully and provide secure communication, so that the system remains stable and protected against malicious use.

#### Acceptance Criteria

1. WHEN network errors occur, THE Public_Chat_Widget SHALL display error messages in the chat interface as system messages
2. THE Chat_Widget_System SHALL validate all incoming messages for length limits and content format following the same pattern as public forms
3. THE Chat_Widget_System SHALL implement rate limiting using the same configuration as public form submissions
4. WHEN the backend workflow is not available or inactive, THE Chat_Widget_System SHALL return HTTP 404 or 403 error responses
5. THE Chat_Widget_System SHALL execute workflows using the ExecutionService.executeWorkflow method with the chat node as the trigger

### Requirement 6

**User Story:** As a system integrator, I want the chat widget to follow the same backend API pattern as public forms, so that it integrates seamlessly with the existing workflow execution system.

#### Acceptance Criteria

1. THE Chat_Widget_System SHALL implement GET /api/public/chats/:chatId endpoint to fetch chat configuration from active workflows
2. THE Chat_Widget_System SHALL search through active workflows to find chat nodes with matching chatUrl parameter
3. THE Chat_Widget_System SHALL implement POST /api/public/chats/:chatId/message endpoint to handle message submissions
4. WHEN a message is submitted, THE Chat_Widget_System SHALL update the chat node's userMessage parameter and execute the workflow using ExecutionService
5. THE Chat_Widget_System SHALL return the workflow execution result as the AI response to the chat widget

### Requirement 7

**User Story:** As a workflow creator, I want to customize the appearance and behavior of my chat widget, so that it matches my brand and provides the desired user experience.

#### Acceptance Criteria

1. THE Chat_Interface_Node SHALL provide configuration parameters for chatTitle, chatDescription, placeholderText, and welcomeMessage
2. THE Chat_Interface_Node SHALL include configuration options for widget theme colors and positioning
3. THE Public_Chat_Widget SHALL read these configuration values from the GET /api/public/chats/:chatId endpoint response
4. WHERE custom configuration is specified, THE Public_Chat_Widget SHALL apply the configured title, colors, and positioning to the chat interface
5. THE Public_Chat_Widget SHALL display the configured welcome message when the chat popup is first opened

### Requirement 8

**User Story:** As a developer, I want the chat widget to be built and deployed following the same pattern as the form widget, so that it integrates consistently with the existing infrastructure.

#### Acceptance Criteria

1. THE Chat_Widget_System SHALL create a chat widget bundle using Vite configuration similar to the form widget build process
2. THE Chat_Widget_System SHALL output a compiled JavaScript file (n8n-chat-widget.umd.js) that can be hosted on CDNs
3. THE Public_Chat_Widget SHALL initialize automatically when loaded and scan for data attributes or initialization parameters
4. THE Chat_Widget_System SHALL support both auto-initialization via data attributes and manual initialization via JavaScript API
5. THE Public_Chat_Widget SHALL follow the same CORS and security patterns as the existing form widget implementation