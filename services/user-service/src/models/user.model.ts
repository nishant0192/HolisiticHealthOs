import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: string;
  phone_number?: string;
  profile_picture?: string;
  is_active: boolean;
  is_email_verified: boolean;
  roles: string[];
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  async findById(id: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, email, first_name, last_name, date_of_birth, gender, 
               phone_number, profile_picture, is_active, is_email_verified, 
               roles, subscription_tier, subscription_status, subscription_expires_at,
               created_at, updated_at
        FROM users
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in UserModel.findById:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, email, first_name, last_name, date_of_birth, gender, 
               phone_number, profile_picture, is_active, is_email_verified, 
               roles, subscription_tier, subscription_status, subscription_expires_at,
               created_at, updated_at
        FROM users
        WHERE email = $1
      `;
      
      const result = await pool.query(query, [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in UserModel.findByEmail:', error);
      throw error;
    }
  }

  async update(userId: string, data: Partial<User>): Promise<User> {
    try {
      // Build dynamic query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(data)) {
        // Ensure the field is allowed
        if (
          value !== undefined &&
          !['id', 'email', 'password_hash', 'created_at', 'updated_at'].includes(key)
        ) {
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
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, first_name, last_name, date_of_birth, gender, 
                  phone_number, profile_picture, is_active, is_email_verified, 
                  roles, subscription_tier, subscription_status, subscription_expires_at,
                  created_at, updated_at
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in UserModel.update:', error);
      throw error;
    }
  }

  /**
   * Retrieve users with pagination and count total records.
   */
  async findAndCountAll({ offset, limit }: { offset: number; limit: number; }): Promise<{ users: User[]; total: number }> {
    try {
      // Query to fetch paginated data
      const dataQuery = `
        SELECT id, email, first_name, last_name, date_of_birth, gender, 
               phone_number, profile_picture, is_active, is_email_verified, 
               roles, subscription_tier, subscription_status, subscription_expires_at,
               created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const dataResult = await pool.query(dataQuery, [limit, offset]);

      // Query to count total number of users
      const countQuery = `SELECT COUNT(*) FROM users`;
      const countResult = await pool.query(countQuery);
      
      const total = parseInt(countResult.rows[0].count, 10);
      return {
        users: dataResult.rows,
        total
      };
    } catch (error) {
      logger.error('Error in UserModel.findAndCountAll:', error);
      throw error;
    }
  }

  /**
   * Update the user's active status.
   */
  async updateStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const query = `
        UPDATE users
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, first_name, last_name, date_of_birth, gender, 
                  phone_number, profile_picture, is_active, is_email_verified, 
                  roles, subscription_tier, subscription_status, subscription_expires_at,
                  created_at, updated_at
      `;
      const result = await pool.query(query, [isActive, userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error in UserModel.updateStatus:', error);
      throw error;
    }
  }
}
