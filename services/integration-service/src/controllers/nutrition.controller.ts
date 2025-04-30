// src/controllers/nutrition.controller.ts
import { Request, Response, NextFunction } from 'express';
import { NutritionService } from '../services/nutrition.service';
import { ApiError } from '../middlewares/error.middleware';
import { asyncHandler } from '../utils/async-handler';

export class NutritionController {
  private nutritionService: NutritionService;

  constructor() {
    this.nutritionService = new NutritionService();
  }

  /**
   * Get nutrition records for a user
   */
  getNutritionRecords = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    // Parse query parameters
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    const mealType = req.query.meal_type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const nutritionRecords = await this.nutritionService.getNutritionByUser(
      userId,
      startDate,
      endDate,
      mealType,
      limit
    );
    
    return res.status(200).json({
      status: 'success',
      data: nutritionRecords
    });
  });

  /**
   * Get nutrition record by ID
   */
  getNutritionById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    const nutritionId = req.params.id;
    
    const nutritionRecord = await this.nutritionService.getNutritionById(nutritionId);
    
    // Check if nutrition record belongs to user
    if (nutritionRecord.user_id !== userId) {
      throw new ApiError('Unauthorized', 403);
    }
    
    return res.status(200).json({
      status: 'success',
      data: nutritionRecord
    });
  });

  /**
   * Create a manual nutrition record
   */
  createNutritionRecord = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    // Prepare nutrition data
    const nutritionData = {
      user_id: userId,
      timestamp: new Date(req.body.timestamp),
      meal_type: req.body.meal_type,
      foods: req.body.foods,
      total_calories: req.body.total_calories,
      total_macronutrients: req.body.total_macronutrients,
      water_intake_ml: req.body.water_intake_ml,
      source_provider: 'manual_entry',
      metadata: req.body.metadata || {}
    };
    
    const nutritionRecord = await this.nutritionService.createNutrition(nutritionData);
    
    return res.status(201).json({
      status: 'success',
      message: 'Nutrition record created successfully',
      data: nutritionRecord
    });
  });
}