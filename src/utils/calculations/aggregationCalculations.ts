/**
 * Aggregation calculation utilities
 * Consolidated from various components
 */

/**
 * Calculate quarterly totals from monthly data
 */
export const calculateQuarterlyTotals = (monthlyData: number[]): number[] => {
  if (monthlyData.length !== 12) {
    throw new Error("Monthly data must contain exactly 12 values");
  }
  
  const quarters = [];
  for (let q = 0; q < 4; q++) {
    const startMonth = q * 3;
    const quarterTotal = monthlyData
      .slice(startMonth, startMonth + 3)
      .reduce((sum, value) => sum + value, 0);
    quarters.push(quarterTotal);
  }
  return quarters;
};

/**
 * Calculate YTD (Year-to-Date) total
 */
export const calculateYTD = (
  monthlyData: number[],
  throughMonth: number
): number => {
  if (throughMonth < 1 || throughMonth > 12) {
    throw new Error("Month must be between 1 and 12");
  }
  
  return monthlyData
    .slice(0, throughMonth)
    .reduce((sum, value) => sum + value, 0);
};

/**
 * Calculate rolling average
 */
export const calculateRollingAverage = (
  data: number[],
  periods: number
): number[] => {
  if (periods > data.length) {
    throw new Error("Rolling period cannot be greater than data length");
  }
  
  const averages = [];
  for (let i = periods - 1; i < data.length; i++) {
    const sum = data
      .slice(i - periods + 1, i + 1)
      .reduce((acc, val) => acc + val, 0);
    averages.push(sum / periods);
  }
  return averages;
};

/**
 * Calculate monthly average from YTD data
 */
export const calculateMonthlyAverage = (
  ytdTotal: number,
  monthsComplete: number
): number => {
  if (monthsComplete === 0) return 0;
  return ytdTotal / monthsComplete;
};

/**
 * Aggregate data by category
 */
export const aggregateByCategory = <T extends { category: string; amount: number }>(
  data: T[]
): Record<string, number> => {
  return data.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Calculate weighted average
 */
export const calculateWeightedAverage = (
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

/**
 * Calculate sum with null/undefined handling
 */
export const calculateSafeSum = (values: (number | null | undefined)[]): number => {
  return values.reduce<number>((sum, value) => {
    return sum + (value || 0);
  }, 0);
};

/**
 * Group and sum data by a key
 */
export const groupAndSum = <T>(
  data: T[],
  keyExtractor: (item: T) => string,
  valueExtractor: (item: T) => number
): Record<string, number> => {
  return data.reduce((acc, item) => {
    const key = keyExtractor(item);
    const value = valueExtractor(item);
    acc[key] = (acc[key] || 0) + value;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Calculate hierarchical totals
 * Used for parent-child category relationships
 */
export const calculateHierarchicalTotals = (
  items: Array<{ parentId?: string; id: string; amount: number }>
): Record<string, number> => {
  const totals: Record<string, number> = {};
  
  // First, sum all direct amounts
  items.forEach(item => {
    totals[item.id] = item.amount;
  });
  
  // Then, aggregate child amounts to parents
  items.forEach(item => {
    if (item.parentId && totals[item.parentId] !== undefined) {
      totals[item.parentId] += item.amount;
    }
  });
  
  return totals;
};