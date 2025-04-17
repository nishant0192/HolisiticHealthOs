// src/models/sleep.model.ts
import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';
import { v4 as uuidv4 } from 'uuid';

export interface SleepStage {
  stage: string;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
}

export interface Sleep {
  id: string;
  user_id: string;
  health_data_id: string | null;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
  sleep_stages: SleepStage[];
  quality: number | null;
  heart_rate_avg: number | null;
  respiratory_rate_avg: number | null;
  temperature_avg: number | null;
  disturbance_count: number | null;
  source_provider: string;
  source_device_id: string | null;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSleepParams {
  user_id: string;
  health_data_id?: string;
  start_time: Date;
  end_time: Date;
  duration_seconds?: number;
  sleep_stages?: SleepStage[];
  quality?: number;
  heart_rate_avg?: number;
  respiratory_rate_avg?: number;
  temperature_avg?: number;
  disturbance_count?: number;
  source_provider: string;
  source_device_id?: string;
  metadata?: any;
}

export class SleepModel {
  async create(params: CreateSleepParams): Promise<Sleep> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      // Calculate duration if not provided
      const duration = params.duration_seconds || 
        (params.end_time.getTime() - params.start_time.getTime()) / 1000;
      
      const query = `
        INSERT INTO sleep_data (
          id, user_id, health_data_id, start_time, end_time, 
          duration_seconds, sleep_stages, quality, heart_rate_avg, 
          respiratory_rate_avg, temperature_avg, disturbance_count, 
          source_provider, source_device_id, metadata, 
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;
      
      const values = [
        id,
        params.user_id,
        params.health_data_id || null,
        params.start_time,
        params.end_time,
        duration,
        JSON.stringify(params.sleep_stages || []),
        params.quality || null,
        params.heart_rate_avg || null,
        params.respiratory_rate_avg || null,
        params.temperature_avg || null,
        params.disturbance_count || null,
        params.source_provider,
        params.source_device_id || null,
        params.metadata || {},
        now,
        now
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error in SleepModel.create:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Sleep | null> {
    try {
      const query = `
        SELECT * FROM sleep_data
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in SleepModel.findById:', error);
      throw error;
    }
  }

  async findByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100
  ): Promise<Sleep[]> {
    try {
      let query = `
        SELECT * FROM sleep_data
        WHERE user_id = $1
      `;
      
      const values: any[] = [userId];
      let paramIndex = 2;
      
      if (startDate) {
        query += ` AND start_time >= ${paramIndex++}`;
        values.push(startDate);
      }
      
      if (endDate) {
        query += ` AND start_time <= ${paramIndex++}`;
        values.push(endDate);
      }
      
      query += ` ORDER BY start_time DESC LIMIT ${paramIndex}`;
      values.push(limit);
      
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error in SleepModel.findByUser:', error);
      throw error;
    }
  }

  async deleteByUserAndSource(userId: string, sourceProvider: string): Promise<number> {
    try {
      const query = `
        DELETE FROM sleep_data
        WHERE user_id = $1 AND source_provider = $2
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId, sourceProvider]);
      return result.rowCount ?? 0;
    } catch (error) {
      logger.error('Error in SleepModel.deleteByUserAndSource:', error);
      throw error;
    }
  }
}