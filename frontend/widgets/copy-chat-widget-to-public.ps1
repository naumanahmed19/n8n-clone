# Copy Chat Widget to Public Directory
# This makes the chat widget accessible via the frontend dev server at http://localhost:3000/widgets/chat/

Write-Host "Copying chat widget to public directory..." -ForegroundColor Green

# Get the frontend root directory (parent of widgets/)
$frontendRoot = Split-Path -Parent $PSScriptRoot

# Create public/widgets/chat directory if it doesn't exist
$publicDir = Join-Path $frontendRoot "public/widgets/chat"
if (-Not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

# Copy widget files from dist/chat to public/widgets/chat
$sourceDir = Join-Path $frontendRoot "dist/chat"

# Copy only the files we need, excluding nested widgets directory
Get-ChildItem -Path $sourceDir -File | Copy-Item -Destination $publicDir -Force

Write-Host "Chat widget copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Chat widget is now accessible at:" -ForegroundColor Cyan
Write-Host "  -> http://localhost:3000/widgets/chat/n8n-chat-widget.umd.js" -ForegroundColor Yellow