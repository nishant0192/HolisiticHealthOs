export interface FitbitToken {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    user_id: string;
  }
  
  export interface FitbitProfile {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    memberSince: string;
  }
  
  export interface FitbitSourceDevice {
    id?: string;
    name?: string;
    type?: string;
  }
  
  export interface FitbitHeartRateZone {
    name: string;
    min: number;
    max: number;
    minutes: number;
    caloriesOut: number;
  }
  
  export interface FitbitActivity {
    id: string;
    name: string;
    activityType: string;
    startTime: string;
    duration: number;
    distance?: number;
    distanceUnit?: string;
    calories?: number;
    steps?: number;
    heartRateZones?: FitbitHeartRateZone[];
    tcxLink?: string;
    source?: string;
    sourceDevice?: FitbitSourceDevice;
  }
  
  export interface FitbitSleepStage {
    stage: string;
    startTime: string;
    duration: number;
  }
  
  export interface FitbitSleep {
    id: string;
    startTime: string;
    endTime: string;
    duration: number;
    efficiency: number;
    isMainSleep: boolean;
    sleepStages: FitbitSleepStage[];
    minutesAsleep: number;
    minutesAwake: number;
    minutesToFallAsleep: number;
    timeInBed: number;
    sourceDevice?: FitbitSourceDevice;
  }
  
  export interface FitbitFoodNutrients {
    carbs: number;
    fat: number;
    protein: number;
    fiber: number;
  }
  
  export interface FitbitFood {
    name: string;
    amount: number;
    unit: string;
    calories: number;
    nutrients: FitbitFoodNutrients;
  }
  
  export interface FitbitNutrition {
    id: string;
    date: string;
    mealType: string;
    foods: FitbitFood[];
    totalCalories: number;
    totalNutrients: FitbitFoodNutrients;
    waterConsumption?: number;
    sourceDevice?: FitbitSourceDevice;
  }