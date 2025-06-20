/**
 * Planning Feature Type Definitions
 *
 * This file contains all TypeScript interfaces and types specific to the
 * 2026 Budget Planning feature. These types extend the existing budget
 * tracking system without modifying existing interfaces.
 */

// Planning methods available to users
export type PlanningMethod =
  | "trend-based"
  | "zero-based"
  | "percentage-increase";

// Planning assumptions for calculations
export interface PlanningAssumptions {
  inflationRate: number; // Percentage (e.g., 3.0 for 3%)
  headcountGrowth: number; // Percentage (e.g., 5.0 for 5%)
  salaryIncrease: number; // Percentage (e.g., 4.0 for 4%)
  revenueGrowth: number; // Percentage (e.g., 10.0 for 10%)
  costOptimization: number; // Percentage (e.g., 2.0 for 2% reduction)
}

// Individual planning scenario
export interface PlanningScenario {
  id: string; // Unique identifier
  name: string; // User-defined name (e.g., "Conservative", "Optimistic")
  description?: string; // Optional description
  assumptions: PlanningAssumptions; // Scenario-specific assumptions
  isActive: boolean; // Whether this scenario is currently selected
  createdAt: Date; // Creation timestamp
  modifiedAt: Date; // Last modification timestamp
}

// Category-specific planning data
export interface CategoryPlanningData {
  categoryId: string; // Links to existing BudgetCategory.id
  planningMethod: PlanningMethod; // Method used for this category
  monthlyValues: number[]; // 12 values (Jan-Dec) for planned amounts
  assumptions: Record<string, number>; // Category-specific assumptions
  notes?: string; // Optional planning notes
  basedOnActuals?: {
    // Reference to historical data used
    year: number;
    totalActual: number;
    growthRate: number;
  };
}

// Complete planning data for a specific year
export interface PlanningData {
  year: number; // Planning year (e.g., 2026)
  basedOnYear: number; // Base year for analysis (e.g., 2025)
  method: PlanningMethod; // Primary planning method used
  globalAssumptions: PlanningAssumptions; // Global planning assumptions
  scenarios: PlanningScenario[]; // Available planning scenarios
  activeScenarioId: string; // Currently selected scenario ID
  categories: CategoryPlanningData[]; // Category-specific planning data
  metadata: PlanningMetadata; // Creation and modification tracking
}

// Metadata for tracking planning data lifecycle
export interface PlanningMetadata {
  createdAt: Date; // When planning data was first created
  lastModified: Date; // Last modification timestamp
  version: string; // Data format version (e.g., "2.0")
  sourceData?: string; // Source of planning data (e.g., "historical-analysis")
  createdBy?: string; // Optional user identifier
}

// Historical analysis results (used for trend-based planning)
export interface HistoricalAnalysis {
  trendGrowth: number; // Overall growth rate from historical data
  seasonalityFactors: number[]; // 12 factors (Jan-Dec) for seasonal patterns
  variancePatterns: Record<string, number>; // Variance patterns by category
  recommendations: string[]; // AI-generated or calculated recommendations
  dataQuality: {
    // Assessment of historical data quality
    completeness: number; // Percentage of complete data
    reliability: number; // Reliability score (0-1)
    yearsAnalyzed: number; // Number of years included in analysis
  };
}

// Planning calculation results
export interface PlanningCalculations {
  totalBudget: number; // Total planned budget for the year
  monthlyBreakdown: number[]; // Monthly totals (Jan-Dec)
  categoryTotals: Record<string, number>; // Total by category ID
  variance: {
    // Variance compared to base year
    absolute: number; // Absolute difference
    percentage: number; // Percentage difference
  };
  insights: {
    // Calculated insights
    largestIncreases: string[]; // Category IDs with largest increases
    largestDecreases: string[]; // Category IDs with largest decreases
    riskFactors: string[]; // Identified risk factors
  };
}
