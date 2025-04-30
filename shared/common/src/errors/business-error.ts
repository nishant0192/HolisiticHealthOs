// business-error.ts
export class BusinessError extends Error {
    constructor(public message: string, public code = 'BUSINESS_ERROR') {
      super(message);
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  