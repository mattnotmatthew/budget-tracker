# Implementation Plan: MonthlyView Dollar Allocation Feature
Generated: 2025-07-01T12:10:00.000Z
Based on: 2025-07-01T11:53:00.000Z

## Overview
Implement a dollar allocation system enabling users to allocate budget between Support and R&D categories directly from MonthlyView. This includes adding new budget categories, creating a modal allocation interface, enhancing the tooltip system, and integrating with existing state management and persistence.

## Prerequisites
- [ ] Verify existing MonthlyView hover tooltip functionality is working
- [ ] Confirm shared Modal component and useModal hook are available
- [ ] Check BudgetContext and reducer patterns for state management
- [ ] Validate existing smartAutoSave functionality for persistence

## Implementation Phases

### Phase 1: Category Foundation
**Objective**: Add Support and R&D categories to budget structure
**Requirements Addressed**: FR1, TR1

Steps:
1. Add `opex-support` category definition to budgetReducer.ts:35-103
2. Add `opex-research-development` category definition to budgetReducer.ts:35-103
3. Verify categories appear in MonthlyView component rendering
4. Test categories appear in BudgetInput component
5. Validate category integration with existing percentage calculations

### Phase 2: Modal Component Implementation
**Objective**: Create AllocationModal component using shared patterns
**Requirements Addressed**: FR2, TR2

Steps:
1. Create new file `/src/components/AllocationModal.tsx`
2. Import shared Modal component and useModal hook
3. Implement form state management with TypeScript interfaces
4. Add dollar amount input fields for Support and R&D allocation
5. Implement validation logic to prevent over-allocation
6. Add save/cancel functionality with auto-save integration
7. Apply existing modal styling patterns

### Phase 3: MonthlyView Integration
**Objective**: Add modal trigger functionality to category rows
**Requirements Addressed**: FR2, TR3

Steps:
1. Add allocation modal state management to MonthlyView.tsx
2. Implement onClick handlers for Support and R&D category rows
3. Integrate modal trigger with existing hover tooltip functionality
4. Pass category and month context data to allocation modal
5. Handle modal open/close events with proper state management
6. Test interaction flow from hover to click to allocation

### Phase 4: Tooltip Enhancement
**Objective**: Enhance tooltip display for allocation breakdown
**Requirements Addressed**: FR4, TR4

Steps:
1. Extend getBudgetAllocationTooltipContent in allocationTooltipUtils.ts
2. Add allocation breakdown sections to tooltip content structure
3. Implement display logic for original vs allocated amounts
4. Integrate real-time updates for allocation changes
5. Maintain existing percentage calculations alongside allocation info
6. Test tooltip display with allocation information

### Phase 5: Data Flow Integration
**Objective**: Complete end-to-end allocation workflow
**Requirements Addressed**: FR3, TR5

Steps:
1. Implement allocation save logic using existing UPDATE_ENTRY actions
2. Integrate with existing unsaved changes tracking system
3. Connect allocation changes to smartAutoSave functionality
4. Apply existing number validation and cleaning utilities
5. Test complete allocation workflow with persistence
6. Verify no new BudgetEntry records are created

## Testing Strategy
- **Component Tests**: AllocationModal form validation and state management
- **Integration Tests**: MonthlyView click handlers and modal integration
- **User Flow Tests**: Complete allocation workflow from hover to save
- **Persistence Tests**: Verify auto-save functionality with allocation changes
- **Tooltip Tests**: Enhanced tooltip display with allocation breakdown

## Validation Against Acceptance Criteria

### AC1: Category Integration
- Phase 1, Steps 3-5: Verify Support and R&D categories in MonthlyView and BudgetInput
- Phase 1, Step 5: Confirm integration with percentage calculations
- All phases: Ensure existing functionality remains unaffected

### AC2: Modal Functionality  
- Phase 2: Complete AllocationModal component implementation
- Phase 3, Steps 2-3: Click handlers for Support/R&D category rows
- Phase 2, Steps 4-6: Direct dollar inputs with save/cancel functionality

### AC3: Data Integrity
- Phase 5, Steps 1-2: Direct budgetAmount modifications via UPDATE_ENTRY
- Phase 5, Steps 2-3: Integration with unsaved changes and auto-save
- Phase 5, Step 6: Confirm no new BudgetEntry records created

### AC4: Enhanced Tooltip Display
- Phase 4, Steps 1-3: Allocation breakdown in separate sections
- Phase 4, Step 4: Real-time updates for allocation changes
- Phase 4, Step 5: Preserve existing tooltip functionality

### AC5: User Experience
- Phase 2, Step 7: Consistent modal styling and design patterns
- Phase 3, Steps 2-3: Click interaction alongside hover functionality
- Phase 2, Step 5: Validation prevents invalid allocation amounts
- Phase 5: Complete workflow provides clear user feedback