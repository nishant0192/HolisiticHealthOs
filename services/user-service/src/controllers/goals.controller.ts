import { Request, Response, NextFunction } from 'express';
import { GoalsService } from '../services/goals.service';
import { asyncHandler } from '../utils/async-handler';
import { successResponse } from '../utils/response';

export class GoalsController {
  private goalsService: GoalsService;

  constructor() {
    this.goalsService = new GoalsService();
  }

  getAllGoals = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    const status = req.query.status as string;
    
    let goals;
    if (status === 'active') {
      goals = await this.goalsService.getActiveGoals(userId);
    } else {
      goals = await this.goalsService.getAllGoals(userId);
    }
    
    return successResponse(res, goals, 'Goals retrieved successfully');
  });

  getGoalById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    const goalId = req.params.id;
    
    const goal = await this.goalsService.getGoalById(goalId, userId);
    
    return successResponse(res, goal, 'Goal retrieved successfully');
  });

  createGoal = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    const newGoal = await this.goalsService.createGoal(userId, req.body);
    
    return successResponse(res, newGoal, 'Goal created successfully', 201);
  });

  updateGoal = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    const goalId = req.params.id;
    
    const updatedGoal = await this.goalsService.updateGoal(goalId, userId, req.body);
    
    return successResponse(res, updatedGoal, 'Goal updated successfully');
  });

  deleteGoal = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    const goalId = req.params.id;
    
    await this.goalsService.deleteGoal(goalId, userId);
    
    return successResponse(res, null, 'Goal deleted successfully');
  });
}