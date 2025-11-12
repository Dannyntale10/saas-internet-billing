import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import fs from 'fs'

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`
    }
    return msg
  })
)

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),
]

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  )

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  )

  // API access log
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    })
  )
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: {
    service: 'saas-wifi-billing',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
})

// Helper methods for structured logging
export const logRequest = (req: any, res: any, responseTime: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    role: req.user?.role,
  }

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData)
  } else {
    logger.info('HTTP Request', logData)
  }
}

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  })
}

export const logDatabaseQuery = (query: string, duration: number, params?: any) => {
  if (duration > 1000) {
    logger.warn('Slow database query', {
      query,
      duration: `${duration}ms`,
      params,
    })
  } else {
    logger.debug('Database query', {
      query,
      duration: `${duration}ms`,
    })
  }
}

export const logActivity = (activity: {
  userId: string
  action: string
  entityType: string
  entityId?: string
  description: string
  metadata?: any
}) => {
  logger.info('User activity', {
    userId: activity.userId,
    action: activity.action,
    entityType: activity.entityType,
    entityId: activity.entityId,
    description: activity.description,
    metadata: activity.metadata,
  })
}

export const logPayment = (payment: {
  id: string
  userId: string
  amount: number
  method: string
  status: string
  transactionId?: string
}) => {
  logger.info('Payment processed', {
    paymentId: payment.id,
    userId: payment.userId,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    transactionId: payment.transactionId,
  })
}

export const logSecurityEvent = (event: {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  ip?: string
  userId?: string
  metadata?: any
}) => {
  const logLevel = event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warn'
  logger[logLevel]('Security event', {
    type: event.type,
    severity: event.severity,
    message: event.message,
    ip: event.ip,
    userId: event.userId,
    metadata: event.metadata,
  })
}

export default logger

