/**
 * Planning Utilities Index - Phase 4.1 Foundation
 *
 * This file exports the main functions from Phase 4.1 for use throughout the application.
 * As we add more phases, this will become the central export point for all planning utilities.
 */

// Phase 4.1: Historical Analysis Foundation
export {
  analyzeHistoricalData,
  getCategoryAnalysis,
  formatAnalysisForDisplay,
} from "./historicalAnalysis";

export type {
  AnalysisInput,
  HistoricalAnalysisResult,
  TrendAnalysis,
  SeasonalityFactors,
  VariancePatterns,
  SpendingVelocity,
  CategoryGrowthTrend,
  AnalysisSummary,
  AnalysisResult,
  AnalysisOptions,
} from "./types";

// Test utilities (for development and validation)
export {
  runPhase41Test,
  runDetailedPhase41Test,
  createTestData,
} from "./testPhase41";

// Version and metadata
export const PLANNING_UTILS_VERSION = "4.1.0";
export const SUPPORTED_PHASES = ["4.1"] as const;

/**
 * Quick function to check if Phase 4.1 is properly installed
 */
export const validatePhase41Installation = (): boolean => {
  try {
    // Import locally for validation
    const { analyzeHistoricalData } = require("./historicalAnalysis");
    return typeof analyzeHistoricalData === "function";
  } catch (error) {
    console.error("Phase 4.1 installation validation failed:", error);
    return false;
  }
};
