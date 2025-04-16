// src/models/health-data.model.ts
import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';
import { v4 as uuidv4 } from 'uuid';

export interface HealthData {
  id: string;
  user_id: string;
  data_type: string;
  data_subtype: string | null;
  value: number;
  unit: string;
  start_time: Date;
  end_time: Date | null;
  source_provider: string;
  source_device_id: string | null;
  source_app_id: string | null;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateHealthDataParams {
  user_id: string;
  data_type: string;
  data_subtype?: string;
  value: number;
  unit: string;
  start_time: Date;
  end_time?: Date;
  source_provider: string;
  source_device_id?: string;
  source_app_id?: string;
  metadata?: any;
}

export class HealthDataModel {
  async create(params: CreateHealthDataParams): Promise<HealthData> {
    try {
      const id = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO health_data (
          id, user_id, data_type, data_subtype, value, 
          unit, start_time, end_time, source_provider, 
          source_device_id, source_app_id, metadata, 
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        id,
        params.user_id,
        params.data_type,
        params.data_subtype || null,
        params.value,
        params.unit,
        params.start_time,
        params.end_time || null,
        params.source_provider,
        params.source_device_id || null,
        params.source_app_id || null,
        params.metadata || {},
        now,
        now
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error in HealthDataModel.create:', error);
      throw error;
    }
  }

  async bulkCreate(paramsArray: CreateHealthDataParams[]): Promise<number> {
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

        placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 
                        $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 
                        $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);

        values.push(
          id,
          params.user_id,
          params.data_type,
          params.data_subtype || null,
          params.value,
          params.unit,
          params.start_time,
          params.end_time || null,
          params.source_provider,
          params.source_device_id || null,
          params.source_app_id || null,
          params.metadata || {},
          now,
          now
        );
      }

      const query = `
        INSERT INTO health_data (
          id, user_id, data_type, data_subtype, value, 
          unit, start_time, end_time, source_provider, 
          source_device_id, source_app_id, metadata, 
          created_at, updated_at
        )
        VALUES ${placeholders.join(', ')}
      `;

      const result = await pool.query(query, values);
      return result.rowCount;
    } catch (error) {
      logger.error('Error in HealthDataModel.bulkCreate:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<HealthData | null> {
    try {
      const query = `
          SELECT * FROM health_data
          WHERE id = $1
        `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error in HealthDataModel.findById:', error);
      throw error;
    }
  }

  async findByUserAndType(
    userId: string,
    dataType: string,
    subType?: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100
  ): Promise<HealthData[]> {
    try {
      let query = `
          SELECT * FROM health_data
          WHERE user_id = $1 AND data_type = $2
        `;

      const values: any[] = [userId, dataType];
      let paramIndex = 3;

      if (subType) {
        query += ` AND data_subtype = $${paramIndex++}`;
        values.push(subType);
      }

      if (startDate) {
        query += ` AND start_time >= $${paramIndex++}`;
        values.push(startDate);
      }

      if (endDate) {
        query += ` AND start_time <= $${paramIndex++}`;
        values.push(endDate);
      }

      query += ` ORDER BY start_time DESC LIMIT $${paramIndex}`;
      values.push(limit);

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error in HealthDataModel.findByUserAndType:', error);
      throw error;
    }
  }

  async deleteByUserAndSource(userId: string, sourceProvider: string): Promise<number> {
    try {
      const query = `
          DELETE FROM health_data
          WHERE user_id = $1 AND source_provider = $2
          RETURNING id
        `;

      const result = await pool.query(query, [userId, sourceProvider]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error in HealthDataModel.deleteByUserAndSource:', error);
      throw error;
    }
  }
}