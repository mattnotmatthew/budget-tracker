# Technical Implementation Reference

## Code Examples and Implementation Snippets

This document provides concrete code examples to guide the implementation of the 2026 Budget Planning feature.

## 🚀 Phase 1: Feature Flag Implementation

### Feature Flag Utility

**File**: `src/utils/featureFlags.ts`

```typescript
// Feature flag configuration
export const FEATURE_FLAGS = {
  BUDGET_PLANNING_2026: process.env.REACT_APP_ENABLE_PLANNING === "true",
  PLANNING_SCENARIOS: process.env.REACT_APP_ENABLE_SCENARIOS === "true",
  ADVANCED_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

// Feature flag check utility
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return FEATURE_FLAGS[flag] || false;
};

// React hook for feature flags
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  return useMemo(() => isFeatureEnabled(flag), [flag]);
};
```

### Environment Configuration

**File**: `.env.example`

```bash
# Planning Feature Control
REACT_APP_ENABLE_PLANNING=false
REACT_APP_ENABLE_SCENARIOS=false
REACT_APP_ENABLE_ANALYTICS=false

# Development environment
REACT_APP_ENABLE_PLANNING=true
```

## 🗃️ Phase 1: Data Model Extensions

### Type Definitions

**File**: `src/types/planning.ts`

```typescript
export interface PlanningAssumptions {
  inflationRate: number;
  headcountGrowth: number;
  salaryIncrease: number;
  revenueGrowth: number;
  costOptimization: number;
}

export interface PlanningScenario {
  id: string;
  name: string;
  description?: string;
  assumptions: PlanningAssumptions;
  isActive: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface CategoryPlanningData {
  categoryId: string;
  planningMethod: "trend-based" | "zero-based" | "percentage-increase";
  monthlyValues: number[];
  assumptions: Record<string, number>;
  notes?: string;
}

export interface PlanningData {
  year: number;
  basedOnYear: number;
  globalAssumptions: PlanningAssumptions;
  scenarios: PlanningScenario[];
  activeScenarioId: string;
  categories: Record<string, CategoryPlanningData>;
  createdAt: Date;
  lastModified: Date;
}
```

### Extended App State

**File**: `src/types/index.ts`

```typescript
// Extend existing AppState interface
export interface AppState {
  // ... existing properties (unchanged)
  selectedYear: number;
  categories: CategoryData[];
  summary: SummaryData;

  // NEW: Planning mode properties (optional for backward compatibility)
  planningMode?: boolean;
  planningData?: Record<number, PlanningData>;
  selectedScenario?: string;
}

// Backward-compatible state initialization
export const createInitialState = (): AppState => ({
  selectedYear: new Date().getFullYear(),
  categories: [],
  summary: createEmptySummary(),
  // Planning properties default to undefined (backward compatible)
  planningMode: false,
  planningData: {},
});
```

## 🎛️ Phase 2: Conditional Routing

### App Router Enhancement

**File**: `src/App.tsx`

```typescript
import { isFeatureEnabled } from "./utils/featureFlags";

// Lazy load planning components
const PlanningDashboard = lazy(
  () => import("./components/Planning/PlanningDashboard")
);
const PlanningCategories = lazy(
  () => import("./components/Planning/PlanningCategories")
);

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
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
                element={<ScenarioModeling />}
              />
            </>
          )}

          {/* Default redirect - UNCHANGED */}
          <Route path="*" element={<Navigate to="/budget" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

### Navigation Enhancement

**File**: `src/components/Navigation/Navigation.tsx`

```typescript
const Navigation: React.FC = () => {
  const { state } = useAppContext();
  const planningEnabled = useFeatureFlag("BUDGET_PLANNING_2026");

  return (
    <nav className="main-navigation">
      {/* Existing navigation - UNCHANGED */}
      <NavLink to="/budget">Dashboard</NavLink>
      <NavLink to="/budget/categories">Categories</NavLink>
      <NavLink to="/budget/summary">Summary</NavLink>

      {/* NEW: Planning navigation (conditional) */}
      {planningEnabled && state.selectedYear === 2026 && (
        <div className="planning-nav">
          <NavLink to="/budget/planning">Planning</NavLink>
          <NavLink to="/budget/planning/categories">Plan Categories</NavLink>
          <NavLink to="/budget/planning/scenarios">Scenarios</NavLink>
        </div>
      )}
    </nav>
  );
};
```

## 📊 Phase 3: Enhanced Executive Summary

### Executive Summary Enhancement

**File**: `src/components/ExecutiveSummary/ExecutiveSummary.tsx`

```typescript
interface ExecutiveSummaryProps {
  mode?: "tracking" | "planning";
  comparisonYear?: number;
  planningData?: PlanningData;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  mode = "tracking",
  comparisonYear,
  planningData,
}) => {
  const { state } = useAppContext();

  // Use existing logic for tracking mode
  if (mode === "tracking") {
    return <ExistingExecutiveSummary />;
  }

  // NEW: Planning mode logic
  const planningMetrics = useMemo(() => {
    if (!planningData) return null;
    return calculatePlanningMetrics(planningData, state.categories);
  }, [planningData, state.categories]);

  return (
    <div className="executive-summary planning-mode">
      <div className="summary-header">
        <h2>2026 Budget Planning Summary</h2>
        <div className="mode-indicator">📋 Planning Mode</div>
      </div>

      {/* Reuse existing KPI cards with planning data */}
      <div className="kpi-grid">
        <KPICard
          title="Planned Total Budget"
          value={planningMetrics?.totalBudget}
          comparison={
            comparisonYear ? getComparisonData(comparisonYear) : undefined
          }
        />
        <KPICard
          title="vs 2025 Actuals"
          value={planningMetrics?.variance}
          isPercentage
        />
        <KPICard
          title="Growth Rate"
          value={planningMetrics?.growthRate}
          isPercentage
        />
      </div>

      {/* NEW: Planning-specific insights */}
      <PlanningInsights data={planningMetrics} />
    </div>
  );
};
```

## 🔄 Phase 4: Historical Analysis Engine

### Historical Data Analysis

**File**: `src/utils/historicalAnalysis.ts`

```typescript
export interface HistoricalAnalysis {
  trendGrowth: number;
  seasonalityFactors: number[];
  variancePatterns: Record<string, number>;
  recommendations: string[];
}

export const analyzeHistoricalData = (
  currentYearData: CategoryData[],
  previousYearData?: CategoryData[]
): HistoricalAnalysis => {
  // Calculate year-over-year growth
  const trendGrowth = previousYearData
    ? calculateGrowthRate(currentYearData, previousYearData)
    : 0.03; // Default 3% growth

  // Analyze monthly patterns for seasonality
  const seasonalityFactors = calculateSeasonalityFactors(currentYearData);

  // Identify variance patterns by category
  const variancePatterns = analyzeVariancePatterns(currentYearData);

  // Generate planning recommendations
  const recommendations = generateRecommendations({
    trendGrowth,
    seasonalityFactors,
    variancePatterns,
  });

  return {
    trendGrowth,
    seasonalityFactors,
    variancePatterns,
    recommendations,
  };
};

const calculateGrowthRate = (
  current: CategoryData[],
  previous: CategoryData[]
): number => {
  const currentTotal = current.reduce((sum, cat) => sum + cat.actualTotal, 0);
  const previousTotal = previous.reduce((sum, cat) => sum + cat.actualTotal, 0);

  return previousTotal > 0 ? (currentTotal - previousTotal) / previousTotal : 0;
};

const calculateSeasonalityFactors = (data: CategoryData[]): number[] => {
  // Calculate monthly distribution patterns
  const monthlyTotals = Array(12).fill(0);

  data.forEach((category) => {
    category.months.forEach((month, index) => {
      monthlyTotals[index] += month.actual || 0;
    });
  });

  const yearTotal = monthlyTotals.reduce((sum, month) => sum + month, 0);
  return monthlyTotals.map((month) =>
    yearTotal > 0 ? month / (yearTotal / 12) : 1
  );
};
```

## 🎯 Phase 5: Planning Methods Implementation

### Trend-Based Planning

**File**: `src/utils/planningMethods.ts`

```typescript
export const generateTrendBasedPlan = (
  historicalData: CategoryData[],
  analysis: HistoricalAnalysis,
  assumptions: PlanningAssumptions
): CategoryPlanningData[] => {
  return historicalData.map((category) => {
    const baseValue = category.actualTotal;
    const adjustedGrowth =
      analysis.trendGrowth + assumptions.inflationRate / 100;
    const projectedTotal = baseValue * (1 + adjustedGrowth);

    // Distribute across months using seasonality
    const monthlyValues = analysis.seasonalityFactors.map(
      (factor) => (projectedTotal / 12) * factor
    );

    return {
      categoryId: category.id,
      planningMethod: "trend-based",
      monthlyValues,
      assumptions: {
        baseValue,
        growthRate: adjustedGrowth,
        inflationAdjustment: assumptions.inflationRate,
      },
      notes: `Based on ${(adjustedGrowth * 100).toFixed(1)}% growth trend`,
    };
  });
};

export const generateZeroBasedPlan = (
  categories: CategoryData[],
  assumptions: PlanningAssumptions
): CategoryPlanningData[] => {
  return categories.map((category) => ({
    categoryId: category.id,
    planningMethod: "zero-based",
    monthlyValues: Array(12).fill(0), // Start from zero
    assumptions: {
      inflationRate: assumptions.inflationRate,
      requiresJustification: true,
    },
    notes: "Zero-based budget - justify each expense",
  }));
};
```

## 🎨 CSS Organization

### Planning Mode Styles

**File**: `src/styles/planning.css`

```css
/* Planning mode specific styles */
.planning-mode {
  border-left: 4px solid var(--planning-primary, #2563eb);
}

.mode-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: var(--planning-bg, #eff6ff);
  color: var(--planning-text, #1e40af);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.planning-dashboard {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  padding: 1.5rem;
}

.planning-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.planning-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.planning-card.active {
  border-color: var(--planning-primary, #2563eb);
  box-shadow: 0 0 0 1px var(--planning-primary, #2563eb);
}

/* Feature flag conditional styles */
.feature-planning-enabled .year-selector {
  position: relative;
}

.feature-planning-enabled .year-selector::after {
  content: "✨ Planning Available";
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 0.75rem;
  color: var(--planning-primary, #2563eb);
  margin-top: 0.25rem;
}

/* Responsive planning layout */
@media (max-width: 768px) {
  .planning-dashboard {
    grid-template-columns: 1fr;
  }

  .planning-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🧪 Testing Examples

### Component Testing

**File**: `src/components/ExecutiveSummary/ExecutiveSummary.test.tsx`

```typescript
describe("ExecutiveSummary", () => {
  // Test existing behavior unchanged
  it("renders tracking mode by default", () => {
    render(<ExecutiveSummary />);
    expect(screen.getByRole("heading")).toHaveTextContent("Executive Summary");
    expect(screen.queryByText("Planning Mode")).not.toBeInTheDocument();
  });

  // Test planning mode when feature enabled
  it("renders planning mode when enabled", () => {
    // Mock feature flag
    jest.mocked(isFeatureEnabled).mockReturnValue(true);

    const mockPlanningData = createMockPlanningData();

    render(
      <ExecutiveSummary mode="planning" planningData={mockPlanningData} />
    );

    expect(screen.getByText("📋 Planning Mode")).toBeInTheDocument();
    expect(
      screen.getByText("2026 Budget Planning Summary")
    ).toBeInTheDocument();
  });

  // Test feature flag behavior
  it("does not render planning features when flag disabled", () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(false);

    render(<ExecutiveSummary mode="planning" />);

    // Should fallback to tracking mode
    expect(screen.queryByText("Planning Mode")).not.toBeInTheDocument();
  });
});
```

### Integration Testing

**File**: `src/__tests__/planning-integration.test.tsx`

```typescript
describe("Planning Feature Integration", () => {
  beforeEach(() => {
    // Reset feature flags before each test
    jest.clearAllMocks();
  });

  it("enables planning routes when feature flag is on", () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(true);

    render(<App />);

    // Planning routes should be available
    expect(screen.getByRole("link", { name: /planning/i })).toBeInTheDocument();
  });

  it("hides planning routes when feature flag is off", () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(false);

    render(<App />);

    // Planning routes should not be available
    expect(
      screen.queryByRole("link", { name: /planning/i })
    ).not.toBeInTheDocument();
  });

  it("maintains existing functionality with planning disabled", () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(false);

    render(<App />);

    // All existing features should work
    expect(
      screen.getByRole("link", { name: /dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /categories/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /summary/i })).toBeInTheDocument();
  });
});
```

## 🚀 Deployment Configuration

### Environment Variables

**File**: `.env.production`

```bash
# Production environment - planning disabled by default
REACT_APP_ENABLE_PLANNING=false
REACT_APP_ENABLE_SCENARIOS=false
REACT_APP_ENABLE_ANALYTICS=false
```

**File**: `.env.staging`

```bash
# Staging environment - planning enabled for testing
REACT_APP_ENABLE_PLANNING=true
REACT_APP_ENABLE_SCENARIOS=true
REACT_APP_ENABLE_ANALYTICS=true
```

### Build Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:planning": "cross-env REACT_APP_ENABLE_PLANNING=true react-scripts build",
    "build:production": "cross-env REACT_APP_ENABLE_PLANNING=false react-scripts build",
    "start:planning": "cross-env REACT_APP_ENABLE_PLANNING=true react-scripts start"
  },
  "devDependencies": {
    "cross-env": "^7.0.3"
  }
}
```

**Note**: Uses `cross-env` for Windows/Mac/Linux compatibility

This technical reference provides concrete implementation examples that developers can copy and adapt during the actual implementation phase.
