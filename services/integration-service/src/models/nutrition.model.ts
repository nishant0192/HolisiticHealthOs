// src/models/nutrition.model.ts
import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Nutrition {
  id: string;
  user_id: string;
  health_data_id: string | null;
  timestamp: Date;
  meal_type: string;
  foods: any[];
  total_calories: number | null;
  total_macronutrients: any | null;
  water_intake_ml: number | null;
  source_provider: string;
  source_app_id: string | null;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNutritionParams {
  user_id: string;
  health_data_id?: string;
  timestamp: Date;
  meal_type: string;
  foods: any[];
  total_calories?: number;
  total_macronutrients?: any;
  water_intake_ml?: number;
  source_provider: string;
  source_app_id?: string;
  metadata?: any;
}

export class NutritionModel {
  async create(params: CreateNutritionParams): Promise<Nutrition> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const query = `
        INSERT INTO nutrition_data (
          id, user_id, health_data_id, timestamp, meal_type, 
          foods, total_calories, total_macronutrients, water_intake_ml, 
          source_provider, source_app_id, metadata, 
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const values = [
        id,
        params.user_id,
        params.health_data_id || null,
        params.timestamp,
        params.meal_type,
        JSON.stringify(params.foods),
        params.total_calories || null,
        params.total_macronutrients ? JSON.stringify(params.total_macronutrients) : null,
        params.water_intake_ml || null,
        params.source_provider,
        params.source_app_id || null,
        params.metadata || {},
        now,
        now
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error in NutritionModel.create:', error);
      throw error;
    }
  }

  async bulkCreate(paramsArray: CreateNutritionParams[]): Promise<number> {
    try {
      if (!paramsArray.length) {
        return 0;
      }
      
      let count = 0;
      
      // Process in batches to avoid issues with large arrays
      for (const params of paramsArray) {
        await this.create(params);
        count++;
      }
      
      return count;
    } catch (error) {
      logger.error('Error in NutritionModel.bulkCreate:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Nutrition | null> {
    try {
      const query = `
        SELECT * FROM nutrition_data
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in NutritionModel.findById:', error);
      throw error;
    }
  }

  async findByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    mealType?: string,
    limit = 100
  ): Promise<Nutrition[]> {
    try {
      let query = `
        SELECT * FROM nutrition_data
        WHERE user_id = $1
      `;
      
      const values: any[] = [userId];
      let paramIndex = 2;
      
      if (startDate) {
        query += ` AND timestamp >= ${paramIndex++}`;
        values.push(startDate);
      }
      
      if (endDate) {
        query += ` AND timestamp <= ${paramIndex++}`;
        values.push(endDate);
      }
      
      if (mealType) {
        query += ` AND meal_type = ${paramIndex++}`;
        values.push(mealType);
      }
      
      query += ` ORDER BY timestamp DESC LIMIT ${paramIndex}`;
      values.push(limit);
      
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error in NutritionModel.findByUser:', error);
      throw error;
    }
  }

  async deleteByUserAndSource(userId: string, sourceProvider: string): Promise<number> {
    try {
      const query = `
        DELETE FROM nutrition_data
        WHERE user_id = $1 AND source_provider = $2
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId, sourceProvider]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error in NutritionModel.deleteByUserAndSource:', error);
      throw error;
    }
  }
}