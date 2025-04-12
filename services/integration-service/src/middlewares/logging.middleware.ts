import { Request, Response, NextFunction } from 'express';
import morgan, { StreamOptions } from 'morgan';
import winston from 'winston';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { appConfig } from '../config';

// Configure winston logger
export const logger = winston.createLogger({
  level: appConfig.logs.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'integration-service' },
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
if (appConfig.env === 'production') {
  const logDir = appConfig.logs.directory;
  
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'combined.log')
  }));
}

// Add request ID
export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

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
  if (appConfig.env === 'development') {
    const originalSend = res.send;
    
    logger.debug(`Request [${req.method}] ${req.originalUrl}`, {
      requestId: req.headers['x-request-id'],
      body: req.body,
      params: req.params,
      query: req.query
    });
    
    // Override res.send to log response body
    res.send = function (body: any): Response {
      logger.debug(`Response [${req.method}] ${req.originalUrl}`, {
        requestId: req.headers['x-request-id'],
        statusCode: res.statusCode,
        body: typeof body === 'string' ? body : JSON.stringify(body)
      });
      
      return originalSend.call(this, body);
    };
  }
  
  next();
};