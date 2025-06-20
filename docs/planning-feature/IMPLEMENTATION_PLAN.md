# Budget Planning Feature Implementation Plan

## Overview

This document outlines a phased approach to implementing a 2026 Budget Planning feature that leverages 2025 actual data while minimizing risk to existing functionality.

## Core Principle: **Zero Breaking Changes**

All new features will be additive only, using feature flags and conditional rendering to ensure existing 2025 tracking functionality remains completely intact.

---

## Phase 1: Foundation & Data Structure (Week 1-2)

### 1.1 Extend Data Model (Risk: **LOW**)

**Approach**: Add new properties without modifying existing structure

```typescript
// New interfaces (additive only)
interface PlanningData {
  basedOnYear: number;
  planningMethod: "trend-based" | "zero-based" | "percentage-increase";
  globalAssumptions: {
    inflationRate: number;
    headcountGrowth: number;
    salaryIncrease: number;
  };
  scenarios: PlanningScenario[];
}

interface PlanningScenario {
  id: string;
  name: string;
  assumptions: Record<string, number>;
  isActive: boolean;
}

// Extend existing AppState (backward compatible)
interface AppState {
  // ... existing properties unchanged
  planningMode?: boolean; // NEW: Optional flag
  planningData?: Record<number, PlanningData>; // NEW: Optional planning data
}
```

**Implementation Strategy**:

- Add optional properties only
- Default values maintain existing behavior
- No modifications to existing data loading/saving logic

### 1.2 Feature Flag System (Risk: **NONE**) ✅ **IMPLEMENTED**

**Location**: `src/utils/featureFlags.ts` ✅

**Implementation Status**: ✅ **COMPLETE**

- ✅ Feature flag utility created
- ✅ Environment configuration files added
- ✅ NPM scripts updated for planning mode
- ✅ TypeScript interfaces defined
- ✅ Development helper functions included

**Current Features**:

```typescript
export const FEATURE_FLAGS = {
  BUDGET_PLANNING_2026: process.env.REACT_APP_ENABLE_PLANNING === "true",
  PLANNING_SCENARIOS: process.env.REACT_APP_ENABLE_SCENARIOS === "true",
  PLANNING_AI_SUGGESTIONS:
    process.env.REACT_APP_ENABLE_AI_SUGGESTIONS === "true",
};

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return FEATURE_FLAGS[flag] || false;
};
```

**Testing**: Use `FeatureFlagTest` component to verify functionality

**Benefits**:

- ✅ Zero impact on production until explicitly enabled
- ✅ Easy rollback mechanism via environment variables
- ✅ Gradual feature rollout capability
- ✅ Development/production environment separation

### 1.3 Environment Configuration ✅ **IMPLEMENTED**

**Files Created**:

- ✅ `.env.example` - Template for environment variables
- ✅ `.env.local` - Local development (planning disabled by default)
- ✅ `.env.development` - Development environment (planning enabled)
- ✅ `.env.production` - Production environment (planning disabled)

**NPM Scripts Added**:

- ✅ `npm run start:planning` - Start with planning enabled
- ✅ `npm run build:planning` - Build with planning enabled
- ✅ `npm run build:production` - Build with planning disabled

**Quick Test Commands**:

```bash
# Test with planning disabled (default)
npm start

# Test with planning enabled
npm run start:planning
```

---

## Phase 2: UI Foundation (Week 2-3) ✅ **COMPLETE**

### 2.1 Mode Selector Enhancement ✅ **IMPLEMENTED**

**Approach**: Extend existing year selector without breaking current functionality

```typescript
// Location: src/components/YearSelector/YearSelector.tsx
const YearSelector = () => {
  const currentYear = new Date().getFullYear();
  const { state, dispatch } = useAppContext();

  const years = [
    { value: 2025, label: "2025 (Tracking)", mode: "tracking" },
    ...(isFeatureEnabled("BUDGET_PLANNING_2026")
      ? [{ value: 2026, label: "2026 (Planning)", mode: "planning" }]
      : []),
  ];

  return (
    <div className="year-selector">
      <select
        value={state.selectedYear}
        onChange={handleYearChange}
        className="year-dropdown"
      >
        {years.map((year) => (
          <option key={year.value} value={year.value}>
            {year.label}
          </option>
        ))}
      </select>

      {/* NEW: Mode indicator (only shows when planning enabled) */}
      {isFeatureEnabled("BUDGET_PLANNING_2026") &&
        state.selectedYear === 2026 && (
          <div className="mode-indicator planning-mode">📋 Planning Mode</div>
        )}
    </div>
  );
};
```

**Safety Measures**:

- Feature flag wrapper prevents rendering when disabled
- Existing 2025 functionality completely unchanged
- CSS classes namespaced to avoid conflicts

### 2.2 Conditional Route Handling ✅ **IMPLEMENTED**

**Approach**: Add new routes without modifying existing ones

```typescript
// Location: src/App.tsx
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Existing routes - UNCHANGED */}
        <Route path="/budget" element={<Dashboard />} />
        <Route path="/budget/categories" element={<Categories />} />
        <Route path="/budget/summary" element={<ExecutiveSummary />} />

        {/* NEW: Planning routes (feature-flagged) */}
        {isFeatureEnabled("BUDGET_PLANNING_2026") && (
          <>
            <Route path="/budget/planning" element={<PlanningDashboard />} />
            <Route
              path="/budget/planning/categories"
              element={<PlanningCategories />}
            />
            <Route
              path="/budget/planning/scenarios"
              element={<PlanningScenarios />}
            />
          </>
        )}

        {/* Existing default route - UNCHANGED */}
        <Route path="*" element={<Navigate to="/budget" replace />} />
      </Routes>
    </Router>
  );
};
```

---

## Phase 3: Core Planning Components (Week 3-4)

### 3.1 Planning Dashboard (Risk: **NONE**)

**Approach**: Create entirely new component that reuses existing components

```typescript
// Location: src/components/Planning/PlanningDashboard.tsx
const PlanningDashboard = () => {
  const { state } = useAppContext();

  // Safeguard: Only render if in planning mode
  if (
    !isFeatureEnabled("BUDGET_PLANNING_2026") ||
    state.selectedYear !== 2026
  ) {
    return <Navigate to="/budget" replace />;
  }

  return (
    <div className="planning-dashboard">
      {/* Reuse existing ExecutiveSummary with planning context */}
      <ExecutiveSummary
        mode="planning"
        comparisonYear={2025}
        planningData={state.planningData?.[2026]}
      />

      {/* New planning-specific sections */}
      <PlanningMethodSelector />
      <CategoryPlanningGrid />
      <PlanningInsights />
    </div>
  );
};
```

**Component Reuse Strategy**:

- `ExecutiveSummary`: Add optional `mode` prop, default to existing behavior
- `KPICard`: Add optional `comparisonData` prop for planning vs. actual
- `Charts`: Reuse with planning data overlays

### 3.2 Executive Summary Enhancement (Risk: **MINIMAL**)

**Approach**: Add optional props without changing default behavior

```typescript
// Location: src/components/ExecutiveSummary/ExecutiveSummary.tsx
interface ExecutiveSummaryProps {
  mode?: "tracking" | "planning"; // NEW: Optional, defaults to 'tracking'
  comparisonYear?: number; // NEW: Optional
  planningData?: PlanningData; // NEW: Optional
}

const ExecutiveSummary = ({
  mode = "tracking", // Default maintains existing behavior
  comparisonYear,
  planningData,
}: ExecutiveSummaryProps = {}) => {
  const { state } = useAppContext();

  // Existing logic completely unchanged when mode === 'tracking'
  if (mode === "tracking") {
    // All existing code runs exactly as before
    return (
      <div className="executive-summary">
        {/* Existing implementation unchanged */}
      </div>
    );
  }

  // NEW: Planning mode logic (only executes when explicitly requested)
  if (mode === "planning") {
    return (
      <PlanningExecutiveSummary
        planningData={planningData}
        comparisonYear={comparisonYear}
      />
    );
  }
};
```

---

## Phase 4: Data Analysis Engine (Week 4-5)

### 4.1 Historical Analysis Module (Risk: **NONE**)

**Location**: `src/utils/planning/historicalAnalysis.ts`

```typescript
// Completely new module - no impact on existing code
export const analyzeHistoricalData = (historicalData: any) => {
  return {
    trendAnalysis: calculateTrendBaseline(historicalData),
    seasonalityFactors: identifySeasonalPatterns(historicalData),
    variancePatterns: analyzeVariancePatterns(historicalData),
    spendingVelocity: calculateSpendingVelocity(historicalData),
    categoryGrowthTrends: analyzeCategoryGrowth(historicalData),
  };
};

export const generatePlanningBaseline = (
  historicalData: any,
  planningMethod: string,
  assumptions: any
) => {
  const analysis = analyzeHistoricalData(historicalData);

  switch (planningMethod) {
    case "trend-based":
      return applyTrendProjection(analysis, assumptions);
    case "zero-based":
      return generateZeroBasedBaseline(analysis, assumptions);
    case "percentage-increase":
      return applyPercentageIncrease(historicalData, assumptions);
    default:
      return historicalData; // Fallback to current year data
  }
};
```

### 4.2 Planning Calculation Engine (Risk: **NONE**)

**Location**: `src/utils/planning/calculations.ts`

```typescript
// New calculation functions for planning scenarios
export const calculateScenarioImpact = (
  baseData: any,
  scenario: PlanningScenario
) => {
  // Scenario modeling logic
};

export const generateSmartSuggestions = (
  categoryData: any,
  historicalTrends: any
) => {
  // AI-like suggestion generation
};

export const validatePlanningData = (planningData: any) => {
  // Data validation for planning inputs
};
```

---

## Phase 5: Planning UI Components (Week 5-6)

### 5.1 Category Planning Grid (Risk: **LOW**)

**Approach**: Create new component that mirrors existing category management

```typescript
// Location: src/components/Planning/CategoryPlanningGrid.tsx
const CategoryPlanningGrid = () => {
  const { state, dispatch } = useAppContext();
  const historicalData = state.data?.[2025]; // Read-only access to 2025 data

  return (
    <div className="category-planning-grid">
      {state.categories.map((category) => (
        <CategoryPlanningCard
          key={category.id}
          category={category}
          historicalData={historicalData?.categories?.[category.id]}
          onUpdatePlan={(categoryId, planData) =>
            dispatch({ type: "UPDATE_CATEGORY_PLAN", categoryId, planData })
          }
        />
      ))}
    </div>
  );
};
```

### 5.2 Scenario Modeling Component (Risk: **NONE**)

**Location**: `src/components/Planning/ScenarioModeling.tsx`

```typescript
const ScenarioModeling = () => {
  // Completely new component for scenario planning
  // No interaction with existing tracking data
};
```

---

## Phase 6: Integration & Data Persistence (Week 6-7)

### 6.1 State Management Enhancement (Risk: **MINIMAL**)

**Approach**: Add new actions without modifying existing ones

```typescript
// Location: src/context/AppContext.tsx
// ADD new action types
type AppAction =
  | { type: "SET_SELECTED_YEAR"; year: number } // Existing
  | { type: "UPDATE_CATEGORIES"; categories: any[] } // Existing
  | { type: "UPDATE_ENTRIES"; entries: any[] } // Existing
  // NEW planning actions
  | { type: "ENABLE_PLANNING_MODE"; enabled: boolean }
  | { type: "UPDATE_PLANNING_DATA"; year: number; data: PlanningData }
  | { type: "UPDATE_CATEGORY_PLAN"; categoryId: string; planData: any }
  | { type: "SAVE_PLANNING_SCENARIO"; scenario: PlanningScenario };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    // Existing cases remain UNCHANGED
    case "SET_SELECTED_YEAR":
      return { ...state, selectedYear: action.year };

    // NEW planning cases (additive only)
    case "ENABLE_PLANNING_MODE":
      return { ...state, planningMode: action.enabled };

    case "UPDATE_PLANNING_DATA":
      return {
        ...state,
        planningData: {
          ...state.planningData,
          [action.year]: action.data,
        },
      };

    default:
      return state;
  }
};
```

### 6.2 JSON Export/Import Enhancement (Risk: **LOW**)

**Approach**: Extend existing JSON structure without breaking current format

```typescript
// Location: src/utils/dataExport.ts
export const exportAppData = (state: AppState) => {
  const exportData = {
    // Existing export structure - UNCHANGED
    categories: state.categories,
    entries: state.entries,
    selectedYear: state.selectedYear,

    // NEW: Planning data (optional)
    ...(state.planningData && { planningData: state.planningData }),
    ...(state.planningMode && { planningMode: state.planningMode }),
  };

  return JSON.stringify(exportData, null, 2);
};

export const importAppData = (jsonData: string): Partial<AppState> => {
  const data = JSON.parse(jsonData);

  // Existing import logic - UNCHANGED
  const importedState: Partial<AppState> = {
    categories: data.categories,
    entries: data.entries,
    selectedYear: data.selectedYear || 2025,
  };

  // NEW: Import planning data if present (backward compatible)
  if (data.planningData) {
    importedState.planningData = data.planningData;
  }
  if (data.planningMode) {
    importedState.planningMode = data.planningMode;
  }

  return importedState;
};
```

---

## Phase 7: Testing & Validation (Week 7-8)

### 7.1 Backward Compatibility Testing

**Test Plan**:

1. **Feature Flag OFF**: Ensure zero changes to existing functionality
2. **Feature Flag ON, 2025 selected**: Ensure tracking mode works identically
3. **Feature Flag ON, 2026 selected**: Verify planning mode functions
4. **Data Import/Export**: Test both old and new JSON formats
5. **Navigation**: Ensure existing routes continue working

### 7.2 Data Migration Testing

**Test Scenarios**:

1. Existing JSON files load without planning data
2. New JSON files with planning data load correctly
3. Switching between years maintains data integrity
4. Planning calculations don't affect tracking data

### 7.3 Performance Testing

**Validation Points**:

1. No performance degradation in tracking mode
2. Planning calculations don't block UI
3. Large datasets handle planning analysis efficiently

---

## Phase 8: Deployment Strategy (Week 8)

### 8.1 Gradual Rollout Plan

**Step 1: Internal Testing**

```bash
# Enable planning feature for testing
REACT_APP_ENABLE_PLANNING=true npm start
```

**Step 2: Limited Beta**

- Deploy with feature flag OFF by default
- Enable for specific users/environments via config

**Step 3: Full Rollout**

- Set feature flag to ON by default
- Monitor for any issues
- Quick rollback capability via environment variable

### 8.2 Rollback Strategy

**Immediate Rollback**: Set `REACT_APP_ENABLE_PLANNING=false`
**Result**: App returns to exact previous functionality

**Emergency Rollback**: Deploy previous build
**Result**: Complete removal of planning features

---

## Risk Mitigation Summary

| Risk Level  | Mitigation Strategy                    | Validation                  |
| ----------- | -------------------------------------- | --------------------------- |
| **NONE**    | New components/files only              | No existing code modified   |
| **LOW**     | Optional props with defaults           | Existing behavior unchanged |
| **MINIMAL** | Feature flags + backward compatibility | Comprehensive testing       |

## Dependencies Required

No new package dependencies needed - all functionality built with existing tech stack:

- ✅ React/TypeScript (existing)
- ✅ Recharts for planning charts (existing)
- ✅ Date-fns for calculations (existing)
- ✅ File-saver for export (existing)

## Success Metrics

1. **Zero Breaking Changes**: All existing functionality works identically
2. **Feature Flag Control**: Can enable/disable without code changes
3. **Data Integrity**: Planning and tracking data remain separate
4. **Performance**: No degradation in existing workflows
5. **User Experience**: Seamless transition between modes

## Timeline Summary

- **Week 1-2**: Foundation (data model, feature flags)
- **Week 3-4**: Core components (dashboard, enhanced summary)
- **Week 4-5**: Analysis engine (historical analysis, calculations)
- **Week 5-6**: Planning UI (category planning, scenarios)
- **Week 6-7**: Integration (state management, persistence)
- **Week 7-8**: Testing & validation
- **Week 8**: Deployment with gradual rollout

**Total Estimated Time**: 8 weeks
**Risk to Existing Features**: Minimal to None
**Rollback Capability**: Immediate via feature flag
