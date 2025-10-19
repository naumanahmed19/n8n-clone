import { createClient } from 'redis';
import { logger } from '../utils/logger';

// Redis client for health checks and general use
export const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
});

// Redis connection event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (error) => {
  logger.error('Redis client error:', error);
});

redisClient.on('end', () => {
  logger.info('Redis client connection closed');
});

// Initialize Redis connection
let isConnected = false;

async function initializeRedis() {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
      logger.info('Redis client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis client:', error);
    }
  }
}

// Health check function for Redis
export async function checkRedisConnection(): Promise<boolean> {
  try {
    if (!isConnected) {
      await initializeRedis();
    }
    
    if (isConnected) {
      await redisClient.ping();
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  try {
    if (isConnected) {
      await redisClient.quit();
      isConnected = false;
      logger.info('Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }
}

// Initialize Redis on module load
initializeRedis().catch((error) => {
  logger.error('Failed to initialize Redis on startup:', error);
});