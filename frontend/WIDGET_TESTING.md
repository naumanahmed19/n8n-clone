# Testing Widget in Main React App

Instead of running multiple servers, you can test the widget directly in your main React app at `http://localhost:3000`.

## 🚀 Quick Setup

### Step 1: Build Widget and Copy to Public

```bash
cd frontend
npm run build:widget:dev
```

This will:

1. Build the widget to `widgets/form/dist/`
2. Copy it to `public/widgets/form/`

### Step 2: Start Frontend Dev Server

```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Step 3: Access the Widget

The widget is now available at:

```
http://localhost:3000/widgets/form/n8n-form-widget.umd.js
```

## 📝 Create a Test Page

Create a new page in your React app to test the widget:

**`frontend/src/pages/WidgetTest.tsx`**

```tsx
import { useEffect } from "react";

export default function WidgetTest() {
  useEffect(() => {
    // Widget auto-initializes from data attributes
    console.log("Widget test page loaded");
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Widget Test Page</h1>

      {/* Widget will render here automatically */}
      <div
        data-n8n-form="5689ad2d-5029-4a10-822c-89f12c0c384e"
        data-api-url="http://localhost:4000/api"
        data-theme="light"
      />

      {/* Load widget script */}
      <script src="/widgets/form/n8n-form-widget.umd.js" />
    </div>
  );
}
```

Or use a simpler HTML approach in `public/widget-test.html`:

**`frontend/public/widget-test.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Widget Test</title>
    <style>
      body {
        font-family: system-ui;
        max-width: 800px;
        margin: 40px auto;
        padding: 20px;
      }
    </style>
  </head>
  <body>
    <h1>🧪 Widget Test Page</h1>

    <div
      data-n8n-form="5689ad2d-5029-4a10-822c-89f12c0c384e"
      data-api-url="http://localhost:4000/api"
      data-theme="light"
    ></div>

    <script src="/widgets/form/n8n-form-widget.umd.js"></script>
  </body>
</html>
```

## 🎯 Access Test Page

After running `npm run dev`:

```
http://localhost:3000/widget-test.html
```

## ✅ Benefits

- ✅ Single server (port 3000)
- ✅ No CORS issues (same origin)
- ✅ No need for multiple terminals
- ✅ Hot reload works
- ✅ Easy debugging

## 🔄 Workflow

1. **Make widget changes** in `src/widgets/form/`
2. **Rebuild**: `npm run build:widget:dev`
3. **Refresh browser**: `Ctrl+Shift+R`
4. **See changes**

## 📚 All-in-One Commands

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend + Widget
cd frontend
npm run build:widget:dev  # Build widget first
npm run dev               # Start frontend
```

That's it! Only 2 terminals needed. 🚀
