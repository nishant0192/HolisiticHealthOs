import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';
import { v4 as uuidv4 } from 'uuid';

export type Provider = 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'samsung_health' | 'withings';;

export interface Connection {
  id: string;
  user_id: string;
  provider: Provider;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: Date | null;
  last_synced_at: Date | null;
  scopes: string[];
  status: 'active' | 'expired' | 'revoked';
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConnectionParams {
  user_id: string;
  provider: Provider;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: Date;
  scopes?: string[];
  metadata?: any;
}

export interface UpdateConnectionParams {
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  last_synced_at?: Date;
  scopes?: string[];
  status?: 'active' | 'expired' | 'revoked';
  metadata?: any;
}

export class ConnectionModel {
  async findById(id: string): Promise<Connection | null> {
    try {
      const query = `
        SELECT * FROM integration_connections
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in ConnectionModel.findById:', error);
      throw error;
    }
  }

  async findByUserAndProvider(userId: string, provider: Provider): Promise<Connection | null> {
    try {
      const query = `
        SELECT * FROM integration_connections
        WHERE user_id = $1 AND provider = $2
      `;
      
      const result = await pool.query(query, [userId, provider]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in ConnectionModel.findByUserAndProvider:', error);
      throw error;
    }
  }

  async findActiveByUser(userId: string): Promise<Connection[]> {
    try {
      const query = `
        SELECT * FROM integration_connections
        WHERE user_id = $1 AND status = 'active'
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error in ConnectionModel.findActiveByUser:', error);
      throw error;
    }
  }

  async create(params: CreateConnectionParams): Promise<Connection> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      // Check if connection already exists
      const existingConnection = await this.findByUserAndProvider(params.user_id, params.provider);
      
      if (existingConnection) {
        // If it exists, update it instead
        return this.update(existingConnection.id, {
          access_token: params.access_token,
          refresh_token: params.refresh_token,
          token_expires_at: params.token_expires_at,
          scopes: params.scopes,
          status: 'active',
          metadata: params.metadata
        });
      }
      
      const query = `
        INSERT INTO integration_connections (
          id, user_id, provider, access_token, refresh_token, 
          token_expires_at, scopes, status, metadata, 
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        id,
        params.user_id,
        params.provider,
        params.access_token,
        params.refresh_token || null,
        params.token_expires_at || null,
        params.scopes || [],
        'active', // Initial status
        params.metadata || {},
        now,
        now
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error in ConnectionModel.create:', error);
      throw error;
    }
  }

  async update(id: string, params: UpdateConnectionParams): Promise<Connection> {
    try {
      // Build dynamic query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      // Add ID as the last parameter
      values.push(id);
      
      const query = `
        UPDATE integration_connections
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Connection not found');
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in ConnectionModel.update:', error);
      throw error;
    }
  }
  
  async updateLastSynced(id: string): Promise<Connection> {
    try {
      const query = `
        UPDATE integration_connections
        SET last_synced_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Connection not found');
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error in ConnectionModel.updateLastSynced:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM integration_connections
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error in ConnectionModel.delete:', error);
      throw error;
    }
  }
}