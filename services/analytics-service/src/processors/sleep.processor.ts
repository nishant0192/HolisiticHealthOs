import { HealthMetric } from '@shared/common';
import * as statistics from '../utils/statistics';
import { format, isValid } from 'date-fns';
import { fillMissingDates } from '../utils/date-handling';
import { logger } from '@shared/logger';

interface SleepSummary {
  totalSleepHours: number;
  averageSleepHours: number;
  averageSleepQuality: number; // 0-100
  averageDeepSleepPercentage: number;
  averageRemSleepPercentage: number;
  averageLightSleepPercentage: number;
  bestSleepDay: {
    date: string;
    duration: number;
    quality: number;
  } | null;
  worstSleepDay: {
    date: string;
    duration: number;
    quality: number;
  } | null;
  daysWithOptimalSleep: number; // 7-9 hours
  daysWithInsufficientSleep: number; // < 7 hours
  daysWithExcessiveSleep: number; // > 9 hours
}

interface SleepTrends {
  durationTrend: {
    direction: string;
    significance: string;
    changePercentage: number;
  };
  qualityTrend: {
    direction: string;
    significance: string;
    changePercentage: number;
  };
  weekdayVsWeekendDifference: number; // minutes
  sleepConsistency: number; // 0-100 score
}

interface DailySleepStats {
  date: string;
  duration: number; // in hours
  quality: number; // 0-100
  deepSleepPercentage: number;
  remSleepPercentage: number;
  lightSleepPercentage: number;
  startTime: string; // ISO time string
  endTime: string; // ISO time string
}

interface SleepRecommendation {
  type: string;
  message: string;
  reason: string;
  priority: number; // 1-3 (high to low)
}

interface SleepInsights {
  summary: SleepSummary;
  trends: SleepTrends;
  dailyStats: DailySleepStats[];
  recommendations: SleepRecommendation[];
}

/**
 * Process sleep data to generate insights
 */
export function processSleep(sleepData: HealthMetric[], days: number = 30): SleepInsights {
  try {
    // Group data by date
    const dateMap: Record<string, {
      duration: number[];
      quality: number[];
      deepSleep: number[];
      remSleep: number[];
      lightSleep: number[];
      startTime: string[];
      endTime: string[];
    }> = {};
    
    // Process all data points
    sleepData.forEach(data => {
      // Skip invalid data
      if (!isValid(new Date(data.ts))) {
        return;
      }
      
      // Extract date part only
      const dateStr = format(new Date(data.ts), 'yyyy-MM-dd');
      
      // Initialize the date entry if it doesn't exist
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          duration: [],
          quality: [],
          deepSleep: [],
          remSleep: [],
          lightSleep: [],
          startTime: [],
          endTime: []
        };
      }
      
      // Add data by type
      switch (data.type) {
        case 'sleep_duration':
          dateMap[dateStr].duration.push(data.value);
          break;
        case 'sleep_quality':
          dateMap[dateStr].quality.push(data.value);
          break;
        case 'deep_sleep':
          dateMap[dateStr].deepSleep.push(data.value);
          break;
        case 'rem_sleep':
          dateMap[dateStr].remSleep.push(data.value);
          break;
        case 'light_sleep':
          dateMap[dateStr].lightSleep.push(data.value);
          break;
        case 'sleep_start':
          dateMap[dateStr].startTime.push(data.ts);
          break;
        case 'sleep_end':
          dateMap[dateStr].endTime.push(data.ts);
          break;
      }
    });
    
    // Convert the map to daily statistics
    let dailyStats: DailySleepStats[] = Object.entries(dateMap).map(([date, data]) => {
      // Calculate average values for the day
      const duration = statistics.mean(data.duration);
      const quality = statistics.mean(data.quality);
      
      // Ensure sleep stage percentages add up to 100%
      let deepSleepPercentage = statistics.mean(data.deepSleep);
      let remSleepPercentage = statistics.mean(data.remSleep);
      let lightSleepPercentage = statistics.mean(data.lightSleep);
      
      // If any value is missing, estimate it
      const total = deepSleepPercentage + remSleepPercentage + lightSleepPercentage;
      if (total === 0) {
        // Use typical sleep stage distribution if no data
        deepSleepPercentage = 15;
        remSleepPercentage = 25;
        lightSleepPercentage = 60;
      } else if (total !== 100) {
        // Normalize to ensure percentages sum to 100
        const factor = 100 / total;
        deepSleepPercentage *= factor;
        remSleepPercentage *= factor;
        lightSleepPercentage *= factor;
      }
      
      // Use the latest start and end times if available
      const startTime = data.startTime.length > 0 
        ? data.startTime[data.startTime.length - 1] 
        : "";
      
      const endTime = data.endTime.length > 0 
        ? data.endTime[data.endTime.length - 1] 
        : "";
      
      return {
        date,
        duration, // in hours
        quality, // 0-100
        deepSleepPercentage,
        remSleepPercentage,
        lightSleepPercentage,
        startTime,
        endTime
      };
    });
    
    // Sort by date (ascending)
    dailyStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate the date range
    const today = new Date();
    const oldestDate = new Date(today);
    oldestDate.setDate(today.getDate() - days + 1);
    
    // Fill in missing dates with default values
    dailyStats = fillMissingDates(
      dailyStats,
      oldestDate,
      today,
      'date',
      { 
        duration: 0, 
        quality: 0, 
        deepSleepPercentage: 0, 
        remSleepPercentage: 0, 
        lightSleepPercentage: 0,
        startTime: "",
        endTime: ""
      }
    );
    
    // Calculate summary statistics
    const totalDays = dailyStats.length;
    const sleepRecordedDays = dailyStats.filter(day => day.duration > 0).length;
    const sleepConsistency = Math.round((sleepRecordedDays / totalDays) * 100);
    
    const totalSleepHours = dailyStats.reduce((sum, day) => sum + day.duration, 0);
    const averageSleepHours = sleepRecordedDays > 0 
      ? totalSleepHours / sleepRecordedDays 
      : 0;
    
    const averageSleepQuality = sleepRecordedDays > 0
      ? dailyStats.reduce((sum, day) => sum + day.quality, 0) / sleepRecordedDays
      : 0;
    
    const averageDeepSleepPercentage = sleepRecordedDays > 0
      ? dailyStats.reduce((sum, day) => sum + day.deepSleepPercentage, 0) / sleepRecordedDays
      : 0;
    
    const averageRemSleepPercentage = sleepRecordedDays > 0
      ? dailyStats.reduce((sum, day) => sum + day.remSleepPercentage, 0) / sleepRecordedDays
      : 0;
    
    const averageLightSleepPercentage = sleepRecordedDays > 0
      ? dailyStats.reduce((sum, day) => sum + day.lightSleepPercentage, 0) / sleepRecordedDays
      : 0;
    
    // Calculate days with different sleep durations
    const daysWithOptimalSleep = dailyStats.filter(
      day => day.duration >= 7 && day.duration <= 9
    ).length;
    
    const daysWithInsufficientSleep = dailyStats.filter(
      day => day.duration > 0 && day.duration < 7
    ).length;
    
    const daysWithExcessiveSleep = dailyStats.filter(
      day => day.duration > 9
    ).length;
    
    // Find best and worst sleep days
    const sleepRecordedDataDays = dailyStats.filter(day => day.duration > 0);
    
    let bestSleepDay: DailySleepStats | null = null;
    let worstSleepDay: DailySleepStats | null = null;
    
    if (sleepRecordedDataDays.length > 0) {
      // Best sleep day has highest quality and sufficient duration
      bestSleepDay = sleepRecordedDataDays.reduce((best, day) => {
        // Prioritize sleep duration between 7-9 hours with high quality
        const bestScore = (best.duration >= 7 && best.duration <= 9 ? 50 : 0) + best.quality;
        const dayScore = (day.duration >= 7 && day.duration <= 9 ? 50 : 0) + day.quality;
        
        return dayScore > bestScore ? day : best;
      }, sleepRecordedDataDays[0]);
      
      // Worst sleep day has lowest quality and insufficient duration
      worstSleepDay = sleepRecordedDataDays.reduce((worst, day) => {
        // Prioritize insufficient sleep with low quality
        const worstScore = (worst.duration < 7 ? 50 : 0) + (100 - worst.quality);
        const dayScore = (day.duration < 7 ? 50 : 0) + (100 - day.quality);
        
        return dayScore > worstScore ? day : worst;
      }, sleepRecordedDataDays[0]);
    }
    
    // Calculate trends
    const durationPerDay = dailyStats.map(day => day.duration);
    const qualityPerDay = dailyStats.map(day => day.quality);
    
    // Only calculate trends if we have some non-zero data
    const durationTrend = durationPerDay.some(duration => duration > 0)
      ? statistics.calculateTrend(durationPerDay)
      : { direction: 'insufficient_data', significance: 'none' };
    
    const qualityTrend = qualityPerDay.some(quality => quality > 0)
      ? statistics.calculateTrend(qualityPerDay)
      : { direction: 'insufficient_data', significance: 'none' };
    
    // Calculate weekday vs weekend difference (in minutes)
    const weekdayStats = dailyStats.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5 && day.duration > 0; // Monday to Friday with recorded sleep
    });
    
    const weekendStats = dailyStats.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) && day.duration > 0; // Sunday or Saturday with recorded sleep
    });
    
    const avgWeekdaySleep = weekdayStats.length > 0
      ? weekdayStats.reduce((sum, day) => sum + day.duration, 0) / weekdayStats.length
      : 0;
    
    const avgWeekendSleep = weekendStats.length > 0
      ? weekendStats.reduce((sum, day) => sum + day.duration, 0) / weekendStats.length
      : 0;
    
    // Calculate difference in minutes
    const weekdayVsWeekendDifference = Math.abs(avgWeekdaySleep - avgWeekendSleep) * 60;
    
    // Calculate change percentages for trends
    const durationChangePercentage = calculateChangePercentage(durationPerDay);
    const qualityChangePercentage = calculateChangePercentage(qualityPerDay);
    
    // Generate recommendations
    const recommendations = generateSleepRecommendations(
      dailyStats,
      {
        sleepConsistency,
        durationTrend,
        qualityTrend,
        averageSleepHours,
        weekdayVsWeekendDifference,
        daysWithInsufficientSleep,
        sleepRecordedDays,
        deepSleepPercentage: averageDeepSleepPercentage
      }
    );
    
    // Create the insights object
    const insights: SleepInsights = {
      summary: {
        totalSleepHours,
        averageSleepHours,
        averageSleepQuality,
        averageDeepSleepPercentage,
        averageRemSleepPercentage,
        averageLightSleepPercentage,
        bestSleepDay: bestSleepDay ? {
          date: bestSleepDay.date,
          duration: bestSleepDay.duration,
          quality: bestSleepDay.quality
        } : null,
        worstSleepDay: worstSleepDay ? {
          date: worstSleepDay.date,
          duration: worstSleepDay.duration,
          quality: worstSleepDay.quality
        } : null,
        daysWithOptimalSleep,
        daysWithInsufficientSleep,
        daysWithExcessiveSleep
      },
      trends: {
        durationTrend: {
          direction: durationTrend.direction,
          significance: durationTrend.significance,
          changePercentage: durationChangePercentage
        },
        qualityTrend: {
          direction: qualityTrend.direction,
          significance: qualityTrend.significance,
          changePercentage: qualityChangePercentage
        },
        weekdayVsWeekendDifference,
        sleepConsistency
      },
      dailyStats,
      recommendations
    };
    
    return insights;
  } catch (error) {
    logger.error('Error processing sleep data:', error);
    throw error;
  }
}

/**
 * Calculate percentage change between beginning and end of a time series
 */
function calculateChangePercentage(data: number[]): number {
  if (data.length < 2) {
    return 0;
  }
  
  // Divide the data into first half and second half
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);
  
  // Filter out zero values
  const nonZeroFirstHalf = firstHalf.filter(val => val > 0);
  const nonZeroSecondHalf = secondHalf.filter(val => val > 0);
  
  // If not enough data points, return 0
  if (nonZeroFirstHalf.length === 0 || nonZeroSecondHalf.length === 0) {
    return 0;
  }
  
  const firstHalfAvg = statistics.mean(nonZeroFirstHalf);
  const secondHalfAvg = statistics.mean(nonZeroSecondHalf);
  
  if (firstHalfAvg === 0) {
    return 0;
  }
  
  return Math.round((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100);
}

/**
 * Generate sleep recommendations based on insights
 */
function generateSleepRecommendations(
  _dailyStats: DailySleepStats[],
  metrics: {
    sleepConsistency: number;
    durationTrend: { direction: string; significance: string };
    qualityTrend: { direction: string; significance: string };
    averageSleepHours: number;
    weekdayVsWeekendDifference: number;
    daysWithInsufficientSleep: number;
    sleepRecordedDays: number;
    deepSleepPercentage: number;
  }
): SleepRecommendation[] {
  const recommendations: SleepRecommendation[] = [];
  
  // Check sleep consistency
  if (metrics.sleepConsistency < 80) {
    recommendations.push({
      type: 'consistency',
      message: 'Try to maintain a consistent sleep schedule, even on weekends.',
      reason: `Your sleep was tracked on only ${metrics.sleepConsistency}% of days.`,
      priority: 3
    });
  }
  
  // Check sleep duration trend
  if (metrics.durationTrend.direction === 'decreasing' && 
      metrics.durationTrend.significance !== 'none') {
    recommendations.push({
      type: 'duration_trend',
      message: 'Your sleep duration is decreasing. Try to prioritize sufficient sleep time.',
      reason: 'Your average nightly sleep duration has been decreasing over time.',
      priority: 1
    });
  }
  
  // Check sleep quality trend
  if (metrics.qualityTrend.direction === 'decreasing' && 
      metrics.qualityTrend.significance !== 'none') {
    recommendations.push({
      type: 'quality_trend',
      message: 'Your sleep quality is decreasing. Consider adjusting your sleep environment or pre-sleep routine.',
      reason: 'Your sleep quality metrics have been declining over time.',
      priority: 2
    });
  }
  
  // Check average sleep duration
  if (metrics.averageSleepHours < 7) {
    recommendations.push({
      type: 'insufficient_sleep',
      message: 'Try to get at least 7 hours of sleep per night for optimal health.',
      reason: `Your current average is ${metrics.averageSleepHours.toFixed(1)} hours per night.`,
      priority: 1
    });
  }
  
  // Check weekday vs weekend difference
  if (metrics.weekdayVsWeekendDifference > 90) { // More than 90 minutes difference
    recommendations.push({
      type: 'social_jetlag',
      message: 'Try to keep your sleep and wake times consistent throughout the week.',
      reason: `There's a ${Math.round(metrics.weekdayVsWeekendDifference)} minute difference between your weekday and weekend sleep duration.`,
      priority: 2
    });
  }
  
  // Check for frequent insufficient sleep
  if (metrics.daysWithInsufficientSleep > metrics.sleepRecordedDays * 0.3) { // More than 30% of days
    recommendations.push({
      type: 'sleep_debt',
      message: 'You may be accumulating sleep debt. Try to prioritize recovery with consistent adequate sleep.',
      reason: `You had insufficient sleep (less than 7 hours) on ${metrics.daysWithInsufficientSleep} days.`,
      priority: 1
    });
  }
  
  // Check deep sleep percentage
  if (metrics.deepSleepPercentage < 10) {
    recommendations.push({
      type: 'deep_sleep',
      message: 'Your deep sleep percentage is low. Consider limiting alcohol and caffeine, especially in the evening.',
      reason: 'Deep sleep is essential for physical recovery and memory consolidation.',
      priority: 2
    });
  }
  
  return recommendations;
}