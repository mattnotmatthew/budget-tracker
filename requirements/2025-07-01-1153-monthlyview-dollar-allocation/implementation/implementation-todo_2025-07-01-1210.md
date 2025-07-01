# Implementation Todo: MonthlyView Dollar Allocation Feature
Generated: 2025-07-01T12:10:00.000Z
Total Steps: 26

## Setup Tasks
- [ ] SETUP-1: Verify existing MonthlyView hover tooltip functionality | File: src/components/MonthlyView.tsx | Priority: High
- [ ] SETUP-2: Confirm shared Modal component availability | File: src/components/shared/Modal.tsx | Priority: High
- [ ] SETUP-3: Check BudgetContext and reducer patterns | File: src/context/BudgetContext.tsx | Priority: High
- [ ] SETUP-4: Validate smartAutoSave functionality | File: src/utils/fileManager.ts | Priority: High

## Phase 1 Tasks: Category Foundation
- [ ] P1-1: Add opex-support category to budgetReducer.ts | File: src/context/reducers/budgetReducer.ts:35-103 | Priority: High
- [ ] P1-2: Add opex-research-development category to budgetReducer.ts | File: src/context/reducers/budgetReducer.ts:35-103 | Priority: High
- [ ] P1-3: Verify categories appear in MonthlyView rendering | File: src/components/MonthlyView.tsx | Priority: High
- [ ] P1-4: Test categories appear in BudgetInput component | File: src/components/BudgetInput.tsx | Priority: Medium
- [ ] P1-5: Validate integration with percentage calculations | File: src/utils/budgetCalculations.ts | Priority: Medium

## Phase 2 Tasks: Modal Component Implementation
- [ ] P2-1: Create AllocationModal.tsx file | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P2-2: Import shared Modal and useModal hook | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P2-3: Implement form state management with TypeScript | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P2-4: Add dollar amount input fields | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P2-5: Implement validation logic | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P2-6: Add save/cancel functionality | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P2-7: Apply modal styling patterns | File: src/components/AllocationModal.tsx | Priority: Medium

## Phase 3 Tasks: MonthlyView Integration
- [ ] P3-1: Add modal state management to MonthlyView | File: src/components/MonthlyView.tsx | Priority: High
- [ ] P3-2: Implement onClick handlers for category rows | File: src/components/MonthlyView.tsx | Priority: High
- [ ] P3-3: Integrate modal with existing hover functionality | File: src/components/MonthlyView.tsx | Priority: High
- [ ] P3-4: Pass category and month context to modal | File: src/components/MonthlyView.tsx | Priority: High
- [ ] P3-5: Handle modal open/close events | File: src/components/MonthlyView.tsx | Priority: Medium
- [ ] P3-6: Test interaction flow | File: src/components/MonthlyView.tsx | Priority: Medium

## Phase 4 Tasks: Tooltip Enhancement
- [ ] P4-1: Extend getBudgetAllocationTooltipContent function | File: src/utils/allocationTooltipUtils.ts | Priority: High
- [ ] P4-2: Add allocation breakdown to content structure | File: src/utils/allocationTooltipUtils.ts | Priority: High
- [ ] P4-3: Implement original vs allocated display logic | File: src/utils/allocationTooltipUtils.ts | Priority: High
- [ ] P4-4: Integrate real-time updates | File: src/utils/allocationTooltipUtils.ts | Priority: Medium
- [ ] P4-5: Maintain existing percentage calculations | File: src/utils/allocationTooltipUtils.ts | Priority: Medium
- [ ] P4-6: Test enhanced tooltip display | File: src/utils/allocationTooltipUtils.ts | Priority: Medium

## Phase 5 Tasks: Data Flow Integration
- [ ] P5-1: Implement allocation save using UPDATE_ENTRY | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P5-2: Integrate with unsaved changes tracking | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P5-3: Connect to smartAutoSave functionality | File: src/components/AllocationModal.tsx | Priority: High
- [ ] P5-4: Apply number validation utilities | File: src/components/AllocationModal.tsx | Priority: Medium
- [ ] P5-5: Test complete allocation workflow | File: Manual Testing | Priority: Medium
- [ ] P5-6: Verify no new BudgetEntry records created | File: Manual Testing | Priority: Medium

## Testing Tasks
- [ ] TEST-1: Component unit tests for AllocationModal | Type: unit
- [ ] TEST-2: Integration tests for MonthlyView click handlers | Type: integration
- [ ] TEST-3: User flow tests for complete allocation workflow | Type: manual
- [ ] TEST-4: Persistence tests for auto-save functionality | Type: integration
- [ ] TEST-5: Tooltip tests for enhanced display | Type: integration

## Validation Tasks
- [ ] VAL-1: Verify AC1 - Category integration in MonthlyView and BudgetInput
- [ ] VAL-2: Verify AC2 - Modal functionality and dollar inputs
- [ ] VAL-3: Verify AC3 - Data integrity and direct budget modifications
- [ ] VAL-4: Verify AC4 - Enhanced tooltip with allocation breakdown
- [ ] VAL-5: Verify AC5 - User experience and interaction consistency