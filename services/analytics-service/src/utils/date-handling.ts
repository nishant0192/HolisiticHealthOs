import {
    parse,
    format,
    // addDays,
    // addMonths,
    subDays,
    subMonths,
    eachDayOfInterval,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    differenceInDays,
    isSameDay,
    isWithinInterval,
    isValid
  } from 'date-fns';
  
  /**
   * Convert a date string to a Date object
   */
  export function parseDate(dateStr: string): Date {
    // Try to parse ISO format first
    const date = new Date(dateStr);
    if (isValid(date)) {
      return date;
    }
    
    // Try other common formats
    try {
      // MM/DD/YYYY
      return parse(dateStr, 'MM/dd/yyyy', new Date());
    } catch (e) {
      try {
        // YYYY-MM-DD
        return parse(dateStr, 'yyyy-MM-dd', new Date());
      } catch (e) {
        try {
          // DD-MM-YYYY
          return parse(dateStr, 'dd-MM-yyyy', new Date());
        } catch (e) {
          throw new Error(`Unable to parse date: ${dateStr}`);
        }
      }
    }
  }
  
  /**
   * Format a date to ISO string date (YYYY-MM-DD)
   */
  export function formatISODate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  }
  
  /**
   * Format a date to a human-friendly string
   */
  export function formatHumanDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  }
  
  /**
   * Get the start and end dates for a specific time range
   */
  export function getDateRange(
    range: 'day' | 'week' | 'month' | 'year' | 'custom',
    customStart?: Date | string,
    customEnd?: Date | string
  ): { startDate: Date; endDate: Date } {
    const today = new Date();
    
    switch (range) {
      case 'day':
        return {
          startDate: startOfDay(today),
          endDate: endOfDay(today)
        };
      
      case 'week':
        return {
          startDate: startOfWeek(today, { weekStartsOn: 1 }), // Week starts on Monday
          endDate: endOfWeek(today, { weekStartsOn: 1 })
        };
      
      case 'month':
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        };
      
      case 'year': {
        const startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
        const endDate = new Date(today.getFullYear(), 11, 31); // December 31st of current year
        return { startDate, endDate };
      }
      
      case 'custom':
        if (!customStart || !customEnd) {
          throw new Error('Custom date range requires both start and end dates');
        }
        
        const startDate = typeof customStart === 'string' 
          ? parseDate(customStart) 
          : customStart;
        
        const endDate = typeof customEnd === 'string' 
          ? parseDate(customEnd) 
          : customEnd;
        
        return { startDate, endDate };
      
      default:
        throw new Error(`Invalid date range: ${range}`);
    }
  }
  
  /**
   * Generate an array of dates between two dates
   */
  export function generateDateArray(startDate: Date | string, endDate: Date | string): Date[] {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    return eachDayOfInterval({ start, end });
  }
  
  /**
   * Generate an array of date strings between two dates
   */
  export function generateDateStringArray(startDate: Date | string, endDate: Date | string): string[] {
    return generateDateArray(startDate, endDate).map(date => formatISODate(date));
  }
  
  /**
   * Fill missing dates in a time series with default values
   */
  export function fillMissingDates<T>(
    data: T[],
    startDate: Date | string,
    endDate: Date | string,
    dateKey: keyof T,
    defaultValue: Partial<T>
  ): T[] {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // Generate array of all dates in the range
    const allDates = eachDayOfInterval({ start, end });
    
    // Create a map of existing dates for quick lookup
    const dateMap = new Map<string, T>();
    data.forEach(item => {
      const itemDate = new Date(item[dateKey] as string);
      dateMap.set(formatISODate(itemDate), item);
    });
    
    // Create a new array with all dates
    const result: T[] = [];
    
    allDates.forEach(date => {
      const dateStr = formatISODate(date);
      if (dateMap.has(dateStr)) {
        result.push(dateMap.get(dateStr)!);
      } else {
        // Create a new object with default values and the current date
        const newItem = {
          ...defaultValue,
          [dateKey]: dateStr
        } as T;
        
        result.push(newItem);
      }
    });
    
    return result;
  }
  
  /**
   * Group dates by time period
   */
  export function groupDatesByPeriod<T>(
    data: T[],
    period: 'day' | 'week' | 'month',
    dateKey: keyof T,
    aggregateFn: (items: T[]) => any
  ): any[] {
    if (data.length === 0) {
      return [];
    }
    
    // Group data by period
    const groups: Record<string, T[]> = {};
    
    data.forEach(item => {
      const date = new Date(item[dateKey] as string);
      let key: string;
      
      switch (period) {
        case 'day':
          key = formatISODate(date);
          break;
        case 'week':
          // Use the first day of the week as the key
          const weekStart = startOfWeek(date, { weekStartsOn: 1 });
          key = formatISODate(weekStart);
          break;
        case 'month':
          // Use year-month as the key
          key = format(date, 'yyyy-MM');
          break;
        default:
          throw new Error(`Invalid period: ${period}`);
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push(item);
    });
    
    // Convert groups to array and apply aggregation function
    return Object.entries(groups).map(([key, items]) => {
      const aggregated = aggregateFn(items);
      
      return {
        period: key,
        ...aggregated
      };
    });
  }
  
  /**
   * Calculate the number of days between two dates
   */
  export function daysBetween(startDate: Date | string, endDate: Date | string): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    return differenceInDays(end, start);
  }
  
  /**
   * Get previous time period
   */
  export function getPreviousPeriod(
    period: 'day' | 'week' | 'month' | 'custom',
    startDate: Date,
    endDate: Date
  ): { startDate: Date; endDate: Date } {
    const daysInPeriod = differenceInDays(endDate, startDate) + 1;
    
    switch (period) {
      case 'day':
        return {
          startDate: subDays(startDate, 1),
          endDate: subDays(endDate, 1)
        };
      
      case 'week':
        return {
          startDate: subDays(startDate, 7),
          endDate: subDays(endDate, 7)
        };
      
      case 'month':
        return {
          startDate: subMonths(startDate, 1),
          endDate: subDays(startDate, 1)
        };
      
      case 'custom':
        return {
          startDate: subDays(startDate, daysInPeriod),
          endDate: subDays(endDate, daysInPeriod)
        };
      
      default:
        throw new Error(`Invalid period: ${period}`);
    }
  }
  
  /**
   * Check if a date is within the specified range
   */
  export function isDateInRange(
    date: Date | string,
    startDate: Date | string,
    endDate: Date | string
  ): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    return isWithinInterval(dateObj, { start, end });
  }
  
  /**
   * Get date periods for comparison (current and previous periods)
   */
  export function getComparisonPeriods(
    period: 'day' | 'week' | 'month' | 'year',
    endDate: Date | string = new Date()
  ): { current: { startDate: Date; endDate: Date }; previous: { startDate: Date; endDate: Date } } {
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    let current: { startDate: Date; endDate: Date };
    
    switch (period) {
      case 'day':
        current = {
          startDate: startOfDay(end),
          endDate: endOfDay(end)
        };
        break;
      
      case 'week': {
        const weekEnd = endOfWeek(end, { weekStartsOn: 1 });
        current = {
          startDate: startOfWeek(end, { weekStartsOn: 1 }),
          endDate: isSameDay(weekEnd, end) ? end : weekEnd
        };
        break;
      }
      
      case 'month': {
        const monthEnd = endOfMonth(end);
        current = {
          startDate: startOfMonth(end),
          endDate: isSameDay(monthEnd, end) ? end : monthEnd
        };
        break;
      }
      
      case 'year': {
        const yearEnd = new Date(end.getFullYear(), 11, 31);
        current = {
          startDate: new Date(end.getFullYear(), 0, 1),
          endDate: isSameDay(yearEnd, end) ? end : yearEnd
        };
        break;
      }
      
      default:
        throw new Error(`Invalid period: ${period}`);
    }
    
    // Calculate previous period
    const daysInPeriod = differenceInDays(current.endDate, current.startDate) + 1;
    const previous = {
      startDate: subDays(current.startDate, daysInPeriod),
      endDate: subDays(current.endDate, daysInPeriod)
    };
    
    return { current, previous };
  }