import { Pool } from 'pg';
import { databaseConfig } from '../config';
import { logger } from '@shared/logger';
import { v4 as uuidv4 } from 'uuid';

// Create a connection pool
const pool = new Pool({
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
  user: databaseConfig.user,
  password: databaseConfig.password,
  ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false,
  max: databaseConfig.maxPool,
  idleTimeoutMillis: databaseConfig.idleTimeout,
  connectionTimeoutMillis: databaseConfig.connectionTimeout
});

export enum ReportType {
  ACTIVITY = 'activity',
  SLEEP = 'sleep',
  NUTRITION = 'nutrition',
  HEALTH = 'health',
  CUSTOM = 'custom'
}

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export interface ReportFilter {
  userId: string;
  type?: ReportType | string;
  period?: ReportPeriod | string;
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
  offset?: number;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  type: ReportType | string;
  period: ReportPeriod | string;
  startDate: string;
  endDate: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

class ReportsModel {
  /**
   * Create a new report
   */
  async createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO reports
          (id, user_id, title, type, period, start_date, end_date, data)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at, updated_at
      `;
      
      const id = uuidv4();
      const params = [
        id,
        report.userId,
        report.title,
        report.type,
        report.period,
        new Date(report.startDate),
        new Date(report.endDate),
        JSON.stringify(report.data)
      ];
      
      const result = await client.query(query, params);
      const row = result.rows[0];
      
      return {
        id: row.id,
        userId: report.userId,
        title: report.title,
        type: report.type,
        period: report.period,
        startDate: report.startDate,
        endDate: report.endDate,
        data: report.data,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
      
    } catch (error) {
      logger.error('Error creating report:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get reports with filtering options
   */
  async getReports(filter: ReportFilter): Promise<Report[]> {
    const client = await pool.connect();
    
    try {
      // Build query with parameterized values
      let query = `
        SELECT 
          id, user_id, title, type, period, start_date, end_date, data, created_at, updated_at
        FROM 
          reports
        WHERE 
          user_id = $1
      `;
      
      // Array to store parameters
      const params: any[] = [filter.userId];
      let paramIndex = 2;
      
      // Add type filter if provided
      if (filter.type) {
        query += ` AND type = $${paramIndex}`;
        params.push(filter.type);
        paramIndex++;
      }
      
      // Add period filter if provided
      if (filter.period) {
        query += ` AND period = $${paramIndex}`;
        params.push(filter.period);
        paramIndex++;
      }
      
      // Add date range filters if provided
      if (filter.startDate) {
        query += ` AND start_date >= $${paramIndex}`;
        params.push(new Date(filter.startDate));
        paramIndex++;
      }
      
      if (filter.endDate) {
        query += ` AND end_date <= $${paramIndex}`;
        params.push(new Date(filter.endDate));
        paramIndex++;
      }
      
      // Add ordering
      query += ` ORDER BY created_at DESC`;
      
      // Add pagination
      if (filter.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filter.limit);
        paramIndex++;
        
        if (filter.offset) {
          query += ` OFFSET $${paramIndex}`;
          params.push(filter.offset);
        }
      }
      
      // Execute query
      const result = await client.query(query, params);
      
      // Transform database rows to Report objects
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        type: row.type,
        period: row.period,
        startDate: row.start_date.toISOString(),
        endDate: row.end_date.toISOString(),
        data: row.data,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      }));
      
    } catch (error) {
      logger.error('Error retrieving reports:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get a report by ID
   */
  async getReportById(id: string, userId: string): Promise<Report | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          id, user_id, title, type, period, start_date, end_date, data, created_at, updated_at
        FROM 
          reports
        WHERE 
          id = $1 AND user_id = $2
      `;
      
      const result = await client.query(query, [id, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        type: row.type,
        period: row.period,
        startDate: row.start_date.toISOString(),
        endDate: row.end_date.toISOString(),
        data: row.data,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
      
    } catch (error) {
      logger.error('Error retrieving report by ID:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Update an existing report
   */
  async updateReport(id: string, userId: string, updates: Partial<Report>): Promise<Report | null> {
    const client = await pool.connect();
    
    try {
      // Start building the query
      let query = `UPDATE reports SET updated_at = NOW()`;
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add each field that needs to be updated
      if (updates.title !== undefined) {
        query += `, title = $${paramIndex}`;
        params.push(updates.title);
        paramIndex++;
      }
      
      if (updates.type !== undefined) {
        query += `, type = $${paramIndex}`;
        params.push(updates.type);
        paramIndex++;
      }
      
      if (updates.period !== undefined) {
        query += `, period = $${paramIndex}`;
        params.push(updates.period);
        paramIndex++;
      }
      
      if (updates.startDate !== undefined) {
        query += `, start_date = $${paramIndex}`;
        params.push(new Date(updates.startDate));
        paramIndex++;
      }
      
      if (updates.endDate !== undefined) {
        query += `, end_date = $${paramIndex}`;
        params.push(new Date(updates.endDate));
        paramIndex++;
      }
      
      if (updates.data !== undefined) {
        query += `, data = $${paramIndex}`;
        params.push(JSON.stringify(updates.data));
        paramIndex++;
      }
      
      // Complete the query with WHERE condition and RETURNING clause
      query += ` WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;
      params.push(id, userId);
      
      // Execute the query
      const result = await client.query(query, params);
      
      // Check if any row was updated
      if (result.rows.length === 0) {
        return null;
      }
      
      // Transform the result to Report object
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        type: row.type,
        period: row.period,
        startDate: row.start_date.toISOString(),
        endDate: row.end_date.toISOString(),
        data: row.data,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
      
    } catch (error) {
      logger.error('Error updating report:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Delete a report
   */
  async deleteReport(id: string, userId: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = `
        DELETE FROM reports
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      
      const result = await client.query(query, [id, userId]);
      
      return result.rows.length > 0;
      
    } catch (error) {
      logger.error('Error deleting report:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new ReportsModel();