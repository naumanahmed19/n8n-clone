# How to Access the Widget File

This guide explains all the ways to access `/n8n-form-widget.umd.js` in different environments.

## 🎯 Quick Answer

The widget location depends on your environment:

| Environment             | URL                                                          |
| ----------------------- | ------------------------------------------------------------ |
| **Standalone Server**   | `http://localhost:8080/dist/n8n-form-widget.umd.js`          |
| **Frontend Dev Server** | `http://localhost:3000/widgets/form/n8n-form-widget.umd.js`  |
| **Production**          | `https://yourdomain.com/widgets/form/n8n-form-widget.umd.js` |

---

## 📦 Development Access Methods

### Method 1: Standalone HTTP Server (Recommended)

**Best for:** Testing widget examples independently

```bash
cd frontend/widgets/form
npx http-server -p 8080 -c-1 --cors
```

**Access:**

- Widget: `http://localhost:8080/dist/n8n-form-widget.umd.js`
- Examples: `http://localhost:8080/examples/simple.html`

**In HTML:**

```html
<!-- Relative path in examples -->
<script src="../dist/n8n-form-widget.umd.js"></script>

<!-- Or absolute URL -->
<script src="http://localhost:8080/dist/n8n-form-widget.umd.js"></script>
```

**Pros:**

- ✅ Simple and isolated
- ✅ No dependency on other services
- ✅ Easy to share examples

**Cons:**

- ❌ Separate server to manage
- ❌ Need to restart after widget rebuild

---

### Method 2: Frontend Dev Server

**Best for:** Testing widget integration with main app

```bash
# Step 1: Build widget and copy to public directory
cd frontend
npm run build:widget:dev

# Step 2: Start frontend dev server
npm run dev
```

**Access:**

- Widget: `http://localhost:3000/widgets/form/n8n-form-widget.umd.js`
- Frontend: `http://localhost:3000`

**In HTML:**

```html
<script src="http://localhost:3000/widgets/form/n8n-form-widget.umd.js"></script>
```

**Pros:**

- ✅ Single server (port 3000)
- ✅ Integrated with main app
- ✅ Uses same domain (no CORS issues with frontend)

**Cons:**

- ❌ Need to run `npm run build:widget:dev` after each widget change
- ❌ Tied to frontend dev server

---

### Method 3: Helper Script (Auto Port Selection)

**Best for:** When port 8080 might be in use

```bash
cd frontend
npm run serve:widget
```

**Access:**

- Automatically uses port 8080 or 8081
- Shows correct URLs in terminal

**Pros:**

- ✅ Auto-detects available ports
- ✅ Shows all URLs clearly
- ✅ Reminds about CORS settings

---

## 🌐 Production Access

### Option A: Upload to CDN

1. **Build the widget:**

   ```bash
   cd frontend
   npm run build:widget
   ```

2. **Upload to CDN:**
   Upload `frontend/widgets/form/dist/n8n-form-widget.umd.js` to:

   - AWS S3 + CloudFront
   - Cloudflare
   - Azure CDN
   - Vercel
   - Netlify

3. **Use in HTML:**
   ```html
   <script src="https://cdn.yourdomain.com/widgets/form/n8n-form-widget.umd.js"></script>
   ```

### Option B: Serve from Your Server

1. **Build the widget:**

   ```bash
   npm run build:widget
   ```

2. **Copy to server:**

   ```bash
   # Copy entire folder
   cp -r widgets/form/dist /var/www/html/widgets/form/
   ```

3. **Configure Nginx/Apache:**

   ```nginx
   location /widgets/ {
       alias /var/www/html/widgets/;
       add_header Access-Control-Allow-Origin *;
   }
   ```

4. **Use in HTML:**
   ```html
   <script src="https://yourdomain.com/widgets/form/n8n-form-widget.umd.js"></script>
   ```

---

## 🔧 File Structure Reference

After building, here's where files are located:

```
frontend/
├── widgets/form/dist/              # ← Built widget (source)
│   └── n8n-form-widget.umd.js
│
├── public/widgets/form/            # ← Copy for dev server (if using Method 2)
│   └── n8n-form-widget.umd.js
│
└── widgets/form/examples/          # ← Examples reference ../dist/
    └── simple.html
```

---

## 🚀 Quick Commands Reference

```bash
# Build widget
npm run build:widget

# Build widget + copy to public (for frontend dev server)
npm run build:widget:dev

# Serve examples (standalone)
npm run serve:widget

# Or manually
cd widgets/form
npx http-server -p 8080 -c-1 --cors
```

---

## ❓ Common Questions

### Q: Do I need to rebuild after changing widget code?

**A:** Yes, run `npm run build:widget` after any changes to `src/widgets/form/`

### Q: Do I need to rebuild when form ID changes?

**A:** No! The widget is dynamic. Just change the form ID in your HTML.

### Q: Can I use a CDN URL in development?

**A:** Yes, but you'll need proper CORS headers from the CDN.

### Q: Why use relative paths in examples?

**A:** So examples work regardless of which server you use.

### Q: Can I serve from multiple ports?

**A:** Yes, just make sure backend CORS allows all ports you use.

---

## 🔐 CORS Configuration

Backend must allow the origin serving the widget:

```typescript
// backend/src/index.ts
cors({
  origin: [
    "http://localhost:3000", // Frontend
    "http://localhost:8080", // Standalone server
    "http://localhost:8081", // Alternative port
    "https://yourdomain.com", // Production
  ],
  credentials: true,
});
```

---

## 📚 Related Documentation

- [QUICK_START.md](QUICK_START.md) - Getting started guide
- [README.md](README.md) - Detailed widget documentation
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Common issues and solutions
- [../README.md](../../README.md) - Main widgets documentation
