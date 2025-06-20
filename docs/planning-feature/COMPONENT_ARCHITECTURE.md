# Planning Feature Component Architecture

## Overview
This document outlines the component architecture for the Budget Planning feature, emphasizing reuse of existing components and minimal risk implementation.

## Component Hierarchy

```
App (existing)
├── Router (existing)
├── Dashboard (existing - tracking mode)
├── PlanningDashboard (NEW - planning mode)
│   ├── ExecutiveSummary (enhanced - supports both modes)
│   │   ├── KPICard (enhanced - optional comparison data)
│   │   ├── Charts (reused - Recharts components)
│   │   └── PlanningExecutiveSummary (NEW - planning-specific)
│   ├── PlanningMethodSelector (NEW)
│   ├── CategoryPlanningGrid (NEW)
│   │   └── CategoryPlanningCard (NEW)
│   ├── ScenarioModeling (NEW)
│   └── PlanningInsights (NEW)
├── Categories (existing - tracking mode)
└── PlanningCategories (NEW - planning mode)
```

## Component Enhancement Strategy

### 1. Zero-Risk Components (No Changes)
- `Dashboard` - tracking mode only
- `Categories` - tracking mode only  
- `Charts` (Recharts) - reused as-is
- All utility components unchanged

### 2. Low-Risk Enhanced Components
Components with optional props that default to existing behavior:

#### ExecutiveSummary Enhancement
```typescript
interface ExecutiveSummaryProps {
  mode?: 'tracking' | 'planning';  // Default: 'tracking'
  comparisonYear?: number;          // Optional
  planningData?: PlanningData;      // Optional
}
```

#### KPICard Enhancement
```typescript
interface KPICardProps {
  // Existing props unchanged
  title: string;
  value: string | number;
  
  // NEW optional props
  comparisonData?: {
    value: string | number;
    label: string;
    trend: 'up' | 'down' | 'stable';
  };
  planningContext?: boolean; // Changes styling context
}
```

### 3. New Components (Zero Risk)
All new components are isolated and don't affect existing functionality:

- `PlanningDashboard`
- `PlanningMethodSelector` 
- `CategoryPlanningGrid`
- `CategoryPlanningCard`
- `ScenarioModeling`
- `PlanningInsights`
- `PlanningExecutiveSummary`

## Component Communication

### State Management Flow
```
AppContext (existing)
├── Tracking State (unchanged)
│   ├── categories
│   ├── entries  
│   └── selectedYear
└── Planning State (NEW - optional)
    ├── planningMode?: boolean
    ├── planningData?: Record<number, PlanningData>
    └── activeScenario?: string
```

### Data Flow Architecture
```
User Input → Component → Action → Reducer → State → Component Update
     ↓
Feature Flag Check → Route to Planning vs Tracking Components
     ↓
Historical Data Analysis → Smart Suggestions → Planning Inputs
```

## File Structure

```
src/
├── components/
│   ├── ExecutiveSummary/ (existing - enhanced)
│   │   ├── ExecutiveSummary.tsx (enhanced)
│   │   ├── ExecutiveSummary.css (extended)
│   │   └── PlanningExecutiveSummary.tsx (NEW)
│   ├── Planning/ (NEW directory)
│   │   ├── PlanningDashboard.tsx
│   │   ├── PlanningMethodSelector.tsx
│   │   ├── CategoryPlanningGrid.tsx
│   │   ├── CategoryPlanningCard.tsx
│   │   ├── ScenarioModeling.tsx
│   │   ├── PlanningInsights.tsx
│   │   └── Planning.css
│   └── KPICard/ (existing - enhanced)
│       ├── KPICard.tsx (enhanced)
│       └── KPICard.css (extended)
├── utils/
│   ├── planning/ (NEW directory)
│   │   ├── historicalAnalysis.ts
│   │   ├── calculations.ts
│   │   ├── scenarios.ts
│   │   └── suggestions.ts
│   └── featureFlags.ts (NEW)
├── types/
│   └── planning.ts (NEW)
└── context/
    └── AppContext.tsx (enhanced)
```

## CSS Strategy

### Namespace Approach
All new planning styles use `.planning-` prefix to avoid conflicts:

```css
/* Existing styles unchanged */
.executive-summary { /* existing */ }
.kpi-card { /* existing */ }

/* New planning styles */
.planning-dashboard { /* new */ }
.planning-mode-indicator { /* new */ }
.planning-kpi-card { /* new variant */ }
```

### Component-Specific Styling
Each new component has its own CSS file:
- `Planning.css` - main planning styles
- Enhanced existing components extend their current CSS files

## Props Interface Strategy

### Backward Compatibility Pattern
```typescript
// Pattern for enhancing existing components
interface EnhancedComponentProps extends ExistingComponentProps {
  // All existing props remain required/optional as before
  
  // New props are optional with sensible defaults
  planningMode?: boolean;
  comparisonData?: ComparisonData;
  planningContext?: PlanningContext;
}
```

### Default Value Strategy
```typescript
const EnhancedComponent = ({
  // Existing props
  title,
  value,
  
  // New props with defaults
  planningMode = false,
  comparisonData = null,
  planningContext = null
}: EnhancedComponentProps) => {
  
  // Existing logic runs when no planning props provided
  if (!planningMode && !comparisonData && !planningContext) {
    return <ExistingComponentImplementation />;
  }
  
  // New logic only when explicitly requested
  return <EnhancedComponentImplementation />;
};
```

## Error Boundaries

### Planning-Specific Error Handling
```typescript
const PlanningErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  // If planning features fail, gracefully degrade to tracking mode
  return (
    <ErrorBoundary
      fallback={<Navigate to="/budget" replace />}
      onError={(error) => console.error('Planning feature error:', error)}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Fallback Strategy
- Planning component errors → redirect to tracking dashboard
- Data analysis errors → use basic projections
- Feature flag failures → disable planning features

## Performance Considerations

### Lazy Loading Strategy
```typescript
// Lazy load planning components to avoid bundle size impact
const PlanningDashboard = lazy(() => import('./components/Planning/PlanningDashboard'));
const ScenarioModeling = lazy(() => import('./components/Planning/ScenarioModeling'));

// Wrap in Suspense with fallback
<Suspense fallback={<LoadingSpinner />}>
  <PlanningDashboard />
</Suspense>
```

### Data Analysis Optimization
```typescript
// Use web workers for heavy calculations to avoid UI blocking
const useHistoricalAnalysis = (data: any) => {
  return useMemo(() => {
    // Expensive calculations memoized
    return analyzeHistoricalData(data);
  }, [data]);
};
```

## Testing Strategy

### Component Testing Approach
1. **Existing Components**: Test with default props (existing behavior)
2. **Enhanced Components**: Test both default and planning modes
3. **New Components**: Full test coverage as isolated units

### Integration Testing
1. **Feature Flag ON/OFF**: Ensure routing works correctly
2. **Mode Switching**: Verify seamless transition between modes
3. **Data Persistence**: Test planning data doesn't affect tracking

This architecture ensures the planning feature integrates seamlessly while maintaining the reliability and performance of existing functionality.
