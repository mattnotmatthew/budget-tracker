/**
 * Date utility functions
 */

/**
 * Get the months that belong to a specific quarter
 * @param quarter - The quarter number (1-4)
 * @returns Array of month numbers (1-12)
 */
export const getQuarterMonths = (quarter: number): number[] => {
  switch (quarter) {
    case 1:
      return [1, 2, 3];
    case 2:
      return [4, 5, 6];
    case 3:
      return [7, 8, 9];
    case 4:
      return [10, 11, 12];
    default:
      return [];
  }
};

/**
 * Get the current quarter based on the current month
 * @returns The current quarter number (1-4)
 */
export const getCurrentQuarter = (): number => {
  const month = new Date().getMonth() + 1; // JavaScript months are 0-indexed
  return Math.ceil(month / 3);
};

/**
 * Get quarter label from quarter number
 * @param quarter - The quarter number (1-4)
 * @returns Quarter label (e.g., "Q1", "Q2")
 */
export const getQuarterLabel = (quarter: number): string => {
  return `Q${quarter}`;
};

/**
 * Get the start and end months for a quarter
 * @param quarter - The quarter number (1-4)
 * @returns Object with startMonth and endMonth
 */
export const getQuarterBounds = (quarter: number): { startMonth: number; endMonth: number } => {
  const months = getQuarterMonths(quarter);
  return {
    startMonth: months[0] || 1,
    endMonth: months[months.length - 1] || 3,
  };
};

/**
 * Check if a month belongs to a specific quarter
 * @param month - The month number (1-12)
 * @param quarter - The quarter number (1-4)
 * @returns True if the month belongs to the quarter
 */
export const isMonthInQuarter = (month: number, quarter: number): boolean => {
  const quarterMonths = getQuarterMonths(quarter);
  return quarterMonths.includes(month);
};

/**
 * Month names array for easy access
 */
export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Get month name from month number
 * @param month - The month number (1-12)
 * @returns The month name
 */
export const getMonthName = (month: number): string => {
  return monthNames[month - 1] || "";
};

/**
 * Get abbreviated month name from month number
 * @param month - The month number (1-12)
 * @returns The abbreviated month name (e.g., "Jan", "Feb")
 */
export const getMonthAbbreviation = (month: number): string => {
  const name = getMonthName(month);
  return name.substring(0, 3);
};