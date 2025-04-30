import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.5, 1, 3, 5, 10]
});

interface TimerLabels {
  method: string;
  route: string;
}

interface EndTimerLabels {
  status_code: string;
}

export const metricsMiddleware =
  () =>
    (req: Request, res: Response, next: NextFunction): void => {
      const end: (labels: EndTimerLabels) => void = httpRequestDuration.startTimer({
        method: req.method,
        route: req.route?.path || req.path
      } as TimerLabels);

      res.once('finish', () => {
        end({ status_code: String(res.statusCode) });
      });
      next();
    };

export interface MetricsEndpointRequest extends Request { }
export interface MetricsEndpointResponse extends Response { }

export const metricsEndpoint = (
  _req: MetricsEndpointRequest,
  res: MetricsEndpointResponse
): MetricsEndpointResponse =>
  res.set('Content-Type', client.register.contentType).end(client.register.metrics());
