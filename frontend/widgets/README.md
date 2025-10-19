# N8n Widgets

This folder contains embeddable widgets that allow users to integrate n8n functionality into their websites.

## Available Widgets

### 🎯 Form Widget

Embed n8n forms on any website without iframes.

**Location:** `widgets/form/`

**Build Command:**

```bash
npm run build:widget
```

**Quick Start:**

```bash
cd widgets/form
npx http-server -p 8080 -c-1
```

Open: http://localhost:8080/examples/simple.html

**Documentation:** [widgets/form/examples/QUICK_START.md](form/examples/QUICK_START.md)

---

### 🚀 Future Widgets

- **Chat Widget** - Coming soon
- **Notification Widget** - Coming soon
- **Data Display Widget** - Coming soon

## Widget Structure

Each widget follows this structure:

```
widgets/
└── [widget-name]/
    ├── dist/              # Built widget files (generated)
    │   ├── n8n-[widget].umd.js
    │   └── n8n-[widget].es.js
    └── examples/          # Usage examples and documentation
        ├── simple.html
        ├── README.md
        └── QUICK_START.md
```

Source code is in `src/widgets/[widget-name]/`

## Development

### Building a Widget

```bash
# Build all widgets
npm run build:widget

# Future: Build specific widget
npm run build:widget:form
npm run build:widget:chat
```

### Adding a New Widget

1. Create source folder: `src/widgets/[widget-name]/`
2. Create output folders: `widgets/[widget-name]/dist/` and `widgets/[widget-name]/examples/`
3. Add build config in `vite.config.widget.[name].ts`
4. Add build script to `package.json`
5. Create examples and documentation

## Distribution

Widgets are standalone bundles that can be:

- Uploaded to CDN
- Served from static hosting
- Embedded via `<script>` tags
- Imported as ES modules

Each widget is self-contained with no external dependencies needed on the client side.
