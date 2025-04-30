import { Pool } from 'pg';
import { databaseConfig } from '../config';
import { logger } from '@shared/logger';
import { HealthMetric } from '@shared/common';

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

// Log pool events
pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Interface for filtering health data queries
export interface HealthDataFilter {
  userId: string;
  type?: string | string[];
  source?: string | string[];
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
  offset?: number;
}

export interface HealthDataStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
  stdDev: number;
}

class HealthDataModel {
  /**
   * Get health data for a user with filtering options
   */
  async getHealthData(filter: HealthDataFilter): Promise<HealthMetric[]> {
    const client = await pool.connect();
    
    try {
      // Build query with parameterized values
      let query = `
        SELECT 
          id, user_id, timestamp, source, type, value, unit
        FROM 
          health_data
        WHERE 
          user_id = $1
      `;
      
      // Array to store parameters
      const params: any[] = [filter.userId];
      let paramIndex = 2;
      
      // Add type filter if provided
      if (filter.type) {
        if (Array.isArray(filter.type)) {
          query += ` AND type = ANY($${paramIndex})`;
          params.push(filter.type);
        } else {
          query += ` AND type = $${paramIndex}`;
          params.push(filter.type);
        }
        paramIndex++;
      }
      
      // Add source filter if provided
      if (filter.source) {
        if (Array.isArray(filter.source)) {
          query += ` AND source = ANY($${paramIndex})`;
          params.push(filter.source);
        } else {
          query += ` AND source = $${paramIndex}`;
          params.push(filter.source);
        }
        paramIndex++;
      }
      
      // Add date range filters if provided
      if (filter.startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(new Date(filter.startDate));
        paramIndex++;
      }
      
      if (filter.endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(new Date(filter.endDate));
        paramIndex++;
      }
      
      // Add ordering
      query += ` ORDER BY timestamp DESC`;
      
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
      
      // Transform database rows to HealthMetric objects
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        ts: row.timestamp.toISOString(),
        source: row.source,
        type: row.type,
        value: parseFloat(row.value),
        unit: row.unit
      }));
      
    } catch (error) {
      logger.error('Error retrieving health data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get aggregate statistics for a specific health data type
   */
  async getStatistics(filter: HealthDataFilter): Promise<HealthDataStats> {
    const client = await pool.connect();
    
    try {
      // Build query with parameterized values
      let query = `
        SELECT 
          COUNT(*) as count,
          MIN(value::float) as min,
          MAX(value::float) as max,
          AVG(value::float) as avg,
          SUM(value::float) as sum,
          STDDEV(value::float) as stddev
        FROM 
          health_data
        WHERE 
          user_id = $1
      `;
      
      // Array to store parameters
      const params: any[] = [filter.userId];
      let paramIndex = 2;
      
      // Add type filter if provided
      if (filter.type) {
        if (Array.isArray(filter.type)) {
          query += ` AND type = ANY($${paramIndex})`;
          params.push(filter.type);
        } else {
          query += ` AND type = $${paramIndex}`;
          params.push(filter.type);
        }
        paramIndex++;
      }
      
      // Add source filter if provided
      if (filter.source) {
        if (Array.isArray(filter.source)) {
          query += ` AND source = ANY($${paramIndex})`;
          params.push(filter.source);
        } else {
          query += ` AND source = $${paramIndex}`;
          params.push(filter.source);
        }
        paramIndex++;
      }
      
      // Add date range filters if provided
      if (filter.startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(new Date(filter.startDate));
        paramIndex++;
      }
      
      if (filter.endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(new Date(filter.endDate));
      }
      
      // Execute query
      const result = await client.query(query, params);
      
      // Return statistics or default values if no data
      if (result.rows.length === 0 || result.rows[0].count === '0') {
        return {
          count: 0,
          min: 0,
          max: 0,
          avg: 0,
          sum: 0,
          stdDev: 0
        };
      }
      
      const stats = result.rows[0];
      return {
        count: parseInt(stats.count, 10),
        min: parseFloat(stats.min) || 0,
        max: parseFloat(stats.max) || 0,
        avg: parseFloat(stats.avg) || 0,
        sum: parseFloat(stats.sum) || 0,
        stdDev: parseFloat(stats.stddev) || 0
      };
      
    } catch (error) {
      logger.error('Error getting health data statistics:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get daily aggregated data for a specific metric
   */
  async getDailyAggregates(filter: HealthDataFilter): Promise<any[]> {
    const client = await pool.connect();
    
    try {
      // Build query with parameterized values
      let query = `
        SELECT 
          DATE_TRUNC('day', timestamp) as date,
          COUNT(*) as count,
          AVG(value::float) as avg,
          SUM(value::float) as sum,
          MIN(value::float) as min,
          MAX(value::float) as max
        FROM 
          health_data
        WHERE 
          user_id = $1
      `;
      
      // Array to store parameters
      const params: any[] = [filter.userId];
      let paramIndex = 2;
      
      // Add type filter if provided
      if (filter.type) {
        if (Array.isArray(filter.type)) {
          query += ` AND type = ANY($${paramIndex})`;
          params.push(filter.type);
        } else {
          query += ` AND type = $${paramIndex}`;
          params.push(filter.type);
        }
        paramIndex++;
      }
      
      // Add source filter if provided
      if (filter.source) {
        if (Array.isArray(filter.source)) {
          query += ` AND source = ANY($${paramIndex})`;
          params.push(filter.source);
        } else {
          query += ` AND source = $${paramIndex}`;
          params.push(filter.source);
        }
        paramIndex++;
      }
      
      // Add date range filters if provided
      if (filter.startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(new Date(filter.startDate));
        paramIndex++;
      }
      
      if (filter.endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(new Date(filter.endDate));
        paramIndex++;
      }
      
      // Group by date and order
      query += ` 
        GROUP BY DATE_TRUNC('day', timestamp)
        ORDER BY date DESC
      `;
      
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
      
      // Transform result
      return result.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        count: parseInt(row.count, 10),
        avg: parseFloat(row.avg) || 0,
        sum: parseFloat(row.sum) || 0,
        min: parseFloat(row.min) || 0,
        max: parseFloat(row.max) || 0
      }));
      
    } catch (error) {
      logger.error('Error getting daily aggregates:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Insert a new health data record
   */
  async insertHealthData(data: Omit<HealthMetric, 'id'>): Promise<HealthMetric> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO health_data
          (user_id, timestamp, source, type, value, unit)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const params = [
        data.userId,
        new Date(data.ts),
        data.source,
        data.type,
        data.value,
        data.unit
      ];
      
      const result = await client.query(query, params);
      
      return {
        id: result.rows[0].id,
        ...data
      };
      
    } catch (error) {
      logger.error('Error inserting health data:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new HealthDataModel();