export interface WithingsToken {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    userid: string;
  }
  
  export interface WithingsProfile {
    id: string;
    firstname: string;
    lastname: string;
    gender: number; // 0: male, 1: female
    birthdate: string; // YYYY-MM-DD format
    height: number; // cm
    weight: number; // kg
  }
  
  export interface WithingsDevice {
    type: string;
    model: string;
    model_id: string;
    battery: string;
    deviceid: string;
    timezone: string;
  }
  
  export interface WithingsActivity {
    id: string;
    startdate: number; // Unix timestamp
    enddate: number; // Unix timestamp
    type: number; // Activity type ID
    category: string; // Activity category
    calories: number; // Calories burned
    distance: number; // Distance in meters
    steps: number; // Number of steps
    elevation: number; // Elevation gain in meters
    duration: number; // Duration in seconds
    hr_average: number; // Average heart rate
    hr_max: number; // Maximum heart rate
    hr_min: number; // Minimum heart rate
    deviceid: string; // Device ID
  }
  
  export interface WithingsSleepStage {
    state: number; // 0: awake, 1: light, 2: deep, 3: REM
    startdate: number; // Unix timestamp
    enddate: number; // Unix timestamp
    duration: number; // Duration in seconds
  }
  
  export interface WithingsSleep {
    id: number;
    startdate: number; // Unix timestamp
    enddate: number; // Unix timestamp
    duration: number; // Duration in seconds
    data: WithingsSleepStage[];
    model: string;
    model_id: string;
    deviceid: string;
    hash_deviceid: string;
    timezone: string;
  }
  
  export interface WithingsNutrient {
    carbs: number; // grams
    fat: number; // grams
    protein: number; // grams
    fiber: number; // grams
    sodium: number; // mg
    water: number; // ml
  }
  
  export interface WithingsMeal {
    id: number;
    name: string;
    category: number; // 1: breakfast, 2: lunch, 3: dinner, 4: snack
    date: number; // Unix timestamp
    nutrients: WithingsNutrient;
    brands: string[];
    foodItems: WithingsFoodItem[];
  }
  
  export interface WithingsFoodItem {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    nutrients: WithingsNutrient;
    brands: string[];
  }
  
  export interface WithingsNutrition {
    id: number;
    date: number; // Unix timestamp
    created: number; // Unix timestamp
    modified: number; // Unix timestamp
    meals: WithingsMeal[];
    waterIntake: number; // ml
  }