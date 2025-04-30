import { Pool } from 'pg';
import { databaseConfig } from '../config';
import { logger } from '@shared/logger';
import axios from 'axios';
import { appConfig } from '../config';

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

interface PopulationStats {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

interface UserProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  fitnessLevel?: string;
  healthConditions?: string[];
}

class DataAccessService {
  /**
   * Get user profile data from the User Service
   */
  async getUserProfile(userId: string, token: string): Promise<UserProfileData | null> {
    try {
      const response = await axios.get(`${appConfig.serviceUrls.user}/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200 && response.data.success) {
        return response.data.data;
      } else {
        logger.warn('Failed to get user profile:', response.data);
        return null;
      }
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      return null;
    }
  }
  
  /**
   * Get population statistics for a specific metric type
   */
  async getPopulationStats(metricType: string): Promise<PopulationStats | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          AVG(value::float) as mean,
          STDDEV(value::float) as std_dev,
          MIN(value::float) as min,
          MAX(value::float) as max,
          COUNT(*) as count
        FROM 
          health_data
        WHERE 
          type = $1
          AND timestamp >= NOW() - INTERVAL '90 days'
      `;
      
      const result = await client.query(query, [metricType]);
      
      if (result.rows.length === 0 || result.rows[0].count === '0') {
        return null;
      }
      
      const stats = result.rows[0];
      return {
        mean: parseFloat(stats.mean) || 0,
        stdDev: parseFloat(stats.std_dev) || 0,
        min: parseFloat(stats.min) || 0,
        max: parseFloat(stats.max) || 0,
        count: parseInt(stats.count, 10)
      };
      
    } catch (error) {
      logger.error('Error fetching population stats:', error);
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get age and gender specific statistics for a metric
   */
  async getDemographicStats(metricType: string, age: number, gender: string): Promise<PopulationStats | null> {
    const client = await pool.connect();
    
    try {
      // Age ranges: <18, 18-29, 30-39, 40-49, 50-59, 60+
      let ageRange;
      if (age < 18) ageRange = '0-17';
      else if (age < 30) ageRange = '18-29';
      else if (age < 40) ageRange = '30-39';
      else if (age < 50) ageRange = '40-49';
      else if (age < 60) ageRange = '50-59';
      else ageRange = '60+';
      
      const query = `
        SELECT 
          AVG(h.value::float) as mean,
          STDDEV(h.value::float) as std_dev,
          MIN(h.value::float) as min,
          MAX(h.value::float) as max,
          COUNT(*) as count
        FROM 
          health_data h
        JOIN
          user_profiles p ON h.user_id = p.user_id
        WHERE 
          h.type = $1
          AND p.age_range = $2
          AND p.gender = $3
          AND h.timestamp >= NOW() - INTERVAL '90 days'
      `;
      
      const result = await client.query(query, [metricType, ageRange, gender]);
      
      if (result.rows.length === 0 || result.rows[0].count === '0') {
        // If no demographic-specific data, fall back to overall population stats
        return await this.getPopulationStats(metricType);
      }
      
      const stats = result.rows[0];
      return {
        mean: parseFloat(stats.mean) || 0,
        stdDev: parseFloat(stats.std_dev) || 0,
        min: parseFloat(stats.min) || 0,
        max: parseFloat(stats.max) || 0,
        count: parseInt(stats.count, 10)
      };
      
    } catch (error) {
      logger.error('Error fetching demographic stats:', error);
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get metrics for a user from the Integration Service
   */
  async getUserMetricsFromIntegration(userId: string, metricType: string, token: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${appConfig.serviceUrls.integration}/metrics/${metricType}`, 
        {
          params: { user_id: userId },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200 && response.data.success) {
        return response.data.data;
      } else {
        logger.warn('Failed to get user metrics from integration service:', response.data);
        return [];
      }
    } catch (error) {
      logger.error('Error fetching user metrics from integration service:', error);
      return [];
    }
  }
  
  /**
   * Get user health data based on a date range
   */
  async getUserHealthData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          id, user_id, timestamp, source, type, value, unit
        FROM 
          health_data
        WHERE 
          user_id = $1
          AND timestamp >= $2
          AND timestamp <= $3
        ORDER BY
          timestamp DESC
      `;
      
      const result = await client.query(query, [userId, startDate, endDate]);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        timestamp: row.timestamp.toISOString(),
        source: row.source,
        type: row.type,
        value: parseFloat(row.value),
        unit: row.unit
      }));
      
    } catch (error) {
      logger.error('Error fetching user health data:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get health metrics grouped by date
   */
  async getMetricsByDate(userId: string, metricType: string, startDate: Date, endDate: Date): Promise<any[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          DATE_TRUNC('day', timestamp) as date,
          AVG(value::float) as avg_value,
          SUM(value::float) as sum_value,
          COUNT(*) as count,
          MIN(value::float) as min_value,
          MAX(value::float) as max_value
        FROM 
          health_data
        WHERE 
          user_id = $1
          AND type = $2
          AND timestamp >= $3
          AND timestamp <= $4
        GROUP BY
          DATE_TRUNC('day', timestamp)
        ORDER BY
          date DESC
      `;
      
      const result = await client.query(query, [userId, metricType, startDate, endDate]);
      
      return result.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        average: parseFloat(row.avg_value) || 0,
        sum: parseFloat(row.sum_value) || 0,
        count: parseInt(row.count, 10),
        min: parseFloat(row.min_value) || 0,
        max: parseFloat(row.max_value) || 0
      }));
      
    } catch (error) {
      logger.error('Error fetching metrics by date:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get distribution of a specific metric across all users
   */
  async getMetricDistribution(metricType: string): Promise<any> {
    const client = await pool.connect();
    
    try {
      const query = `
        WITH ranges AS (
          SELECT
            CASE
              WHEN value::float < percentile_cont(0.1) WITHIN GROUP (ORDER BY value::float) THEN 'lowest_10'
              WHEN value::float < percentile_cont(0.25) WITHIN GROUP (ORDER BY value::float) THEN 'low_25'
              WHEN value::float < percentile_cont(0.5) WITHIN GROUP (ORDER BY value::float) THEN 'mid_50_lower'
              WHEN value::float < percentile_cont(0.75) WITHIN GROUP (ORDER BY value::float) THEN 'mid_50_upper'
              WHEN value::float < percentile_cont(0.9) WITHIN GROUP (ORDER BY value::float) THEN 'high_25'
              ELSE 'highest_10'
            END as range_bucket,
            count(*) as count
          FROM health_data
          WHERE type = $1
          AND timestamp >= NOW() - INTERVAL '90 days'
          GROUP BY range_bucket
        )
        SELECT
          range_bucket,
          count,
          (count * 100.0 / sum(count) OVER ()) as percentage
        FROM ranges
        ORDER BY
          CASE range_bucket
            WHEN 'lowest_10' THEN 1
            WHEN 'low_25' THEN 2
            WHEN 'mid_50_lower' THEN 3
            WHEN 'mid_50_upper' THEN 4
            WHEN 'high_25' THEN 5
            WHEN 'highest_10' THEN 6
          END
      `;
      
      const result = await client.query(query, [metricType]);
      
      // Calculate percentiles
      const percentilesQuery = `
        SELECT
          percentile_cont(0.1) WITHIN GROUP (ORDER BY value::float) as p10,
          percentile_cont(0.25) WITHIN GROUP (ORDER BY value::float) as p25,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY value::float) as p50,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY value::float) as p75,
          percentile_cont(0.9) WITHIN GROUP (ORDER BY value::float) as p90
        FROM health_data
        WHERE type = $1
        AND timestamp >= NOW() - INTERVAL '90 days'
      `;
      
      const percentilesResult = await client.query(percentilesQuery, [metricType]);
      
      return {
        distribution: result.rows.map(row => ({
          range: row.range_bucket,
          count: parseInt(row.count, 10),
          percentage: parseFloat(row.percentage)
        })),
        percentiles: {
          p10: parseFloat(percentilesResult.rows[0].p10) || 0,
          p25: parseFloat(percentilesResult.rows[0].p25) || 0,
          p50: parseFloat(percentilesResult.rows[0].p50) || 0,
          p75: parseFloat(percentilesResult.rows[0].p75) || 0,
          p90: parseFloat(percentilesResult.rows[0].p90) || 0
        }
      };
      
    } catch (error) {
      logger.error('Error fetching metric distribution:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new DataAccessService();