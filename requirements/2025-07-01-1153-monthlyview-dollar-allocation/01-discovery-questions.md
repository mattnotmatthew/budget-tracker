# Discovery Questions

## Q1: Should the dollar allocation functionality be triggered through a modal dialog interface?
**Default if unknown:** Yes (follows existing patterns like BudgetInput modal and shared Modal component usage throughout the application)

## Q2: Should allocation transfers be limited to categories within the same parent group (Cost of Sales vs OpEx)?
**Default if unknown:** No (allowing cross-group transfers provides more flexibility for budget reallocation scenarios)

## Q3: Should the allocation feature create new BudgetEntry records to track allocation history?
**Default if unknown:** Yes (maintains data integrity and audit trail consistent with existing budget modification patterns)

## Q4: Should allocation changes be immediately persisted to the file system using the existing smart auto-save functionality?
**Default if unknown:** Yes (follows established patterns for budget modifications and ensures data consistency)

## Q5: Should the updated tooltip display show both original budget amounts and allocated amounts separately?
**Default if unknown:** Yes (provides comprehensive view of budget composition including allocation sources and destinations)

## Technical Context Discovered:
- Existing modal patterns with shared Modal component and useModal hook
- Established BudgetEntry structure with CRUD operations and Redux-style actions
- Smart auto-save functionality with multi-layer persistence (memory → cache → file)
- Robust input validation and Excel-style number cleaning utilities
- Action-based state management with automatic unsaved changes tracking
- Recently implemented MonthlyView tooltip system ready for enhancement