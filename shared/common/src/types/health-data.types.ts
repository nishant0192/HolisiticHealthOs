// health-data.types.ts
export interface HealthMetric {
    ts: string;              // ISO‑8601
    source: 'fitbit' | 'apple' | 'google' | 'manual';
    type: 'steps' | 'sleep' | 'hr';
    value: number;
    unit: string;
  }
  