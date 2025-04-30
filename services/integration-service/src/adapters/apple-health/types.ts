export interface AppleHealthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    id_token: string;
  }
  
  export interface AppleHealthProfile {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  }
  
  export interface AppleHealthActivity {
    id: string;
    sourceName: string;
    sourceId: string;
    startDate: string;
    endDate: string;
    duration: number;
    activeEnergyBurned: number;
    activeEnergyBurnedUnit: string;
    distance: number;
    distanceUnit: string;
    workoutActivityType: string;
  }
  
  export interface AppleHealthSleep {
    id: string;
    sourceName: string;
    sourceId: string;
    startDate: string;
    endDate: string;
    duration: number;
    sleepStages: {
      stage: string;
      startDate: string;
      endDate: string;
      duration: number;
    }[];
  }
  
  export interface AppleHealthNutrition {
    id: string;
    sourceName: string;
    sourceId: string;
    date: string;
    meal: string;
    foodItems: {
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      carbohydrates: number;
      protein: number;
      fat: number;
      fiber: number;
    }[];
  }