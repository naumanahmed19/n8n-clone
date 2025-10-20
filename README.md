# n8n-clone

A workflow automation platform similar to n8n, built with Node.js, TypeScript, and React.

## Features

- Visual workflow designer
- Support for multiple data sources
- Custom node creation
- Real-time execution monitoring
- REST API integration
- Database connectivity (PostgreSQL, MySQL, MongoDB)

## Prerequisites

- Node.js 18+
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 15+
- Redis 7+

## Quick Start

### Development Setup

1. Clone the repository:
   ```bash
   git clone &lt;repository-url&gt;
   cd n8n-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development servers:
   ```bash
   npm run dev
   ```

### Docker Setup

1. Build and start services:
   ```bash
   docker-compose up --build
   ```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Docker Build Arguments

The Docker build process now supports several build arguments that can be used to customize the build, especially useful when Docker Hub is unavailable:

### BASE_IMAGE
Specify an alternative base image for Node.js. This is useful when Docker Hub is unavailable or when you want to use a mirror.
```bash
BASE_IMAGE=registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine
```

### SOURCE_COMMIT
Specify the source commit for build tracking.
```bash
SOURCE_COMMIT=v1.0.0
```

### CORS_ORIGIN
Specify the CORS origin for the backend.
```bash
CORS_ORIGIN=https://yourdomain.com
```

### VITE_API_URL
Specify the API URL for the frontend.
```bash
VITE_API_URL=https://api.yourdomain.com
```

### Using Build Arguments

To use these build arguments, set them in your environment or pass them directly to docker-compose:

```bash
# Set environment variables
export BASE_IMAGE=registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine
docker-compose up --build

# Or pass directly
docker-compose build --build-arg BASE_IMAGE=registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine
docker-compose up
```

### Docker Hub Availability Issues

If you encounter Docker Hub availability issues (like the 503 Service Unavailable error), you can use alternative registries:

```bash
# Use Docker China mirror
npm run docker:build:mirror registry.docker-cn.com/library

# Use Alibaba Cloud mirror
npm run docker:build:mirror registry.cn-hangzhou.aliyuncs.com/aliyun-node

# On Windows PowerShell
npm run docker:build:mirror:ps
```

## Project Structure

- `backend/` - Node.js backend API with Express
- `frontend/` - React frontend with TypeScript
- `docs/` - Documentation and guides
- `scripts/` - Utility scripts for development and deployment

## Available Scripts

### Development
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:backend` - Start backend only
- `npm run dev:frontend` - Start frontend only

### Build
- `npm run build` - Build both frontend and backend
- `npm run build:backend` - Build backend only
- `npm run build:frontend` - Build frontend only

### Testing
- `npm run test` - Run tests for both frontend and backend
- `npm run test:backend` - Run backend tests only
- `npm run test:frontend` - Run frontend tests only

### Docker
- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:prod` - Start production environment with Docker
- `npm run docker:build:mirror` - Build Docker images using alternative registries (bash)
- `npm run docker:build:mirror:ps` - Build Docker images using alternative registries (PowerShell)

## Environment Variables

Copy `.env.example` to `.env` and adjust the values as needed:

```bash
cp .env.example .env
```

See `.env.example` for all available configuration options.

## Documentation

Detailed documentation can be found in the [docs](./docs) directory:

- [Custom Node Creation](./docs/create-custom-node)
- [Execution System](./docs/execution-system)
- [Node Development Guides](./docs/)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the GitHub repository.