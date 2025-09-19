// Main entry point for the n8n clone backend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import { workflowRoutes } from './routes/workflows';
import { executionRoutes } from './routes/executions';
import { nodeRoutes } from './routes/nodes';
import { authRoutes } from './routes/auth';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'n8n-clone-backend',
    version: '1.0.0'
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'n8n Clone Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      workflows: '/api/workflows',
      executions: '/api/executions',
      nodes: '/api/nodes',
      health: '/health'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/nodes', nodeRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints:`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - Workflows: http://localhost:${PORT}/api/workflows`);
  console.log(`   - Executions: http://localhost:${PORT}/api/executions`);
  console.log(`   - Nodes: http://localhost:${PORT}/api/nodes`);
});

export default app;