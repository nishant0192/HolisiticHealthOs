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
      throw new ApiError('Validation failed: ' + error.details.map(d => d.message).join(', '), 400);
    }
    
    next();
  };
};

export const userValidationSchemas = {
  updateProfile: Joi.object({
    first_name: Joi.string().min(2).max(50),
    last_name: Joi.string().min(2).max(50),
    date_of_birth: Joi.date().iso().max('now'),
    gender: Joi.string().valid('male', 'female', 'non-binary', 'prefer_not_to_say', 'other'),
    phone_number: Joi.string().pattern(/^\+?[0-9\s\-\(\)]{7,20}$/).message('Please provide a valid phone number'),
    profile_picture: Joi.string().uri()
  }),
  
  updateHealthProfile: Joi.object({
    health_conditions: Joi.array().items(Joi.string()),
    medications: Joi.array().items(Joi.string()),
    allergies: Joi.array().items(Joi.string()),
    dietary_preferences: Joi.array().items(Joi.string()),
    activity_level: Joi.string().valid('sedentary', 'light', 'moderate', 'active', 'very_active'),
    sleep_goal_hours: Joi.number().min(3).max(12),
    fitness_experience: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    motivation_factors: Joi.array().items(Joi.string()),
    stress_level: Joi.number().min(1).max(10),
    height_cm: Joi.number().min(50).max(300),
    weight_kg: Joi.number().min(20).max(500)
  }),
  
  createGoal: Joi.object({
    goal_type: Joi.string().required().valid(
      'weight', 'steps', 'distance', 'sleep', 'nutrition', 'water', 'meditation', 'custom'
    ),
    target: Joi.number().required(),
    unit: Joi.string().required(),
    start_date: Joi.date().iso().required(),
    target_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
    description: Joi.string().max(500)
  }),
  
  updateGoal: Joi.object({
    target: Joi.number(),
    target_date: Joi.date().iso(),
    status: Joi.string().valid('active', 'completed', 'abandoned'),
    progress: Joi.number().min(0).max(100),
    description: Joi.string().max(500)
  })
};