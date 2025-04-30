import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

/**
 * @route   GET /reports
 * @desc    Get all reports with filtering options
 * @access  Private
 */
router.get('/', asyncHandler(reportsController.getReports));

/**
 * @route   GET /reports/:id
 * @desc    Get a report by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(reportsController.getReportById));

/**
 * @route   POST /reports
 * @desc    Create a new report
 * @access  Private
 */
router.post('/', asyncHandler(reportsController.createReport));

/**
 * @route   PUT /reports/:id
 * @desc    Update an existing report
 * @access  Private
 */
router.put('/:id', asyncHandler(reportsController.updateReport));

/**
 * @route   DELETE /reports/:id
 * @desc    Delete a report
 * @access  Private
 */
router.delete('/:id', asyncHandler(reportsController.deleteReport));

/**
 * @route   POST /reports/generate/activity
 * @desc    Generate an activity report
 * @access  Private
 */
router.post('/generate/activity', asyncHandler(reportsController.generateActivityReport));

/**
 * @route   POST /reports/generate/sleep
 * @desc    Generate a sleep report
 * @access  Private
 */
router.post('/generate/sleep', asyncHandler(reportsController.generateSleepReport));

/**
 * @route   POST /reports/generate/nutrition
 * @desc    Generate a nutrition report
 * @access  Private
 */
router.post('/generate/nutrition', asyncHandler(reportsController.generateNutritionReport));

/**
 * @route   POST /reports/generate/health
 * @desc    Generate a comprehensive health report
 * @access  Private
 */
router.post('/generate/health', asyncHandler(reportsController.generateHealthReport));

/**
 * @route   POST /reports/generate/custom
 * @desc    Generate a custom report with specified metrics
 * @access  Private
 */
router.post('/generate/custom', asyncHandler(reportsController.generateCustomReport));

export default router;