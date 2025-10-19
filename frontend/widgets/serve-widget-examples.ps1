# Serve Form Widget Examples
# Run this script to test the form widget examples locally

Write-Host "🚀 Starting Form Widget Example Server..." -ForegroundColor Green
Write-Host ""

# Check if port 8080 is available, otherwise use 8081
$port = 8080
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "⚠️  Port 8080 is in use, using port 8081 instead" -ForegroundColor Yellow
    $port = 8081
}

Write-Host "Examples will be available at:" -ForegroundColor Cyan
Write-Host "  → http://localhost:$port/examples/simple.html" -ForegroundColor Yellow
Write-Host "  → http://localhost:$port/examples/widget-demo.html" -ForegroundColor Yellow
Write-Host "  → http://localhost:$port/examples/example-production.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "📌 Make sure backend is running and allows port $port in CORS!" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Navigate to widgets/form directory and start server
Set-Location (Join-Path $PSScriptRoot "form")
npx http-server -p $port -c-1 --cors
