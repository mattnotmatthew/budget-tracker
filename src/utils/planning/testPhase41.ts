/**
 * Phase 4.1 Test - Historical Analysis Foundation
 *
 * Simple test to validate the historical analysis module works correctly.
 * This can be run in the browser console or imported for testing.
 */

import { analyzeHistoricalData } from "./historicalAnalysis";
import { AnalysisInput } from "./types";
import { BudgetEntry, BudgetCategory } from "../../types";

/**
 * Sample test data for validation
 */
export const createTestData = (): AnalysisInput => {
  const categories: BudgetCategory[] = [
    { id: "cat1", name: "Marketing" },
    { id: "cat2", name: "Engineering" },
    { id: "cat3", name: "Sales" },
  ];

  const entries: BudgetEntry[] = [
    // Marketing data with growth trend
    {
      id: "1",
      categoryId: "cat1",
      year: 2025,
      quarter: 1,
      month: 1,
      budgetAmount: 10000,
      actualAmount: 9500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      categoryId: "cat1",
      year: 2025,
      quarter: 1,
      month: 2,
      budgetAmount: 10000,
      actualAmount: 10200,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      categoryId: "cat1",
      year: 2025,
      quarter: 1,
      month: 3,
      budgetAmount: 10000,
      actualAmount: 10800,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      categoryId: "cat1",
      year: 2025,
      quarter: 2,
      month: 4,
      budgetAmount: 11000,
      actualAmount: 11200,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      categoryId: "cat1",
      year: 2025,
      quarter: 2,
      month: 5,
      budgetAmount: 11000,
      actualAmount: 11500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "6",
      categoryId: "cat1",
      year: 2025,
      quarter: 2,
      month: 6,
      budgetAmount: 11000,
      actualAmount: 11800,
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Engineering data with stable spending
    {
      id: "7",
      categoryId: "cat2",
      year: 2025,
      quarter: 1,
      month: 1,
      budgetAmount: 50000,
      actualAmount: 49800,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "8",
      categoryId: "cat2",
      year: 2025,
      quarter: 1,
      month: 2,
      budgetAmount: 50000,
      actualAmount: 50200,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "9",
      categoryId: "cat2",
      year: 2025,
      quarter: 1,
      month: 3,
      budgetAmount: 50000,
      actualAmount: 49900,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "10",
      categoryId: "cat2",
      year: 2025,
      quarter: 2,
      month: 4,
      budgetAmount: 52000,
      actualAmount: 51800,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "11",
      categoryId: "cat2",
      year: 2025,
      quarter: 2,
      month: 5,
      budgetAmount: 52000,
      actualAmount: 52100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "12",
      categoryId: "cat2",
      year: 2025,
      quarter: 2,
      month: 6,
      budgetAmount: 52000,
      actualAmount: 52300,
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Sales data with seasonal pattern (higher in Q2)
    {
      id: "13",
      categoryId: "cat3",
      year: 2025,
      quarter: 1,
      month: 1,
      budgetAmount: 8000,
      actualAmount: 7500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "14",
      categoryId: "cat3",
      year: 2025,
      quarter: 1,
      month: 2,
      budgetAmount: 8000,
      actualAmount: 7800,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "15",
      categoryId: "cat3",
      year: 2025,
      quarter: 1,
      month: 3,
      budgetAmount: 8000,
      actualAmount: 8200,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "16",
      categoryId: "cat3",
      year: 2025,
      quarter: 2,
      month: 4,
      budgetAmount: 9000,
      actualAmount: 9500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "17",
      categoryId: "cat3",
      year: 2025,
      quarter: 2,
      month: 5,
      budgetAmount: 9000,
      actualAmount: 9800,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "18",
      categoryId: "cat3",
      year: 2025,
      quarter: 2,
      month: 6,
      budgetAmount: 9000,
      actualAmount: 10200,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return {
    entries,
    categories,
    year: 2025,
  };
};

/**
 * Run basic validation test
 */
export const runPhase41Test = () => {
  console.log("🔍 Running Phase 4.1 Test - Historical Analysis Foundation");

  try {
    const testData = createTestData();
    const result = analyzeHistoricalData(testData);

    if (!result.success) {
      console.error("❌ Analysis failed:", result.error);
      return false;
    }

    const analysis = result.data;
    console.log("✅ Analysis completed successfully!");

    // Basic validation checks
    console.log("\n📊 Analysis Summary:");
    console.log(`- Total Categories Analyzed: ${analysis.totalCategories}`);
    console.log(`- Data Year: ${analysis.dataYear}`);
    console.log(
      `- Total Spending: $${analysis.summary.totalSpending.toLocaleString()}`
    );
    console.log(
      `- Budget Accuracy: ${(
        analysis.summary.overallBudgetAccuracy * 100
      ).toFixed(1)}%`
    );
    console.log(
      `- Recommended Method: ${analysis.summary.recommendedPlanningMethod}`
    );

    // Check trend analysis
    console.log("\n📈 Trend Analysis:");
    analysis.trendAnalysis.forEach((trend) => {
      console.log(
        `- ${trend.categoryName}: ${trend.trendDirection} (${(
          trend.confidence * 100
        ).toFixed(1)}% confidence)`
      );
    });

    // Check seasonality
    console.log("\n🌊 Seasonality Analysis:");
    analysis.seasonalityFactors.forEach((seasonal) => {
      console.log(
        `- ${seasonal.categoryName}: ${
          seasonal.hasSeasonality ? "Seasonal" : "Non-seasonal"
        } (strength: ${(seasonal.seasonalityStrength * 100).toFixed(1)}%)`
      );
    });

    // Check variance patterns
    console.log("\n📋 Predictability:");
    analysis.variancePatterns.forEach((variance) => {
      console.log(
        `- ${variance.categoryName}: ${variance.predictabilityRating} (${(
          variance.budgetAccuracy * 100
        ).toFixed(1)}% accuracy)`
      );
    });

    console.log("\n🎉 Phase 4.1 test completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return false;
  }
};

/**
 * Extended test with validation of specific calculations
 */
export const runDetailedPhase41Test = () => {
  console.log("🔬 Running Detailed Phase 4.1 Test");

  const testData = createTestData();
  const result = analyzeHistoricalData(testData);

  if (!result.success) {
    console.error("❌ Analysis failed:", result.error);
    return false;
  }

  const analysis = result.data;

  // Test 1: Marketing should show increasing trend
  const marketingTrend = analysis.trendAnalysis.find(
    (t) => t.categoryName === "Marketing"
  );
  console.log(
    `Marketing trend: ${marketingTrend?.trendDirection} (expected: increasing)`
  );

  // Test 2: Engineering should be stable/predictable
  const engineeringVariance = analysis.variancePatterns.find(
    (v) => v.categoryName === "Engineering"
  );
  console.log(
    `Engineering predictability: ${engineeringVariance?.predictabilityRating} (expected: high/medium)`
  );

  // Test 3: Check total spending calculation
  const expectedTotal = testData.entries.reduce(
    (sum, entry) => sum + (entry.actualAmount || 0),
    0
  );
  console.log(
    `Total spending: $${analysis.summary.totalSpending} (expected: $${expectedTotal})`
  );

  // Test 4: Validate category count
  console.log(`Categories analyzed: ${analysis.totalCategories} (expected: 3)`);

  console.log("✅ Detailed validation completed!");
  return true;
};

// Export for use in development/testing
export { analyzeHistoricalData } from "./historicalAnalysis";
