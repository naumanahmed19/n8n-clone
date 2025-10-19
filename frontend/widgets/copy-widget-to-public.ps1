# Copy Widget to Public Directory
# This makes the widget accessible via the frontend dev server at http://localhost:3000/widgets/form/

Write-Host "📦 Copying widget to public directory..." -ForegroundColor Green

# Get the frontend root directory (parent of widgets/)
$frontendRoot = Split-Path -Parent $PSScriptRoot

# Create public/widgets/form directory if it doesn't exist
$publicDir = Join-Path $frontendRoot "public/widgets/form"
if (-Not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

# Copy widget files from widgets/form/dist to public/widgets/form
$sourceDir = Join-Path $PSScriptRoot "form/dist/*"
Copy-Item -Path $sourceDir -Destination $publicDir -Recurse -Force

Write-Host "✅ Widget copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Widget is now accessible at:" -ForegroundColor Cyan
Write-Host "  → http://localhost:3000/widgets/form/n8n-form-widget.umd.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Test page: http://localhost:3000/widget-test.html" -ForegroundColor Gray
