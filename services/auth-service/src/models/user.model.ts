import { pool } from '../config/database.config';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: string;
  phone_number?: string;
  is_active: boolean;
  is_email_verified: boolean;
  roles: string[];
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at?: Date;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserParams {
  email: string;
  password: string; // Plain text password
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: string;
  phone_number?: string;
  roles?: string[];
}

export interface UpdateUserParams {
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date;
  gender?: string;
  phone_number?: string;
  is_active?: boolean;
  roles?: string[];
  subscription_tier?: string;
  subscription_status?: string;
  subscription_expires_at?: Date;
}

export class UserModel {
  async create(params: CreateUserParams, passwordHash: string): Promise<User> {
    const { 
      email, first_name, last_name, date_of_birth, 
      gender, phone_number, roles = ['user'] 
    } = params;
    
    const id = uuidv4();
    const now = new Date();
    
    const query = `
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        date_of_birth, gender, phone_number, roles, 
        created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      id, email.toLowerCase(), passwordHash, first_name, last_name,
      date_of_birth || null, gender || null, phone_number || null, roles,
      now, now
    ];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === '23505') { // Unique violation error code
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users WHERE email = $1
    `;
    
    const result = await pool.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT * FROM users WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateEmailVerification(id: string, isVerified: boolean): Promise<void> {
    const query = `
      UPDATE users
      SET is_email_verified = $1, updated_at = $2
      WHERE id = $3
    `;
    
    await pool.query(query, [isVerified, new Date(), id]);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = $2
      WHERE id = $3
    `;
    
    await pool.query(query, [passwordHash, new Date(), id]);
  }

  async updateLastLogin(id: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login_at = $1
      WHERE id = $2
    `;
    
    await pool.query(query, [new Date(), id]);
  }

  async updateUser(id: string, params: UpdateUserParams): Promise<User> {
    // Build dynamic query based on provided parameters
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Add each parameter if it's provided
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Always update the updated_at timestamp
    updates.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;
    
    // Add user ID as the last parameter
    values.push(id);
    
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}