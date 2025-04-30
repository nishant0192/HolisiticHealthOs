export interface GarminToken {
    oauth_token: string;
    oauth_token_secret: string;
    user_id: string;
  }
  
  export interface GarminProfile {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    gender?: string;
    age?: number;
    heightCm?: number;
    weightKg?: number;
  }
  
  export interface GarminActivity {
    id: string;
    name: string;
    type: string;
    startTime: number; // Timestamp in milliseconds
    durationInSeconds: number;
    distanceInMeters?: number;
    averageHeartRate?: number;
    maxHeartRate?: number;
    calories?: number;
    steps?: number;
    deviceName?: string;
  }
  
  export interface GarminSleepStage {
    stage: string;
    startTimeInSeconds: number;
    endTimeInSeconds: number;
    durationInSeconds: number;
  }
  
  export interface GarminSleep {
    id: string;
    startTimeInSeconds: number;
    endTimeInSeconds: number;
    durationInSeconds: number;
    sleepStages: GarminSleepStage[];
    sleepQualityScore?: number | null;
    unmeasurableSleep?: number;
    validationTime?: string | null;
    deviceName?: string;
  }
  
  export interface GarminFoodNutrients {
    carbs: number;
    fat: number;
    protein: number;
    fiber: number;
  }
  
  export interface GarminFood {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    nutrients: GarminFoodNutrients;
  }
  
  export interface GarminNutrition {
    id: string;
    date: string;
    mealType: string;
    foods: GarminFood[];
    totalCalories: number;
    totalNutrients: GarminFoodNutrients;
    waterIntake?: number;
    deviceName?: string;
  }