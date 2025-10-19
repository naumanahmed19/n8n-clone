# 🚀 Quick Start - Test Your Form Widget

Your form ID: `5689ad2d-5029-4a10-822c-89f12c0c384e`

## Step 1: Build the Widget

```bash
cd frontend
npm run build:widget
```

This will create `dist-widget/n8n-form-widget.umd.js`

## Step 2: Test Locally

### Option A: Open Demo File Directly

1. First, start a local dev server (widget needs to be served, not file://):

```bash
cd frontend
# Using Python (if installed)
python -m http.server 8080

# OR using Node (if you have http-server)
npx http-server -p 8080
```

2. Open in browser:
```
http://localhost:8080/widget-demo.html
```

### Option B: Use Vite Dev Server

While building the widget, you can serve it via Vite:

```bash
# Terminal 1: Keep frontend dev server running
cd frontend
npm run dev

# Terminal 2: Open the demo
# Navigate to: http://localhost:5173/widget-demo.html
```

## Step 3: Test the Widget

The demo page now includes **3 live instances** of your form:

1. **Method 1** - Auto-initialized with data attributes
2. **Method 2** - Manually initialized with callbacks  
3. **Method 3** - Your actual live form with theme toggle

All three should load your form and work identically!

## Step 4: Test Form Submission

1. Fill out any of the forms in the demo
2. Click Submit
3. Check:
   - Browser console for success/error messages
   - Backend terminal for API calls
   - The onSuccess callback should fire

## Expected Console Output

When widget loads successfully:
```
✅ N8n Form Widget loaded successfully
✅ Widget initialized with form ID: 5689ad2d-5029-4a10-822c-89f12c0c384e
```

When form is submitted:
```
✅ Form submitted successfully! {success: true, message: "...", executionId: "..."}
```

## Troubleshooting

### Widget not loading?
- Check that backend is running on port 4000
- Check browser console for errors
- Verify CORS is enabled on backend

### Form not displaying?
- Verify form ID is correct
- Check that workflow is activated
- Check Network tab for API response

### Submission not working?
- Check backend logs
- Verify workflow execution
- Check rate limiting settings

## Next Steps

Once working locally, you can:

1. **Deploy widget to production**
   ```bash
   # Copy to backend public folder
   cp dist-widget/* ../backend/public/widgets/
   
   # Or upload to CDN
   ```

2. **Use on any website**
   ```html
   <div data-n8n-form="5689ad2d-5029-4a10-822c-89f12c0c384e"></div>
   <script src="https://your-domain.com/n8n-form-widget.umd.js"></script>
   ```

3. **Customize styling** - The form inherits your Tailwind theme

## Test URLs

- **Original form page**: http://localhost:3000/form/5689ad2d-5029-4a10-822c-89f12c0c384e
- **Widget demo page**: http://localhost:8080/widget-demo.html (or 5173)
- **Production example**: http://localhost:8080/example-production.html

## What to Test

- ✅ Form loads correctly
- ✅ All fields render properly
- ✅ Validation works
- ✅ Submission succeeds
- ✅ Success/error messages display
- ✅ Callbacks fire correctly
- ✅ Multiple instances work
- ✅ Theme switching works
- ✅ Responsive on mobile
- ✅ No console errors

Happy testing! 🎉
