# Expert Detail Questions

## Q6: Should percentage allocations be calculated at the parent group level (Cost of Sales vs OpEx) or at the net total level across all categories?
**Default if unknown:** Parent group level (maintains logical category grouping where Cost of Sales categories show % of total Cost of Sales budget)

## Q7: Should the tooltip display only the current month's allocation when hovering over individual month columns, or aggregate data for the entire visible quarter?
**Default if unknown:** Individual month data (provides precise month-specific allocation information matching the hover target)

## Q8: Should we reuse the existing ExecutiveSummary Tooltip component at `/src/components/ExecutiveSummary/components/Tooltip.tsx` with its rich content structure?
**Default if unknown:** Yes (maintains UI consistency and leverages proven tooltip positioning logic)

## Q9: Should allocation percentages include adjustment amounts in the calculation base, or use only the base budget/actual/reforecast values?
**Default if unknown:** Include adjustments (provides complete picture of actual budget allocation including modifications)

## Q10: Should the tooltip show allocation data for collapsed categories, or respect the current collapsed/expanded state of category groups?
**Default if unknown:** Show all categories regardless of collapsed state (provides complete allocation insight even when categories are visually hidden)

## Technical Context:
- MonthlyView uses quarterly filtering with selectedQuarters prop
- Categories organized by parentCategory ("cost-of-sales", "opex") 
- Subgroups exist for "Comp and Benefits" and "Other" within OpEx
- Current calculateMonthlyData() function handles multi-level aggregation
- Existing Tooltip component supports rich content with definition/interpretation/formula/calculation sections