# Context Findings

## Key Discovery: Support and R&D Categories Currently Not Defined

### Category Structure Analysis
**Critical Finding**: Support and R&D are **not currently defined as budget categories** in the system. The current category structure includes:

**Cost of Sales Categories** (6 categories):
- Recurring Software, One-Time Software, Recurring Service, One-time Service, Reclass from Opex, Other

**OpEx Categories** (15 categories):
- Base Pay, Capitalized Salaries, Commissions, Reclass to COGS, Bonus, Benefits, Payroll Taxes, Other Compensation
- Travel & Entertainment, Employee Related, Facilities, Information Technology, Professional Services, Corporate, Marketing

**Files to Modify for New Categories**:
- `/src/context/reducers/budgetReducer.ts` (lines 35-103) - Add Support and R&D category definitions
- `/src/utils/budgetCalculations.ts` (lines 25-45) - Update category grouping logic if needed

## Modal Implementation Patterns Found

### Shared Modal Component (`/src/components/shared/Modal.tsx`)
- **Flexible Architecture**: Size variants (small, medium, large, full)
- **Accessibility Features**: Keyboard navigation, focus management, escape key handling
- **Configurable Behavior**: Overlay click closing, optional footer support
- **Animation Support**: Slide-in transitions with responsive design

### Modal State Management (`/src/hooks/useModal.ts`)
- **Simple Pattern**: useState-based with memoized open/close functions
- **Clean API**: Provides `open()`, `close()`, `toggle()`, and `isOpen` boolean

### BudgetInput Modal Pattern (`/src/components/BudgetInput.tsx`)
- **Form State Management**: Local state with TypeScript interfaces
- **Excel-style Input**: Number cleaning and bulk paste handling
- **Auto-save Integration**: Smart save with file system API integration
- **Validation Logic**: Input validation with user feedback messages
- **Change Detection**: Unsaved changes warning system

## MonthlyView Integration Points

### Existing Hover Functionality (`/src/components/MonthlyView.tsx`)
- **Mouse Event Handlers**: onMouseEnter, onMouseMove, onMouseLeave on category rows
- **Tooltip State Management**: Centralized state for visibility, content, and positioning
- **Dynamic Content Generation**: Uses utility functions for tooltip content
- **Cursor Styling**: Help cursor indicates interactive elements

### Tooltip System (`/src/components/shared/Tooltip.tsx`)
- **Advanced Positioning**: Safe boundary calculations and collision detection
- **Rich Content Structure**: Definition, interpretation, formula, calculation sections
- **Mouse Tracking**: Follow cursor behavior with viewport awareness

## Data Modification Patterns

### BudgetEntry Structure
```typescript
interface BudgetEntry {
  id: string;
  categoryId: string;
  year: number; quarter: number; month: number;
  budgetAmount: number;
  actualAmount?: number;
  reforecastAmount?: number;
  adjustmentAmount?: number;
  notes?: string;
  createdAt: Date; updatedAt: Date;
}
```

### State Management Patterns
- **Redux-style Actions**: ADD_ENTRY, UPDATE_ENTRY, DELETE_ENTRY
- **Optimistic Updates**: UI changes immediately, persistence happens async
- **Unsaved Changes Tracking**: Automatic detection with action-based flagging
- **Smart Auto-save**: Debounced cache updates with file system integration

## Implementation Architecture Recommendations

### Required New Components
1. **AllocationModal Component**: Using shared Modal component with medium size
2. **Support/R&D Category Definitions**: Add to budgetReducer.ts initial categories
3. **Allocation State Management**: Extend existing budget context patterns
4. **Enhanced Tooltip Content**: Update allocation tooltip utils for original vs allocated amounts

### Integration Points Identified
1. **MonthlyView Enhancement**: Add click handler to category rows alongside hover
2. **Tooltip Content Enhancement**: Extend getBudgetAllocationTooltipContent for allocation breakdown
3. **BudgetEntry Modifications**: Direct updates to existing entries (no new record types)
4. **File Persistence**: Leverage existing smartAutoSave functionality

### Data Flow Pattern
```
User hovers → Tooltip shows allocation breakdown
User clicks → Modal opens with allocation form
User allocates → Updates BudgetEntry amounts directly
Modal saves → Triggers smart auto-save → Updates tooltip content
```

## Technical Constraints Identified
- **No Historical Tracking**: Allocation changes update existing BudgetEntry records directly
- **Two-Category Limitation**: Only Support and R&D allocation (both need to be added as new categories)
- **Parent Group Restriction**: Both Support and R&D will likely be OpEx categories
- **Real-time Updates**: Must integrate with existing unsaved changes and auto-save systems

## Files Requiring Modification
1. **`/src/context/reducers/budgetReducer.ts`** - Add Support and R&D category definitions
2. **`/src/components/MonthlyView.tsx`** - Add allocation modal trigger and state management
3. **`/src/utils/allocationTooltipUtils.ts`** - Enhance tooltip content for allocation breakdown
4. **`/src/components/AllocationModal.tsx`** - New component for allocation interface
5. **`/src/utils/budgetCalculations.ts`** - Update if special handling needed for Support/R&D grouping