import { GoalsModel, Goal, CreateGoalParams, UpdateGoalParams } from '../models/goals.model';
import { ApiError } from '../middlewares/error.middleware';
import { logger } from '../middlewares/logging.middleware';

export class GoalsService {
  private goalsModel: GoalsModel;

  constructor() {
    this.goalsModel = new GoalsModel();
  }

  async getAllGoals(userId: string): Promise<Goal[]> {
    try {
      return await this.goalsModel.findByUserId(userId);
    } catch (error) {
      logger.error('Error in GoalsService.getAllGoals:', error);
      throw new ApiError('Failed to get goals', 500);
    }
  }

  async getActiveGoals(userId: string): Promise<Goal[]> {
    try {
      return await this.goalsModel.findActiveByUserId(userId);
    } catch (error) {
      logger.error('Error in GoalsService.getActiveGoals:', error);
      throw new ApiError('Failed to get active goals', 500);
    }
  }

  async getGoalById(goalId: string, userId: string): Promise<Goal> {
    try {
      const goal = await this.goalsModel.findById(goalId, userId);
      
      if (!goal) {
        throw new ApiError('Goal not found', 404);
      }
      
      return goal;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Error in GoalsService.getGoalById:', error);
      throw new ApiError('Failed to get goal', 500);
    }
  }

  async createGoal(userId: string, data: CreateGoalParams): Promise<Goal> {
    try {
      return await this.goalsModel.create(userId, data);
    } catch (error) {
      logger.error('Error in GoalsService.createGoal:', error);
      throw new ApiError('Failed to create goal', 500);
    }
  }

  async updateGoal(goalId: string, userId: string, data: UpdateGoalParams): Promise<Goal> {
    try {
      return await this.goalsModel.update(goalId, userId, data);
    } catch (error) {
      if (error instanceof Error && error.message === 'Goal not found or does not belong to user') {
        throw new ApiError(error.message, 404);
      }
      
      logger.error('Error in GoalsService.updateGoal:', error);
      throw new ApiError('Failed to update goal', 500);
    }
  }

  async deleteGoal(goalId: string, userId: string): Promise<boolean> {
    try {
      const deleted = await this.goalsModel.delete(goalId, userId);
      
      if (!deleted) {
        throw new ApiError('Goal not found', 404);
      }
      
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Error in GoalsService.deleteGoal:', error);
      throw new ApiError('Failed to delete goal', 500);
    }
  }
}