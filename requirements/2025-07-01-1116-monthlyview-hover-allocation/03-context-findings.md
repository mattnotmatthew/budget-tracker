# Context Findings

## Key Components Analysis

### MonthlyView Component (`/src/components/MonthlyView.tsx`)
- **Current Structure**: Quarterly view with collapsible sections by category
- **Data Source**: Uses `calculateMonthlyData()` from budget calculations
- **Interactive Elements**: Collapsible sections, iOS toggles for forecast/final modes
- **Hover Patterns**: Basic hover states for rows, no tooltips currently implemented
- **Category Organization**: Cost of Sales, OpEx (with Comp & Benefits, Other subgroups)

### BudgetInput Component (`/src/components/BudgetInput.tsx`)
- **Data Management**: Manages budget entries through BudgetContext
- **Input Fields**: budgetAmount, actualAmount, reforecastAmount, adjustmentAmount
- **Storage**: Data cached and written to JSON file for portability
- **Category Integration**: Works with same category structure as MonthlyView

### Budget Calculation System (`/src/utils/budgetCalculations.ts`)
- **Core Function**: `calculateMonthlyData()` processes budget entries into structured data
- **Current Calculations**: Absolute dollar amounts, variance percentages
- **Data Flow**: BudgetEntry → CategorySummary → MonthlyData
- **Aggregation**: Multi-level totals (category → subgroup → parent group → net total)

## Existing Tooltip Infrastructure

### Sophisticated Tooltip Component (`/src/components/ExecutiveSummary/components/Tooltip.tsx`)
- **Advanced Features**: Viewport-aware positioning, rich content structure
- **Content Types**: Definition, interpretation, formula, calculation sections
- **State Management**: Mouse event handling with position tracking
- **Ready for Reuse**: Proven implementation that can be adapted

### CSS Styling System
- **Color Palette**: Primary green (#334915), blue (#172a3a), standard status colors
- **Hover Transitions**: Standard 0.2s ease transitions with consistent patterns
- **Interactive UI**: Established hover states with transform and shadow effects
- **Z-index Management**: Modal/overlay patterns with z-index 1000+

## Implementation Requirements

### New Data Structure Additions Needed
```typescript
interface CategorySummary {
  // ... existing fields
  budgetPercent?: number;      // % of total budget allocation
  actualPercent?: number;      // % of total actual spend  
  reforecastPercent?: number;  // % of total reforecast
}
```

### Percentage Calculation Logic Required
- **Base Totals**: Calculate from quarterly view totals (all visible months)
- **Category Percentages**: Each category as % of parent group total
- **Subgroup Handling**: Comp & Benefits and Other as % of OpEx total
- **Zero Division**: Robust handling for empty budget scenarios

### Integration Points Identified
- **MonthlyView.tsx**: Add hover event handlers to category rows
- **budgetCalculations.ts**: Extend calculateMonthlyData() with percentage calculations
- **monthly.css**: Add tooltip styling following existing patterns
- **Tooltip component**: Reuse existing sophisticated tooltip implementation

## Related Features Found
- **ExecutiveSummary**: Extensive tooltip usage with budget data
- **VendorManagement**: Percentage-based calculations for vendor concentration
- **KPICard**: Proven pattern for hover tooltips with financial data
- **Modal system**: Overlay positioning and z-index management patterns

## Technical Constraints
- **Desktop Only**: No mobile/touch considerations needed (per user requirements)
- **Real-time Data**: Must calculate from current BudgetInput state
- **Performance**: Efficient event handling for hover interactions
- **Accessibility**: Follow existing keyboard navigation patterns

## Files Requiring Modification
1. **`/src/components/MonthlyView.tsx`** - Add hover handlers and tooltip integration
2. **`/src/utils/budgetCalculations.ts`** - Add percentage calculation functions
3. **`/src/styles/views/monthly.css`** - Add tooltip styling
4. **`/src/types/index.ts`** - Extend CategorySummary interface (optional)

## Architecture Decision
**Recommended Approach**: Reuse existing Tooltip component with new budget allocation content utilities, following the proven ExecutiveSummary implementation pattern.