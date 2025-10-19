# Widget Quick Start Guide

## 📦 Build the Widget

```bash
cd frontend
npm run build:widget
```

Output: `frontend/widgets/form/dist/n8n-form-widget.umd.js`

## 📁 Folder Structure

```
frontend/
├── widgets/
│   └── form/              # Form widget
│       ├── dist/          # Built widget files (generated)
│       │   ├── n8n-form-widget.umd.js  # For <script> tags
│       │   └── n8n-form-widget.es.js   # For ES modules
│       └── examples/      # Usage examples
│           ├── simple.html     # Basic example (start here!)
│           ├── widget-demo.html    # All 3 initialization methods
│           ├── example-production.html # Production template
│           ├── README.md       # Detailed documentation
│           └── QUICK_START.md  # This file
└── src/widgets/
    └── form/              # Widget source code
        ├── index.tsx      # Main widget class
        └── PublicFormWidget.tsx # React component
```

## 🚀 Quick Usage

### Step 1: Get Your Form ID
1. Open Form Generator node in your workflow
2. Activate the workflow
3. Copy the Form ID from the "Widget Embed Code" tab

### Step 2: Embed the Widget
Add this to your HTML:

```html
<div data-n8n-form="YOUR-FORM-ID" 
     data-api-url="http://localhost:4000/api"></div>
<script src="http://yourdomain.com/n8n-form-widget.umd.js"></script>
```

### Step 3: Access the Widget File

There are multiple ways to access the widget depending on your setup:

#### Option A: Via Standalone HTTP Server (Recommended for testing)
```bash
cd frontend/widgets/form
npx http-server -p 8080 -c-1 --cors
```
- Widget URL: `http://localhost:8080/dist/n8n-form-widget.umd.js`
- Examples: `http://localhost:8080/examples/simple.html`

#### Option B: Via Frontend Dev Server
```bash
# 1. Build widget and copy to public
cd frontend
npm run build:widget:dev

# 2. Start frontend dev server
npm run dev
```
- Widget URL: `http://localhost:3000/widgets/form/n8n-form-widget.umd.js`
- Frontend: `http://localhost:3000`

#### Option C: Via Helper Script
```bash
cd frontend
npm run serve:widget
```
Automatically finds available port (8080 or 8081)

**Important:** Backend must allow the port in CORS settings. See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) if you get CORS errors.

## 🌐 Production Deployment

1. **Build the widget:**
   ```bash
   npm run build:widget
   ```

2. **Upload to CDN or static server:**
   - Upload `widgets/form/dist/n8n-form-widget.umd.js`
   - Get the public URL (e.g., `https://cdn.yourdomain.com/widgets/form/n8n-form-widget.umd.js`)

3. **Update environment variables:**
   ```bash
   # .env.production
   VITE_WIDGET_URL=https://cdn.yourdomain.com
   VITE_API_URL=https://api.yourdomain.com/api
   ```

4. **Use in your HTML:**
   ```html
   <div data-n8n-form="YOUR-FORM-ID" 
        data-api-url="https://api.yourdomain.com/api"></div>
   <script src="https://cdn.yourdomain.com/n8n-form-widget.umd.js"></script>
   ```

## 🎨 Customization Options

```html
<div data-n8n-form="YOUR-FORM-ID" 
     data-api-url="http://localhost:4000/api"
     data-theme="light"
     data-on-success="handleSuccess"
     data-on-error="handleError"></div>

<script>
  function handleSuccess(response) {
    console.log('Form submitted!', response);
    // Redirect, show message, etc.
  }
  
  function handleError(error) {
    console.error('Form error:', error);
  }
</script>
```

## 📝 Examples Included

- **simple.html** - Minimal example to get started
- **widget-demo.html** - Shows all 3 initialization methods
- **example-production.html** - Production-ready template

## 🔧 Troubleshooting

**Widget not loading?**
- Check browser console for errors
- Verify the script URL is correct
- Make sure API URL is accessible

**Form not appearing?**
- Verify form ID is correct
- Check that workflow is activated
- Ensure API is running

**CORS errors?**
- Check backend CORS settings
- API must allow requests from your domain

## 💡 Tips

- Use **simple.html** for quick testing
- The widget has NO dependencies - it bundles everything
- Works with any hosting (WordPress, Shopify, static sites, etc.)
- No iframes = Better SEO, responsive, and faster loading
