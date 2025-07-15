/**
 * Date formatting utilities
 * Consolidated from various components
 */

/**
 * Format date to standard display format
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export const formatDateISO = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Format month number to month name
 */
export const formatMonthName = (month: number, format: 'short' | 'long' = 'long'): string => {
  const date = new Date(2025, month - 1, 1);
  return date.toLocaleString('default', { month: format });
};

/**
 * Format quarter from month number
 */
export const formatQuarter = (month: number): string => {
  const quarter = Math.ceil(month / 3);
  return `Q${quarter}`;
};

/**
 * Format month and year
 */
export const formatMonthYear = (month: number, year: number, format: 'short' | 'long' = 'short'): string => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('default', { 
    month: format, 
    year: 'numeric' 
  });
};

/**
 * Format date range
 */
export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
};

/**
 * Format relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Format fiscal year
 */
export const formatFiscalYear = (date: Date | string, fiscalYearStartMonth: number = 1): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  
  if (month >= fiscalYearStartMonth) {
    return `FY${year}`;
  } else {
    return `FY${year - 1}`;
  }
};

/**
 * Format duration (in days, hours, minutes)
 */
export const formatDuration = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffMs = Math.abs(end.getTime() - start.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Same day';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
};

/**
 * Get month names array
 */
export const getMonthNames = (format: 'short' | 'long' = 'short'): string[] => {
  return Array.from({ length: 12 }, (_, i) => formatMonthName(i + 1, format));
};

/**
 * Get quarter label
 */
export const getQuarterLabel = (quarter: number, year?: number): string => {
  const label = `Q${quarter}`;
  return year ? `${label} ${year}` : label;
};

/**
 * Parse date string flexibly
 */
export const parseDate = (dateString: string): Date | null => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};