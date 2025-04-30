import { Request, Response, NextFunction } from 'express';
import morgan, { FormatFn, TokenIndexer } from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@shared/logger';

// --- 1. Augment Request to carry an ID ---
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

// --- 2. Middleware to add or reuse a request ID ---
export const addRequestId = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.id) {
    req.id = uuidv4();
  }
  next();
};

// --- 3. Composite logger using morgan + winston ---
export const requestLogger = () => {
  const skipHealthCheck = (req: Request, _res: Response): boolean =>
    req.path === '/health' || req.path === '/metrics';

  // ← Here we explicitly type the format fn for our Request/Response
  const format: FormatFn<Request, Response> = (
    tokens: TokenIndexer<Request, Response>,
    req: Request,
    res: Response
  ): string => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      responseTime: Number(tokens['response-time'](req, res)),
      contentLength: tokens.res(req, res, 'content-length'),
      requestId: req.id,
      userAgent: req.headers['user-agent'],
      remoteAddress: tokens['remote-addr'](req, res),
      timestamp: new Date().toISOString(),
    });
  };

  const stream = {
    write: (message: string): void => {
      try {
        const logObject = JSON.parse(message);
        if (logObject.status >= 500) {
          logger.error('HTTP Request', logObject);
        } else if (logObject.status >= 400) {
          logger.warn('HTTP Request', logObject);
        } else {
          logger.info('HTTP Request', logObject);
        }
      } catch {
        logger.info(message);
      }
    },
  };

  // ← Pass in our Request/Response types so morgan picks the right overload
  return [
    addRequestId,
    morgan<Request, Response>(format, {
      stream,
      skip: skipHealthCheck,
    }),
  ];
};
