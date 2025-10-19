# Widget Examples

This folder contains example HTML files showing how to embed the N8n Form Widget.

## Files

- **widget-demo.html** - Development demo with 3 different initialization methods
- **example-production.html** - Production-ready example

## How to Use

### 1. Build the Widget

```bash
cd frontend
npm run build:widget
```

This creates the widget files in `frontend/widgets/form/dist/`:
- `n8n-form-widget.umd.js` - For `<script>` tags
- `n8n-form-widget.es.js` - For ES modules

### 2. Serve the Widget

Copy the built files to your static server or CDN. For development, you can serve from the dist-widget folder.

### 3. Run Examples

**Option A: Use http-server**
```bash
cd frontend
npx http-server -p 8080 -c-1
```
Then open: http://localhost:8080/examples/widget-demo.html

**Option B: Open directly in browser**
Open the HTML files in your browser (update script src to point to your widget location)

## Widget Embedding Methods

### Method 1: Auto-Initialization (Easiest)
```html
<div data-n8n-form="YOUR-FORM-ID" 
     data-api-url="http://localhost:4000/api"></div>
<script src="http://your-domain.com/n8n-form-widget.umd.js"></script>
```

### Method 2: Manual Initialization
```html
<div id="form-container"></div>
<script src="http://your-domain.com/n8n-form-widget.umd.js"></script>
<script>
  N8nFormWidget.init({
    formId: 'YOUR-FORM-ID',
    container: '#form-container',
    apiUrl: 'http://localhost:4000/api'
  });
</script>
```

### Method 3: ES Module
```html
<div id="form-container"></div>
<script type="module">
  import { N8nFormWidget } from 'http://your-domain.com/n8n-form-widget.es.js';
  N8nFormWidget.init({
    formId: 'YOUR-FORM-ID',
    container: '#form-container',
    apiUrl: 'http://localhost:4000/api'
  });
</script>
```

## Configuration

Update these values in the examples:
- `YOUR-FORM-ID` - Your actual form ID from the workflow
- `http://localhost:4000/api` - Your API URL
- Widget script URL - Point to where you're hosting the widget

## Production Deployment

1. Build the widget: `npm run build:widget`
2. Upload `dist-widget/n8n-form-widget.umd.js` to your CDN or static server
3. Update the script src in your HTML to point to the CDN URL
4. Update the `data-api-url` or `apiUrl` to your production API
