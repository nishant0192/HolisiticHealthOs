// src/utils/transform.ts

/**
 * Transform database model to API response format
 * @param user User database record
 * @returns User data formatted for API response
 */
export const transformUserResponse = (user: any) => {
    // Remove sensitive fields
    const { password_hash, ...userInfo } = user;

    return {
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        fullName: `${userInfo.first_name} ${userInfo.last_name}`,
        dateOfBirth: userInfo.date_of_birth,
        gender: userInfo.gender,
        phoneNumber: userInfo.phone_number,
        profilePicture: userInfo.profile_picture,
        isActive: userInfo.is_active,
        roles: userInfo.roles,
        createdAt: userInfo.created_at,
        updatedAt: userInfo.updated_at
    };
};

/**
 * Transform profile database model to API response format
 * @param profile Profile database record
 * @returns Profile data formatted for API response
 */
export const transformProfileResponse = (profile: any) => {
    return {
        id: profile.id,
        userId: profile.user_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: `${profile.first_name} ${profile.last_name}`,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        phoneNumber: profile.phone_number,
        profilePicture: profile.profile_picture,
        preferredUnits: profile.preferred_units,
        notificationPreferences: profile.notification_preferences,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
    };
};

/**
 * Transform API request data to database model format
 * @param data API request data
 * @returns Data formatted for database operations
 */
export const transformProfileRequest = (data: any) => {
    const transformedData: any = {};

    // Map camelCase fields to snake_case
    if (data.firstName !== undefined) transformedData.first_name = data.firstName;
    if (data.lastName !== undefined) transformedData.last_name = data.lastName;
    if (data.dateOfBirth !== undefined) transformedData.date_of_birth = data.dateOfBirth;
    if (data.gender !== undefined) transformedData.gender = data.gender;
    if (data.phoneNumber !== undefined) transformedData.phone_number = data.phoneNumber;
    if (data.profilePicture !== undefined) transformedData.profile_picture = data.profilePicture;
    if (data.preferredUnits !== undefined) transformedData.preferred_units = data.preferredUnits;
    if (data.notificationPreferences !== undefined) transformedData.notification_preferences = data.notificationPreferences;

    return transformedData;
};

/**
 * Transform health profile database model to API response format
 */
export const transformHealthProfileResponse = (profile: any) => {
    return {
        userId: profile.user_id,
        healthConditions: profile.health_conditions || [],
        medications: profile.medications || [],
        allergies: profile.allergies || [],
        dietaryPreferences: profile.dietary_preferences || [],
        activityLevel: profile.activity_level || 'moderate',
        sleepGoalHours: profile.sleep_goal_hours || 8,
        fitnessExperience: profile.fitness_experience || 'beginner',
        motivationFactors: profile.motivation_factors || [],
        stressLevel: profile.stress_level || 5,
        heightCm: profile.height_cm,
        weightKg: profile.weight_kg,
        bmi: calculateBMI(profile.height_cm, profile.weight_kg),
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
    };
};

/**
 * Transform API request data to database model format for health profile
 */
export const transformHealthProfileRequest = (data: any) => {
    const transformedData: any = {};

    // Map camelCase fields to snake_case
    if (data.healthConditions !== undefined) transformedData.health_conditions = data.healthConditions;
    if (data.medications !== undefined) transformedData.medications = data.medications;
    if (data.allergies !== undefined) transformedData.allergies = data.allergies;
    if (data.dietaryPreferences !== undefined) transformedData.dietary_preferences = data.dietaryPreferences;
    if (data.activityLevel !== undefined) transformedData.activity_level = data.activityLevel;
    if (data.sleepGoalHours !== undefined) transformedData.sleep_goal_hours = data.sleepGoalHours;
    if (data.fitnessExperience !== undefined) transformedData.fitness_experience = data.fitnessExperience;
    if (data.motivationFactors !== undefined) transformedData.motivation_factors = data.motivationFactors;
    if (data.stressLevel !== undefined) transformedData.stress_level = data.stressLevel;
    if (data.heightCm !== undefined) transformedData.height_cm = data.heightCm;
    if (data.weightKg !== undefined) transformedData.weight_kg = data.weightKg;

    return transformedData;
};

/**
 * Calculate BMI if height and weight are available
 */
const calculateBMI = (heightCm: number | null, weightKg: number | null): number | null => {
    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
        return null;
    }

    // BMI formula: weight (kg) / (height (m))²
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};