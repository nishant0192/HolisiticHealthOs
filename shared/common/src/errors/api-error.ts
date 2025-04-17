// api-error.ts
export class ApiError extends Error {
    constructor(
      public message: string,
      public status = 500,
      public details?: unknown
    ) {
      super(message);
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  