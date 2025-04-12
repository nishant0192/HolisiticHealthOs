export interface GoogleFitToken {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
    id_token: string;
  }
  
  export interface GoogleFitProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
  }
  
  export interface GoogleFitActivity {
    id: string;
    activityType: string;
    startTimeMillis: string;
    endTimeMillis: string;
    modifiedTimeMillis: string;
    activitySegments: {
      startTimeMillis: string;
      endTimeMillis: string;
      activityType: string;
    }[];
    application: {
      packageName: string;
      version: string;
    };
    calories: {
      value: number;
      unit: string;
    };
    distance: {
      value: number;
      unit: string;
    };
    steps: {
      value: number;
    };
  }
  
  export interface GoogleFitSleep {
    id: string;
    startTimeMillis: string;
    endTimeMillis: string;
    modifiedTimeMillis: string;
    sleepSegments: {
      startTimeMillis: string;
      endTimeMillis: string;
      sleepStage: string;
    }[];
    application: {
      packageName: string;
      version: string;
    };
  }
  
  export interface GoogleFitNutrition {
    id: string;
    startTimeMillis: string;
    endTimeMillis: string;
    modifiedTimeMillis: string;
    nutrients: {
      calories: number;
      fat: number;
      protein: number;
      carbohydrates: number;
      fiber: number;
    };
    application: {
      packageName: string;
      version: string;
    };
    meal: string;
    foodItems: {
      name: string;
      nutrients: {
        calories: number;
        fat: number;
        protein: number;
        carbohydrates: number;
        fiber: number;
      };
      amount: {
        value: number;
        unit: string;
      };
    }[];
  }