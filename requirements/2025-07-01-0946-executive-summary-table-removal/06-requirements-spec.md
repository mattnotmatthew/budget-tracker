# Requirements Specification: Remove Vendor Spend by Category Table

## Problem Statement
The Executive Summary currently contains a "Vendor spend by category - budget vs actual" table that needs to be removed. This table aggregates vendor spending data by finance-mapped categories and compares budget vs actual amounts across months. The removal is a focused change to simplify the UI, not part of a larger redesign.

## Solution Overview
Completely remove the vendor spend by category table from the Executive Summary, including:
- The table UI component
- All associated calculation functions
- Related CSS styling
- No replacement content (leave the space empty)

## Functional Requirements

### 1. UI Removal
- Remove the entire "Vendor spend by category - budget vs actual" section from the Executive Summary
- The space previously occupied by the table should remain empty
- No visual indicators or comments should be left where the table was

### 2. Data Handling
- Keep collecting and storing vendor tracking data (no changes to data collection)
- Other components that use vendor data should continue to function normally
- No alternative view for vendor spend by category is needed

### 3. Visual Balance
- After removal, verify that the Executive Summary still looks visually balanced
- Check the spacing and layout to ensure no awkward gaps

## Technical Requirements

### 1. Code Removal from ExecutiveSummaryModular.tsx
**File:** `src/components/ExecutiveSummary/ExecutiveSummaryModular.tsx`

#### Remove JSX (lines 2137-2269):
- The entire div containing the vendor spend table
- Includes title, table headers, data rows, and totals

#### Remove Functions (these are only used by this table):
- `getDistinctFinanceMappedCategories` (lines 130-159)
- `getVendorBudgetByCategory` (lines 162-199)
- `getVendorActualByCategory` (lines 202-247)
- `getVendorTotalsByMonth` (lines 250-297)
- `getVendorTableMonths` (lines 336-354)
- `getQuarterGroups` (lines 356-383)

### 2. CSS Removal from ExecutiveSummary.css
**File:** `src/components/ExecutiveSummary/ExecutiveSummary.css`

Remove all vendor-spend related classes (lines 1863-2135):
- `.vendor-spend-table-container`
- `.vendor-spend-table-title`
- `.vendor-spend-table-wrapper`
- `.vendor-spend-table` and all descendant selectors
- `.budget-row`, `.actual-row`
- `.category-cell`, `.type-cell`, `.amount-cell`
- `.no-data-row`
- `.summary-spacer`
- `.total-budget-row`, `.total-actual-row`

### 3. Dependencies to Preserve
Do NOT remove:
- `state.vendorTrackingData` - Used elsewhere
- `state.vendorData` - Used elsewhere
- `formatCurrencyExcelStyle` - Imported utility used elsewhere
- Any vendor data structures or types

## Implementation Hints

1. **Clean Removal Pattern:**
   - First remove the JSX section
   - Then remove the calculation functions
   - Finally remove the CSS
   - Test after each step

2. **Line Number Shifts:**
   - After removing functions, line numbers for the JSX will shift up
   - Remove functions in order from top to bottom to minimize confusion

3. **Testing Focus:**
   - Verify other vendor-related components still work (VendorPortfolioSection, VendorManagement)
   - Check that the Executive Summary renders without errors
   - Ensure no console errors about missing functions

## Acceptance Criteria

1. ✓ The "Vendor spend by category - budget vs actual" table is completely removed
2. ✓ All six associated calculation functions are removed
3. ✓ All vendor-spend CSS classes are removed
4. ✓ No visual artifacts or comments remain where the table was
5. ✓ Other vendor-related features continue to work normally
6. ✓ The Executive Summary renders without errors
7. ✓ The visual layout is checked and confirmed to be acceptable

## Assumptions

1. Documentation updates are handled separately (not part of this task)
2. No data migration is needed (vendor tracking data remains unchanged)
3. No user notifications about the removal are required
4. The empty space left by the table is acceptable without replacement content