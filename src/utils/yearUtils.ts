/**
 * Year Utility Functions for Planning Feature
 *
 * This utility provides year-agnostic functions for calculating
 * planning years, determining available years, and managing
 * year-based planning logic.
 */

/**
 * Get the current year
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Get the next planning year (typically current year + 1)
 */
export const getNextPlanningYear = (): number => {
  return getCurrentYear() + 1;
};

/**
 * Get the default base year for planning (typically current year)
 */
export const getDefaultBaseYear = (): number => {
  return getCurrentYear();
};

/**
 * Get available planning years
 * @param yearsAhead Number of years to plan ahead (default: 2)
 * @returns Array of future years available for planning
 */
export const getAvailablePlanningYears = (yearsAhead: number = 2): number[] => {
  const currentYear = getCurrentYear();
  const years: number[] = [];

  for (let i = 1; i <= yearsAhead; i++) {
    years.push(currentYear + i);
  }

  return years;
};

/**
 * Check if a year is a valid planning year (future year)
 * @param year Year to check
 * @returns True if year is in the future
 */
export const isValidPlanningYear = (year: number): boolean => {
  return year > getCurrentYear();
};

/**
 * Get the most appropriate base year for planning
 * @param planningYear The year we're planning for
 * @returns The best year to base planning calculations on
 */
export const getBaseYearForPlanning = (planningYear: number): number => {
  // Typically plan based on the previous year
  return planningYear - 1;
};

/**
 * Generate a user-friendly label for a planning year
 * @param year The planning year
 * @returns A formatted label like "2026 (Planning)"
 */
export const getPlanningYearLabel = (year: number): string => {
  return `${year} (Planning)`;
};

/**
 * Get all years that have budget data (historical + current)
 * @param availableYears Array of years that have data
 * @returns Array of years with existing data
 */
export const getHistoricalYears = (availableYears: number[]): number[] => {
  const currentYear = getCurrentYear();
  return availableYears.filter((year) => year <= currentYear);
};

/**
 * Determine if we can create planning data based on available historical data
 * @param availableYears Years with existing budget data
 * @param planningYear The year we want to plan for
 * @returns True if we have sufficient data to create a plan
 */
export const canCreatePlanningData = (
  availableYears: number[],
  planningYear: number
): boolean => {
  if (!isValidPlanningYear(planningYear)) {
    return false;
  }

  const baseYear = getBaseYearForPlanning(planningYear);
  return availableYears.includes(baseYear);
};
