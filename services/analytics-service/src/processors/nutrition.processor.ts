import { HealthMetric } from '@shared/common';
import * as statistics from '../utils/statistics';
import { format, isValid } from 'date-fns';
import { fillMissingDates } from '../utils/date-handling';
import { logger } from '@shared/logger';

interface NutritionSummary {
  averageCaloriesPerDay: number;
  averageProteinPerDay: number; // grams
  averageCarbsPerDay: number; // grams
  averageFatPerDay: number; // grams
  averageFiberPerDay: number; // grams
  averageSugarPerDay: number; // grams
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
  highestCalorieDay: {
    date: string;
    calories: number;
  } | null;
  lowestCalorieDay: {
    date: string;
    calories: number;
  } | null;
  daysWithinCalorieGoal: number;
  daysWithTrackedNutrition: number;
}

interface NutritionTrends {
  caloriesTrend: {
    direction: string;
    significance: string;
    changePercentage: number;
  };
  proteinTrend: {
    direction: string;
    significance: string;
    changePercentage: number;
  };
  carbsTrend: {
    direction: string;
    significance: string;
    changePercentage: number;
  };
  fatTrend: {
    direction: string;
    significance: string;
    changePercentage: number;
  };
  weekdayVsWeekendDifference: number; // percentage difference in calories
  nutritionTrackingConsistency: number; // 0-100 score
}

interface DailyNutritionStats {
  date: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  meals: number; // count of meals tracked
  waterIntake: number; // ml
}

interface NutritionRecommendation {
  type: string;
  message: string;
  reason: string;
  priority: number; // 1-3 (high to low)
}

interface NutritionInsights {
  summary: NutritionSummary;
  trends: NutritionTrends;
  dailyStats: DailyNutritionStats[];
  recommendations: NutritionRecommendation[];
}

/**
 * Process nutrition data to generate insights
 */
export function processNutrition(nutritionData: HealthMetric[], days: number = 30): NutritionInsights {
  try {
    // Group data by date
    const dateMap: Record<string, {
      calories: number[];
      protein: number[];
      carbs: number[];
      fat: number[];
      fiber: number[];
      sugar: number[];
      meals: number[];
      water: number[];
    }> = {};
    
    // Process all data points
    nutritionData.forEach(data => {
      // Skip invalid data
      if (!isValid(new Date(data.ts))) {
        return;
      }
      
      // Extract date part only
      const dateStr = format(new Date(data.ts), 'yyyy-MM-dd');
      
      // Initialize the date entry if it doesn't exist
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          calories: [],
          protein: [],
          carbs: [],
          fat: [],
          fiber: [],
          sugar: [],
          meals: [],
          water: []
        };
      }
      
      // Add data by type
      switch (data.type) {
        case 'calories':
          dateMap[dateStr].calories.push(data.value);
          break;
        case 'protein':
          dateMap[dateStr].protein.push(data.value);
          break;
        case 'carbs':
          dateMap[dateStr].carbs.push(data.value);
          break;
        case 'fat':
          dateMap[dateStr].fat.push(data.value);
          break;
        case 'fiber':
          dateMap[dateStr].fiber.push(data.value);
          break;
        case 'sugar':
          dateMap[dateStr].sugar.push(data.value);
          break;
        case 'meal':
          dateMap[dateStr].meals.push(1); // Count of meal entries
          break;
        case 'water':
          dateMap[dateStr].water.push(data.value);
          break;
      }
    });
    
    // Convert the map to daily statistics
    let dailyStats: DailyNutritionStats[] = Object.entries(dateMap).map(([date, data]) => {
      // Sum up values for the day
      const calories = data.calories.reduce((sum, val) => sum + val, 0);
      const protein = data.protein.reduce((sum, val) => sum + val, 0);
      const carbs = data.carbs.reduce((sum, val) => sum + val, 0);
      const fat = data.fat.reduce((sum, val) => sum + val, 0);
      const fiber = data.fiber.reduce((sum, val) => sum + val, 0);
      const sugar = data.sugar.reduce((sum, val) => sum + val, 0);
      const meals = data.meals.length;
      const waterIntake = data.water.reduce((sum, val) => sum + val, 0);
      
      return {
        date,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sugar,
        meals,
        waterIntake
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
      { 
        calories: 0, 
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        meals: 0,
        waterIntake: 0
      }
    );
    
    // Calculate summary statistics
    const totalDays = dailyStats.length;
    const daysWithTrackedNutrition = dailyStats.filter(day => day.calories > 0).length;
    const nutritionTrackingConsistency = Math.round((daysWithTrackedNutrition / totalDays) * 100);
    
    // Calculate averages
    const averageCaloriesPerDay = daysWithTrackedNutrition > 0
      ? dailyStats.reduce((sum, day) => sum + day.calories, 0) / daysWithTrackedNutrition
      : 0;
    
    const averageProteinPerDay = daysWithTrackedNutrition > 0
      ? dailyStats.reduce((sum, day) => sum + day.protein, 0) / daysWithTrackedNutrition
      : 0;
    
    const averageCarbsPerDay = daysWithTrackedNutrition > 0
      ? dailyStats.reduce((sum, day) => sum + day.carbs, 0) / daysWithTrackedNutrition
      : 0;
    
    const averageFatPerDay = daysWithTrackedNutrition > 0
      ? dailyStats.reduce((sum, day) => sum + day.fat, 0) / daysWithTrackedNutrition
      : 0;
    
    const averageFiberPerDay = daysWithTrackedNutrition > 0
      ? dailyStats.reduce((sum, day) => sum + day.fiber, 0) / daysWithTrackedNutrition
      : 0;
    
    const averageSugarPerDay = daysWithTrackedNutrition > 0
      ? dailyStats.reduce((sum, day) => sum + day.sugar, 0) / daysWithTrackedNutrition
      : 0;
    
    // Calculate macronutrient percentages
    const totalMacros = averageProteinPerDay * 4 + averageCarbsPerDay * 4 + averageFatPerDay * 9;
    
    const proteinPercentage = totalMacros > 0
      ? Math.round((averageProteinPerDay * 4 / totalMacros) * 100)
      : 0;
    
    const carbsPercentage = totalMacros > 0
      ? Math.round((averageCarbsPerDay * 4 / totalMacros) * 100)
      : 0;
    
    const fatPercentage = totalMacros > 0
      ? Math.round((averageFatPerDay * 9 / totalMacros) * 100)
      : 0;
    
    // Find highest and lowest calorie days
    const daysWithTrackedCalories = dailyStats.filter(day => day.calories > 0);
    
    let highestCalorieDay: DailyNutritionStats | null = null;
    let lowestCalorieDay: DailyNutritionStats | null = null;
    
    if (daysWithTrackedCalories.length > 0) {
      highestCalorieDay = daysWithTrackedCalories.reduce((max, day) => 
        day.calories > max.calories ? day : max, daysWithTrackedCalories[0]);
      
      lowestCalorieDay = daysWithTrackedCalories.reduce((min, day) => 
        day.calories < min.calories ? day : min, daysWithTrackedCalories[0]);
    }
    
    // Assume a typical calorie goal range is 1800-2500 calories
    // This would typically be personalized based on user profile
    const lowerCalorieGoal = 1800;
    const upperCalorieGoal = 2500;
    
    const daysWithinCalorieGoal = daysWithTrackedCalories.filter(
      day => day.calories >= lowerCalorieGoal && day.calories <= upperCalorieGoal
    ).length;
    
    // Calculate trends
    const caloriesPerDay = dailyStats.map(day => day.calories);
    const proteinPerDay = dailyStats.map(day => day.protein);
    const carbsPerDay = dailyStats.map(day => day.carbs);
    const fatPerDay = dailyStats.map(day => day.fat);
    
    // Only calculate trends if we have sufficient non-zero data
    const caloriesTrend = caloriesPerDay.filter(cals => cals > 0).length >= 5
      ? statistics.calculateTrend(caloriesPerDay)
      : { direction: 'insufficient_data', significance: 'none' };
    
    const proteinTrend = proteinPerDay.filter(p => p > 0).length >= 5
      ? statistics.calculateTrend(proteinPerDay)
      : { direction: 'insufficient_data', significance: 'none' };
    
    const carbsTrend = carbsPerDay.filter(c => c > 0).length >= 5
      ? statistics.calculateTrend(carbsPerDay)
      : { direction: 'insufficient_data', significance: 'none' };
    
    const fatTrend = fatPerDay.filter(f => f > 0).length >= 5
      ? statistics.calculateTrend(fatPerDay)
      : { direction: 'insufficient_data', significance: 'none' };
    
    // Calculate weekday vs weekend difference
    const weekdayStats = dailyStats.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5 && day.calories > 0; // Monday to Friday with tracked nutrition
    });
    
    const weekendStats = dailyStats.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) && day.calories > 0; // Sunday or Saturday with tracked nutrition
    });
    
    const avgWeekdayCalories = weekdayStats.length > 0
      ? weekdayStats.reduce((sum, day) => sum + day.calories, 0) / weekdayStats.length
      : 0;
    
    const avgWeekendCalories = weekendStats.length > 0
      ? weekendStats.reduce((sum, day) => sum + day.calories, 0) / weekendStats.length
      : 0;
    
    // Calculate percentage difference
    const weekdayVsWeekendDifference = avgWeekdayCalories > 0 || avgWeekendCalories > 0
      ? Math.round(Math.abs(avgWeekdayCalories - avgWeekendCalories) / 
          (avgWeekdayCalories > 0 ? avgWeekdayCalories : avgWeekendCalories) * 100)
      : 0;
    
    // Calculate change percentages for trends
    const caloriesChangePercentage = calculateChangePercentage(caloriesPerDay);
    const proteinChangePercentage = calculateChangePercentage(proteinPerDay);
    const carbsChangePercentage = calculateChangePercentage(carbsPerDay);
    const fatChangePercentage = calculateChangePercentage(fatPerDay);
    
    // Generate recommendations
    const recommendations = generateNutritionRecommendations(
      dailyStats,
      {
        nutritionTrackingConsistency,
        averageCaloriesPerDay,
        averageProteinPerDay,
        averageCarbsPerDay,
        averageFatPerDay,
        averageFiberPerDay,
        averageSugarPerDay,
        proteinPercentage,
        carbsPercentage,
        fatPercentage,
        daysWithTrackedNutrition
      }
    );
    
    // Create the insights object
    const insights: NutritionInsights = {
      summary: {
        averageCaloriesPerDay,
        averageProteinPerDay,
        averageCarbsPerDay,
        averageFatPerDay,
        averageFiberPerDay,
        averageSugarPerDay,
        proteinPercentage,
        carbsPercentage,
        fatPercentage,
        highestCalorieDay: highestCalorieDay ? {
          date: highestCalorieDay.date,
          calories: highestCalorieDay.calories
        } : null,
        lowestCalorieDay: lowestCalorieDay ? {
          date: lowestCalorieDay.date,
          calories: lowestCalorieDay.calories
        } : null,
        daysWithinCalorieGoal,
        daysWithTrackedNutrition
      },
      trends: {
        caloriesTrend: {
          direction: caloriesTrend.direction,
          significance: caloriesTrend.significance,
          changePercentage: caloriesChangePercentage
        },
        proteinTrend: {
          direction: proteinTrend.direction,
          significance: proteinTrend.significance,
          changePercentage: proteinChangePercentage
        },
        carbsTrend: {
          direction: carbsTrend.direction,
          significance: carbsTrend.significance,
          changePercentage: carbsChangePercentage
        },
        fatTrend: {
          direction: fatTrend.direction,
          significance: fatTrend.significance,
          changePercentage: fatChangePercentage
        },
        weekdayVsWeekendDifference,
        nutritionTrackingConsistency
      },
      dailyStats,
      recommendations
    };
    
    return insights;
  } catch (error) {
    logger.error('Error processing nutrition data:', error);
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
 * Generate nutrition recommendations based on insights
 */
function generateNutritionRecommendations(
  dailyStats: DailyNutritionStats[],
  metrics: {
    nutritionTrackingConsistency: number;
    averageCaloriesPerDay: number;
    averageProteinPerDay: number;
    averageCarbsPerDay: number;
    averageFatPerDay: number;
    averageFiberPerDay: number;
    averageSugarPerDay: number;
    proteinPercentage: number;
    carbsPercentage: number;
    fatPercentage: number;
    daysWithTrackedNutrition: number;
  }
): NutritionRecommendation[] {
  const recommendations: NutritionRecommendation[] = [];
  
  // Check nutrition tracking consistency
  if (metrics.nutritionTrackingConsistency < 70) {
    recommendations.push({
      type: 'tracking',
      message: 'Try to track your nutrition more consistently for better insights.',
      reason: `You tracked nutrition on only ${metrics.nutritionTrackingConsistency}% of days.`,
      priority: 3
    });
  }
  
  // Check protein intake
  const bodyWeightInKg = 70; // Assume 70kg (this would typically be obtained from user profile)
  const recommendedProtein = bodyWeightInKg * 1.6; // ~1.6g per kg bodyweight
  
  if (metrics.averageProteinPerDay < recommendedProtein * 0.8 && metrics.daysWithTrackedNutrition >= 3) {
    recommendations.push({
      type: 'protein',
      message: 'Consider increasing your protein intake for better recovery and muscle maintenance.',
      reason: `Your current average is ${Math.round(metrics.averageProteinPerDay)}g per day, which may be lower than optimal.`,
      priority: 2
    });
  }
  
  // Check fiber intake
  if (metrics.averageFiberPerDay < 25 && metrics.daysWithTrackedNutrition >= 3) {
    recommendations.push({
      type: 'fiber',
      message: 'Try to increase your fiber intake by eating more vegetables, fruits, and whole grains.',
      reason: `Your current average is ${Math.round(metrics.averageFiberPerDay)}g per day (recommended: 25-35g).`,
      priority: 2
    });
  }
  
  // Check sugar intake
  if (metrics.averageSugarPerDay > 50 && metrics.daysWithTrackedNutrition >= 3) {
    recommendations.push({
      type: 'sugar',
      message: 'Consider reducing your sugar intake for better health outcomes.',
      reason: `Your current average is ${Math.round(metrics.averageSugarPerDay)}g per day (recommended: <36g for men, <25g for women).`,
      priority: 1
    });
  }
  
  // Check macronutrient balance
  if (metrics.daysWithTrackedNutrition >= 5) {
    if (metrics.proteinPercentage < 15) {
      recommendations.push({
        type: 'macros_protein',
        message: 'Your diet appears to be low in protein relative to other macronutrients.',
        reason: `Protein accounts for only ${metrics.proteinPercentage}% of your macronutrient intake.`,
        priority: 2
      });
    }
    
    if (metrics.fatPercentage > 40) {
      recommendations.push({
        type: 'macros_fat',
        message: 'Your diet may be higher in fat than recommended for optimal health.',
        reason: `Fat accounts for ${metrics.fatPercentage}% of your macronutrient intake.`,
        priority: 2
      });
    }
    
    if (metrics.carbsPercentage > 65) {
      recommendations.push({
        type: 'macros_carbs',
        message: 'Your diet appears to be very high in carbohydrates.',
        reason: `Carbohydrates account for ${metrics.carbsPercentage}% of your macronutrient intake.`,
        priority: 3
      });
    }
  }
  
  // Check for very high or low calorie days
  const highCalorieDays = dailyStats.filter(day => day.calories > 3000).length;
  const lowCalorieDays = dailyStats.filter(day => day.calories > 0 && day.calories < 1500).length;
  
  if (highCalorieDays > metrics.daysWithTrackedNutrition * 0.2) { // More than 20% high calorie days
    recommendations.push({
      type: 'high_calorie',
      message: 'You have several days with very high calorie intake.',
      reason: `${highCalorieDays} days had over 3,000 calories, which may exceed your energy needs.`,
      priority: 2
    });
  }
  
  if (lowCalorieDays > metrics.daysWithTrackedNutrition * 0.2) { // More than 20% low calorie days
    recommendations.push({
      type: 'low_calorie',
      message: 'You have several days with very low calorie intake.',
      reason: `${lowCalorieDays} days had under 1,500 calories, which may be insufficient for your energy needs.`,
      priority: 1
    });
  }
  
  // Check water intake
  const daysWithWaterTracking = dailyStats.filter(day => day.waterIntake > 0).length;
  const avgWaterIntake = daysWithWaterTracking > 0
    ? dailyStats.reduce((sum, day) => sum + day.waterIntake, 0) / daysWithWaterTracking / 1000 // Convert to liters
    : 0;
  
  if (avgWaterIntake < 2 && daysWithWaterTracking >= 3) {
    recommendations.push({
      type: 'hydration',
      message: 'Try to increase your water intake for better hydration.',
      reason: `Your current average is ${avgWaterIntake.toFixed(1)} liters per day (recommended: 2-3 liters).`,
      priority: 2
    });
  }
  
  return recommendations;
}