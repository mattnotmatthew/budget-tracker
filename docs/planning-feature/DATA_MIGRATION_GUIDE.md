# Data Migration and Persistence Guide

## Overview

This document outlines the data migration strategy and persistence patterns for the 2026 Budget Planning feature, ensuring seamless integration with existing data structures while maintaining backward compatibility.

## 🗄️ Data Structure Evolution

### Current Data Structure (2025 - Unchanged)

```typescript
// Existing structure remains completely intact
interface AppState {
  selectedYear: number; // Current: 2025
  categories: CategoryData[]; // Existing category structure
  summary: SummaryData; // Existing summary calculations
  // ... other existing properties
}

interface CategoryData {
  id: string;
  name: string;
  type: "revenue" | "expense";
  months: MonthData[];
  budgetTotal: number;
  actualTotal: number;
}
```

### Extended Data Structure (2026 - Additive)

```typescript
// Enhanced structure with optional planning properties
interface AppState {
  // Existing properties (unchanged)
  selectedYear: number;
  categories: CategoryData[];
  summary: SummaryData;

  // NEW: Optional planning properties (default: undefined)
  planningMode?: boolean; // Default: false
  planningData?: Record<number, PlanningData>; // Default: {}
  selectedScenario?: string; // Default: undefined
}

// NEW: Planning-specific data structure
interface PlanningData {
  year: number; // Planning year (e.g., 2026)
  basedOnYear: number; // Base year for analysis (e.g., 2025)
  method: PlanningMethod; // Planning approach used
  globalAssumptions: Assumptions; // Global planning assumptions
  scenarios: Scenario[]; // Multiple planning scenarios
  activeScenarioId: string; // Currently selected scenario
  categories: PlanningCategory[]; // Category-specific planning data
  metadata: PlanningMetadata; // Creation/modification tracking
}
```

## 📥 Data Migration Strategy

### Principle: Zero-Impact Migration

- **No existing data modification**
- **Additive properties only**
- **Backward compatibility guaranteed**

### Migration Process

#### Step 1: Detect Data Version

```typescript
const detectDataVersion = (data: any): "legacy" | "planning-ready" => {
  // Check if planning properties exist
  if (data.planningData !== undefined || data.planningMode !== undefined) {
    return "planning-ready";
  }
  return "legacy";
};
```

#### Step 2: Safe Data Loading

```typescript
const loadAppState = (savedData: string | null): AppState => {
  if (!savedData) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(savedData);
    const version = detectDataVersion(parsed);

    if (version === "legacy") {
      // Add planning properties with safe defaults
      return {
        ...parsed,
        planningMode: false, // Safe default
        planningData: {}, // Empty planning data
        selectedScenario: undefined,
      };
    }

    // Data already has planning properties
    return parsed;
  } catch (error) {
    console.warn("Failed to parse saved data, using defaults:", error);
    return createInitialState();
  }
};
```

#### Step 3: Backward-Compatible Saving

```typescript
const saveAppState = (
  state: AppState,
  includePlanning: boolean = true
): void => {
  const dataToSave = includePlanning
    ? state // Save everything including planning data
    : {
        // Save only legacy data for compatibility
        selectedYear: state.selectedYear,
        categories: state.categories,
        summary: state.summary,
        // Exclude planning properties
      };

  try {
    localStorage.setItem("budgetTrackerState", JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Failed to save state:", error);
  }
};
```

## 🗃️ Storage Patterns

### Separate Storage Keys

```typescript
// Storage key strategy for data isolation
const STORAGE_KEYS = {
  LEGACY_DATA: "budgetTrackerState", // Existing key (unchanged)
  PLANNING_DATA: "budgetTrackerPlanningData", // NEW: Planning-specific data
  SETTINGS: "budgetTrackerSettings", // App settings and preferences
} as const;

// Load data with fallback strategy
const loadData = (): AppState => {
  // Try to load legacy data first
  const legacyData = localStorage.getItem(STORAGE_KEYS.LEGACY_DATA);
  const baseState = legacyData ? JSON.parse(legacyData) : createInitialState();

  // Try to load planning data separately
  const planningData = localStorage.getItem(STORAGE_KEYS.PLANNING_DATA);
  if (planningData && isFeatureEnabled("BUDGET_PLANNING_2026")) {
    const planning = JSON.parse(planningData);
    return {
      ...baseState,
      planningData: planning,
      planningMode: false, // Start in tracking mode by default
    };
  }

  return baseState;
};

// Save data with separation strategy
const saveData = (state: AppState): void => {
  // Always save legacy data (for backward compatibility)
  const legacyState = {
    selectedYear: state.selectedYear,
    categories: state.categories,
    summary: state.summary,
  };
  localStorage.setItem(STORAGE_KEYS.LEGACY_DATA, JSON.stringify(legacyState));

  // Save planning data separately (if feature enabled)
  if (isFeatureEnabled("BUDGET_PLANNING_2026") && state.planningData) {
    localStorage.setItem(
      STORAGE_KEYS.PLANNING_DATA,
      JSON.stringify(state.planningData)
    );
  }
};
```

## 🔄 Data Import/Export Enhancement

### Enhanced Export Functionality

```typescript
// Extend existing export to include planning data
interface ExportOptions {
  includeTracking: boolean; // Include 2025 tracking data
  includePlanning: boolean; // Include 2026 planning data
  includeMeta: boolean; // Include metadata and assumptions
  format: "json" | "xlsx"; // Export format
}

const exportData = (state: AppState, options: ExportOptions) => {
  const exportPackage: any = {};

  // Include tracking data (existing functionality)
  if (options.includeTracking) {
    exportPackage.tracking = {
      year: state.selectedYear,
      categories: state.categories,
      summary: state.summary,
    };
  }

  // Include planning data (new functionality)
  if (options.includePlanning && state.planningData) {
    exportPackage.planning = state.planningData;
  }

  // Include metadata
  if (options.includeMeta) {
    exportPackage.metadata = {
      exportDate: new Date().toISOString(),
      version: "2.0",
      features: {
        planning: isFeatureEnabled("BUDGET_PLANNING_2026"),
        scenarios: isFeatureEnabled("PLANNING_SCENARIOS"),
      },
    };
  }

  if (options.format === "json") {
    return exportJSON(exportPackage);
  } else {
    return exportExcel(exportPackage);
  }
};
```

### Safe Import Functionality

```typescript
const importData = (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);

        // Validate import structure
        const validatedState = validateImportedData(imported);
        resolve(validatedState);
      } catch (error) {
        reject(new Error("Invalid file format"));
      }
    };

    reader.readAsText(file);
  });
};

const validateImportedData = (imported: any): AppState => {
  // Start with safe defaults
  let state = createInitialState();

  // Import tracking data (backward compatible)
  if (imported.tracking) {
    state.selectedYear = imported.tracking.year || state.selectedYear;
    state.categories =
      validateCategories(imported.tracking.categories) || state.categories;
    state.summary = imported.tracking.summary || state.summary;
  }

  // Import planning data (if feature enabled and data exists)
  if (isFeatureEnabled("BUDGET_PLANNING_2026") && imported.planning) {
    state.planningData = validatePlanningData(imported.planning);
  }

  return state;
};
```

## 🛡️ Data Validation

### Planning Data Validation

```typescript
const validatePlanningData = (
  data: any
): Record<number, PlanningData> | undefined => {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const validatedData: Record<number, PlanningData> = {};

  Object.entries(data).forEach(([year, planningData]) => {
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2026) {
      return; // Skip invalid years
    }

    const validated = validateSinglePlanningData(planningData as any);
    if (validated) {
      validatedData[yearNum] = validated;
    }
  });

  return Object.keys(validatedData).length > 0 ? validatedData : undefined;
};

const validateSinglePlanningData = (data: any): PlanningData | null => {
  try {
    return {
      year: data.year || 2026,
      basedOnYear: data.basedOnYear || 2025,
      method: validatePlanningMethod(data.method),
      globalAssumptions: validateAssumptions(data.globalAssumptions),
      scenarios: validateScenarios(data.scenarios),
      activeScenarioId: data.activeScenarioId || "",
      categories: validatePlanningCategories(data.categories),
      metadata: {
        createdAt: data.metadata?.createdAt
          ? new Date(data.metadata.createdAt)
          : new Date(),
        lastModified: new Date(),
        version: "2.0",
      },
    };
  } catch (error) {
    console.warn("Invalid planning data:", error);
    return null;
  }
};
```

## 📊 Data Transformation Utilities

### Historical Data Analysis for Planning

```typescript
const generatePlanningDataFromHistorical = (
  historicalCategories: CategoryData[],
  targetYear: number = 2026
): PlanningData => {
  const analysis = analyzeHistoricalData(historicalCategories);

  return {
    year: targetYear,
    basedOnYear: targetYear - 1, // Use previous year as base
    method: "trend-based",
    globalAssumptions: {
      inflationRate: 3.0,
      headcountGrowth: 5.0,
      salaryIncrease: 4.0,
      revenueGrowth: analysis.trendGrowth * 100,
      costOptimization: 2.0,
    },
    scenarios: [
      createDefaultScenario("Conservative", analysis.trendGrowth * 0.8),
      createDefaultScenario("Base Case", analysis.trendGrowth),
      createDefaultScenario("Optimistic", analysis.trendGrowth * 1.2),
    ],
    activeScenarioId: "base-case",
    categories: historicalCategories.map((cat) =>
      generateCategoryPlanningData(cat, analysis)
    ),
    metadata: {
      createdAt: new Date(),
      lastModified: new Date(),
      version: "2.0",
      sourceData: "historical-analysis",
    },
  };
};
```

### Data Cleanup Utilities

```typescript
// Clean up planning data when feature is disabled
const cleanupPlanningData = (state: AppState): AppState => {
  if (!isFeatureEnabled("BUDGET_PLANNING_2026")) {
    return {
      ...state,
      planningMode: false,
      planningData: undefined,
      selectedScenario: undefined,
    };
  }
  return state;
};

// Compress old planning data for storage efficiency
const compressPlanningData = (
  planningData: Record<number, PlanningData>
): Record<number, PlanningData> => {
  const compressed: Record<number, PlanningData> = {};
  const currentYear = new Date().getFullYear();

  // Keep only current year and next 2 years
  Object.entries(planningData).forEach(([year, data]) => {
    const yearNum = parseInt(year);
    if (yearNum >= currentYear && yearNum <= currentYear + 2) {
      compressed[yearNum] = data;
    }
  });

  return compressed;
};
```

## 🔄 Migration Testing

### Test Cases for Data Migration

```typescript
describe("Data Migration", () => {
  it("should load legacy data without planning properties", () => {
    const legacyData = {
      selectedYear: 2025,
      categories: mockCategories,
      summary: mockSummary,
    };

    localStorage.setItem("budgetTrackerState", JSON.stringify(legacyData));

    const state = loadAppState();

    expect(state.selectedYear).toBe(2025);
    expect(state.categories).toEqual(mockCategories);
    expect(state.planningMode).toBe(false);
    expect(state.planningData).toEqual({});
  });

  it("should preserve existing data when adding planning properties", () => {
    const existingState = createMockState();
    const planningData = createMockPlanningData();

    const enhancedState = {
      ...existingState,
      planningData: { 2026: planningData },
    };

    // Existing data should remain unchanged
    expect(enhancedState.selectedYear).toBe(existingState.selectedYear);
    expect(enhancedState.categories).toEqual(existingState.categories);
    expect(enhancedState.summary).toEqual(existingState.summary);

    // Planning data should be added
    expect(enhancedState.planningData[2026]).toEqual(planningData);
  });

  it("should handle corrupted planning data gracefully", () => {
    const corruptedData = {
      selectedYear: 2025,
      categories: mockCategories,
      planningData: "invalid-json",
    };

    const state = validateImportedData(corruptedData);

    // Should preserve valid tracking data
    expect(state.selectedYear).toBe(2025);
    expect(state.categories).toEqual(mockCategories);

    // Should ignore corrupted planning data
    expect(state.planningData).toBeUndefined();
  });
});
```

## 🚀 Implementation Checklist

### Data Migration Tasks

- [ ] **Create storage key constants** for data separation
- [ ] **Implement version detection** for existing data
- [ ] **Add migration utilities** for safe data loading
- [ ] **Create validation functions** for planning data
- [ ] **Implement backup/restore** mechanisms
- [ ] **Add data cleanup utilities** for feature disabling
- [ ] **Create import/export enhancements** with planning support
- [ ] **Implement storage optimization** for large datasets
- [ ] **Add migration testing** with comprehensive scenarios
- [ ] **Document rollback procedures** for data safety

### Safety Measures

- ✅ **No existing data modification** - all changes are additive
- ✅ **Backward compatibility** - legacy data loading always works
- ✅ **Feature flag control** - planning data only when enabled
- ✅ **Data validation** - corrupted planning data is safely ignored
- ✅ **Graceful degradation** - app works without planning data
- ✅ **Storage separation** - planning data isolated from tracking data

This migration guide ensures that the introduction of planning features has zero impact on existing data while providing a robust foundation for the new functionality.
