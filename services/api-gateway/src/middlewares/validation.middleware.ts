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
      
      throw new ApiError('Validation failed', 400);
    }
    
    next();
  };
};