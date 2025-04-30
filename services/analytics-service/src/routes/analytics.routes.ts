import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

/**
 * @route   GET /analytics/health-data
 * @desc    Get health data with filtering options
 * @access  Private
 */
router.get('/health-data', asyncHandler(analyticsController.getHealthData));

/**
 * @route   GET /analytics/health-stats
 * @desc    Get health data statistics
 * @access  Private
 */
router.get('/health-stats', asyncHandler(analyticsController.getHealthStats));

/**
 * @route   GET /analytics/daily-aggregates
 * @desc    Get daily aggregated health data
 * @access  Private
 */
router.get('/daily-aggregates', asyncHandler(analyticsController.getDailyAggregates));

/**
 * @route   GET /analytics/activity/insights
 * @desc    Get activity insights
 * @access  Private
 */
router.get('/activity/insights', asyncHandler(analyticsController.getActivityInsights));

/**
 * @route   GET /analytics/sleep/insights
 * @desc    Get sleep insights
 * @access  Private
 */
router.get('/sleep/insights', asyncHandler(analyticsController.getSleepInsights));

/**
 * @route   GET /analytics/nutrition/insights
 * @desc    Get nutrition insights
 * @access  Private
 */
router.get('/nutrition/insights', asyncHandler(analyticsController.getNutritionInsights));

/**
 * @route   GET /analytics/trend
 * @desc    Get trend analysis for a metric
 * @access  Private
 */
router.get('/trend', asyncHandler(analyticsController.getTrendAnalysis));

/**
 * @route   GET /analytics/correlation
 * @desc    Get correlation analysis between two metrics
 * @access  Private
 */
router.get('/correlation', asyncHandler(analyticsController.getCorrelationAnalysis));

/**
 * @route   GET /analytics/health-summary
 * @desc    Get aggregated health summary
 * @access  Private
 */
router.get('/health-summary', asyncHandler(analyticsController.getHealthSummary));

/**
 * @route   GET /analytics/metric-comparison
 * @desc    Get metric comparison with population averages
 * @access  Private
 */
router.get('/metric-comparison', asyncHandler(analyticsController.getMetricComparison));

export default router;