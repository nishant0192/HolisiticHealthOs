import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';

export interface HealthProfile {
  id: string;
  user_id: string;
  health_conditions: string[];
  medications: string[];
  allergies: string[];
  dietary_preferences: string[];
  activity_level: string;
  sleep_goal_hours: number;
  fitness_experience: string;
  motivation_factors: string[];
  stress_level: number;
  height_cm: number | null;
  weight_kg: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateHealthProfileParams {
  health_conditions?: string[];
  medications?: string[];
  allergies?: string[];
  dietary_preferences?: string[];
  activity_level?: string;
  sleep_goal_hours?: number;
  fitness_experience?: string;
  motivation_factors?: string[];
  stress_level?: number;
  height_cm?: number;
  weight_kg?: number;
}

export class HealthProfileModel {
  async findByUserId(userId: string): Promise<HealthProfile | null> {
    try {
      // Get health profile
      const query = `
        SELECT * FROM user_health_profiles
        WHERE user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in HealthProfileModel.findByUserId:', error);
      throw error;
    }
  }

  async createOrUpdate(userId: string, data: UpdateHealthProfileParams): Promise<HealthProfile> {
    try {
      // Check if profile already exists
      const checkQuery = `
        SELECT id FROM user_health_profiles
        WHERE user_id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [userId]);
      const exists = checkResult.rows.length > 0;
      
      if (exists) {
        // Update existing profile
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) {
            updates.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
        
        // Always update the updated_at timestamp
        updates.push(`updated_at = NOW()`);
        
        // Add user ID as the last parameter
        values.push(userId);
        
        const query = `
          UPDATE user_health_profiles
          SET ${updates.join(', ')}
          WHERE user_id = $${paramIndex}
          RETURNING *
        `;
        
        const result = await pool.query(query, values);
        return result.rows[0];
      } else {
        // Insert new profile
        const columns = ['user_id'];
        const placeholders = ['$1'];
        const values = [userId];
        let paramIndex = 2;
        
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) {
            columns.push(key);
            placeholders.push(`$${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
        
        const query = `
          INSERT INTO user_health_profiles (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        const result = await pool.query(query, values);
        return result.rows[0];
      }
    } catch (error) {
      logger.error('Error in HealthProfileModel.createOrUpdate:', error);
      throw error;
    }
  }

  async getLatestMeasurements(userId: string): Promise<{ height_cm: number | null, weight_kg: number | null }> {
    try {
      // Get the latest height and weight from health data table
      const query = `
        SELECT 
          (SELECT value FROM health_data 
           WHERE user_id = $1 AND data_type = 'vitals' AND data_subtype = 'height'
           ORDER BY start_time DESC LIMIT 1) as height_cm,
          (SELECT value FROM health_data 
           WHERE user_id = $1 AND data_type = 'vitals' AND data_subtype = 'weight'
           ORDER BY start_time DESC LIMIT 1) as weight_kg
      `;
      
      const result = await pool.query(query, [userId]);
      
      return {
        height_cm: result.rows[0]?.height_cm || null,
        weight_kg: result.rows[0]?.weight_kg || null
      };
    } catch (error) {
      logger.error('Error in HealthProfileModel.getLatestMeasurements:', error);
      throw error;
    }
  }
}