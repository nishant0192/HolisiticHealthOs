import { Request, Response, NextFunction } from 'express';
import morgan, { StreamOptions } from 'morgan';
import winston from 'winston';
import path from 'path';

// Configure winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || 'logs';
  
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'combined.log')
  }));
}

// Create a stream object for morgan
const stream: StreamOptions = {
  write: (message) => logger.info(message.trim())
};

// Create a middleware function for HTTP request logging
export const requestLogger = morgan(
  // Log format
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream }
);

// Create a middleware to log request/response bodies in development
export const detailedLogger = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    const originalSend = res.send;
    
    logger.debug(`Request [${req.method}] ${req.originalUrl}`, {
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers
    });
    
    // Override res.send to log response body
    res.send = function (body: any): Response {
      logger.debug(`Response [${req.method}] ${req.originalUrl}`, {
        statusCode: res.statusCode,
        body: typeof body === 'string' ? body : JSON.stringify(body)
      });
      
      return originalSend.call(this, body);
    };
  }
  
  next();
};

export { logger };