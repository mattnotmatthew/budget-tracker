/**
 * Planning Analysis Types - Phase 4.1
 *
 * TypeScript interfaces for historical data analysis and planning calculations.
 * These types support the data analysis engine without affecting existing types.
 */

import { BudgetEntry, BudgetCategory } from "../../types";

// ===== ANALYSIS RESULT TYPES =====

export interface TrendAnalysis {
  categoryId: string;
  categoryName: string;
  monthlyGrowthRate: number;
  yearlyGrowthRate: number;
  trendDirection: "increasing" | "decreasing" | "stable";
  confidence: number; // 0-1 scale
  projectedNextMonth: number;
  projectedNextYear: number;
}

export interface SeasonalityFactors {
  categoryId: string;
  categoryName: string;
  monthlyFactors: Record<number, number>; // month (1-12) -> factor
  peakMonth: number;
  lowMonth: number;
  seasonalityStrength: number; // 0-1 scale
  hasSeasonality: boolean;
}

export interface VariancePatterns {
  categoryId: string;
  categoryName: string;
  averageVariance: number;
  varianceStability: number; // 0-1 scale (1 = very predictable)
  budgetAccuracy: number; // how often budget was close to actual
  volatilityScore: number; // 0-1 scale (1 = very volatile)
  predictabilityRating: "high" | "medium" | "low";
}

export interface SpendingVelocity {
  categoryId: string;
  categoryName: string;
  avgMonthlySpend: number;
  acceleration: number; // change in spending rate
  spendingRhythm: "front-loaded" | "back-loaded" | "even" | "erratic";
  quarterlyDistribution: [number, number, number, number]; // Q1, Q2, Q3, Q4 percentages
}

export interface CategoryGrowthTrend {
  categoryId: string;
  categoryName: string;
  historicalGrowth: number[]; // monthly growth rates
  averageGrowth: number;
  growthStability: number;
  recommendedGrowth: number; // for planning
  growthCategory: "fast-growing" | "steady" | "declining" | "volatile";
}

// ===== COMPREHENSIVE ANALYSIS TYPES =====

export interface HistoricalAnalysisResult {
  analysisDate: Date;
  dataYear: number;
  totalCategories: number;
  trendAnalysis: TrendAnalysis[];
  seasonalityFactors: SeasonalityFactors[];
  variancePatterns: VariancePatterns[];
  spendingVelocity: SpendingVelocity[];
  categoryGrowthTrends: CategoryGrowthTrend[];
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  totalSpending: number;
  averageMonthlySpending: number;
  mostPredictableCategories: string[];
  leastPredictableCategories: string[];
  fastestGrowingCategories: string[];
  seasonalCategories: string[];
  overallBudgetAccuracy: number;
  recommendedPlanningMethod:
    | "trend-based"
    | "zero-based"
    | "percentage-increase";
  confidenceScore: number;
}

// ===== INPUT DATA TYPES =====

export interface AnalysisInput {
  entries: BudgetEntry[];
  categories: BudgetCategory[];
  year: number;
  analysisOptions?: AnalysisOptions;
}

export interface AnalysisOptions {
  includeSeasonality?: boolean;
  minDataPoints?: number; // minimum months of data required
  confidenceThreshold?: number; // 0-1, minimum confidence for recommendations
  excludeCategories?: string[]; // category IDs to exclude from analysis
  weightRecentData?: boolean; // give more weight to recent months
}

// ===== CALCULATION HELPERS =====

export interface MonthlyDataPoint {
  month: number; // 1-12
  year: number;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  categoryId: string;
}

export interface CategoryMonthlyData {
  categoryId: string;
  categoryName: string;
  dataPoints: MonthlyDataPoint[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  monthsWithData: number;
}

// ===== TREND CALCULATION TYPES =====

export interface TrendCalculationResult {
  slope: number; // trend line slope
  intercept: number; // trend line intercept
  rSquared: number; // correlation coefficient
  projections: number[]; // future month projections
  confidence: number; // confidence in the trend
}

export interface SeasonalityCalculationResult {
  monthlyAverages: Record<number, number>;
  deseasonalizedData: number[];
  seasonalIndices: Record<number, number>;
  seasonalityStrength: number;
}

// ===== UTILITY TYPES =====

export type AnalysisFunction<T> = (input: AnalysisInput) => T;

export interface AnalysisMetadata {
  version: string;
  createdAt: Date;
  analysisType: string;
  dataSource: "historical" | "imported" | "manual";
  reliability: "high" | "medium" | "low";
}

// ===== ERROR HANDLING =====

export interface AnalysisError {
  type: "insufficient_data" | "invalid_input" | "calculation_error" | "unknown";
  message: string;
  categoryId?: string;
  details?: Record<string, any>;
}

export type AnalysisResult<T> =
  | { success: true; data: T; metadata: AnalysisMetadata }
  | { success: false; error: AnalysisError };
