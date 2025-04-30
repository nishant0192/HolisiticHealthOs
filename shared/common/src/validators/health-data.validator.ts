import { z } from 'zod';
import { HealthMetric } from '../types/health-data.types';

/**
 * Zod schema that validates a single HealthMetric item.
 *  - ts: ISO 8601 timestamp
 *  - source: limited to known providers
 *  - type: limited metric kinds
 *  - value: finite number >= 0
 *  - unit: non‑empty string
 */
export const healthMetricSchema = z.object({
  ts: z.string().datetime({ offset: true }),
  source: z.enum(['fitbit', 'apple', 'google', 'manual']),
  type: z.enum(['steps', 'sleep', 'hr']),
  value: z.number().nonnegative().finite(),
  unit: z.string().min(1)
});

/** Array schema for bulk inserts */
export const healthMetricArraySchema = z.array(healthMetricSchema);

/** Type helper inferred from the schema (identical to HealthMetric) */
export type HealthMetricInput = z.infer<typeof healthMetricSchema>;

/** Runtime validator */
export const validateHealthMetric = (payload: unknown): HealthMetric => {
  return healthMetricSchema.parse(payload);
};
