import NodeCache from 'node-cache';
import { logger } from '../middlewares/logging.middleware';

interface RateLimitConfig {
  [key: string]: {
    limit: number;            // Maximum number of requests in window
    windowMs: number;         // Window size in milliseconds
    errorThreshold?: number;  // Error threshold after which to increase delay
    initialDelay?: number;    // Initial delay in milliseconds for retries
    maxDelay?: number;        // Maximum delay in milliseconds
  };
}

/**
 * Rate limiter for external API calls
 * Uses a token bucket algorithm with automatic backoff on errors
 */
class RateLimiter {
  private readonly cache: NodeCache;
  private readonly config: RateLimitConfig;
  private errorCounts: Map<string, number>;
  private backoffDelays: Map<string, number>;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 60, checkperiod: 10 });
    this.errorCounts = new Map<string, number>();
    this.backoffDelays = new Map<string, number>();

    // Default rate limit configurations for different providers
    this.config = {
      'fitbit-api': {
        limit: 150,
        windowMs: 3600000,  // 1 hour
        errorThreshold: 3,
        initialDelay: 1000,
        maxDelay: 60000
      },
      'fitbit-token': {
        limit: 10,
        windowMs: 3600000,  // 1 hour
      },
      'garmin-api': {
        limit: 100,
        windowMs: 3600000,  // 1 hour
        errorThreshold: 3,
        initialDelay: 1000,
        maxDelay: 60000
      },
      'garmin-token': {
        limit: 10,
        windowMs: 3600000,  // 1 hour
      },
      'google-fit-api': {
        limit: 1000,
        windowMs: 86400000,  // 24 hours
        errorThreshold: 5,
        initialDelay: 500,
        maxDelay: 30000
      },
      'google-fit-token': {
        limit: 20,
        windowMs: 3600000,  // 1 hour
      },
      'apple-health-api': {
        limit: 1000,
        windowMs: 86400000,  // 24 hours
        errorThreshold: 5,
        initialDelay: 500,
        maxDelay: 30000
      },
      'samsung-health-api': {
        limit: 100,
        windowMs: 3600000,  // 1 hour
        errorThreshold: 3,
        initialDelay: 1000,
        maxDelay: 30000
      },
      'withings-api': {
        limit: 60,
        windowMs: 60000,  // 1 minute
        errorThreshold: 3,
        initialDelay: 2000,
        maxDelay: 60000
      },
    };
  }

  /**
   * Set custom configuration for a provider
   */
  setConfig(provider: string, config: {
    limit: number;
    windowMs: number;
    errorThreshold?: number;
    initialDelay?: number;
    maxDelay?: number;
  }): void {
    this.config[provider] = config;
  }

  /**
   * Reset error count for a provider
   */
  resetErrorCount(provider: string): void {
    this.errorCounts.set(provider, 0);
    this.backoffDelays.set(provider, 0);
  }

  /**
   * Record an error for a provider
   */
  recordError(provider: string): void {
    const currentCount = this.errorCounts.get(provider) || 0;
    this.errorCounts.set(provider, currentCount + 1);

    // Increase backoff delay if above error threshold
    if (this.config[provider]?.errorThreshold && 
        currentCount + 1 >= this.config[provider].errorThreshold!) {
      
      const currentDelay = this.backoffDelays.get(provider) || 0;
      const initialDelay = this.config[provider].initialDelay || 1000;
      const maxDelay = this.config[provider].maxDelay || 60000;
      
      // Exponential backoff with maximum
      const newDelay = currentDelay === 0 
        ? initialDelay 
        : Math.min(currentDelay * 2, maxDelay);
      
      this.backoffDelays.set(provider, newDelay);
      
      logger.warn(`Rate limiting increased for ${provider}: delay now ${newDelay}ms due to repeated errors`);
    }
  }

  /**
   * Consume tokens for a provider
   * Returns a promise that resolves when the request can proceed
   * @param provider The provider name
   * @param cost The cost of the request (default: 1)
   */
  async consume(provider: string, cost: number = 1): Promise<void> {
    if (!this.config[provider]) {
      logger.warn(`No rate limit config found for provider: ${provider}. Using default.`);
      this.config[provider] = {
        limit: 100,
        windowMs: 60000, // 1 minute
      };
    }

    const { limit, windowMs } = this.config[provider];
    const now = Date.now();
    const bucketKey = `${provider}_bucket`;
    const lastUpdateKey = `${provider}_lastUpdate`;

    // Get current state from cache or initialize
    let tokens = this.cache.get<number>(bucketKey) || limit;
    const lastUpdate = this.cache.get<number>(lastUpdateKey) || 0;

    // Calculate token refill since last update
    const timePassed = now - lastUpdate;
    const refillAmount = Math.floor((timePassed / windowMs) * limit);
    
    // Update tokens (refill but don't exceed limit)
    tokens = Math.min(tokens + refillAmount, limit);

    // Check if we have enough tokens
    if (tokens < cost) {
      const waitTime = Math.ceil((windowMs / limit) * (cost - tokens));
      logger.warn(`Rate limit reached for ${provider}. Waiting for ${waitTime}ms`);
      
      // Add any backoff delay if there have been errors
      const backoffDelay = this.backoffDelays.get(provider) || 0;
      const totalDelay = waitTime + backoffDelay;
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
      
      // Try again after waiting
      return this.consume(provider, cost);
    }

    // Consume tokens
    tokens -= cost;
    
    // Update cache
    this.cache.set(bucketKey, tokens);
    this.cache.set(lastUpdateKey, now);
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();