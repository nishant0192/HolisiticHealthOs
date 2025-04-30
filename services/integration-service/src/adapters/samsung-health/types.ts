export interface SamsungHealthToken {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }
  
  export interface SamsungHealthProfile {
    id: string;
    name: string;
    gender?: string;
    birthDate?: string;
    height?: number;
    weight?: number;
  }
  
  export interface SamsungHealthDevice {
    name?: string;
    model?: string;
    manufacturer?: string;
    uuid?: string;
  }
  
  export interface SamsungHealthActivity {
    id: string;
    type: string;
    startTime: number; // Unix timestamp in milliseconds
    endTime: number; // Unix timestamp in milliseconds
    duration: number; // Milliseconds
    distance?: number; // Meters
    distanceUnit?: string;
    calories?: number;
    steps?: number;
    device?: SamsungHealthDevice;
  }
  
  export interface SamsungHealthSleepStage {
    stage: string;
    startTime: number; // Unix timestamp in milliseconds
    endTime: number; // Unix timestamp in milliseconds
    duration: number; // Milliseconds
  }
  
  export interface SamsungHealthSleep {
    id: string;
    startTime: number; // Unix timestamp in milliseconds
    endTime: number; // Unix timestamp in milliseconds
    duration: number; // Milliseconds
    stages: SamsungHealthSleepStage[];
    quality?: number; // Sleep quality score (0-100)
    device?: SamsungHealthDevice;
  }
  
  export interface SamsungHealthNutrientInfo {
    carbs: number; // grams
    fat: number; // grams
    protein: number; // grams
    fiber: number; // grams
  }
  
  export interface SamsungHealthFoodItem {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    nutrients: SamsungHealthNutrientInfo;
  }
  
  export interface SamsungHealthNutrition {
    id: string;
    timestamp: number; // Unix timestamp in milliseconds
    mealType: string; // breakfast, lunch, dinner, snack
    foodItems: SamsungHealthFoodItem[];
    totalCalories: number;
    totalNutrients: SamsungHealthNutrientInfo;
    waterIntake?: number; // ml
    device?: SamsungHealthDevice;
  }