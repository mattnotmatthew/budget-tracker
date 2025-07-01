# Requirements Specification: MonthlyView Hover Allocation Feature

## Problem Statement
Users need to see budget allocation percentages for each category when hovering over monthly data in the MonthlyView component. This will provide immediate insight into how budget dollars are distributed across categories without requiring navigation to other views or manual calculations.

## Solution Overview
Implement hover tooltips on MonthlyView category rows that display both dollar amounts and percentage allocations for each category. The tooltips will show individual month data calculated in real-time from BudgetInput data, with percentages calculated at the parent group level (Cost of Sales vs OpEx).

## Functional Requirements

### FR1: Hover Tooltip Display
- **Trigger**: Mouse hover over any category row in MonthlyView
- **Content**: Display tooltip showing category allocation data for the specific month
- **Scope**: Show allocation data for all categories regardless of collapsed/expanded state
- **Platform**: Desktop only (no mobile/touch support required)

### FR2: Allocation Calculations
- **Percentage Base**: Calculate percentages at parent group level
  - Cost of Sales categories show % of total Cost of Sales budget
  - OpEx categories show % of total OpEx budget
- **Include Adjustments**: Base calculations on budget + actual + reforecast + adjustment amounts
- **Real-time Data**: Calculate from current BudgetInput state, not cached values

### FR3: Tooltip Content Structure
- **Dollar Amounts**: Display absolute values for budget, actual, reforecast, adjustments
- **Percentage Allocations**: Show corresponding percentage of parent group total
- **Month Context**: Show data specific to the hovered month column
- **Category Context**: Include category name and parent group identification

### FR4: Data Integration
- **Source**: Real-time calculation from BudgetInput component data
- **Persistence**: Leverage existing JSON file storage system for underlying data
- **Quarterly View**: Respect selectedQuarters filtering for visible months

## Technical Requirements

### TR1: Component Architecture
- **File**: `/src/components/MonthlyView.tsx`
- **Integration**: Reuse existing Tooltip component from `/src/components/ExecutiveSummary/components/Tooltip.tsx`
- **Event Handling**: Implement onMouseEnter, onMouseMove, onMouseLeave handlers
- **State Management**: Use existing BudgetContext for data access

### TR2: Calculation Logic
- **File**: `/src/utils/budgetCalculations.ts`
- **Function**: Extend calculateMonthlyData() or create new calculateCategoryPercentages()
- **Data Flow**: BudgetEntry → CategorySummary (with percentages) → Tooltip content
- **Algorithm**: 
  ```typescript
  categoryPercent = (categoryTotal / parentGroupTotal) * 100
  ```

### TR3: Data Structure Extensions
- **Optional**: Extend CategorySummary interface with percentage fields
- **Content**: Create tooltip content utility functions
- **Format**: Follow existing tooltip content structure (definition, interpretation, formula, calculation)

### TR4: Styling Integration
- **File**: `/src/styles/views/monthly.css`
- **Pattern**: Follow existing hover transition standards (0.2s ease)
- **Colors**: Use established color palette (#334915, #172a3a)
- **Z-index**: Use 1000+ for tooltip overlay positioning
- **Cursor**: Apply `cursor: help` for tooltip-enabled elements

## Implementation Approach

### Phase 1: Calculation Enhancement
1. Create `calculateCategoryPercentages()` function in budgetCalculations.ts
2. Extend existing data structures to include percentage information
3. Test percentage calculations with existing budget data

### Phase 2: Tooltip Integration
1. Import and adapt ExecutiveSummary Tooltip component
2. Create tooltip content utility functions for budget allocation data
3. Implement mouse event handlers in MonthlyView component

### Phase 3: UI Polish
1. Add appropriate hover styling to monthly.css
2. Implement smooth transitions and positioning
3. Test tooltip positioning and viewport awareness

## Acceptance Criteria

### AC1: Hover Functionality
- [ ] Tooltip appears on hover over any category row
- [ ] Tooltip disappears when mouse leaves category area
- [ ] Tooltip follows mouse movement for optimal positioning
- [ ] No performance degradation during hover interactions

### AC2: Data Accuracy
- [ ] Dollar amounts match MonthlyView displayed values
- [ ] Percentages calculated correctly at parent group level
- [ ] Adjustments included in percentage base calculations
- [ ] Real-time updates reflect current BudgetInput changes

### AC3: Content Display
- [ ] Individual month data shown (not quarterly aggregates)
- [ ] All categories displayed regardless of collapsed state
- [ ] Category name and parent group clearly identified
- [ ] Both absolute amounts and percentages visible

### AC4: UI/UX Standards
- [ ] Consistent with existing tooltip styling and behavior
- [ ] Smooth hover transitions matching application standards
- [ ] Proper z-index layering prevents UI conflicts
- [ ] Help cursor indicates tooltip availability

## Assumptions

### Data Assumptions
- BudgetInput data structure remains consistent with current implementation
- Existing calculateMonthlyData() function continues to be the primary calculation method
- JSON file storage system provides adequate performance for real-time calculations

### UI Assumptions  
- Desktop-only usage eliminates need for touch/mobile considerations
- Existing ExecutiveSummary Tooltip component is stable and reusable
- Current MonthlyView layout provides adequate space for hover interactions

### Performance Assumptions
- Tooltip calculations can be performed on-demand without caching
- Mouse event handling will not impact overall application performance
- Existing budget calculation utilities can handle additional percentage logic

## Related Features
- **ExecutiveSummary Tooltips**: Existing implementation pattern to follow
- **VendorManagement**: Similar percentage calculation patterns exist
- **BudgetInput**: Primary data source for allocation calculations
- **Dashboard**: Container component managing MonthlyView state