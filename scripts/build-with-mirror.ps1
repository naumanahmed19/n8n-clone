# Script to build Docker images using alternative registries when Docker Hub is unavailable

Write-Host "Building n8n-clone with alternative registry..."

# Default to Docker China mirror
param(
    [string]$Registry = "registry.docker-cn.com/library"
)

Write-Host "Using registry: $Registry"

# Set build arguments
$env:BASE_IMAGE = "$Registry/node:22-alpine"

# Build with the specified registry
docker-compose build --build-arg BASE_IMAGE="$env:BASE_IMAGE"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host "To start services, run: docker-compose up"
} else {
    Write-Host "Build failed. Trying with Alibaba Cloud mirror..." -ForegroundColor Yellow
    
    # Try with Alibaba Cloud mirror
    $env:BASE_IMAGE = "registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine"
    docker-compose build --build-arg BASE_IMAGE="$env:BASE_IMAGE"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build successful with Alibaba Cloud mirror!" -ForegroundColor Green
        Write-Host "To start services, run: docker-compose up"
    } else {
        Write-Host "Build failed with both mirrors. Please check your network connection." -ForegroundColor Red
    }
}