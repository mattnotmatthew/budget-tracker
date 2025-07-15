# Feature-Based File Organization Migration Guide

## Overview
Components have been reorganized into feature-based directories for better maintainability and clarity.

## Import Path Changes

### Budget Feature Components
```typescript
// OLD
import BudgetInput from '../components/BudgetInput';
import AllocationModal from '../components/AllocationModal';
import FunctionalAllocation from '../components/FunctionalAllocation';
import MonthlyView from '../components/MonthlyView';
import YearlyBudgetDashboard from '../components/YearlyBudgetDashboard';

// NEW
import { 
  BudgetInput,
  AllocationModal,
  FunctionalAllocation,
  MonthlyView,
  YearlyBudgetDashboard
} from '../features/budget';
```

### Vendors Feature Components
```typescript
// OLD
import VendorBudgetTable from '../components/VendorBudgetTable';
import VendorManagement from '../components/VendorManagement';
import VendorManagementRefactored from '../components/VendorManagementRefactored';
import VendorMonthlyTable from '../components/VendorMonthlyTable';

// NEW
import { 
  VendorBudgetTable,
  VendorManagement,
  VendorManagementRefactored,
  VendorMonthlyTable
} from '../features/vendors';
```

### Reports Feature Components
```typescript
// OLD
import ExecutiveSummary from '../components/ExecutiveSummary/ExecutiveSummary';
import ExecutiveSummaryModular from '../components/ExecutiveSummary/ExecutiveSummaryModular';
import ExecutiveSummaryRefactored from '../components/ExecutiveSummary/ExecutiveSummaryRefactored';

// NEW
import { 
  ExecutiveSummary,
  ExecutiveSummaryModular,
  ExecutiveSummaryRefactored
} from '../features/reports';
```

## Directory Structure
```
src/
├── features/
│   ├── budget/
│   │   ├── components/
│   │   │   ├── BudgetInput.tsx
│   │   │   ├── AllocationModal.tsx
│   │   │   ├── FunctionalAllocation.tsx
│   │   │   ├── MonthlyView.tsx
│   │   │   └── YearlyBudgetDashboard.tsx
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.ts
│   ├── vendors/
│   │   ├── components/
│   │   │   ├── VendorBudgetTable.tsx
│   │   │   ├── VendorManagement.tsx
│   │   │   ├── VendorManagementRefactored.tsx
│   │   │   ├── VendorMonthlyTable.tsx
│   │   │   ├── VendorFilters.tsx
│   │   │   ├── VendorSummary.tsx
│   │   │   ├── VendorTabs.tsx
│   │   │   └── vendorUtils.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.ts
│   ├── reports/
│   │   ├── components/
│   │   │   └── ExecutiveSummary/
│   │   │       ├── ExecutiveSummary.tsx
│   │   │       ├── ExecutiveSummaryModular.tsx
│   │   │       ├── ExecutiveSummaryRefactored.tsx
│   │   │       ├── tabs/
│   │   │       └── ...
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.ts
│   └── categories/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── index.ts
└── components/
    └── (remaining general-purpose components)
```

## Migration Steps

1. **Update imports in consuming components**
   - Search for old import paths
   - Replace with new feature-based imports
   - Use the index.ts barrel exports

2. **Update relative imports within moved components**
   - Components may need path adjustments for:
     - Shared utilities
     - Common components
     - Type imports

3. **Test thoroughly**
   - Build the application
   - Check for TypeScript errors
   - Test runtime functionality

## Benefits

- **Better organization**: Related components grouped by feature
- **Clearer dependencies**: Easy to see what belongs together
- **Improved maintainability**: Features can evolve independently
- **Easier navigation**: Less scrolling through unrelated files