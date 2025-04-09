import Joi from "joi";

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Sanitize input to prevent injection attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const userValidationSchemas = {
  updateUser: Joi.object({
    first_name: Joi.string().min(2).max(50),
    last_name: Joi.string().min(2).max(50),
    date_of_birth: Joi.date().iso().max('now'),
    gender: Joi.string().valid('male', 'female', 'non-binary', 'prefer_not_to_say', 'other'),
    phone_number: Joi.string().pattern(/^\+?[0-9\s\-\(\)]{7,20}$/).message('Please provide a valid phone number'),
    profile_picture: Joi.string().uri()
  }),

  updateUserStatus: Joi.object({
    is_active: Joi.boolean().required()
  }),

  // Include other schemas as needed
};
