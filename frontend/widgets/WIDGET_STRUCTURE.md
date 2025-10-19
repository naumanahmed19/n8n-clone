# Widget Folder Structure

## ✅ New Structure (Organized by Widget Type)

```
frontend/
├── src/
│   └── widgets/           # Widget source code
│       └── form/          # Form widget source
│           ├── index.tsx              # Main widget class
│           ├── PublicFormWidget.tsx   # React component
│           └── widget-styles.css      # Widget styles
│
├── widgets/               # Built widgets & examples
│   ├── README.md          # Main widgets documentation
│   └── form/              # Form widget distribution
│       ├── dist/          # Built files (generated)
│       │   ├── n8n-form-widget.umd.js    # UMD bundle (1.4 MB)
│       │   ├── n8n-form-widget.es.js     # ES module
│       │   └── *.js.map                  # Source maps
│       └── examples/      # Usage examples
│           ├── simple.html           # Basic example
│           ├── widget-demo.html      # All methods demo
│           ├── example-production.html
│           ├── README.md             # Detailed docs
│           └── QUICK_START.md        # Quick reference
│
├── vite.config.widget.ts  # Widget build configuration
├── serve-widget-examples.ps1  # PowerShell script to serve examples
└── package.json           # Updated with widget scripts
```

## 🎯 Benefits of New Structure

### 1. **Scalable for Multiple Widgets**
```
widgets/
├── form/          # Form widget
├── chat/          # Future: Chat widget
└── notification/  # Future: Notification widget
```

### 2. **Self-Contained Widget Packages**
Each widget folder contains:
- ✅ Built distribution files (`dist/`)
- ✅ Usage examples (`examples/`)
- ✅ Documentation (README files)

### 3. **Easy Distribution**
Upload entire `widgets/form/` folder to CDN:
```
https://cdn.yourdomain.com/widgets/form/dist/n8n-form-widget.umd.js
https://cdn.yourdomain.com/widgets/form/examples/simple.html
```

### 4. **Clear Separation**
- **Source code:** `src/widgets/form/`
- **Distribution:** `widgets/form/dist/`
- **Examples:** `widgets/form/examples/`

## 📦 Commands

### Build Form Widget
```bash
npm run build:widget
# or
npm run build:widget:form
```

Output: `widgets/form/dist/n8n-form-widget.umd.js`

### Serve Examples
```bash
npm run serve:widget
```

Opens: http://localhost:8080/examples/

### Manual Serve (Alternative)
```bash
cd widgets/form
npx http-server -p 8080 -c-1
```

## 🚀 Adding New Widgets

### Step 1: Create Source
```
src/widgets/
└── chat/
    ├── index.tsx
    └── PublicChatWidget.tsx
```

### Step 2: Create Distribution Structure
```
widgets/
└── chat/
    ├── dist/          # Will be generated
    └── examples/      # Add examples
```

### Step 3: Add Build Config
Create `vite.config.widget.chat.ts`:
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widgets/chat/index.tsx'),
      name: 'N8nChatWidget',
      fileName: (format) => `n8n-chat-widget.${format}.js`,
    },
    outDir: 'widgets/chat/dist',
  },
})
```

### Step 4: Add Build Script
```json
{
  "scripts": {
    "build:widget:chat": "vite build --config vite.config.widget.chat.ts"
  }
}
```

## 📝 Migration Summary

### Moved Files:
- ✅ `src/widget/*` → `src/widgets/form/`
- ✅ `examples/*` → `widgets/form/examples/`
- ✅ `dist-widget/*` → `widgets/form/dist/`

### Updated Files:
- ✅ `vite.config.widget.ts` - Updated paths
- ✅ `package.json` - Added new scripts
- ✅ All example HTML files - Updated script paths
- ✅ All README files - Updated documentation

### Cleaned Up:
- ❌ Removed `src/widget/` (old location)
- ❌ Removed `examples/` (old location)
- ❌ Removed `dist-widget/` (old location)
- ❌ Removed `public/` (unused)

## 🎨 Example Usage

After building, reference the widget:

```html
<!-- Local development -->
<script src="../dist/n8n-form-widget.umd.js"></script>

<!-- Production CDN -->
<script src="https://cdn.yourdomain.com/widgets/form/dist/n8n-form-widget.umd.js"></script>
```

## 📚 Documentation Locations

- **Main Widgets:** `widgets/README.md`
- **Form Widget Quick Start:** `widgets/form/examples/QUICK_START.md`
- **Form Widget Full Docs:** `widgets/form/examples/README.md`
- **This Document:** Explains the folder structure

## ✨ Next Steps

1. ✅ Build widget: `npm run build:widget`
2. ✅ Test examples: `npm run serve:widget`
3. ✅ Open: http://localhost:8080/examples/simple.html
4. 🚀 Deploy `widgets/form/dist/` to CDN
5. 📦 Add more widgets (chat, notification, etc.)
