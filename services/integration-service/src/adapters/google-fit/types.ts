export interface GoogleFitToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleFitProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface GoogleFitDevice {
  type: string;
  model: string;
  manufacturer: string;
  uid: string;
  version: string;
}

export interface GoogleFitHeartRateDataPoint {
  startTimeMillis: string;
  endTimeMillis: string;
  value: number;
}

export interface GoogleFitDataPoint {
  startTimeNanos: string;
  endTimeNanos: string;
  value: number[];
  originDataSourceId?: string;
}

export interface GoogleFitDataSet {
  dataSourceId: string;
  point: GoogleFitDataPoint[];
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
  heartRate?: {
    average: number;
    max: number;
    dataPoints: GoogleFitHeartRateDataPoint[];
  };
  device?: GoogleFitDevice;
}

export interface GoogleFitSleepStage {
  stage: string;
  startTimeMillis: string;
  endTimeMillis: string;
  durationMillis: number;
}

export interface GoogleFitSleep {
  id: string;
  startTimeMillis: string;
  endTimeMillis: string;
  modifiedTimeMillis: string;
  sleepStages: GoogleFitSleepStage[];
  application: {
    packageName: string;
    version: string;
  };
  device?: GoogleFitDevice;
}

export interface GoogleFitNutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface GoogleFitFoodItem {
  name: string;
  quantity: number;
  unit: string;
  nutrients: GoogleFitNutrient[];
  calories: number;
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
  foodItems: GoogleFitFoodItem[];
  device?: GoogleFitDevice;
}

export interface GoogleFitDataSourceResponse {
  dataSource: {
    dataStreamId: string;
    type: string;
    dataStreamName: string;
    application: {
      packageName: string;
    };
    dataType: {
      name: string;
      field: {
        name: string;
        format: string;
      }[];
    };
    device: GoogleFitDevice;
  }[];
}

export interface GoogleFitDatasetResponse {
  minStartTimeNs: string;
  maxEndTimeNs: string;
  dataSourceId: string;
  point: GoogleFitDataPoint[];
}

export interface GoogleFitSessionResponse {
  session: {
    id: string;
    name: string;
    description: string;
    startTimeMillis: string;
    endTimeMillis: string;
    modifiedTimeMillis: string;
    application: {
      packageName: string;
      version: string;
    };
    activityType: number;
    activeTimeMillis?: string;
  }[];
}