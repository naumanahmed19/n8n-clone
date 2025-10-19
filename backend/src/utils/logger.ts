import winston from 'winston'

// Enhanced logger configuration for Coolify deployment
const isProduction = process.env.NODE_ENV === 'production'
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

// Create enhanced format for production logging
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
)

// Create development format for local debugging
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

// Create logger instance with enhanced configuration
export const logger = winston.createLogger({
  level: logLevel,
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: { 
    service: 'n8n-clone-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [],
})

// Configure transports based on environment
if (isProduction) {
  // Production: Log to console for Coolify to capture
  logger.add(new winston.transports.Console({
    level: logLevel,
    handleExceptions: true,
    handleRejections: true
  }))
  
  // Optional file logging for persistent storage (if volumes are mounted)
  if (process.env.ENABLE_FILE_LOGGING === 'true') {
    logger.add(new winston.transports.File({ 
      filename: '/app/logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }))
    logger.add(new winston.transports.File({ 
      filename: '/app/logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }))
  }
} else {
  // Development: Console with colors and file logging
  logger.add(new winston.transports.Console())
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }))
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }))
}

export default logger