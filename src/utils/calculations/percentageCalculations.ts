/**
 * Percentage calculation utilities
 * Consolidated from various components
 */

/**
 * Calculate percentage of actual vs budget
 */
export const calculateUtilizationPercentage = (actual: number, budget: number): number => {
  if (budget === 0) return 0;
  return (actual / budget) * 100;
};

/**
 * Calculate growth percentage between two values
 */
export const calculateGrowthPercentage = (currentValue: number, previousValue: number): number => {
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
};

/**
 * Calculate percentage share of total
 */
export const calculateSharePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Calculate completion percentage based on time period
 */
export const calculatePeriodCompletionPercentage = (
  currentPeriod: number,
  totalPeriods: number
): number => {
  if (totalPeriods === 0) return 0;
  return (currentPeriod / totalPeriods) * 100;
};

/**
 * Calculate run rate percentage
 * Projects annual performance based on YTD data
 */
export const calculateRunRatePercentage = (
  ytdActual: number,
  periodsComplete: number,
  totalPeriods: number,
  annualBudget: number
): number => {
  if (periodsComplete === 0 || annualBudget === 0) return 0;
  const projectedAnnual = (ytdActual / periodsComplete) * totalPeriods;
  return (projectedAnnual / annualBudget) * 100;
};

/**
 * Calculate category percentage of parent
 * Used for hierarchical budget breakdowns
 */
export const calculateCategoryPercentageOfParent = (
  categoryAmount: number,
  parentAmount: number
): number => {
  if (parentAmount === 0) return 0;
  return (categoryAmount / parentAmount) * 100;
};

/**
 * Format percentage for display
 * Handles edge cases and consistent formatting
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1,
  includeSign: boolean = false
): string => {
  if (!isFinite(value)) return "N/A";
  
  const formatted = value.toFixed(decimals);
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${formatted}%`;
};

/**
 * Calculate percentage change with handling for zero base
 */
export const calculatePercentageChange = (
  newValue: number,
  oldValue: number
): number | null => {
  if (oldValue === 0) {
    if (newValue === 0) return 0;
    return null; // Indicates infinite change
  }
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

/**
 * Calculate weighted percentage
 * Used for weighted averages in budget calculations
 */
export const calculateWeightedPercentage = (
  values: number[],
  weights: number[]
): number => {
  if (values.length !== weights.length || values.length === 0) {
    return 0;
  }
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = values.reduce((sum, value, index) => {
    return sum + (value * weights[index]);
  }, 0);
  
  return weightedSum / totalWeight;
};