import { Options, MemoryStore } from 'express-rate-limit';

interface RateLimitConfig {
    standard: Options;
    auth: Options;
    sensitive: Options;
}

const rateLimitConfig: RateLimitConfig = {
    standard: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100, // 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'error',
            message: 'Too many requests from this IP, please try again after 15 minutes',
        },
        statusCode: 429,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
        requestPropertyName: 'rateLimit',
        keyGenerator: (req) => req.ip || req.socket.remoteAddress || '',
        identifier: (req) => req.ip || '',
        handler: (_req, res) => {
            return res.status(429).json({
                status: 'error',
                message: 'Too many requests from this IP, please try again after 15 minutes',
            });
        },
        skip: () => false,
        requestWasSuccessful: () => true,
        store: new MemoryStore(), // Default memory store
        validate: true, // Enable default validation
        passOnStoreError: false, // Default behavior
    },
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 20, // 20 auth attempts per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'error',
            message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
        },
        statusCode: 429,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
        requestPropertyName: 'rateLimit',
        keyGenerator: (req) => req.ip || req.socket.remoteAddress || '',
        identifier: (req) => req.ip || '',
        handler: (_req, res) => {
            return res.status(429).json({
                status: 'error',
                message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
            });
        },
        skip: () => false,
        requestWasSuccessful: () => true,
        store: new MemoryStore(), // Default memory store
        validate: true, // Enable default validation
        passOnStoreError: false, // Default behavior
    },
    sensitive: {
        windowMs: 60 * 60 * 1000, // 1 hour
        limit: 10, // 10 sensitive requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'error',
            message: 'Too many sensitive operations from this IP, please try again after 1 hour',
        },
        statusCode: 429,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
        requestPropertyName: 'rateLimit',
        keyGenerator: (req) => req.ip || req.socket.remoteAddress || '',
        identifier: (req) => req.ip || '',
        handler: (_req, res) => {
            return res.status(429).json({
                status: 'error',
                message: 'Too many sensitive operations from this IP, please try again after 1 hour',
            });
        },
        skip: () => false,
        requestWasSuccessful: () => true,
        store: new MemoryStore(), // Default memory store
        validate: true, // Enable default validation
        passOnStoreError: false, // Default behavior
    },
};

export default rateLimitConfig;
