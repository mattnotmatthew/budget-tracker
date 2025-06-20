/**
 * Historical Data Analysis Module - Phase 4.1
 *
 * This module provides core functions for analyzing historical budget data
 * to generate insights and trends for planning purposes.
 *
 * Features:
 * - Trend analysis and projections
 * - Seasonality detection
 * - Variance pattern analysis
 * - Spending velocity calculations
 * - Category growth trend analysis
 */

import { BudgetEntry, BudgetCategory } from "../../types";
import {
  AnalysisInput,
  HistoricalAnalysisResult,
  TrendAnalysis,
  SeasonalityFactors,
  VariancePatterns,
  SpendingVelocity,
  CategoryGrowthTrend,
  CategoryMonthlyData,
  MonthlyDataPoint,
  TrendCalculationResult,
  SeasonalityCalculationResult,
  AnalysisSummary,
  AnalysisResult,
  AnalysisMetadata,
  AnalysisError,
} from "./types";

// ===== MAIN ANALYSIS FUNCTION =====

/**
 * Performs comprehensive historical analysis on budget data
 */
export function analyzeHistoricalData(
  input: AnalysisInput
): AnalysisResult<HistoricalAnalysisResult> {
  try {
    // Validate input data
    const validationResult = validateAnalysisInput(input);
    if (!validationResult.success) {
      return validationResult;
    }

    // Transform data for analysis
    const categoryData = transformDataForAnalysis(
      input.entries,
      input.categories
    );
    // Perform individual analyses
    const trendAnalysis = categoryData.map((data) =>
      calculateTrendAnalysis(data)
    );
    const seasonalityFactors = categoryData.map((data) =>
      calculateSeasonalityFactors(data)
    );
    const variancePatterns = categoryData.map((data) =>
      calculateVariancePatterns(data)
    );
    const spendingVelocity = categoryData.map((data) =>
      calculateSpendingVelocity(data)
    );
    const categoryGrowthTrends = categoryData.map((data) =>
      calculateCategoryGrowthTrend(data)
    );

    // Generate summary
    const summary = generateAnalysisSummary({
      trendAnalysis,
      seasonalityFactors,
      variancePatterns,
      spendingVelocity,
      categoryGrowthTrends,
      totalSpending: input.entries.reduce(
        (sum, entry) => sum + (entry.actualAmount || 0),
        0
      ),
    });

    const result: HistoricalAnalysisResult = {
      analysisDate: new Date(),
      dataYear: input.year,
      totalCategories: input.categories.length,
      trendAnalysis,
      seasonalityFactors,
      variancePatterns,
      spendingVelocity,
      categoryGrowthTrends,
      summary,
    };

    const metadata: AnalysisMetadata = {
      version: "1.0.0",
      createdAt: new Date(),
      analysisType: "historical",
      dataSource: "historical",
      reliability:
        result.summary.confidenceScore > 0.7
          ? "high"
          : result.summary.confidenceScore > 0.4
          ? "medium"
          : "low",
    };

    return { success: true, data: result, metadata };
  } catch (error) {
    const analysisError: AnalysisError = {
      type: "calculation_error",
      message:
        error instanceof Error ? error.message : "Unknown analysis error",
      details: { originalError: error },
    };
    return { success: false, error: analysisError };
  }
}

// ===== DATA TRANSFORMATION =====

/**
 * Transforms budget entries into monthly data points for analysis
 */
function transformDataForAnalysis(
  entries: BudgetEntry[],
  categories: BudgetCategory[]
): CategoryMonthlyData[] {
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));
  const dataByCategory = new Map<string, MonthlyDataPoint[]>();
  // Group entries by category
  entries.forEach((entry) => {
    // Skip entries without actual amounts for historical analysis
    if (entry.actualAmount === undefined) {
      return;
    }

    if (!dataByCategory.has(entry.categoryId)) {
      dataByCategory.set(entry.categoryId, []);
    }

    const dataPoint: MonthlyDataPoint = {
      month: entry.month,
      year: entry.year,
      budgetAmount: entry.budgetAmount,
      actualAmount: entry.actualAmount,
      variance: entry.actualAmount - entry.budgetAmount,
      categoryId: entry.categoryId,
    };

    dataByCategory.get(entry.categoryId)!.push(dataPoint);
  });

  // Convert to CategoryMonthlyData format
  return Array.from(dataByCategory.entries()).map(
    ([categoryId, dataPoints]) => {
      const totalBudget = dataPoints.reduce(
        (sum, dp) => sum + dp.budgetAmount,
        0
      );
      const totalActual = dataPoints.reduce(
        (sum, dp) => sum + dp.actualAmount,
        0
      );

      return {
        categoryId,
        categoryName: categoryMap.get(categoryId) || "Unknown Category",
        dataPoints: dataPoints.sort((a, b) => a.month - b.month),
        totalBudget,
        totalActual,
        totalVariance: totalActual - totalBudget,
        monthsWithData: dataPoints.length,
      };
    }
  );
}

// ===== TREND ANALYSIS =====

/**
 * Calculates trend analysis for a category
 */
function calculateTrendAnalysis(
  categoryData: CategoryMonthlyData
): TrendAnalysis {
  const { dataPoints } = categoryData;

  if (dataPoints.length < 3) {
    return {
      categoryId: categoryData.categoryId,
      categoryName: categoryData.categoryName,
      monthlyGrowthRate: 0,
      yearlyGrowthRate: 0,
      trendDirection: "stable",
      confidence: 0,
      projectedNextMonth: 0,
      projectedNextYear: 0,
    };
  }

  // Calculate linear regression for trend
  const trendResult = calculateLinearTrend(
    dataPoints.map((dp) => dp.actualAmount)
  );

  // Calculate growth rates
  const monthlyGrowthRate = calculateMonthlyGrowthRate(dataPoints);
  const yearlyGrowthRate = monthlyGrowthRate * 12;

  // Determine trend direction
  const trendDirection =
    trendResult.slope > 0.05
      ? "increasing"
      : trendResult.slope < -0.05
      ? "decreasing"
      : "stable";

  // Project future values
  const lastMonth = dataPoints[dataPoints.length - 1];
  const projectedNextMonth = Math.max(
    0,
    lastMonth.actualAmount + trendResult.slope
  );
  const projectedNextYear = Math.max(
    0,
    lastMonth.actualAmount + trendResult.slope * 12
  );

  return {
    categoryId: categoryData.categoryId,
    categoryName: categoryData.categoryName,
    monthlyGrowthRate,
    yearlyGrowthRate,
    trendDirection,
    confidence: trendResult.rSquared,
    projectedNextMonth,
    projectedNextYear,
  };
}

/**
 * Calculates linear trend using least squares regression
 */
function calculateLinearTrend(values: number[]): TrendCalculationResult {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = values.reduce((sum, yi, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const rSquared = Math.max(0, 1 - ssResidual / ssTotal);

  // Generate projections for next 12 months
  const projections = Array.from({ length: 12 }, (_, i) =>
    Math.max(0, slope * (n + i) + intercept)
  );

  return {
    slope,
    intercept,
    rSquared,
    projections,
    confidence: rSquared,
  };
}

/**
 * Calculates average monthly growth rate
 */
function calculateMonthlyGrowthRate(dataPoints: MonthlyDataPoint[]): number {
  if (dataPoints.length < 2) return 0;

  const growthRates: number[] = [];
  for (let i = 1; i < dataPoints.length; i++) {
    const previous = dataPoints[i - 1].actualAmount;
    const current = dataPoints[i].actualAmount;

    if (previous > 0) {
      growthRates.push((current - previous) / previous);
    }
  }

  return growthRates.length > 0
    ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
    : 0;
}

// ===== SEASONALITY ANALYSIS =====

/**
 * Calculates seasonality factors for a category
 */
function calculateSeasonalityFactors(
  categoryData: CategoryMonthlyData
): SeasonalityFactors {
  const { dataPoints } = categoryData;

  if (dataPoints.length < 6) {
    return {
      categoryId: categoryData.categoryId,
      categoryName: categoryData.categoryName,
      monthlyFactors: {},
      peakMonth: 1,
      lowMonth: 1,
      seasonalityStrength: 0,
      hasSeasonality: false,
    };
  }

  const seasonalResult = calculateSeasonalityPattern(dataPoints);

  // Find peak and low months
  const monthlyAverages = Object.entries(seasonalResult.monthlyAverages);
  const peakMonth = Number(
    monthlyAverages.reduce(
      (max, curr) => (curr[1] > max[1] ? curr : max),
      monthlyAverages[0]
    )[0]
  );
  const lowMonth = Number(
    monthlyAverages.reduce(
      (min, curr) => (curr[1] < min[1] ? curr : min),
      monthlyAverages[0]
    )[0]
  );

  return {
    categoryId: categoryData.categoryId,
    categoryName: categoryData.categoryName,
    monthlyFactors: seasonalResult.seasonalIndices,
    peakMonth,
    lowMonth,
    seasonalityStrength: seasonalResult.seasonalityStrength,
    hasSeasonality: seasonalResult.seasonalityStrength > 0.1,
  };
}

/**
 * Calculates seasonal pattern using moving averages
 */
function calculateSeasonalityPattern(
  dataPoints: MonthlyDataPoint[]
): SeasonalityCalculationResult {
  // Group by month
  const monthlyData: Record<number, number[]> = {};
  dataPoints.forEach((dp) => {
    if (!monthlyData[dp.month]) {
      monthlyData[dp.month] = [];
    }
    monthlyData[dp.month].push(dp.actualAmount);
  });

  // Calculate monthly averages
  const monthlyAverages: Record<number, number> = {};
  for (let month = 1; month <= 12; month++) {
    if (monthlyData[month] && monthlyData[month].length > 0) {
      monthlyAverages[month] =
        monthlyData[month].reduce((sum, val) => sum + val, 0) /
        monthlyData[month].length;
    } else {
      monthlyAverages[month] = 0;
    }
  }

  // Calculate overall average
  const overallAverage =
    Object.values(monthlyAverages).reduce((sum, val) => sum + val, 0) / 12;

  // Calculate seasonal indices
  const seasonalIndices: Record<number, number> = {};
  for (let month = 1; month <= 12; month++) {
    seasonalIndices[month] =
      overallAverage > 0 ? monthlyAverages[month] / overallAverage : 1;
  }

  // Calculate seasonality strength (coefficient of variation of monthly averages)
  const avgValues = Object.values(monthlyAverages).filter((val) => val > 0);
  const mean = avgValues.reduce((sum, val) => sum + val, 0) / avgValues.length;
  const variance =
    avgValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    avgValues.length;
  const stdDev = Math.sqrt(variance);
  const seasonalityStrength = mean > 0 ? stdDev / mean : 0;

  return {
    monthlyAverages,
    deseasonalizedData: [], // Could implement if needed
    seasonalIndices,
    seasonalityStrength: Math.min(1, seasonalityStrength),
  };
}

// ===== VARIANCE ANALYSIS =====

/**
 * Calculates variance patterns for a category
 */
function calculateVariancePatterns(
  categoryData: CategoryMonthlyData
): VariancePatterns {
  const { dataPoints } = categoryData;

  if (dataPoints.length === 0) {
    return {
      categoryId: categoryData.categoryId,
      categoryName: categoryData.categoryName,
      averageVariance: 0,
      varianceStability: 0,
      budgetAccuracy: 0,
      volatilityScore: 0,
      predictabilityRating: "low",
    };
  }

  // Calculate variance metrics
  const variances = dataPoints.map((dp) => Math.abs(dp.variance));
  const averageVariance =
    variances.reduce((sum, variance) => sum + variance, 0) / variances.length;

  // Calculate variance stability (lower coefficient of variation = more stable)
  const varianceMean = averageVariance;
  const varianceStdDev = Math.sqrt(
    variances.reduce(
      (sum, variance) => sum + Math.pow(variance - varianceMean, 2),
      0
    ) / variances.length
  );
  const varianceStability =
    varianceMean > 0 ? Math.max(0, 1 - varianceStdDev / varianceMean) : 1;

  // Calculate budget accuracy (percentage of months within 10% of budget)
  const accurateMonths = dataPoints.filter((dp) => {
    const percentageVariance =
      dp.budgetAmount > 0 ? Math.abs(dp.variance) / dp.budgetAmount : 0;
    return percentageVariance <= 0.1;
  }).length;
  const budgetAccuracy = accurateMonths / dataPoints.length;

  // Calculate volatility score
  const amounts = dataPoints.map((dp) => dp.actualAmount);
  const amountMean =
    amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const amountStdDev = Math.sqrt(
    amounts.reduce((sum, amount) => sum + Math.pow(amount - amountMean, 2), 0) /
      amounts.length
  );
  const volatilityScore =
    amountMean > 0 ? Math.min(1, amountStdDev / amountMean) : 0;

  // Determine predictability rating
  const predictabilityRating =
    budgetAccuracy > 0.7 && varianceStability > 0.6
      ? "high"
      : budgetAccuracy > 0.4 && varianceStability > 0.3
      ? "medium"
      : "low";

  return {
    categoryId: categoryData.categoryId,
    categoryName: categoryData.categoryName,
    averageVariance,
    varianceStability,
    budgetAccuracy,
    volatilityScore,
    predictabilityRating,
  };
}

// ===== SPENDING VELOCITY ANALYSIS =====

/**
 * Calculates spending velocity patterns for a category
 */
function calculateSpendingVelocity(
  categoryData: CategoryMonthlyData
): SpendingVelocity {
  const { dataPoints } = categoryData;

  if (dataPoints.length === 0) {
    return {
      categoryId: categoryData.categoryId,
      categoryName: categoryData.categoryName,
      avgMonthlySpend: 0,
      acceleration: 0,
      spendingRhythm: "even",
      quarterlyDistribution: [0.25, 0.25, 0.25, 0.25],
    };
  }

  // Calculate average monthly spend
  const totalSpend = dataPoints.reduce((sum, dp) => sum + dp.actualAmount, 0);
  const avgMonthlySpend = totalSpend / dataPoints.length;

  // Calculate acceleration (change in spending rate)
  const acceleration = calculateSpendingAcceleration(dataPoints);

  // Calculate quarterly distribution
  const quarterlyDistribution = calculateQuarterlyDistribution(dataPoints);

  // Determine spending rhythm
  const spendingRhythm = determineSpendingRhythm(quarterlyDistribution);

  return {
    categoryId: categoryData.categoryId,
    categoryName: categoryData.categoryName,
    avgMonthlySpend,
    acceleration,
    spendingRhythm,
    quarterlyDistribution,
  };
}

function calculateSpendingAcceleration(dataPoints: MonthlyDataPoint[]): number {
  if (dataPoints.length < 3) return 0;

  const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
  const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

  const firstHalfAvg =
    firstHalf.reduce((sum, dp) => sum + dp.actualAmount, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, dp) => sum + dp.actualAmount, 0) /
    secondHalf.length;

  return firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;
}

function calculateQuarterlyDistribution(
  dataPoints: MonthlyDataPoint[]
): [number, number, number, number] {
  const quarterTotals = [0, 0, 0, 0];

  dataPoints.forEach((dp) => {
    const quarter = Math.floor((dp.month - 1) / 3);
    quarterTotals[quarter] += dp.actualAmount;
  });

  const total = quarterTotals.reduce((sum, q) => sum + q, 0);

  if (total === 0) return [0.25, 0.25, 0.25, 0.25];

  return quarterTotals.map((q) => q / total) as [
    number,
    number,
    number,
    number
  ];
}

function determineSpendingRhythm(
  distribution: [number, number, number, number]
): SpendingVelocity["spendingRhythm"] {
  const [q1, q2, q3, q4] = distribution;

  // Front-loaded: Q1+Q2 > 60%
  if (q1 + q2 > 0.6) return "front-loaded";

  // Back-loaded: Q3+Q4 > 60%
  if (q3 + q4 > 0.6) return "back-loaded";

  // Even: no quarter > 35%
  if (Math.max(...distribution) <= 0.35) return "even";

  // Otherwise erratic
  return "erratic";
}

// ===== CATEGORY GROWTH ANALYSIS =====

/**
 * Calculates category growth trends
 */
function calculateCategoryGrowthTrend(
  categoryData: CategoryMonthlyData
): CategoryGrowthTrend {
  const { dataPoints } = categoryData;

  if (dataPoints.length < 2) {
    return {
      categoryId: categoryData.categoryId,
      categoryName: categoryData.categoryName,
      historicalGrowth: [],
      averageGrowth: 0,
      growthStability: 0,
      recommendedGrowth: 0,
      growthCategory: "steady",
    };
  }

  // Calculate month-over-month growth rates
  const historicalGrowth: number[] = [];
  for (let i = 1; i < dataPoints.length; i++) {
    const previous = dataPoints[i - 1].actualAmount;
    const current = dataPoints[i].actualAmount;

    if (previous > 0) {
      historicalGrowth.push((current - previous) / previous);
    }
  }

  // Calculate metrics
  const averageGrowth =
    historicalGrowth.length > 0
      ? historicalGrowth.reduce((sum, rate) => sum + rate, 0) /
        historicalGrowth.length
      : 0;

  const growthVariance =
    historicalGrowth.length > 0
      ? historicalGrowth.reduce(
          (sum, rate) => sum + Math.pow(rate - averageGrowth, 2),
          0
        ) / historicalGrowth.length
      : 0;

  const growthStability = Math.max(0, 1 - Math.sqrt(growthVariance));

  // Recommended growth (smoothed average)
  const recommendedGrowth = averageGrowth * 0.7; // Conservative approach

  // Categorize growth pattern
  const growthCategory = categorizeGrowth(averageGrowth, growthStability);

  return {
    categoryId: categoryData.categoryId,
    categoryName: categoryData.categoryName,
    historicalGrowth,
    averageGrowth,
    growthStability,
    recommendedGrowth,
    growthCategory,
  };
}

function categorizeGrowth(
  averageGrowth: number,
  stability: number
): CategoryGrowthTrend["growthCategory"] {
  if (stability < 0.3) return "volatile";
  if (averageGrowth > 0.05) return "fast-growing";
  if (averageGrowth < -0.02) return "declining";
  return "steady";
}

// ===== SUMMARY GENERATION =====

/**
 * Generates analysis summary with recommendations
 */
function generateAnalysisSummary(data: {
  trendAnalysis: TrendAnalysis[];
  seasonalityFactors: SeasonalityFactors[];
  variancePatterns: VariancePatterns[];
  spendingVelocity: SpendingVelocity[];
  categoryGrowthTrends: CategoryGrowthTrend[];
  totalSpending: number;
}): AnalysisSummary {
  const {
    trendAnalysis,
    seasonalityFactors,
    variancePatterns,
    spendingVelocity,
    categoryGrowthTrends,
    totalSpending,
  } = data;

  // Calculate overall metrics
  const averageMonthlySpending = totalSpending / 12; // Assuming full year data

  const averageConfidence =
    trendAnalysis.reduce((sum, t) => sum + t.confidence, 0) /
    trendAnalysis.length;
  const averageBudgetAccuracy =
    variancePatterns.reduce((sum, v) => sum + v.budgetAccuracy, 0) /
    variancePatterns.length;

  // Identify category groups
  const mostPredictableCategories = variancePatterns
    .filter((v) => v.predictabilityRating === "high")
    .map((v) => v.categoryName)
    .slice(0, 5);

  const leastPredictableCategories = variancePatterns
    .filter((v) => v.predictabilityRating === "low")
    .map((v) => v.categoryName)
    .slice(0, 5);

  const fastestGrowingCategories = categoryGrowthTrends
    .filter((c) => c.growthCategory === "fast-growing")
    .sort((a, b) => b.averageGrowth - a.averageGrowth)
    .map((c) => c.categoryName)
    .slice(0, 5);

  const seasonalCategories = seasonalityFactors
    .filter((s) => s.hasSeasonality)
    .map((s) => s.categoryName);

  // Recommend planning method
  const recommendedPlanningMethod = recommendPlanningMethod(
    averageBudgetAccuracy,
    averageConfidence,
    seasonalCategories.length
  );

  // Overall confidence score
  const confidenceScore = (averageConfidence + averageBudgetAccuracy) / 2;

  return {
    totalSpending,
    averageMonthlySpending,
    mostPredictableCategories,
    leastPredictableCategories,
    fastestGrowingCategories,
    seasonalCategories,
    overallBudgetAccuracy: averageBudgetAccuracy,
    recommendedPlanningMethod,
    confidenceScore,
  };
}

function recommendPlanningMethod(
  budgetAccuracy: number,
  confidence: number,
  seasonalCategoriesCount: number
): AnalysisSummary["recommendedPlanningMethod"] {
  // High accuracy and confidence with seasonal patterns -> trend-based
  if (budgetAccuracy > 0.6 && confidence > 0.5 && seasonalCategoriesCount > 0) {
    return "trend-based";
  }

  // Low accuracy or confidence -> zero-based for fresh start
  if (budgetAccuracy < 0.4 || confidence < 0.3) {
    return "zero-based";
  }

  // Moderate accuracy -> percentage increase (simple and reliable)
  return "percentage-increase";
}

// ===== VALIDATION =====

/**
 * Validates analysis input data
 */
function validateAnalysisInput(input: AnalysisInput): AnalysisResult<boolean> {
  // Check required fields
  if (!input.entries || !input.categories || !input.year) {
    return {
      success: false,
      error: {
        type: "invalid_input",
        message: "Missing required input data (entries, categories, or year)",
      },
    };
  }

  // Check minimum data requirements
  if (input.entries.length < 3) {
    return {
      success: false,
      error: {
        type: "insufficient_data",
        message: "At least 3 budget entries are required for analysis",
      },
    };
  }

  // Check data consistency
  const categoryIds = new Set(input.categories.map((c) => c.id));
  const entryCategoryIds = new Set(input.entries.map((e) => e.categoryId));
  const missingCategories = Array.from(entryCategoryIds).filter(
    (id) => !categoryIds.has(id)
  );

  if (missingCategories.length > 0) {
    return {
      success: false,
      error: {
        type: "invalid_input",
        message: `Entries reference missing categories: ${missingCategories.join(
          ", "
        )}`,
      },
    };
  }

  return {
    success: true,
    data: true,
    metadata: {
      version: "1.0.0",
      createdAt: new Date(),
      analysisType: "validation",
      dataSource: "historical",
      reliability: "high",
    },
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Gets analysis for a specific category
 */
export function getCategoryAnalysis(
  result: HistoricalAnalysisResult,
  categoryId: string
): {
  trend: TrendAnalysis | undefined;
  seasonality: SeasonalityFactors | undefined;
  variance: VariancePatterns | undefined;
  velocity: SpendingVelocity | undefined;
  growth: CategoryGrowthTrend | undefined;
} {
  return {
    trend: result.trendAnalysis.find((t) => t.categoryId === categoryId),
    seasonality: result.seasonalityFactors.find(
      (s) => s.categoryId === categoryId
    ),
    variance: result.variancePatterns.find((v) => v.categoryId === categoryId),
    velocity: result.spendingVelocity.find((v) => v.categoryId === categoryId),
    growth: result.categoryGrowthTrends.find(
      (g) => g.categoryId === categoryId
    ),
  };
}

/**
 * Formats analysis results for display
 */
export function formatAnalysisForDisplay(
  result: HistoricalAnalysisResult
): string {
  const { summary } = result;

  return `
Analysis Summary for ${result.dataYear}:
- Total Spending: $${summary.totalSpending.toLocaleString()}
- Average Monthly: $${summary.averageMonthlySpending.toLocaleString()}
- Budget Accuracy: ${(summary.overallBudgetAccuracy * 100).toFixed(1)}%
- Confidence Score: ${(summary.confidenceScore * 100).toFixed(1)}%
- Recommended Method: ${summary.recommendedPlanningMethod}

Most Predictable: ${summary.mostPredictableCategories.join(", ")}
Fastest Growing: ${summary.fastestGrowingCategories.join(", ")}
Seasonal Categories: ${summary.seasonalCategories.join(", ")}
  `.trim();
}
