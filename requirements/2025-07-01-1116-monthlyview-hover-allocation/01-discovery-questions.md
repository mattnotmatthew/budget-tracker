# Discovery Questions

## Q1: Should the hover display show budget allocations for all months in the current quarter view?
**Default if unknown:** Yes (users typically work with quarterly data and would want to see allocation across the visible timeframe)

## Q2: Will the allocation data need to persist or be recalculated in real-time from BudgetInput?
**Default if unknown:** Yes (real-time calculation from BudgetInput ensures data accuracy and reflects current budget state)

## Q3: Should the hover tooltip display both dollar amounts and percentage allocation for each category?
**Default if unknown:** Yes (both absolute amounts and percentages provide comprehensive allocation insight)

## Q4: Will this feature need to work on mobile/touch devices with tap-to-show instead of hover?
**Default if unknown:** Yes (mobile-first approach is standard practice for modern web applications)

## Q5: Should the allocation display be limited to the currently visible collapsed/expanded categories?
**Default if unknown:** No (showing all category allocations regardless of collapsed state provides complete budget picture)

## Technical Context Discovered:
- MonthlyView uses quarterly filtering with collapsible sections
- BudgetInput manages budget data through BudgetContext with entries by month/year
- Categories are organized by parentCategory (cost-of-sales, opex)
- Existing hover/interaction patterns use CSS classes for styling
- Currency formatting uses formatCurrencyExcelStyle utility
- Data flows through calculateMonthlyData utility function