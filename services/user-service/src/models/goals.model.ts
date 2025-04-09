import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Goal {
  id: string;
  user_id: string;
  goal_type: string;
  target: number;
  unit: string;
  start_date: Date;
  target_date: Date;
  status: string;
  progress: number;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGoalParams {
  goal_type: string;
  target: number;
  unit: string;
  start_date: Date;
  target_date: Date;
  description?: string;
}

export interface UpdateGoalParams {
  target?: number;
  target_date?: Date;
  status?: string;
  progress?: number;
  description?: string;
}

export class GoalsModel {
  async findByUserId(userId: string): Promise<Goal[]> {
    try {
      const query = `
        SELECT * FROM user_goals
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error in GoalsModel.findByUserId:', error);
      throw error;
    }
  }
  
  async findActiveByUserId(userId: string): Promise<Goal[]> {
    try {
      const query = `
        SELECT * FROM user_goals
        WHERE user_id = $1 AND status = 'active'
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error in GoalsModel.findActiveByUserId:', error);
      throw error;
    }
  }

  async findById(goalId: string, userId: string): Promise<Goal | null> {
    try {
      const query = `
        SELECT * FROM user_goals
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await pool.query(query, [goalId, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in GoalsModel.findById:', error);
      throw error;
    }
  }

  async create(userId: string, data: CreateGoalParams): Promise<Goal> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const query = `
        INSERT INTO user_goals (
          id, user_id, goal_type, target, unit, start_date, 
          target_date, status, progress, description, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        id,
        userId,
        data.goal_type,
        data.target,
        data.unit,
        data.start_date,
        data.target_date,
        'active', // Initial status
        0, // Initial progress
        data.description || null,
        now,
        now
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error in GoalsModel.create:', error);
      throw error;
    }
  }

  async update(goalId: string, userId: string, data: UpdateGoalParams): Promise<Goal> {
    try {
      // Build dynamic query based on provided fields
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
      
      // Add goal ID and user ID as the last parameters
      values.push(goalId);
      values.push(userId);
      
      const query = `
        UPDATE user_goals
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Goal not found or does not belong to user');
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in GoalsModel.update:', error);
      throw error;
    }
  }

  async delete(goalId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM user_goals
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      
      const result = await pool.query(query, [goalId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error in GoalsModel.delete:', error);
      throw error;
    }
  }
}