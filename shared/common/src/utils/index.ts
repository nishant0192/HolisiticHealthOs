// date.utils.ts
export const toIso = (date: Date | number) => new Date(date).toISOString();

export const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 86_400_000);
