import { logger } from '@shared/logger';
import healthDataModel, { HealthDataFilter, HealthDataStats } from '../models/health-data.model';
import { HealthMetric } from '@shared/common';
import { processActivity } from '../processors/activity.processor';
import { processSleep } from '../processors/sleep.processor';
import { processNutrition } from '../processors/nutrition.processor';
import dataAccessService from './data-access.service';
import * as statistics from '../utils/statistics';
import { subDays, format } from 'date-fns';

class AnalyticsService {
    /**
     * Get health data with filtering options
     */
    async getHealthData(filter: HealthDataFilter): Promise<HealthMetric[]> {
        try {
            // Get data from model
            return await healthDataModel.getHealthData(filter);
        } catch (error) {
            logger.error('Error in analytics service getHealthData:', error);
            throw error;
        }
    }

    /**
     * Get health data statistics
     */
    async getHealthDataStats(filter: HealthDataFilter): Promise<HealthDataStats> {
        try {
            return await healthDataModel.getStatistics(filter);
        } catch (error) {
            logger.error('Error in analytics service getHealthDataStats:', error);
            throw error;
        }
    }

    /**
     * Get daily aggregates for a health metric
     */
    async getDailyAggregates(filter: HealthDataFilter): Promise<any[]> {
        try {
            return await healthDataModel.getDailyAggregates(filter);
        } catch (error) {
            logger.error('Error in analytics service getDailyAggregates:', error);
            throw error;
        }
    }

    /**
     * Get activity insights for a user
     */
    async getActivityInsights(userId: string, days: number = 30): Promise<any> {
        try {
            const endDate = new Date();
            const startDate = subDays(endDate, days);

            // Get activity data
            const activityData = await healthDataModel.getHealthData({
                userId,
                type: 'activity',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            // Process the activity data to generate insights
            return processActivity(activityData, days);
        } catch (error) {
            logger.error('Error in analytics service getActivityInsights:', error);
            throw error;
        }
    }

    /**
     * Get sleep insights for a user
     */
    async getSleepInsights(userId: string, days: number = 30): Promise<any> {
        try {
            const endDate = new Date();
            const startDate = subDays(endDate, days);

            // Get sleep data
            const sleepData = await healthDataModel.getHealthData({
                userId,
                type: 'sleep',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            // Process the sleep data to generate insights
            return processSleep(sleepData, days);
        } catch (error) {
            logger.error('Error in analytics service getSleepInsights:', error);
            throw error;
        }
    }

    /**
     * Get nutrition insights for a user
     */
    async getNutritionInsights(userId: string, days: number = 30): Promise<any> {
        try {
            const endDate = new Date();
            const startDate = subDays(endDate, days);

            // Get nutrition data
            const nutritionData = await healthDataModel.getHealthData({
                userId,
                type: 'nutrition',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            // Process the nutrition data to generate insights
            return processNutrition(nutritionData, days);
        } catch (error) {
            logger.error('Error in analytics service getNutritionInsights:', error);
            throw error;
        }
    }

    /**
     * Get a trend analysis for a specific metric
     */
    async getTrendAnalysis(userId: string, metricType: string, days: number = 30): Promise<any> {
        try {
            const endDate = new Date();
            const startDate = subDays(endDate, days);

            // Get the data for the specified metric
            const data = await healthDataModel.getDailyAggregates({
                userId,
                type: metricType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            // If no data found, return empty result
            if (data.length === 0) {
                return {
                    trend: 'insufficient_data',
                    averages: [],
                    change: 0,
                    changePercentage: 0
                };
            }

            // Calculate the trend
            const values = data.map(d => d.avg);
            const trend = statistics.calculateTrend(values);

            // Calculate overall change
            const firstValue = data[data.length - 1].avg; // Oldest (data is in DESC order)
            const lastValue = data[0].avg; // Most recent

            const change = lastValue - firstValue;
            const changePercentage = firstValue !== 0 ? (change / firstValue) * 100 : 0;

            // Calculate weekly averages if enough data
            const weeklyAverages = [];
            if (data.length >= 7) {
                for (let i = 0; i < Math.min(4, Math.floor(data.length / 7)); i++) {
                    const weekData = data.slice(i * 7, (i + 1) * 7);
                    const weekValues = weekData.map(d => d.avg);

                    weeklyAverages.push({
                        week: i + 1,
                        startDate: weekData[weekData.length - 1].date,
                        endDate: weekData[0].date,
                        average: statistics.mean(weekValues),
                        min: Math.min(...weekValues),
                        max: Math.max(...weekValues)
                    });
                }
            }

            return {
                trend: trend.direction,
                significance: trend.significance,
                averages: weeklyAverages,
                change,
                changePercentage,
                dataPoints: data.length
            };

        } catch (error) {
            logger.error('Error in analytics service getTrendAnalysis:', error);
            throw error;
        }
    }

    /**
     * Calculate correlations between two metrics
     */
    async getCorrelationAnalysis(
        userId: string,
        metric1: string,
        metric2: string,
        days: number = 30
    ): Promise<any> {
        try {
            const endDate = new Date();
            const startDate = subDays(endDate, days);

            // Get data for both metrics
            const [data1, data2] = await Promise.all([
                healthDataModel.getDailyAggregates({
                    userId,
                    type: metric1,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }),
                healthDataModel.getDailyAggregates({
                    userId,
                    type: metric2,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                })
            ]);

            // If not enough data for both metrics, return empty result
            if (data1.length < 5 || data2.length < 5) {
                return {
                    correlation: 0,
                    strength: 'insufficient_data',
                    dataPoints: Math.min(data1.length, data2.length)
                };
            }

            // Create a map of dates to values for easy lookup
            const dateMap1: Record<string, number> = {};
            data1.forEach(d => {
                dateMap1[d.date] = d.avg;
            });

            const dateMap2: Record<string, number> = {};
            data2.forEach(d => {
                dateMap2[d.date] = d.avg;
            });

            // Find dates that exist in both datasets
            const commonDates = Object.keys(dateMap1).filter(date => dateMap2[date] !== undefined);

            // If not enough common dates, return insufficient data
            if (commonDates.length < 5) {
                return {
                    correlation: 0,
                    strength: 'insufficient_data',
                    dataPoints: commonDates.length
                };
            }

            // Create paired arrays of values
            const values1 = commonDates.map(date => dateMap1[date]);
            const values2 = commonDates.map(date => dateMap2[date]);

            // Calculate correlation coefficient
            const correlation = statistics.correlation(values1, values2);

            // Determine correlation strength
            let strength;
            const absCorrelation = Math.abs(correlation);

            if (absCorrelation < 0.2) strength = 'negligible';
            else if (absCorrelation < 0.4) strength = 'weak';
            else if (absCorrelation < 0.6) strength = 'moderate';
            else if (absCorrelation < 0.8) strength = 'strong';
            else strength = 'very_strong';

            return {
                correlation,
                strength,
                direction: correlation > 0 ? 'positive' : 'negative',
                dataPoints: commonDates.length,
                metric1: {
                    type: metric1,
                    mean: statistics.mean(values1),
                    stdDev: statistics.standardDeviation(values1)
                },
                metric2: {
                    type: metric2,
                    mean: statistics.mean(values2),
                    stdDev: statistics.standardDeviation(values2)
                }
            };

        } catch (error) {
            logger.error('Error in analytics service getCorrelationAnalysis:', error);
            throw error;
        }
    }

    /**
     * Get aggregated health summary for a time period
     */
    async getHealthSummary(userId: string, days: number = 7): Promise<any> {
        try {
            const endDate = new Date();
            const startDate = subDays(endDate, days);

            // Get data for different health metrics
            const [activityData, sleepData, nutritionData] = await Promise.all([
                healthDataModel.getDailyAggregates({
                    userId,
                    type: 'activity',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }),
                healthDataModel.getDailyAggregates({
                    userId,
                    type: 'sleep',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }),
                healthDataModel.getDailyAggregates({
                    userId,
                    type: 'nutrition',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                })
            ]);

            // Create a map to hold all metrics by date
            const dateMetrics: Record<string, any> = {};

            // Process all dates in the range
            for (let d = 0; d < days; d++) {
                const date = format(subDays(endDate, d), 'yyyy-MM-dd');
                dateMetrics[date] = {
                    date,
                    activity: null,
                    sleep: null,
                    nutrition: null
                };
            }

            // Fill in activity data
            activityData.forEach(d => {
                if (dateMetrics[d.date]) {
                    dateMetrics[d.date].activity = {
                        count: d.count,
                        avg: d.avg,
                        sum: d.sum,
                        min: d.min,
                        max: d.max
                    };
                }
            });

            // Fill in sleep data
            sleepData.forEach(d => {
                if (dateMetrics[d.date]) {
                    dateMetrics[d.date].sleep = {
                        count: d.count,
                        avg: d.avg,
                        sum: d.sum,
                        min: d.min,
                        max: d.max
                    };
                }
            });

            // Fill in nutrition data
            nutritionData.forEach(d => {
                if (dateMetrics[d.date]) {
                    dateMetrics[d.date].nutrition = {
                        count: d.count,
                        avg: d.avg,
                        sum: d.sum,
                        min: d.min,
                        max: d.max
                    };
                }
            });

            // Convert to array and sort by date
            const dailyMetrics = Object.values(dateMetrics).sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Calculate overall averages and completeness
            const activityValues = dailyMetrics
                .filter(d => d.activity !== null)
                .map(d => d.activity.avg);

            const sleepValues = dailyMetrics
                .filter(d => d.sleep !== null)
                .map(d => d.sleep.avg);

            const nutritionValues = dailyMetrics
                .filter(d => d.nutrition !== null)
                .map(d => d.nutrition.avg);

            return {
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                days,
                completeness: {
                    activity: (activityValues.length / days) * 100,
                    sleep: (sleepValues.length / days) * 100,
                    nutrition: (nutritionValues.length / days) * 100
                },
                averages: {
                    activity: activityValues.length > 0 ? statistics.mean(activityValues) : null,
                    sleep: sleepValues.length > 0 ? statistics.mean(sleepValues) : null,
                    nutrition: nutritionValues.length > 0 ? statistics.mean(nutritionValues) : null
                },
                dailyMetrics
            };

        } catch (error) {
            logger.error('Error in analytics service getHealthSummary:', error);
            throw error;
        }
    }

    /**
     * Compare a user's metrics with population averages
     */
    async getMetricComparison(userId: string, metricType: string): Promise<any> {
        try {
            // Get the user's recent data for the metric (last 30 days)
            const endDate = new Date();
            const startDate = subDays(endDate, 30);

            const userData = await healthDataModel.getHealthData({
                userId,
                type: metricType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            if (userData.length === 0) {
                return {
                    status: 'insufficient_data',
                    message: 'Not enough user data available for comparison'
                };
            }

            // Calculate user average
            const userValues = userData.map(d => d.value);
            const userAvg = statistics.mean(userValues);

            // Get population averages from the data access service
            const populationStats = await dataAccessService.getPopulationStats(metricType);

            if (!populationStats) {
                return {
                    status: 'population_data_unavailable',
                    userAverage: userAvg,
                    userCount: userValues.length,
                    message: 'Population comparison data is not available'
                };
            }

            // Calculate percentile
            const percentile = statistics.calculatePercentile(userAvg,
                populationStats.mean,
                populationStats.stdDev
            );

            // Determine relative standing
            let standing;
            if (percentile > 90) standing = 'excellent';
            else if (percentile > 70) standing = 'good';
            else if (percentile > 30) standing = 'average';
            else if (percentile > 10) standing = 'below_average';
            else standing = 'needs_improvement';

            return {
                status: 'success',
                userAverage: userAvg,
                userCount: userValues.length,
                populationAverage: populationStats.mean,
                populationStdDev: populationStats.stdDev,
                percentile,
                standing,
                sampleSize: populationStats.count
            };

        } catch (error) {
            logger.error('Error in analytics service getMetricComparison:', error);
            throw error;
        }
    }
}

export default new AnalyticsService();