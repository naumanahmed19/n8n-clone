#!/bin/bash

# Script to build Docker images using alternative registries when Docker Hub is unavailable

echo "Building n8n-clone with alternative registry..."

# Default to Docker China mirror
REGISTRY=${1:-"registry.docker-cn.com/library"}

echo "Using registry: $REGISTRY"

# Export build arguments
export BASE_IMAGE="$REGISTRY/node:22-alpine"

# Build with the specified registry
docker-compose build --build-arg BASE_IMAGE="$BASE_IMAGE"

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "To start services, run: docker-compose up"
else
    echo "Build failed. Trying with Alibaba Cloud mirror..."
    
    # Try with Alibaba Cloud mirror
    export BASE_IMAGE="registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine"
    docker-compose build --build-arg BASE_IMAGE="$BASE_IMAGE"
    
    if [ $? -eq 0 ]; then
        echo "Build successful with Alibaba Cloud mirror!"
        echo "To start services, run: docker-compose up"
    else
        echo "Build failed with both mirrors. Please check your network connection."
    fi
fi