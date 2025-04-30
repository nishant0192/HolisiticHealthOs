// src/models/activity.model.ts
import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Activity {
  id: string;
  user_id: string;
  health_data_id: string | null;
  activity_type: string;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
  distance: number | null;
  distance_unit: string | null;
  calories_burned: number | null;
  steps: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  source_provider: string;
  source_device_id: string | null;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateActivityParams {
  user_id: string;
  health_data_id?: string;
  activity_type: string;
  start_time: Date;
  end_time: Date;
  duration_seconds?: number;
  distance?: number;
  distance_unit?: string;
  calories_burned?: number;
  steps?: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  source_provider: string;
  source_device_id?: string;
  metadata?: any;
}

export class ActivityModel {
  async create(params: CreateActivityParams): Promise<Activity> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      // Calculate duration if not provided
      const duration = params.duration_seconds || 
        (params.end_time.getTime() - params.start_time.getTime()) / 1000;
      
      const query = `
        INSERT INTO activity_data (
          id, user_id, health_data_id, activity_type, start_time, 
          end_time, duration_seconds, distance, distance_unit, 
          calories_burned, steps, heart_rate_avg, heart_rate_max, 
          source_provider, source_device_id, metadata, 
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;
      
      const values = [
        id,
        params.user_id,
        params.health_data_id || null,
        params.activity_type,
        params.start_time,
        params.end_time,
        duration,
        params.distance || null,
        params.distance_unit || null,
        params.calories_burned || null,
        params.steps || null,
        params.heart_rate_avg || null,
        params.heart_rate_max || null,
        params.source_provider,
        params.source_device_id || null,
        params.metadata || {},
        now,
        now
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error in ActivityModel.create:', error);
      throw error;
    }
  }

  async bulkCreate(paramsArray: CreateActivityParams[]): Promise<number> {
    try {
      if (!paramsArray.length) {
        return 0;
      }

      // Prepare for bulk insert
      const values: any[] = [];
      const placeholders: string[] = [];
      const now = new Date();
      let paramIndex = 1;

      for (const params of paramsArray) {
        const id = uuidv4();
        const duration = params.duration_seconds || 
          (params.end_time.getTime() - params.start_time.getTime()) / 1000;

        placeholders.push(`(${paramIndex++}, ${paramIndex++}, ${paramIndex++}, ${paramIndex++}, ${paramIndex++}, 
                        ${paramIndex++}, ${paramIndex++}, ${paramIndex++}, ${paramIndex++}, 
                        ${paramIndex++}, ${paramIndex++}, ${paramIndex++}, ${paramIndex++}, 
                        ${paramIndex++}, ${paramIndex++}, ${paramIndex++}, ${paramIndex++}, ${paramIndex++})`);

        values.push(
          id,
          params.user_id,
          params.health_data_id || null,
          params.activity_type,
          params.start_time,
          params.end_time,
          duration,
          params.distance || null,
          params.distance_unit || null,
          params.calories_burned || null,
          params.steps || null,
          params.heart_rate_avg || null,
          params.heart_rate_max || null,
          params.source_provider,
          params.source_device_id || null,
          params.metadata || {},
          now,
          now
        );
      }

      const query = `
        INSERT INTO activity_data (
          id, user_id, health_data_id, activity_type, start_time, 
          end_time, duration_seconds, distance, distance_unit, 
          calories_burned, steps, heart_rate_avg, heart_rate_max, 
          source_provider, source_device_id, metadata, 
          created_at, updated_at
        )
        VALUES ${placeholders.join(', ')}
      `;

      const result = await pool.query(query, values);
      return result.rowCount ?? 0;
    } catch (error) {
      logger.error('Error in ActivityModel.bulkCreate:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Activity | null> {
    try {
      const query = `
        SELECT * FROM activity_data
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in ActivityModel.findById:', error);
      throw error;
    }
  }

  async findByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    activityType?: string,
    limit = 100
  ): Promise<Activity[]> {
    try {
      let query = `
        SELECT * FROM activity_data
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
      
      if (activityType) {
        query += ` AND activity_type = ${paramIndex++}`;
        values.push(activityType);
      }
      
      query += ` ORDER BY start_time DESC LIMIT ${paramIndex}`;
      values.push(limit);
      
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error in ActivityModel.findByUser:', error);
      throw error;
    }
  }

  async deleteByUserAndSource(userId: string, sourceProvider: string): Promise<number> {
    try {
      const query = `
        DELETE FROM activity_data
        WHERE user_id = $1 AND source_provider = $2
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId, sourceProvider]);
      return result.rowCount ?? 0;
    } catch (error) {
      logger.error('Error in ActivityModel.deleteByUserAndSource:', error);
      throw error;
    }
  }
}