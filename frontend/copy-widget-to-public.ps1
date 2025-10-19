# Copy Widget to Public Directory
# This makes the widget accessible via the frontend dev server at http://localhost:3000/widgets/form/

Write-Host "📦 Copying widget to public directory..." -ForegroundColor Green

# Create public/widgets/form directory if it doesn't exist
$publicDir = "public/widgets/form"
if (-Not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

# Copy widget files
Copy-Item -Path "widgets/form/dist/*" -Destination $publicDir -Recurse -Force

Write-Host "✅ Widget copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Widget is now accessible at:" -ForegroundColor Cyan
Write-Host "  → http://localhost:3000/widgets/form/n8n-form-widget.umd.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Tip: Run this script after each widget build" -ForegroundColor Gray
