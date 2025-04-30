/**
 * TypeScript module declarations for shared modules
 */

declare module '@shared/common' {
    export class ApiError extends Error {
      status: number;
      details?: unknown;
      constructor(message: string, status?: number, details?: unknown);
    }
    
    export class BusinessError extends Error {
      code: string;
      constructor(message: string, code?: string);
    }
    
    export interface HealthMetric {
      id?: string;
      userId: string;
      ts: string;
      source: string;
      type: string;
      value: number;
      unit: string;
    }
    
    export interface User {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      createdAt: string;
    }
  }
  
  declare module '@shared/logger' {
    export const logger: {
      error: (message: string, ...meta: any[]) => void;
      warn: (message: string, ...meta: any[]) => void;
      info: (message: string, ...meta: any[]) => void;
      debug: (message: string, ...meta: any[]) => void;
    };
  }
  
  declare module '@shared/monitoring' {
    export function initTracing(serviceName: string): void;
    
    export function metricsMiddleware(): (req: any, res: any, next: any) => void;
    
    export function metricsEndpoint(req: any, res: any): any;
    
    export interface MetricsEndpointRequest extends Request {}
    export interface MetricsEndpointResponse extends Response {}
  }