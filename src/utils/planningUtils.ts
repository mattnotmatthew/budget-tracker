/**
 * Planning Data Utilities
 *
 * Helper functions for creating, validating, and manipulating planning data.
 * These utilities ensure data consistency and provide convenient defaults.
 */

import {
  PlanningData,
  PlanningScenario,
  PlanningAssumptions,
  CategoryPlanningData,
  HistoricalAnalysis,
  PlanningMethod,
} from "../types/planning";
import { BudgetCategory, BudgetEntry } from "../types";

/**
 * Create default planning assumptions
 */
export const createDefaultAssumptions = (): PlanningAssumptions => ({
  inflationRate: 3.0, // 3% inflation
  headcountGrowth: 5.0, // 5% headcount growth
  salaryIncrease: 4.0, // 4% salary increase
  revenueGrowth: 8.0, // 8% revenue growth
  costOptimization: 2.0, // 2% cost reduction
});

/**
 * Create a default planning scenario
 */
export const createDefaultScenario = (
  name: string,
  growthMultiplier: number = 1.0
): PlanningScenario => {
  const baseAssumptions = createDefaultAssumptions();

  return {
    id: `scenario-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    description: `${name} planning scenario`,
    assumptions: {
      ...baseAssumptions,
      revenueGrowth: baseAssumptions.revenueGrowth * growthMultiplier,
      headcountGrowth: baseAssumptions.headcountGrowth * growthMultiplier,
    },
    isActive: name.toLowerCase() === "base case",
    createdAt: new Date(),
    modifiedAt: new Date(),
  };
};

/**
 * Create default planning scenarios (Conservative, Base Case, Optimistic)
 */
export const createDefaultScenarios = (): PlanningScenario[] => [
  createDefaultScenario("Conservative", 0.7),
  createDefaultScenario("Base Case", 1.0),
  createDefaultScenario("Optimistic", 1.3),
];

/**
 * Create category planning data based on historical data
 */
export const createCategoryPlanningData = (
  category: BudgetCategory,
  method: PlanningMethod = "trend-based",
  historicalEntries: BudgetEntry[] = []
): CategoryPlanningData => {
  // Calculate historical total for this category
  const historicalTotal = historicalEntries
    .filter((entry) => entry.categoryId === category.id)
    .reduce(
      (sum, entry) => sum + (entry.actualAmount || entry.budgetAmount),
      0
    );

  // Create monthly distribution (equal distribution by default)
  const monthlyValues =
    method === "zero-based"
      ? Array(12).fill(0)
      : Array(12).fill(historicalTotal / 12);

  return {
    categoryId: category.id,
    planningMethod: method,
    monthlyValues,
    assumptions: {
      growthRate: method === "trend-based" ? 8.0 : 0.0,
      inflationAdjustment: 3.0,
    },
    notes: `Generated using ${method} methodology`,
    basedOnActuals:
      historicalTotal > 0
        ? {
            year: new Date().getFullYear() - 1,
            totalActual: historicalTotal,
            growthRate: 8.0,
          }
        : undefined,
  };
};

/**
 * Create complete planning data for a year
 */
export const createPlanningData = (
  planningYear: number,
  baseYear: number = planningYear - 1,
  categories: BudgetCategory[] = [],
  historicalEntries: BudgetEntry[] = [],
  method: PlanningMethod = "trend-based"
): PlanningData => {
  const scenarios = createDefaultScenarios();
  const categoryPlanningData = categories.map((cat) =>
    createCategoryPlanningData(cat, method, historicalEntries)
  );

  return {
    year: planningYear,
    basedOnYear: baseYear,
    method,
    globalAssumptions: createDefaultAssumptions(),
    scenarios,
    activeScenarioId:
      scenarios.find((s) => s.isActive)?.id || scenarios[0]?.id || "",
    categories: categoryPlanningData,
    metadata: {
      createdAt: new Date(),
      lastModified: new Date(),
      version: "2.0",
      sourceData:
        historicalEntries.length > 0
          ? "historical-analysis"
          : "manual-creation",
    },
  };
};

/**
 * Validate planning data structure
 */
export const validatePlanningData = (data: any): data is PlanningData => {
  if (!data || typeof data !== "object") return false;

  const required = [
    "year",
    "basedOnYear",
    "method",
    "globalAssumptions",
    "scenarios",
    "activeScenarioId",
    "categories",
    "metadata",
  ];
  return required.every((field) => field in data);
};

/**
 * Calculate total planned budget from planning data
 */
export const calculateTotalPlannedBudget = (
  planningData: PlanningData
): number => {
  return planningData.categories.reduce((total, category) => {
    return (
      total + category.monthlyValues.reduce((sum, value) => sum + value, 0)
    );
  }, 0);
};

/**
 * Get planning data for a specific category
 */
export const getCategoryPlanningData = (
  planningData: PlanningData,
  categoryId: string
): CategoryPlanningData | undefined => {
  return planningData.categories.find((cat) => cat.categoryId === categoryId);
};

/**
 * Update category planning data
 */
export const updateCategoryPlanningData = (
  planningData: PlanningData,
  categoryId: string,
  updates: Partial<CategoryPlanningData>
): PlanningData => {
  return {
    ...planningData,
    categories: planningData.categories.map((cat) =>
      cat.categoryId === categoryId ? { ...cat, ...updates } : cat
    ),
    metadata: {
      ...planningData.metadata,
      lastModified: new Date(),
    },
  };
};

/**
 * Create a simple historical analysis (placeholder for future implementation)
 */
export const createBasicHistoricalAnalysis = (
  historicalEntries: BudgetEntry[]
): HistoricalAnalysis => {
  // Simple growth rate calculation
  const totalActual = historicalEntries.reduce(
    (sum, entry) => sum + (entry.actualAmount || 0),
    0
  );

  return {
    trendGrowth: 0.08, // 8% default growth
    seasonalityFactors: Array(12).fill(1.0), // No seasonality by default
    variancePatterns: {},
    recommendations: [
      "Consider inflation adjustments",
      "Review growth assumptions",
      "Validate category allocations",
    ],
    dataQuality: {
      completeness: historicalEntries.length > 0 ? 80 : 0,
      reliability: 0.7,
      yearsAnalyzed: 1,
    },
  };
};
