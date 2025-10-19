# 📸 Widget Tab - Visual Guide

## What Users See in Form Generator Node

### Step 1: Before Workflow Activation

```
┌─────────────────────────────────────────────────────────────┐
│ Form Generator Node Configuration                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Form Title: *                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Contact Us Form                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Form Description:                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Get in touch with us                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Form Fields:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ Email (string)                                        │ │
│ │ ✓ Message (textarea)                                    │ │
│ │ [+ Add Field]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Submit Button Text: *                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Send Message                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Widget Embed Code:                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️  Widget embed code will be available after          │ │
│ │     activating the workflow.                            │ │
│ │                                                          │ │
│ │     Save and activate this workflow to generate the     │ │
│ │     form ID and get the embed code.                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: After Workflow Activation

```
┌─────────────────────────────────────────────────────────────┐
│ Form Generator Node Configuration                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ... (other fields above) ...                               │
│                                                             │
│ Widget Embed Code:                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✨ Widget Mode: Embed this form on any website         │ │
│ │    without iframes! Choose from the methods below.      │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                          │ │
│ │  [Auto-Init] [Manual] [ES Module]                       │ │
│ │  ──────────                                              │ │
│ │                                                          │ │
│ │  Simple Auto-Initialize                                 │ │
│ │  Just add a div with data attributes. Auto-initializes  │ │
│ │  on page load.                                          │ │
│ │                                                          │ │
│ │  HTML Code                          [📋 Copy Code]      │ │
│ │  ┌────────────────────────────────────────────────────┐ │ │
│ │  │ <!-- Add this to your HTML -->                     │ │ │
│ │  │ <div data-n8n-form="5689ad2d..."                   │ │ │
│ │  │      data-api-url="http://..."                     │ │ │
│ │  │      data-theme="light"></div>                     │ │ │
│ │  │                                                     │ │ │
│ │  │ <!-- Add the widget script -->                     │ │ │
│ │  │ <script src="http://...widget.js"></script>       │ │ │
│ │  └────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │  ⚠️  Best for: Quick embeds, WordPress sites,          │ │
│ │      static pages                                       │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  Configuration Options                                  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │  formId      Your form ID (required)                    │ │
│ │  apiUrl      Backend API URL (optional)                 │ │
│ │  container   Selector or element (optional)             │ │
│ │  theme       'light', 'dark', or 'auto'                 │ │
│ │  onSuccess   Callback on success                        │ │
│ │  onError     Callback on error                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  ✨ Benefits vs iframes                                 │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │  ✓ Better SEO: Content directly in page DOM            │ │
│ │  ✓ Responsive: Auto-sizes to container                 │ │
│ │  ✓ Faster: No iframe overhead                          │ │
│ │  ✓ Native interactions: Smooth scrolling & focus       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [🔗 View Complete Widget Documentation]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Switching to Manual Tab

```
┌─────────────────────────────────────────────────────────────┐
│ Widget Embed Code:                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✨ Widget Mode: Embed this form on any website         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                          │ │
│ │  [Auto-Init] [Manual] [ES Module]                       │ │
│ │             ────────                                     │ │
│ │                                                          │ │
│ │  Manual Initialization                                  │ │
│ │  Full control with JavaScript. Add callbacks for        │ │
│ │  success/error handling.                                │ │
│ │                                                          │ │
│ │  HTML + JavaScript Code     [📋 Copy Code]              │ │
│ │  ┌────────────────────────────────────────────────────┐ │ │
│ │  │ <!-- Add container -->                             │ │ │
│ │  │ <div id="my-form"></div>                           │ │ │
│ │  │                                                     │ │ │
│ │  │ <!-- Load widget script -->                        │ │ │
│ │  │ <script src="...widget.js"></script>              │ │ │
│ │  │                                                     │ │ │
│ │  │ <!-- Initialize with JavaScript -->                │ │ │
│ │  │ <script>                                           │ │ │
│ │  │   const widget = new window.N8nFormWidget();      │ │ │
│ │  │                                                     │ │ │
│ │  │   widget.init({                                    │ │ │
│ │  │     formId: '5689ad2d...',                         │ │ │
│ │  │     apiUrl: 'http://...',                          │ │ │
│ │  │     container: '#my-form',                         │ │ │
│ │  │     theme: 'light',                                │ │ │
│ │  │     onSuccess: (data) => {                         │ │ │
│ │  │       console.log('Form submitted!', data);       │ │ │
│ │  │       alert('Thank you!');                        │ │ │
│ │  │     },                                             │ │ │
│ │  │     onError: (error) => {                          │ │ │
│ │  │       console.error('Error:', error);             │ │ │
│ │  │     }                                              │ │ │
│ │  │   });                                              │ │ │
│ │  │ </script>                                          │ │ │
│ │  └────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │  ⚠️  Best for: Custom success handling, analytics      │ │
│ │      tracking, redirects                                │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Copy Button Interaction

### Before Click

```
┌────────────────┐
│ 📋 Copy Code  │
└────────────────┘
```

### After Click (2 seconds)

```
┌────────────────┐
│ ✅ Copied!    │
└────────────────┘
```

## Actual Usage on Website

### User's Website HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Contact Us</title>
  </head>
  <body>
    <h1>Get in Touch</h1>

    <!-- User just pastes this code -->
    <div
      data-n8n-form="5689ad2d-5029-4a10-822c-89f12c0c384e"
      data-api-url="http://localhost:4000/api"
      data-theme="light"
    ></div>
    <script src="http://localhost:5173/n8n-form-widget.umd.js"></script>
  </body>
</html>
```

### Result in Browser

```
┌─────────────────────────────────────────┐
│  Get in Touch                           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Contact Us Form                   │ │
│  │ Get in touch with us              │ │
│  │                                   │ │
│  │ Email: *                          │ │
│  │ ┌───────────────────────────────┐ │ │
│  │ │ you@example.com               │ │ │
│  │ └───────────────────────────────┘ │ │
│  │                                   │ │
│  │ Message: *                        │ │
│  │ ┌───────────────────────────────┐ │ │
│  │ │                               │ │ │
│  │ │                               │ │ │
│  │ │                               │ │ │
│  │ └───────────────────────────────┘ │ │
│  │                                   │ │
│  │ [      Send Message      ]        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Key UI Elements

### Tabs

- **Auto-Init**: Simplest method (recommended for beginners)
- **Manual**: Full control (recommended for developers)
- **ES Module**: Modern frameworks (React, Vue, etc.)

### Code Block Features

- Read-only textarea
- Monospace font
- Syntax-style formatting
- Scroll for long code
- Select all on click

### Copy Button States

1. Default: "📋 Copy Code"
2. Clicked: "✅ Copied!" (green text)
3. After 2s: Back to default

### Alert Boxes

- **Blue**: Information (widget mode explanation)
- **Amber/Orange**: Usage recommendations ("Best for...")
- **Green**: Benefits list

### Cards

- **Main card**: Embed code with tabs
- **Reference card**: Configuration options
- **Benefits card**: Advantages over iframes

## Mobile Responsive

### On Mobile (< 768px)

```
┌───────────────────────┐
│ Widget Embed Code     │
├───────────────────────┤
│ ✨ Widget Mode        │
│ Embed without iframes │
├───────────────────────┤
│                       │
│ [Auto] [Manual] [ES]  │
│  ────                 │
│                       │
│ Simple Auto-Init      │
│ Just add a div...     │
│                       │
│ [Copy]                │
│ ┌───────────────────┐ │
│ │ <div data-n8n... │ │
│ │ ↓ Scroll          │ │
│ └───────────────────┘ │
│                       │
│ ⚠️ Best for: Quick   │
│    embeds            │
└───────────────────────┘
```

## Conclusion

The Widget Tab provides a **complete, self-service solution** for users to embed forms without ever leaving the node configuration. Everything they need is right there! 🎉
