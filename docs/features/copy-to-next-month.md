# Copy to Next Month Feature

## Overview

The "Copy to Next Month" feature allows users to duplicate their current month's data to the next month, saving time when setting up similar data structures across months.

## Implementation

### Reusable Hook: `useCopyToNextMonth`

Located at: `src/hooks/useCopyToNextMonth.ts`

This hook provides a reusable implementation for copying any type of monthly data to the next month.

#### Features:

- Generic TypeScript implementation that works with any data type
- Automatic month/year calculation (handles year rollover)
- Confirmation dialog when target month already has data
- Success/error message handling
- Flexible item creation logic

#### Usage:

```typescript
const { copyToNextMonth, pasteMessage } = useCopyToNextMonth<YourDataType>();

const handleCopy = () => {
  copyToNextMonth({
    items: currentMonthItems,
    selectedMonth: currentMonth,
    selectedYear: currentYear,
    allItems: allItemsAcrossMonths,
    getItemKey: (item) => item.id,
    createCopiedItem: (item, nextMonth, nextYear) => ({
      ...item,
      id: generateNewId(),
      month: nextMonth,
      year: nextYear,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
    itemTypeName: "items",
    itemDisplayName: "items",
  });
};
```

## Updated Components

### 1. Resources.tsx

- Uses the new `useCopyToNextMonth` hook
- Maintains existing functionality while reducing code duplication

### 2. FunctionalAllocation.tsx

- Added three copy functions:
  - `handleCopyTeamAllocationsToNextMonth()`
  - `handleCopyRevenueAllocationsToNextMonth()`
  - `handleCopyInfrastructureAllocationsToNextMonth()`
- Each section can now copy its allocations independently

### 3. AllocationActions.tsx

- Added optional `onCopyToNextMonth` prop
- Conditionally renders "Copy to Next Month" button
- Shows both paste and copy success messages

### 4. AllocationTableSection.tsx

- Passes through copy functionality to AllocationActions
- Supports both copy and paste message display

## User Experience

### Button Placement

- Copy to Next Month button appears alongside Export to CSV button
- Uses consistent styling with existing buttons (btn-info class)
- Only shows when copy functionality is provided

### Confirmation Flow

1. User clicks "Copy to Next Month"
2. If target month already has data, shows confirmation dialog
3. On confirmation, copies all items from current month
4. Shows success message with count of copied items
5. Message auto-disappears after 4 seconds

### Error Handling

- Validates that there are items to copy
- Handles month/year rollover correctly
- Provides clear user feedback for all scenarios

## Benefits

### Code Reusability

- Single hook handles all copy logic
- Consistent behavior across different data types
- Easy to add to new components

### Maintainability

- Centralized copy logic
- Type-safe implementation
- Clear separation of concerns

### User Productivity

- Faster data entry for repetitive monthly tasks
- Reduces manual copy/paste errors
- Consistent experience across all tables
