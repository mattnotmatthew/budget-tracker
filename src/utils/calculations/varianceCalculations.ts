/**
 * Variance calculation utilities
 * Consolidated from various components
 */

/**
 * Calculate basic variance between actual and budget
 */
export const calculateVariance = (actual: number, budget: number): number => {
  return actual - budget;
};

/**
 * Calculate variance percentage
 */
export const calculateVariancePercentage = (actual: number, budget: number): number => {
  if (budget === 0) return 0;
  return ((actual - budget) / Math.abs(budget)) * 100;
};

/**
 * Calculate variance with normalization for small amounts
 * Used in MonthlyView and other components
 */
export const calculateNormalizedVariance = (variance: number): number => {
  const varianceInThousands = variance / 1000;
  return Math.abs(varianceInThousands) < 0.001 ? 0 : variance;
};

/**
 * Get variance status class based on variance amount
 */
export const getVarianceClass = (variance: number): string => {
  const normalizedVariance = calculateNormalizedVariance(variance);
  
  if (normalizedVariance === 0) return "neutral";
  if (normalizedVariance > 0) return "positive";
  if (normalizedVariance < -5000) return "danger";
  if (normalizedVariance < 0) return "negative";
  return "neutral";
};

/**
 * Calculate cumulative variance over a period
 */
export const calculateCumulativeVariance = (
  actuals: number[],
  budgets: number[]
): number => {
  if (actuals.length !== budgets.length) {
    throw new Error("Actuals and budgets arrays must have the same length");
  }
  
  return actuals.reduce((sum, actual, index) => {
    return sum + calculateVariance(actual, budgets[index]);
  }, 0);
};

/**
 * Calculate variance trend (increasing/decreasing)
 */
export const calculateVarianceTrend = (variances: number[]): 'improving' | 'worsening' | 'stable' => {
  if (variances.length < 2) return 'stable';
  
  const recentVariances = variances.slice(-3); // Look at last 3 periods
  const firstVariance = recentVariances[0];
  const lastVariance = recentVariances[recentVariances.length - 1];
  
  const changePercentage = Math.abs((lastVariance - firstVariance) / (firstVariance || 1)) * 100;
  
  if (changePercentage < 5) return 'stable';
  return lastVariance > firstVariance ? 'improving' : 'worsening';
};

/**
 * Calculate budget tracking variance
 * Used for tracking actual vs budget performance
 */
export const calculateBudgetTrackingVariance = (
  netTotal: { actual: number; budget: number; adjustments: number },
  isInForecastMode: boolean
): { actual: number; budget: number; reforecast: number; variance: number } => {
  // This is extracted from the calculateBudgetTracking function
  if (isInForecastMode) {
    // Forecast mode: actual with adjustments vs budget
    const reforecast = netTotal.actual + netTotal.adjustments;
    return {
      actual: 0,
      budget: netTotal.budget,
      reforecast: reforecast,
      variance: reforecast - netTotal.budget,
    };
  } else {
    // Final mode: actual vs budget
    return {
      actual: netTotal.actual,
      budget: netTotal.budget,
      reforecast: 0,
      variance: netTotal.actual - netTotal.budget,
    };
  }
};