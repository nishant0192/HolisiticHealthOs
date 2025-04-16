// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from './error.middleware';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const validationErrors = error.details.reduce((acc: Record<string, string>, curr) => {
        const key = curr.path.join('.');
        acc[key] = curr.message;
        return acc;
      }, {});
      
      throw new ApiError(`Validation failed: ${error.details.map(d => d.message).join(', ')}`, 400);
    }
    
    next();
  };
};

export const integrationValidationSchemas = {
  createConnection: Joi.object({
    provider: Joi.string().required().valid('apple_health', 'google_fit', 'fitbit', 'garmin'),
    code: Joi.string().when('provider', {
      is: Joi.valid('google_fit', 'fitbit', 'garmin'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    access_token: Joi.string().when('provider', {
      is: 'apple_health',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    refresh_token: Joi.string().optional(),
    token_expires_at: Joi.date().iso().optional(),
    scopes: Joi.array().items(Joi.string()).optional()
  }),
  
  manualActivity: Joi.object({
    activity_type: Joi.string().required(),
    start_time: Joi.date().iso().required(),
    end_time: Joi.date().iso().required(),
    duration_seconds: Joi.number().min(0).optional(),
    distance: Joi.number().min(0).optional(),
    distance_unit: Joi.string().valid('km', 'mi').optional(),
    calories_burned: Joi.number().min(0).optional(),
    steps: Joi.number().integer().min(0).optional(),
    heart_rate_avg: Joi.number().min(0).optional(),
    heart_rate_max: Joi.number().min(0).optional(),
    metadata: Joi.object().optional()
  }),
  
  manualSleep: Joi.object({
    start_time: Joi.date().iso().required(),
    end_time: Joi.date().iso().required(),
    duration_seconds: Joi.number().min(0).optional(),
    quality: Joi.number().min(1).max(100).optional(),
    sleep_stages: Joi.array().items(
      Joi.object({
        stage: Joi.string().valid('awake', 'light', 'deep', 'rem').required(),
        start_time: Joi.date().iso().required(),
        end_time: Joi.date().iso().required(),
        duration_seconds: Joi.number().min(0).required()
      })
    ).optional(),
    heart_rate_avg: Joi.number().min(0).optional(),
    respiratory_rate_avg: Joi.number().min(0).optional(),
    temperature_avg: Joi.number().optional(),
    disturbance_count: Joi.number().integer().min(0).optional(),
    environmental_factors: Joi.object().optional(),
    metadata: Joi.object().optional()
  }),
  
  manualNutrition: Joi.object({
    timestamp: Joi.date().iso().required(),
    meal_type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
    foods: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        unit: Joi.string().required(),
        calories: Joi.number().min(0).optional(),
        macronutrients: Joi.object({
          protein: Joi.number().min(0).optional(),
          carbohydrates: Joi.number().min(0).optional(),
          fat: Joi.number().min(0).optional(),
          fiber: Joi.number().min(0).optional()
        }).optional(),
        micronutrients: Joi.object().optional()
      })
    ).required(),
    total_calories: Joi.number().min(0).optional(),
    total_macronutrients: Joi.object({
      protein: Joi.number().min(0).optional(),
      carbohydrates: Joi.number().min(0).optional(),
      fat: Joi.number().min(0).optional(),
      fiber: Joi.number().min(0).optional()
    }).optional(),
    water_intake_ml: Joi.number().min(0).optional(),
    metadata: Joi.object().optional()
  })
};