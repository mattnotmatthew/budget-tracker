# Requirements Specification: MonthlyView Dollar Allocation Feature

## Problem Statement
Users need the ability to allocate budget dollars between Support and R&D categories directly from the MonthlyView interface. This feature should provide an intuitive modal-based allocation interface and enhance the existing tooltip system to display allocation composition, enabling better budget management and reallocation workflows.

## Solution Overview
Implement a dollar allocation system that adds Support and R&D categories to the budget structure, provides a modal interface triggered from MonthlyView category rows, and enhances the existing tooltip system to show allocation breakdowns. The solution will leverage existing modal patterns, state management, and auto-save functionality while maintaining data integrity through direct budget modifications.

## Functional Requirements

### FR1: Category Structure Enhancement
- **Add Support Category**: New OpEx category `opex-support` with display name "Support"
- **Add R&D Category**: New OpEx category `opex-research-development` with display name "R&D"
- **Category Integration**: Both categories follow existing OpEx category patterns and grouping
- **Backward Compatibility**: New categories integrate seamlessly with existing budget calculations

### FR2: Modal Allocation Interface
- **Trigger Method**: Click on category rows in MonthlyView (extending existing hover functionality)
- **Modal Size**: Medium-sized modal using shared Modal component
- **Input Type**: Direct dollar amount inputs for allocation between Support and R&D
- **Validation**: Ensure allocation totals do not exceed available source amounts
- **User Experience**: Clear, intuitive interface following existing BudgetInput patterns

### FR3: Budget Data Modification
- **Direct Updates**: Modify budgetAmount field in existing BudgetEntry records
- **No Historical Tracking**: Allocation changes update existing records without creating new entries
- **Smart Auto-save**: Leverage existing auto-save functionality for immediate persistence
- **Change Detection**: Integrate with existing unsaved changes tracking system

### FR4: Enhanced Tooltip Display
- **Allocation Breakdown**: Display both original budget amounts and allocated amounts
- **Separate Sections**: Show original vs allocated amounts in distinct calculation sections
- **Real-time Updates**: Reflect allocation changes immediately in tooltip content
- **Comprehensive View**: Maintain existing percentage calculations alongside allocation information

## Technical Requirements

### TR1: Category Definition
- **File**: `/src/context/reducers/budgetReducer.ts`
- **Location**: Add to initialCategories array (lines 35-103)
- **Structure**: Follow existing OpEx category pattern with parentCategory: "opex"
- **IDs**: Use `opex-support` and `opex-research-development` for consistency

### TR2: Modal Component Implementation
- **File**: `/src/components/AllocationModal.tsx` (new component)
- **Base**: Extend shared Modal component from `/src/components/shared/Modal.tsx`
- **Hook**: Use existing useModal hook for state management
- **Props**: Accept category data, month information, and save callback
- **Styling**: Follow existing modal CSS patterns and button styling

### TR3: MonthlyView Integration
- **File**: `/src/components/MonthlyView.tsx`
- **Enhancement**: Add onClick handler to category rows alongside existing hover handlers
- **State Management**: Extend existing tooltip state for modal management
- **Event Handling**: Differentiate between hover (tooltip) and click (modal) interactions
- **Modal Trigger**: Open allocation modal with relevant category and month context

### TR4: Tooltip Content Enhancement
- **File**: `/src/utils/allocationTooltipUtils.ts`
- **Function**: Extend getBudgetAllocationTooltipContent for allocation breakdown
- **Content Structure**: Add allocation sections to existing tooltip content format
- **Display Logic**: Show original amounts, allocated amounts, and net totals
- **Formatting**: Use existing currency formatting utilities

### TR5: Data Flow Integration
- **State Management**: Use existing BudgetContext and reducer patterns
- **Actions**: Leverage existing UPDATE_ENTRY action for budget modifications
- **Persistence**: Integrate with existing smartAutoSave functionality
- **Validation**: Apply existing number cleaning and validation utilities

## Implementation Approach

### Phase 1: Category Foundation
1. Add Support and R&D category definitions to budgetReducer.ts
2. Verify integration with existing budget calculations and display logic
3. Test category appearance in MonthlyView and BudgetInput components

### Phase 2: Modal Implementation
1. Create AllocationModal component using shared Modal patterns
2. Implement form state management and validation logic
3. Add save/cancel functionality with auto-save integration
4. Style modal following existing design patterns

### Phase 3: MonthlyView Integration
1. Add click handlers to category rows
2. Implement modal trigger logic and state management
3. Integrate allocation modal with existing tooltip functionality
4. Test user interaction flow from hover to click to allocation

### Phase 4: Tooltip Enhancement
1. Extend allocation tooltip utility functions
2. Add allocation breakdown to tooltip content structure
3. Implement real-time updates for allocation changes
4. Test tooltip display with allocation information

## Acceptance Criteria

### AC1: Category Integration
- [ ] Support and R&D categories appear in MonthlyView and BudgetInput
- [ ] Categories follow existing OpEx grouping and calculation patterns
- [ ] New categories integrate with existing percentage calculations
- [ ] All existing functionality remains unaffected

### AC2: Modal Functionality
- [ ] Allocation modal opens when clicking on Support or R&D category rows
- [ ] Modal displays current budget amounts for both categories
- [ ] Direct dollar amount inputs allow allocation between categories
- [ ] Save functionality updates budget amounts and triggers auto-save
- [ ] Cancel functionality discards changes and closes modal

### AC3: Data Integrity
- [ ] Allocation changes modify budgetAmount field in existing BudgetEntry records
- [ ] Changes trigger existing unsaved changes detection
- [ ] Auto-save functionality persists changes to file system
- [ ] No new BudgetEntry records created for allocation tracking

### AC4: Enhanced Tooltip Display
- [ ] Tooltip shows original budget amounts in one section
- [ ] Tooltip shows allocated amounts in separate section
- [ ] Allocation breakdown clearly indicates source and destination
- [ ] Real-time updates reflect recent allocation changes
- [ ] Existing tooltip functionality remains intact

### AC5: User Experience
- [ ] Modal follows existing design patterns and styling
- [ ] Click interaction works alongside existing hover functionality
- [ ] Validation prevents invalid allocation amounts
- [ ] Clear user feedback for successful allocation changes
- [ ] Consistent behavior with other budget modification features

## Assumptions

### Data Assumptions
- Support and R&D categories will be used exclusively for allocation (no direct budget input)
- Allocation typically moves budget from other categories to Support/R&D
- Dollar amounts are preferred over percentage-based allocation
- Direct budget modification is acceptable without historical audit trail

### UI Assumptions
- Users will discover allocation functionality through existing hover interaction
- Medium-sized modal provides adequate space for allocation interface
- Click interaction on category rows is intuitive for users
- Enhanced tooltip provides sufficient allocation visibility

### Technical Assumptions
- Existing BudgetEntry structure accommodates allocation requirements
- Smart auto-save functionality handles allocation persistence adequately
- No additional database schema changes required
- Current state management patterns scale for allocation functionality

## Related Features
- **MonthlyView Hover Allocation**: Foundation tooltip system for allocation display
- **BudgetInput Modal**: Reference implementation for modal-based budget editing
- **Smart Auto-save**: Existing persistence layer for budget modifications
- **Shared Modal Component**: Reusable modal infrastructure for allocation interface

## Files Requiring Modification
1. **`/src/context/reducers/budgetReducer.ts`** - Add Support and R&D category definitions
2. **`/src/components/AllocationModal.tsx`** - New allocation modal component
3. **`/src/components/MonthlyView.tsx`** - Add click handlers and modal integration
4. **`/src/utils/allocationTooltipUtils.ts`** - Enhance tooltip content for allocation breakdown
5. **`/src/styles/components/allocation.css`** - New styling for allocation modal (if needed)