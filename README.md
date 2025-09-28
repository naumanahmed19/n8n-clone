# n8n Clone - Workflow Automation Platform

A modern workflow automation platform built with React, Node.js, and TypeScript. Create visual workflows by connecting different services and APIs through a drag-and-drop interface.

## Features

- 🎨 Visual workflow editor with drag-and-drop interface
- 🔧 Extensible node system for custom integrations
- ⚡ Real-time execution monitoring with unified API
- 🎯 **Unified Execution System** - Single node and workflow executions use the same API
- 📊 Progress tracking for both single nodes and complete workflows
- 🔍 Complete execution details and output data visualization
- 🔒 Secure credential management
- 🐳 Docker-ready deployment
- 📊 Execution history and analytics
- 🔌 Custom node development kit

### ✨ Latest Improvements

**Unified Execution API** - Major system improvement delivering:

- **Single API Endpoint**: Both workflow and single node executions use `/api/executions`
- **Consistent Response Format**: Identical response structure with standard UUID execution IDs
- **Full Feature Parity**: Progress tracking, result viewing, and execution details for single nodes
- **Real Execution Logic**: Single node executions perform actual HTTP requests (no mock data)
- **Complete Output Data**: Frontend displays actual API response data in execution results

See `EXECUTION_SYSTEM_UNIFIED.md` for complete technical details.

## Tech Stack

**Frontend:**

- React 18 with TypeScript
- React Flow for visual workflow editor
- Zustand for state management
- Tailwind CSS for styling
- Vite for build tooling

**Backend:**

- Node.js with Express.js
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- Bull Queue with Redis
- Socket.io for real-time updates
- VM2 for secure JavaScript execution

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd n8n-clone
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development environment with Docker**

   ```bash
   npm run docker:dev
   ```

   Or run services individually:

   ```bash
   # Start database and Redis
   docker-compose -f docker-compose.dev.yml up postgres redis -d

   # Start backend
   npm run dev:backend

   # Start frontend (in another terminal)
   npm run dev:frontend
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Health check: http://localhost:4000/health

### Production Deployment

1. **Build and run with Docker Compose**

   ```bash
   npm run docker:prod
   ```

2. **Or build manually**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
n8n-clone/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── Dockerfile          # Production Docker image
│   └── Dockerfile.dev      # Development Docker image
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── prisma/         # Database schema
│   ├── Dockerfile          # Production Docker image
│   └── Dockerfile.dev      # Development Docker image
├── docker-compose.yml       # Production Docker Compose
├── docker-compose.dev.yml   # Development Docker Compose
└── package.json            # Root package.json (workspaces)
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend development server
- `npm run dev:backend` - Start only backend development server
- `npm run build` - Build both frontend and backend for production
- `npm run test` - Run tests for both frontend and backend
- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:prod` - Start production environment with Docker

## Development

### Adding New Features

1. Follow the implementation plan in `.kiro/specs/n8n-clone/tasks.md`
2. Create feature branches for each task
3. Write tests for new functionality
4. Update documentation as needed

### Custom Node Development

Custom nodes can be developed using the built-in node development kit. See the documentation for detailed instructions on creating and registering custom nodes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
