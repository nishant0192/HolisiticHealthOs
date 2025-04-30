import { HealthMetric } from '@shared/common';
import * as statistics from '../utils/statistics';
import { format, isValid } from 'date-fns';
import { fillMissingDates } from '../utils/date-handling';
import { logger } from '@shared/logger';

interface ActivitySummary {
  totalSteps: number;
  totalDistance: number;
  totalCalories: number;
  totalDuration: number;
  averageStepsPerDay: number;
  averageDistancePerDay: number;
  averageCaloriesPerDay: number;
  averageDurationPerDay: number;
  mostActiveDay: {
    date: string;
    steps: number;
    distance: number;
    calories: number;
    duration: number;
  } | null;
  leastActiveDay: {
    date: string;
    steps: number;
    distance: number;
    calories: number;
    duration: number;
  } | null;
}

interface ActivityTrends {
  stepsPerDayTrend: {
    direction: string;
    significance: string;
    changePercentage: number;
  };
  caloriesPerDayTrend: {
    direction: string;
    significance: string;
    changePercentage: number;
  };
  activityConsistency: number; // 0-100 score
  weekdayVsWeekendDifference: number; // percentage
}

interface DailyActivityStats {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  duration: number;
  intensity: number;
}

interface ActivityRecommendation {
  type: string;
  message: string;
  reason: string;
  priority: number; // 1-3 (high to low)
}

interface ActivityInsights {
  summary: ActivitySummary;
  trends: ActivityTrends;
  dailyStats: DailyActivityStats[];
  recommendations: ActivityRecommendation[];
}

/**
 * Process activity data to generate insights
 */
export function processActivity(activityData: HealthMetric[], days: number = 30): ActivityInsights {
  try {
    // Group data by date
    const dateMap: Record<string, {
      steps: number[];
      distance: number[];
      calories: number[];
      duration: number[];
    }> = {};
    
    // Process all data points
    activityData.forEach(data => {
      // Skip invalid data
      if (!isValid(new Date(data.ts))) {
        return;
      }
      
      // Extract date part only
      const dateStr = format(new Date(data.ts), 'yyyy-MM-dd');
      
      // Initialize the date entry if it doesn't exist
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          steps: [],
          distance: [],
          calories: [],
          duration: []
        };
      }
      
      // Add data by type
      switch (data.type) {
        case 'steps':
          dateMap[dateStr].steps.push(data.value);
          break;
        case 'distance':
          dateMap[dateStr].distance.push(data.value);
          break;
        case 'calories':
          dateMap[dateStr].calories.push(data.value);
          break;
        case 'duration':
          dateMap[dateStr].duration.push(data.value);
          break;
      }
    });
    
    // Convert the map to daily statistics
    let dailyStats: DailyActivityStats[] = Object.entries(dateMap).map(([date, data]) => {
      const stepsSum = data.steps.reduce((sum, val) => sum + val, 0);
      const distanceSum = data.distance.reduce((sum, val) => sum + val, 0);
      const caloriesSum = data.calories.reduce((sum, val) => sum + val, 0);
      const durationSum = data.duration.reduce((sum, val) => sum + val, 0);
      
      // Calculate intensity score (0-100)
      // Higher scores for more steps, more calories burned, and longer duration
      const stepsScore = Math.min(stepsSum / 10000 * 100, 100); // 10k steps = 100%
      const caloriesScore = Math.min(caloriesSum / 500 * 100, 100); // 500 calories = 100%
      const durationScore = Math.min(durationSum / 60 * 100, 100); // 60 mins = 100%
      
      const intensity = Math.round((stepsScore + caloriesScore + durationScore) / 3);
      
      return {
        date,
        steps: stepsSum,
        distance: distanceSum,
        calories: caloriesSum,
        duration: durationSum,
        intensity
      };
    });
    
    // Sort by date (ascending)
    dailyStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate the date range
    const today = new Date();
    const oldestDate = new Date(today);
    oldestDate.setDate(today.getDate() - days + 1);
    
    // Fill in missing dates
    dailyStats = fillMissingDates(
      dailyStats,
      oldestDate,
      today,
      'date',
      { steps: 0, distance: 0, calories: 0, duration: 0, intensity: 0 }
    );
    
    // Calculate summary statistics
    const totalDays = dailyStats.length;
    const nonZeroDays = dailyStats.filter(day => day.steps > 0).length;
    const activityConsistency = Math.round((nonZeroDays / totalDays) * 100);
    
    const totalSteps = dailyStats.reduce((sum, day) => sum + day.steps, 0);
    const totalDistance = dailyStats.reduce((sum, day) => sum + day.distance, 0);
    const totalCalories = dailyStats.reduce((sum, day) => sum + day.calories, 0);
    const totalDuration = dailyStats.reduce((sum, day) => sum + day.duration, 0);
    
    // Find most and least active days
    const activeDays = dailyStats.filter(day => day.steps > 0);
    
    let mostActiveDay: DailyActivityStats | null = null;
    let leastActiveDay: DailyActivityStats | null = null;
    
    if (activeDays.length > 0) {
      mostActiveDay = activeDays.reduce((max, day) => 
        day.steps > max.steps ? day : max, activeDays[0]);
      
      leastActiveDay = activeDays.reduce((min, day) => 
        day.steps < min.steps ? day : min, activeDays[0]);
    }
    
    // Calculate trends
    const stepsPerDay = dailyStats.map(day => day.steps);
    const caloriesPerDay = dailyStats.map(day => day.calories);
    
    // Only calculate trends if we have some non-zero data
    const stepsTrend = stepsPerDay.some(steps => steps > 0)
      ? statistics.calculateTrend(stepsPerDay)
      : { direction: 'insufficient_data', significance: 'none' };
    
    const caloriesTrend = caloriesPerDay.some(calories => calories > 0)
      ? statistics.calculateTrend(caloriesPerDay)
      : { direction: 'insufficient_data', significance: 'none' };
    
    // Calculate weekday vs weekend difference
    const weekdayStats = dailyStats.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    });
    
    const weekendStats = dailyStats.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    });
    
    const avgWeekdaySteps = weekdayStats.length > 0
      ? weekdayStats.reduce((sum, day) => sum + day.steps, 0) / weekdayStats.length
      : 0;
    
    const avgWeekendSteps = weekendStats.length > 0
      ? weekendStats.reduce((sum, day) => sum + day.steps, 0) / weekendStats.length
      : 0;
    
    // Percentage difference
    const weekdayVsWeekendDifference = avgWeekdaySteps === 0 && avgWeekendSteps === 0
      ? 0
      : Math.round(Math.abs(avgWeekdaySteps - avgWeekendSteps) / 
          Math.max(avgWeekdaySteps, avgWeekendSteps) * 100);
    
    // Calculate change percentage for trends
    const stepsChangePercentage = calculateChangePercentage(stepsPerDay);
    const caloriesChangePercentage = calculateChangePercentage(caloriesPerDay);
    
    // Generate recommendations
    const recommendations = generateActivityRecommendations(
      dailyStats,
      {
        activityConsistency,
        stepsPerDayTrend: stepsTrend,
        caloriesPerDayTrend: caloriesTrend,
        totalSteps,
        totalDays,
        avgStepsPerDay: totalSteps / totalDays
      }
    );
    
    // Create the insights object
    const insights: ActivityInsights = {
      summary: {
        totalSteps,
        totalDistance,
        totalCalories,
        totalDuration,
        averageStepsPerDay: totalSteps / totalDays,
        averageDistancePerDay: totalDistance / totalDays,
        averageCaloriesPerDay: totalCalories / totalDays,
        averageDurationPerDay: totalDuration / totalDays,
        mostActiveDay: mostActiveDay ? {
          date: mostActiveDay.date,
          steps: mostActiveDay.steps,
          distance: mostActiveDay.distance,
          calories: mostActiveDay.calories,
          duration: mostActiveDay.duration
        } : null,
        leastActiveDay: leastActiveDay ? {
          date: leastActiveDay.date,
          steps: leastActiveDay.steps,
          distance: leastActiveDay.distance,
          calories: leastActiveDay.calories,
          duration: leastActiveDay.duration
        } : null
      },
      trends: {
        stepsPerDayTrend: {
          direction: stepsTrend.direction,
          significance: stepsTrend.significance,
          changePercentage: stepsChangePercentage
        },
        caloriesPerDayTrend: {
          direction: caloriesTrend.direction,
          significance: caloriesTrend.significance,
          changePercentage: caloriesChangePercentage
        },
        activityConsistency,
        weekdayVsWeekendDifference
      },
      dailyStats,
      recommendations
    };
    
    return insights;
  } catch (error) {
    logger.error('Error processing activity data:', error);
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
  
  const firstHalfAvg = statistics.mean(firstHalf);
  const secondHalfAvg = statistics.mean(secondHalf);
  
  if (firstHalfAvg === 0) {
    return 0;
  }
  
  return Math.round((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100);
}

/**
 * Generate activity recommendations based on insights
 */
function generateActivityRecommendations(
  dailyStats: DailyActivityStats[],
  metrics: {
    activityConsistency: number;
    stepsPerDayTrend: { direction: string; significance: string };
    caloriesPerDayTrend: { direction: string; significance: string };
    totalSteps: number;
    totalDays: number;
    avgStepsPerDay: number;
  }
): ActivityRecommendation[] {
  const recommendations: ActivityRecommendation[] = [];
  
  // Check activity consistency
  if (metrics.activityConsistency < 50) {
    recommendations.push({
      type: 'consistency',
      message: 'Try to be active every day, even if just for a short walk.',
      reason: `You were active on only ${metrics.activityConsistency}% of days.`,
      priority: 1
    });
  }
  
  // Check step count trend
  if (metrics.stepsPerDayTrend.direction === 'decreasing' && 
      metrics.stepsPerDayTrend.significance !== 'none') {
    recommendations.push({
      type: 'trend',
      message: 'Your activity level is decreasing. Try to maintain or increase your daily steps.',
      reason: 'Your average daily steps have been decreasing over time.',
      priority: 2
    });
  }
  
  // Check step count
  const avgStepsPerDay = metrics.totalSteps / metrics.totalDays;
  if (avgStepsPerDay < 5000) {
    recommendations.push({
      type: 'volume',
      message: 'Aim for at least 7,500 steps per day for better health outcomes.',
      reason: `Your current average is ${Math.round(avgStepsPerDay)} steps per day.`,
      priority: avgStepsPerDay < 3000 ? 1 : 2
    });
  }
  
  // Check for inactive days
  const inactiveDays = dailyStats.filter(day => day.steps < 1000).length;
  if (inactiveDays > metrics.totalDays * 0.3) { // More than 30% inactive days
    recommendations.push({
      type: 'inactive_days',
      message: 'Try to avoid days with very low activity (less than 1,000 steps).',
      reason: `You had ${inactiveDays} days with minimal activity.`,
      priority: 2
    });
  }
  
  // Look for missing data
  const missingDataDays = dailyStats.filter(day => day.steps === 0).length;
  if (missingDataDays > metrics.totalDays * 0.5) { // More than 50% missing data
    recommendations.push({
      type: 'tracking',
      message: 'Try to consistently track your activity for better insights.',
      reason: 'Some of your activity data may be missing or incomplete.',
      priority: 3
    });
  }
  
  return recommendations;
}