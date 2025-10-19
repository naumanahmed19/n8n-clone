# 🎨 N8n Form Widget - Embeddable Forms Without iframes

Turn your n8n forms into portable widgets that can be embedded on any website without using iframes.

## ✨ Features

- 🚀 **No iframes required** - Direct DOM integration
- 📱 **Fully responsive** - Adapts to any container size
- 🎨 **Theme support** - Light, dark, or auto mode
- 🔒 **Style isolation** - Won't conflict with your website's CSS
- ⚡ **Lightweight** - Optimized bundle size
- 🎯 **Easy integration** - Just one script tag
- 🔄 **Callbacks** - React to form submissions and errors
- 🌐 **Cross-origin ready** - Works on any domain

## 🚀 Quick Start

### 1. Build the Widget

```bash
cd frontend
npm run build:widget
```

This creates the widget files in `dist-widget/`:
- `n8n-form-widget.umd.js` - For script tag embedding
- `n8n-form-widget.es.js` - For module imports
- `n8n-form-widget.css` - Styles (auto-imported)

### 2. Deploy Widget Files

Copy the `dist-widget` files to your CDN or static file server:

```bash
# Example: Copy to public directory
cp -r dist-widget/* /path/to/public/widgets/

# Or serve from your backend
cp -r dist-widget/* ../backend/public/widgets/
```

### 3. Embed on Your Website

Choose one of three methods:

## 📝 Embedding Methods

### Method 1: Auto-Initialize (Simplest)

Just add a div with `data-n8n-form` attribute:

```html
<!-- Your webpage -->
<div data-n8n-form="YOUR_FORM_ID" 
     data-api-url="https://your-api.com/api"
     data-theme="light"></div>

<!-- Add the widget script -->
<script src="https://your-cdn.com/n8n-form-widget.umd.js"></script>
```

### Method 2: Manual Initialization

Use JavaScript for more control:

```html
<div id="my-form"></div>

<script src="https://your-cdn.com/n8n-form-widget.umd.js"></script>
<script>
  const widget = new window.N8nFormWidget();
  
  widget.init({
    formId: 'YOUR_FORM_ID',
    apiUrl: 'https://your-api.com/api',
    container: '#my-form',
    theme: 'auto',
    onSuccess: (data) => {
      console.log('Form submitted!', data);
      // Show custom success message
      alert('Thank you!');
    },
    onError: (error) => {
      console.error('Error:', error);
    }
  });
</script>
```

### Method 3: ES Module Import

For modern build tools:

```javascript
import { N8nFormWidget } from './n8n-form-widget.es.js';

const widget = new N8nFormWidget();
widget.init({
  formId: 'YOUR_FORM_ID',
  apiUrl: 'https://your-api.com/api',
  container: document.getElementById('form-container'),
  theme: 'auto'
});
```

## ⚙️ Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `formId` | string | ✅ Yes | - | Unique form ID from your workflow |
| `apiUrl` | string | No | Auto-detected | Your API endpoint URL |
| `container` | string \| HTMLElement | No | `#n8n-form-widget` | Container selector or element |
| `theme` | `'light'` \| `'dark'` \| `'auto'` | No | `'auto'` | Color theme mode |
| `onSuccess` | function | No | - | Callback on successful submission |
| `onError` | function | No | - | Callback on error |

## 🎯 Examples

### Contact Form with Custom Success Handler

```html
<div id="contact-form"></div>

<script src="https://your-cdn.com/n8n-form-widget.umd.js"></script>
<script>
  const widget = new window.N8nFormWidget();
  
  widget.init({
    formId: 'contact-form-123',
    container: '#contact-form',
    theme: 'light',
    onSuccess: (data) => {
      // Redirect to thank you page
      window.location.href = '/thank-you';
    },
    onError: (error) => {
      // Show custom error message
      document.getElementById('error-msg').textContent = error;
    }
  });
</script>
```

### Multiple Forms on Same Page

```html
<!-- Newsletter signup -->
<div data-n8n-form="newsletter-123" data-theme="light"></div>

<!-- Contact form -->
<div data-n8n-form="contact-456" data-theme="light"></div>

<script src="https://your-cdn.com/n8n-form-widget.umd.js"></script>
<!-- Both forms auto-initialize -->
```

### WordPress Integration

```php
<?php
// In your WordPress theme or plugin
function add_n8n_form_widget() {
  ?>
  <div data-n8n-form="<?php echo get_option('n8n_form_id'); ?>" 
       data-theme="auto"></div>
  
  <script src="<?php echo get_template_directory_uri(); ?>/js/n8n-form-widget.umd.js"></script>
  <?php
}
add_shortcode('n8n_form', 'add_n8n_form_widget');
?>
```

### React Integration

```jsx
import { useEffect, useRef } from 'react';

function MyComponent() {
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Dynamically load widget script
    const script = document.createElement('script');
    script.src = 'https://your-cdn.com/n8n-form-widget.umd.js';
    script.onload = () => {
      const widget = new window.N8nFormWidget();
      widget.init({
        formId: 'YOUR_FORM_ID',
        container: containerRef.current,
        theme: 'light'
      });
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return <div ref={containerRef} />;
}
```

## 🎨 Styling

The widget uses scoped CSS classes to prevent conflicts:

```css
/* Your website can override these if needed */
.n8n-form-widget {
  /* Widget container styles */
}

.n8n-form-widget[data-theme="light"] {
  /* Light theme overrides */
}

.n8n-form-widget[data-theme="dark"] {
  /* Dark theme overrides */
}
```

## 🔒 CORS Configuration

Make sure your backend allows requests from the domains where the widget will be embedded:

```javascript
// backend/src/index.ts
app.use(cors({
  origin: [
    'https://yourwebsite.com',
    'https://www.yourwebsite.com',
    'https://example.com'
  ],
  credentials: true
}));
```

## 📦 Production Deployment

### 1. Build for Production

```bash
npm run build:widget
```

### 2. Deploy to CDN

Upload `dist-widget/` files to your CDN:

```bash
# AWS S3 example
aws s3 sync dist-widget/ s3://your-bucket/widgets/ --acl public-read

# Or use any CDN (Cloudflare, Netlify, Vercel, etc.)
```

### 3. Update Form URLs

In your n8n workflows, update the webhook URLs to point to your production API.

## 🎯 Benefits vs iframes

| Feature | Widget | iframe |
|---------|--------|--------|
| SEO-friendly | ✅ Yes | ❌ No |
| Responsive height | ✅ Auto | ⚠️ Needs JS |
| Style isolation | ✅ Scoped CSS | ✅ Full |
| Load time | ✅ Fast | ⚠️ Slower |
| Parent page interaction | ✅ Easy | ⚠️ Limited |
| Cross-origin support | ✅ Yes | ✅ Yes |
| JavaScript access | ✅ Direct | ⚠️ postMessage |

## 🐛 Troubleshooting

### Widget not loading?

1. Check browser console for errors
2. Verify script URL is correct
3. Check CORS settings on your API

### Form not submitting?

1. Verify `formId` is correct
2. Check `apiUrl` points to your backend
3. Ensure form is active in workflow
4. Check network tab for API errors

### Styling conflicts?

The widget uses Tailwind CSS with scoped classes. If you have conflicts:

1. Use `data-theme` attribute to isolate themes
2. Add custom CSS with higher specificity
3. Check that parent container doesn't override styles

## 🔧 Development

### Local Development

```bash
# Terminal 1: Start backend
npm run dev --workspace=backend

# Terminal 2: Start frontend
npm run dev --workspace=frontend

# Terminal 3: Build widget in watch mode
cd frontend
npm run build:widget -- --watch
```

### Testing Widget

Open `widget-demo.html` in your browser:

```bash
cd frontend
python -m http.server 8080
# Visit http://localhost:8080/widget-demo.html
```

## 📚 API Reference

### N8nFormWidget Class

#### Methods

**`init(config: WidgetConfig): void`**
- Initializes and renders the widget

**`destroy(): void`**
- Unmounts and cleans up the widget

**`update(config: Partial<WidgetConfig>): void`**
- Updates widget configuration (re-renders)

#### Events

Use callbacks to respond to widget events:

```javascript
widget.init({
  formId: 'test',
  onSuccess: (data) => {
    // data.success, data.message, data.executionId
  },
  onError: (error) => {
    // error message string
  }
});
```

## 🚀 Next Steps

1. Build your workflow with Form Generator node
2. Activate the workflow and note the form ID
3. Build the widget: `npm run build:widget`
4. Deploy widget files to your CDN
5. Embed on your website using one of the methods above
6. Test and enjoy! 🎉

## 📄 License

MIT License - See main project LICENSE file
