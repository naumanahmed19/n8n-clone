# Widget Troubleshooting Guide

## Common Issues and Solutions

### ❌ CORS Error: "Access-Control-Allow-Origin" blocked

**Error:**
```
Access to XMLHttpRequest at 'http://localhost:4000/api/...' from origin 'null' 
has been blocked by CORS policy
```

**Causes:**
1. Opening HTML file directly (`file://` protocol)
2. Origin not allowed in backend CORS settings

**Solutions:**

#### Solution 1: Use HTTP Server (Recommended)
Don't open HTML files directly. Always serve them via HTTP:

```bash
cd frontend/widgets/form
npx http-server -p 8080 -c-1 --cors
```

Then open: http://localhost:8080/examples/simple.html

#### Solution 2: Check Backend CORS Settings
Ensure backend allows the origin in `backend/src/index.ts`:

```typescript
cors({
  origin: [
    "http://localhost:3000",  // Frontend
    "http://localhost:8080",  // Widget examples
    "http://127.0.0.1:8080",  // Alternative
  ],
  credentials: true,
})
```

#### Solution 3: Restart Backend
After changing CORS settings:

```bash
cd backend
npm run dev
```

---

### ❌ Widget Not Loading

**Symptoms:**
- Blank page
- No form appears
- Console errors

**Solutions:**

#### Check 1: Widget Built?
```bash
cd frontend
npm run build:widget
```

Verify: `frontend/widgets/form/dist/n8n-form-widget.umd.js` exists

#### Check 2: Correct Script Path
In your HTML:
```html
<!-- ✅ Correct (relative path) -->
<script src="../dist/n8n-form-widget.umd.js"></script>

<!-- ❌ Wrong (absolute path without server) -->
<script src="/dist/n8n-form-widget.umd.js"></script>
```

#### Check 3: Form ID Valid?
Ensure the form ID exists and workflow is activated:
```html
<div data-n8n-form="YOUR-ACTUAL-FORM-ID" ...></div>
```

#### Check 4: API Running?
Verify backend is running on port 4000:
```bash
curl http://localhost:4000/health
```

---

### ❌ Form Not Submitting

**Symptoms:**
- Form displays but submission fails
- Error: "Network Error" or "404 Not Found"

**Solutions:**

#### Check 1: API URL Correct
```html
<div data-n8n-form="YOUR-FORM-ID" 
     data-api-url="http://localhost:4000/api"></div>
```

#### Check 2: Workflow Activated
The workflow containing the Form Generator node must be activated.

#### Check 3: Form Endpoint Exists
Test the endpoint:
```bash
curl http://localhost:4000/api/public/forms/YOUR-FORM-ID
```

Should return form configuration JSON.

---

### ❌ 404 Error on Widget Script

**Error:**
```
GET http://localhost:8080/dist/n8n-form-widget.umd.js 404 (Not Found)
```

**Solutions:**

#### Solution 1: Check Working Directory
When running http-server, make sure you're in the right folder:

```bash
# ✅ Correct
cd frontend/widgets/form
npx http-server -p 8080

# ❌ Wrong (from frontend root)
cd frontend
npx http-server -p 8080  # Widget not in this folder
```

#### Solution 2: Check Relative Path
From `examples/simple.html`, the path should be:
```html
<script src="../dist/n8n-form-widget.umd.js"></script>
```

Not:
```html
<script src="dist/n8n-form-widget.umd.js"></script>  <!-- ❌ Missing ../ -->
```

---

### ❌ Network Error in Console

**Error:**
```
AxiosError: Network Error
```

**Solutions:**

#### Check 1: Backend Running
```bash
cd backend
npm run dev
```

Should show: `Server running on port 4000`

#### Check 2: API URL Accessible
In browser, try: http://localhost:4000/health

Should return JSON with status "ok"

#### Check 3: Firewall/Antivirus
Some security software blocks localhost connections. Temporarily disable to test.

---

### ❌ Widget Shows Old Data

**Symptoms:**
- Changes not reflected
- Old form fields appear

**Solutions:**

#### Solution 1: Hard Refresh
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

#### Solution 2: Disable Cache
When running http-server:
```bash
npx http-server -p 8080 -c-1  # -c-1 disables cache
```

#### Solution 3: Rebuild Widget
```bash
cd frontend
npm run build:widget
```

#### Solution 4: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

---

## Quick Diagnostics Checklist

Use this checklist to diagnose issues:

- [ ] Backend is running on port 4000
- [ ] Widget is built (`widgets/form/dist/` exists)
- [ ] Using HTTP server (not opening file directly)
- [ ] CORS allows the origin
- [ ] Form ID is correct
- [ ] Workflow is activated
- [ ] API URL is correct
- [ ] Browser console shows no errors

## Getting Help

If issues persist:

1. **Check browser console** (F12) for error messages
2. **Check backend logs** for API errors
3. **Test API directly** with curl or Postman
4. **Verify all services running**:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend (optional)
   cd frontend && npm run dev
   
   # Terminal 3: Widget Examples
   cd frontend/widgets/form && npx http-server -p 8080 -c-1
   ```

## Development vs Production

### Development Setup
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:3000`
- Widget Examples: `http://localhost:8080`

### Production Setup
- Backend: `https://api.yourdomain.com`
- Widget: `https://cdn.yourdomain.com/widgets/form/dist/n8n-form-widget.umd.js`
- Update CORS to allow your production domains

---

**Still having issues?** Check the main documentation:
- [QUICK_START.md](../examples/QUICK_START.md)
- [README.md](../examples/README.md)
