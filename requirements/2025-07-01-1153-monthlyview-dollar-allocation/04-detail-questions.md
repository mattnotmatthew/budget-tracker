# Expert Detail Questions

## Q6: Should the Support and R&D categories be added as new OpEx categories in the budgetReducer.ts initialCategories array?
**Default if unknown:** Yes (based on current category structure where operational categories are organized under OpEx parent group)

## Q7: Should the allocation modal be triggered by clicking on category rows that already have tooltip hover functionality?
**Default if unknown:** Yes (leverages existing hover interaction pattern and provides logical progression from view to edit)

## Q8: Should allocation changes modify the budgetAmount field directly in existing BudgetEntry records rather than using adjustmentAmount?
**Default if unknown:** Yes (maintains data integrity since user specified no historical tracking and direct budget modification aligns with allocation concept)

## Q9: Should the allocation interface use percentage-based inputs that calculate dollar amounts, or direct dollar amount inputs?
**Default if unknown:** Dollar amount inputs (aligns with existing BudgetInput patterns and user request for "dollar allocation")

## Q10: Should the enhanced tooltip display original budget amounts and allocated amounts in separate calculation sections?
**Default if unknown:** Yes (provides clear transparency into budget composition and allocation sources as requested)

## Technical Context:
- Support and R&D categories do not currently exist and need to be added to budgetReducer.ts
- Existing modal patterns use shared Modal component with medium size for form interfaces
- MonthlyView already has hover tooltip system ready for enhancement
- BudgetEntry structure supports direct budgetAmount modifications with automatic timestamp updates
- Smart auto-save functionality will handle persistence without additional development