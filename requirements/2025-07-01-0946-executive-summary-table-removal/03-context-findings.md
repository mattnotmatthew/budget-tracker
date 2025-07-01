# Context Findings

## Table Location and Implementation

### Main Table Component
- **File:** `src/components/ExecutiveSummary/ExecutiveSummaryModular.tsx`
- **Lines:** 2137-2269 (132 lines of JSX)
- **Title:** "Vendor spend by category - budget vs actual"

### Associated Functions (All appear to be used only by this table)
1. **`getDistinctFinanceMappedCategories`** (lines 130-159)
   - Gets unique finance mapped categories from vendor tracking and budget data
   - Used only in the vendor spend table

2. **`getVendorBudgetByCategory`** (lines 162-199)
   - Calculates budget amounts by category and month
   - Used only in the vendor spend table

3. **`getVendorActualByCategory`** (lines 202-247)
   - Calculates actual amounts by category and month
   - Used only in the vendor spend table

4. **`getVendorTotalsByMonth`** (lines 250-297)
   - Calculates totals for budget and actual by month
   - Used only in the vendor spend table

5. **`getVendorTableMonths`** (lines 336-354)
   - Returns months to display in the table
   - Used only in the vendor spend table

6. **`getQuarterGroups`** (lines 356-383)
   - Groups months into quarters for table headers
   - Used only in the vendor spend table

### CSS Classes (Specific to this table)
- **File:** `src/components/ExecutiveSummary/ExecutiveSummary.css`
- **Lines:** 1863-2135 (272 lines of CSS)
- **Classes:**
  - `.vendor-spend-table-container`
  - `.vendor-spend-table-title`
  - `.vendor-spend-table-wrapper`
  - `.vendor-spend-table` (and descendant selectors)
  - `.budget-row`, `.actual-row`
  - `.category-cell`, `.type-cell`, `.amount-cell`
  - `.no-data-row`
  - `.summary-spacer`
  - `.total-budget-row`, `.total-actual-row`

## Dependencies Analysis

### State Dependencies
- `state.vendorTrackingData` - Used elsewhere in the component
- `state.vendorData` - Used elsewhere in the component
- `state.selectedYear` - Used elsewhere in the component

### Other Components Using Vendor Data
1. **VendorPortfolioSection** - Uses vendor data but:
   - Displays individual vendors with categories
   - Does its own calculations
   - Does NOT depend on the vendor spend by category aggregations

2. **vendorCalculations.ts** - Contains:
   - Simple `VendorData` interface (costOfSales, other, total)
   - Not related to vendor spend by category

3. **No other components** found that depend on vendor spend by category calculations

## Technical Constraints
- The table functions are self-contained and not exported
- CSS classes are specific to this table and not reused
- State data is used elsewhere but not the specific category aggregations

## Similar Features Analyzed
- VendorPortfolioSection shows vendor data differently (by vendor, not by category)
- VendorManagement and VendorTracking handle data input, not category aggregations
- Budget tables show category data but not vendor-specific breakdowns

## Removal Impact Assessment
- **Safe to remove** - No other components depend on these specific calculations
- **Data preserved** - Raw vendor data remains available for other uses
- **No cascading effects** - Functions and styles are isolated to this table