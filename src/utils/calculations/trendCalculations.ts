/**
 * Trend calculation utilities
 * Consolidated from various components
 */

/**
 * Calculate linear trend from data points
 */
export const calculateLinearTrend = (values: number[]): {
  slope: number;
  intercept: number;
  projected: number[];
} => {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: values[0] || 0, projected: values };
  }

  // Calculate slope using least squares method
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  values.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate projected values
  const projected = values.map((_, index) => intercept + slope * index);

  return { slope, intercept, projected };
};

/**
 * Calculate moving average trend
 */
export const calculateMovingAverage = (
  data: number[],
  window: number = 3
): number[] => {
  if (window > data.length) {
    return data;
  }

  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]); // Not enough data for average
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  
  return result;
};

/**
 * Calculate trend direction
 */
export const calculateTrendDirection = (
  values: number[],
  threshold: number = 0.05
): 'up' | 'down' | 'stable' => {
  if (values.length < 2) return 'stable';

  const trend = calculateLinearTrend(values);
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate relative slope
  const relativeSlope = avgValue !== 0 ? trend.slope / avgValue : 0;

  if (Math.abs(relativeSlope) < threshold) return 'stable';
  return relativeSlope > 0 ? 'up' : 'down';
};

/**
 * Calculate compound growth rate
 */
export const calculateCompoundGrowthRate = (
  startValue: number,
  endValue: number,
  periods: number
): number => {
  if (startValue === 0 || periods === 0) return 0;
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
};

/**
 * Calculate seasonality index
 */
export const calculateSeasonalityIndex = (
  monthlyData: number[][],  // Array of years, each containing 12 months
): number[] => {
  if (monthlyData.length === 0) return Array(12).fill(1);

  const monthlyAverages = Array(12).fill(0);
  const yearlyAverages: number[] = [];

  // Calculate yearly averages
  monthlyData.forEach(yearData => {
    const yearAvg = yearData.reduce((sum, val) => sum + val, 0) / 12;
    yearlyAverages.push(yearAvg);
  });

  // Calculate monthly averages across years
  for (let month = 0; month < 12; month++) {
    let monthSum = 0;
    let count = 0;
    
    monthlyData.forEach((yearData, yearIndex) => {
      if (yearData[month] !== undefined && yearlyAverages[yearIndex] > 0) {
        monthSum += yearData[month] / yearlyAverages[yearIndex];
        count++;
      }
    });
    
    monthlyAverages[month] = count > 0 ? monthSum / count : 1;
  }

  return monthlyAverages;
};

/**
 * Calculate trend strength (R-squared)
 */
export const calculateTrendStrength = (values: number[]): number => {
  if (values.length < 2) return 0;

  const trend = calculateLinearTrend(values);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

  // Calculate total sum of squares
  const totalSS = values.reduce((sum, val) => {
    return sum + Math.pow(val - mean, 2);
  }, 0);

  // Calculate residual sum of squares
  const residualSS = values.reduce((sum, val, index) => {
    const predicted = trend.intercept + trend.slope * index;
    return sum + Math.pow(val - predicted, 2);
  }, 0);

  // R-squared = 1 - (residual SS / total SS)
  return totalSS === 0 ? 0 : 1 - (residualSS / totalSS);
};

/**
 * Project future values based on trend
 */
export const projectFutureValues = (
  historicalValues: number[],
  periodsToProject: number,
  method: 'linear' | 'average' | 'last' = 'linear'
): number[] => {
  if (historicalValues.length === 0) {
    return Array(periodsToProject).fill(0);
  }

  switch (method) {
    case 'linear': {
      const trend = calculateLinearTrend(historicalValues);
      const lastIndex = historicalValues.length - 1;
      
      return Array(periodsToProject).fill(0).map((_, i) => {
        return trend.intercept + trend.slope * (lastIndex + i + 1);
      });
    }
    
    case 'average': {
      const avg = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
      return Array(periodsToProject).fill(avg);
    }
    
    case 'last':
    default: {
      const lastValue = historicalValues[historicalValues.length - 1];
      return Array(periodsToProject).fill(lastValue);
    }
  }
};