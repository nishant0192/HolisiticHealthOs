/**
 * Statistics utility functions for data analysis
 */

/**
 * Calculate the mean (average) of an array of numbers
 */
export function mean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }
  
  /**
   * Calculate the median of an array of numbers
   */
  export function median(data: number[]): number {
    if (data.length === 0) return 0;
    
    const sortedData = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sortedData.length / 2);
    
    return sortedData.length % 2 !== 0
      ? sortedData[mid]
      : (sortedData[mid - 1] + sortedData[mid]) / 2;
  }
  
  /**
   * Calculate the variance of an array of numbers
   */
  export function variance(data: number[]): number {
    if (data.length <= 1) return 0;
    
    const avg = mean(data);
    const squareDiffs = data.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    
    return mean(squareDiffs);
  }
  
  /**
   * Calculate the standard deviation of an array of numbers
   */
  export function standardDeviation(data: number[]): number {
    return Math.sqrt(variance(data));
  }
  
  /**
   * Calculate the Pearson correlation coefficient between two arrays
   */
  export function correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }
    
    const n = x.length;
    
    // Calculate means
    const meanX = mean(x);
    const meanY = mean(y);
    
    // Calculate sum of products of deviations
    let sumProducts = 0;
    let sumSquaresX = 0;
    let sumSquaresY = 0;
    
    for (let i = 0; i < n; i++) {
      const xDev = x[i] - meanX;
      const yDev = y[i] - meanY;
      
      sumProducts += xDev * yDev;
      sumSquaresX += xDev * xDev;
      sumSquaresY += yDev * yDev;
    }
    
    // Handle division by zero
    if (sumSquaresX === 0 || sumSquaresY === 0) {
      return 0;
    }
    
    return sumProducts / (Math.sqrt(sumSquaresX) * Math.sqrt(sumSquaresY));
  }
  
  /**
   * Calculate the linear regression (y = mx + b) for two arrays
   */
  export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    if (x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0, r2: 0 };
    }
    
    const n = x.length;
    
    // Calculate means
    const meanX = mean(x);
    const meanY = mean(y);
    
    // Calculate slope (m)
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDev = x[i] - meanX;
      numerator += xDev * (y[i] - meanY);
      denominator += xDev * xDev;
    }
    
    // Handle division by zero
    if (denominator === 0) {
      return { slope: 0, intercept: meanY, r2: 0 };
    }
    
    const slope = numerator / denominator;
    
    // Calculate intercept (b)
    const intercept = meanY - slope * meanX;
    
    // Calculate coefficient of determination (R^2)
    const r = correlation(x, y);
    const r2 = r * r;
    
    return { slope, intercept, r2 };
  }
  
  /**
   * Calculate the percentile of a value in a normal distribution
   */
  export function calculatePercentile(value: number, mean: number, stdDev: number): number {
    // Calculate z-score
    const z = (value - mean) / stdDev;
    
    // Use error function (erf) to calculate cumulative distribution function (CDF)
    // This is an approximation of the normal CDF
    const percentile = 0.5 * (1 + erf(z / Math.sqrt(2))) * 100;
    
    return Math.min(Math.max(percentile, 0), 100); // Clamp to [0, 100]
  }
  
  /**
   * Error function (erf) approximation
   */
  function erf(x: number): number {
    // Constants
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
  
    // Save the sign of x
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
  
    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
    return sign * y;
  }
  
  /**
   * Calculate trend direction and significance
   */
  export function calculateTrend(data: number[]): { direction: string; significance: string } {
    if (data.length < 3) {
      return { direction: 'insufficient_data', significance: 'none' };
    }
    
    // Generate x values (time indices)
    const x = Array.from({ length: data.length }, (_, i) => i);
    
    // Calculate regression
    const { slope, r2 } = linearRegression(x, data);
    
    // Determine direction
    let direction;
    if (Math.abs(slope) < 0.001) {
      direction = 'stable';
    } else {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }
    
    // Determine significance based on R^2 value
    let significance;
    if (r2 < 0.1) {
      significance = 'none';
    } else if (r2 < 0.3) {
      significance = 'low';
    } else if (r2 < 0.5) {
      significance = 'moderate';
    } else if (r2 < 0.7) {
      significance = 'high';
    } else {
      significance = 'very_high';
    }
    
    return { direction, significance };
  }
  
  /**
   * Calculate the z-score of a value
   */
  export function zScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }
  
  /**
   * Calculate moving average of a time series
   */
  export function movingAverage(data: number[], windowSize: number): number[] {
    if (windowSize < 1 || data.length < windowSize) {
      return data;
    }
    
    const result: number[] = [];
    
    for (let i = 0; i <= data.length - windowSize; i++) {
      const window = data.slice(i, i + windowSize);
      result.push(mean(window));
    }
    
    return result;
  }
  
  /**
   * Get statistical summary of a dataset
   */
  export function getSummaryStats(data: number[]): {
    count: number;
    min: number;
    max: number;
    range: number;
    mean: number;
    median: number;
    stdDev: number;
    q1: number;
    q3: number;
    iqr: number;
  } {
    if (data.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        range: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        q1: 0,
        q3: 0,
        iqr: 0
      };
    }
    
    const sortedData = [...data].sort((a, b) => a - b);
    const count = data.length;
    const min = sortedData[0];
    const max = sortedData[count - 1];
    const range = max - min;
    const meanValue = mean(data);
    const medianValue = median(data);
    const stdDevValue = standardDeviation(data);
    
    // Calculate quartiles
    const q1Index = Math.floor(count * 0.25);
    const q3Index = Math.floor(count * 0.75);
    const q1 = sortedData[q1Index];
    const q3 = sortedData[q3Index];
    const iqr = q3 - q1;
    
    return {
      count,
      min,
      max,
      range,
      mean: meanValue,
      median: medianValue,
      stdDev: stdDevValue,
      q1,
      q3,
      iqr
    };
  }