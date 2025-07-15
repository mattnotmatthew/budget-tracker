# Budget Tracker Development Workflow

A comprehensive guide for developers working on the Budget vs Actual Tracker 2025 application, covering setup, development practices, and contribution guidelines.

## 📖 Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Architecture](#project-architecture)
3. [Development Standards](#development-standards)
4. [Git Workflow](#git-workflow)
5. [Testing Procedures](#testing-procedures)
6. [Code Review Process](#code-review-process)
7. [Deployment Process](#deployment-process)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Performance Guidelines](#performance-guidelines)

---

## Development Environment Setup

### Prerequisites

**Required Software**:

- Node.js 16.14+ (LTS recommended)
- npm 8.0+ or yarn 1.22+
- Git 2.30+
- VS Code (recommended) or preferred IDE
- Chrome/Firefox for testing

**Optional Tools**:

- React Developer Tools browser extension
- Redux DevTools extension
- Prettier VS Code extension
- ESLint VS Code extension

### Initial Setup

1. **Clone Repository**:

```bash
git clone <repository-url>
cd budget-tracker
```

2. **Install Dependencies**:

```bash
npm install
# or
yarn install
```

3. **Environment Configuration**:

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
REACT_APP_ENABLE_BUDGET_PLANNING=false
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_DEBUG_MODE=true
```

4. **Start Development Server**:

```bash
npm start
# or
yarn start
```

5. **Verify Setup**:

- Open http://localhost:3000
- Check console for errors
- Verify hot reload works
- Test basic functionality

### IDE Configuration

**VS Code Settings** (`.vscode/settings.json`):

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "emmet.includeLanguages": {
    "typescript": "typescriptreact"
  }
}
```

**Recommended Extensions**:

- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

---

## Project Architecture

### Directory Structure Deep Dive

```
src/
├── components/           # React components
│   ├── Dashboard.tsx     # Main app container
│   ├── MonthlyView.tsx   # Monthly budget interface
│   ├── YearlyBudgetDashboard.tsx  # Executive dashboard
│   ├── VendorManagement.tsx       # Vendor tracking
│   ├── ExecutiveSummary/          # Executive reporting
│   │   ├── ExecutiveSummary.tsx
│   │   ├── PerformanceCards.tsx
│   │   └── InsightsPanel.tsx
│   ├── Planning/                  # Future planning features
│   │   ├── PlanningDashboard.tsx
│   │   ├── ScenarioManagement.tsx
│   │   └── HistoricalAnalysis.tsx
│   └── shared/                    # Reusable components
│       ├── Modal.tsx
│       ├── IOSToggle.tsx
│       └── LoadingSpinner.tsx
├── context/              # State management
│   └── BudgetContext.tsx # Global state provider
├── hooks/                # Custom React hooks
│   ├── useBudgetData.ts
│   ├── useFileManager.ts
│   └── useCalculations.ts
├── types/                # TypeScript definitions
│   ├── index.ts          # Core interfaces
│   ├── calculations.ts   # Calculation types
│   └── planning.ts       # Planning feature types
├── utils/                # Utility functions
│   ├── budgetCalculations.ts      # Core calculations
│   ├── currencyFormatter.ts      # Display formatting
│   ├── fileManager.ts            # File operations
│   ├── featureFlags.ts           # Feature toggles
│   ├── validation.ts             # Data validation
│   └── constants.ts              # App constants
├── services/            # External integrations
│   ├── api.ts           # API service layer
│   └── storage.ts       # Storage management
├── styles/              # CSS styling
│   ├── App.css          # Global styles
│   ├── components/      # Component-specific styles
│   └── themes/          # Theme definitions
└── __tests__/           # Test files
    ├── components/      # Component tests
    ├── utils/           # Utility tests
    └── integration/     # Integration tests
```

### Component Architecture

**Component Hierarchy**:

```
App
├── BudgetProvider (Context)
├── Dashboard (Main Container)
│   ├── Navigation
│   ├── YearSelector
│   ├── QuarterSelector
│   └── ViewContainer
│       ├── MonthlyView
│       ├── YearlyBudgetDashboard
│       ├── ExecutiveSummary
│       └── VendorManagement
└── GlobalModals
    ├── BudgetInput
    ├── FileManager
    └── ConfirmationDialog
```

### Data Flow Architecture

```
User Action → Component → Context Dispatch → Reducer → State Update → Component Re-render
                                    ↓
                            Utility Functions ← Pure Calculations ← Business Logic
```

---

## Development Standards

### TypeScript Guidelines

**Interface Design**:

```typescript
// Good: Descriptive, specific interfaces
interface BudgetEntry {
  readonly id: string;
  categoryId: string;
  year: number;
  quarter: number;
  month: number;
  budgetAmount: number;
  actualAmount?: number;
  reforecastAmount?: number;
  adjustmentAmount?: number;
  notes?: string;
  readonly createdAt: Date;
  updatedAt: Date;
}

// Avoid: Generic or unclear interfaces
interface Data {
  id: string;
  values: number[];
  other?: any;
}
```

**Type Safety Best Practices**:

```typescript
// Use union types for controlled values
type ViewMode = "monthly" | "quarterly" | "yearly" | "executive";

// Use mapped types for transformations
type PartialBudgetEntry = Partial<Pick<BudgetEntry, "budgetAmount" | "notes">>;

// Use type guards for runtime checking
const isBudgetEntry = (obj: unknown): obj is BudgetEntry => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "categoryId" in obj &&
    "year" in obj
  );
};
```

### React Component Standards

**Functional Component Structure**:

```typescript
interface ComponentProps {
  required: string;
  optional?: number;
  children?: React.ReactNode;
}

const ComponentName: React.FC<ComponentProps> = ({
  required,
  optional = 0,
  children,
}) => {
  // Hooks at the top
  const { state, dispatch } = useBudget();
  const [localState, setLocalState] = useState<string>("");

  // Derived state and memoized values
  const calculatedValue = useMemo(() => {
    return calculateSomething(state.data);
  }, [state.data]);

  // Event handlers
  const handleAction = useCallback(
    (value: string) => {
      setLocalState(value);
      dispatch({ type: "UPDATE_SOMETHING", payload: value });
    },
    [dispatch]
  );

  // Effects
  useEffect(() => {
    // Side effects here
  }, [dependencies]);

  // Early returns for error states
  if (!required) {
    return <div>Error: Required prop missing</div>;
  }

  // Main render
  return <div className="component-name">{/* Component content */}</div>;
};

export default ComponentName;
```

### CSS/Styling Standards

**CSS Organization**:

```css
/* Component-specific styles */
.budget-dashboard {
  /* Layout properties */
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1rem;

  /* Visual properties */
  background-color: var(--background-primary);
  border-radius: 8px;
  padding: 1rem;

  /* Responsive design */
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

/* BEM methodology for complex components */
.performance-card {
  /* Block styles */
}

.performance-card__header {
  /* Element styles */
}

.performance-card--highlighted {
  /* Modifier styles */
}
```

**CSS Custom Properties**:

```css
:root {
  /* Colors */
  --color-primary: #007bff;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-error: #dc3545;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-weight-normal: 400;
  --font-weight-bold: 600;
}
```

---

## Git Workflow

### Branch Strategy

**Main Branches**:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `staging`: Pre-production testing

**Feature Branches**:

- `feature/description`: New features
- `bugfix/description`: Bug fixes
- `hotfix/description`: Critical production fixes
- `docs/description`: Documentation updates

### Commit Message Format

**Structure**:

```
type(scope): short description

Optional longer description explaining the change
in more detail. Wrap at 72 characters.

Fixes #123
```

**Types**:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
feat(dashboard): add quarterly performance metrics

Add new performance cards showing quarterly comparison
data with color-coded variance indicators.

Closes #45

fix(calculations): correct variance calculation for negative values

The variance calculation was not properly handling negative
budget amounts, causing incorrect percentage calculations.

Fixes #67

docs(readme): update installation instructions

Added missing steps for environment configuration
and clarified Node.js version requirements.
```

### Development Workflow

1. **Start New Feature**:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/new-feature-name
```

2. **Development Process**:

```bash
# Make changes
git add .
git commit -m "feat(scope): implement feature"

# Push regularly
git push origin feature/new-feature-name
```

3. **Pre-merge Checklist**:

```bash
# Update from develop
git checkout develop
git pull origin develop
git checkout feature/new-feature-name
git rebase develop

# Run tests
npm test
npm run lint
npm run type-check

# Build verification
npm run build
```

4. **Create Pull Request**:

- Fill out PR template
- Assign reviewers
- Link related issues
- Update documentation if needed

---

## Testing Procedures

### Test Structure

**Test File Organization**:

```
src/__tests__/
├── components/
│   ├── Dashboard.test.tsx
│   ├── MonthlyView.test.tsx
│   └── VendorManagement.test.tsx
├── utils/
│   ├── budgetCalculations.test.ts
│   ├── currencyFormatter.test.ts
│   └── fileManager.test.ts
├── hooks/
│   ├── useBudgetData.test.ts
│   └── useCalculations.test.ts
└── integration/
    ├── budget-workflow.test.tsx
    └── file-operations.test.tsx
```

### Unit Testing

**Component Testing Example**:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetProvider } from "../../context/BudgetContext";
import MonthlyView from "../../components/MonthlyView";

const renderWithProvider = (component: React.ReactElement) => {
  return render(<BudgetProvider>{component}</BudgetProvider>);
};

describe("MonthlyView", () => {
  test("displays budget entries for selected month", () => {
    renderWithProvider(<MonthlyView />);

    expect(screen.getByText("January 2025")).toBeInTheDocument();
    expect(screen.getByText("Add Entry")).toBeInTheDocument();
  });

  test("toggles forecast mode when switch is clicked", () => {
    renderWithProvider(<MonthlyView />);

    const toggle = screen.getByRole("switch", { name: /forecast mode/i });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});
```

**Utility Testing Example**:

```typescript
import { calculateCategorySummary } from "../../utils/budgetCalculations";
import { mockBudgetEntries, mockCategories } from "../mocks/budgetData";

describe("budgetCalculations", () => {
  describe("calculateCategorySummary", () => {
    test("calculates correct variance for positive amounts", () => {
      const result = calculateCategorySummary(
        mockBudgetEntries,
        mockCategories[0],
        1, // quarter
        1, // month
        2025 // year
      );

      expect(result.variance).toBe(-500); // Over budget
      expect(result.variancePercent).toBeCloseTo(-10.0);
    });

    test("handles zero budget amounts correctly", () => {
      const entriesWithZeroBudget = [
        ...mockBudgetEntries,
        { ...mockBudgetEntries[0], budgetAmount: 0 },
      ];

      const result = calculateCategorySummary(
        entriesWithZeroBudget,
        mockCategories[0]
      );

      expect(result.variancePercent).toBe(0);
    });
  });
});
```

### Integration Testing

**Workflow Testing**:

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";

describe("Budget Entry Workflow", () => {
  test("complete budget entry process", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to monthly view
    await user.click(screen.getByText("Monthly View"));

    // Open budget entry modal
    await user.click(screen.getByText("Add Entry"));

    // Fill form
    await user.selectOptions(
      screen.getByLabelText("Category"),
      "opex-base-pay"
    );
    await user.type(screen.getByLabelText("Budget Amount"), "5000");
    await user.type(screen.getByLabelText("Actual Amount"), "4800");

    // Submit
    await user.click(screen.getByText("Save Entry"));

    // Verify entry appears
    await waitFor(() => {
      expect(screen.getByText("Base Pay")).toBeInTheDocument();
      expect(screen.getByText("$5,000")).toBeInTheDocument();
      expect(screen.getByText("$4,800")).toBeInTheDocument();
    });
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- Dashboard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="variance calculation"

# Update snapshots
npm test -- --updateSnapshot
```

---

## Code Review Process

### Review Checklist

**Functionality**:

- [ ] Feature works as specified
- [ ] Edge cases are handled
- [ ] Error states are managed
- [ ] Performance is acceptable

**Code Quality**:

- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] Functions are pure where possible
- [ ] Components are properly composed

**Testing**:

- [ ] Unit tests cover new functionality
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases tested

**Documentation**:

- [ ] Code is self-documenting
- [ ] Complex logic has comments
- [ ] README updated if needed
- [ ] API changes documented

### Review Guidelines

**For Authors**:

1. Self-review before requesting review
2. Provide context in PR description
3. Link to related issues/requirements
4. Highlight areas needing special attention
5. Respond promptly to feedback

**For Reviewers**:

1. Focus on logic and architecture first
2. Check for potential bugs or edge cases
3. Verify tests cover the changes
4. Suggest improvements constructively
5. Approve when satisfied with quality

### Common Review Comments

**Code Structure**:

```typescript
// ❌ Avoid: Complex nested logic
if (condition1) {
  if (condition2) {
    if (condition3) {
      // deeply nested logic
    }
  }
}

// ✅ Prefer: Early returns
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
// main logic here
```

**Type Safety**:

```typescript
// ❌ Avoid: Any types
const handleData = (data: any) => {
  return data.someProperty;
};

// ✅ Prefer: Specific types
interface DataInput {
  someProperty: string;
  otherProperty: number;
}

const handleData = (data: DataInput): string => {
  return data.someProperty;
};
```

---

## Deployment Process

### Build Process

**Development Build**:

```bash
npm run start
# Serves development build with hot reload
```

**Production Build**:

```bash
npm run build
# Creates optimized production build in /build
```

**Build Verification**:

```bash
# Check bundle size
npm run analyze

# Test production build locally
npm install -g serve
serve -s build
```

### Deployment Checklist

**Pre-deployment**:

- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Feature flags configured
- [ ] Environment variables set

**Deployment Steps**:

1. Merge to main branch
2. Tag release version
3. Build production bundle
4. Deploy to staging environment
5. Run smoke tests
6. Deploy to production
7. Monitor for issues

**Post-deployment**:

- [ ] Verify application loads
- [ ] Test critical user paths
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update deployment documentation

### Environment Configuration

**Development**:

```bash
REACT_APP_ENV=development
REACT_APP_DEBUG_MODE=true
REACT_APP_ENABLE_BUDGET_PLANNING=true
```

**Staging**:

```bash
REACT_APP_ENV=staging
REACT_APP_DEBUG_MODE=false
REACT_APP_ENABLE_BUDGET_PLANNING=true
```

**Production**:

```bash
REACT_APP_ENV=production
REACT_APP_DEBUG_MODE=false
REACT_APP_ENABLE_BUDGET_PLANNING=false
```

---

## Troubleshooting

### Common Development Issues

**TypeScript Errors**:

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm start

# Check TypeScript configuration
npx tsc --noEmit
```

**Build Failures**:

```bash
# Clear all caches
rm -rf node_modules package-lock.json
npm install

# Check for conflicting dependencies
npm ls
```

**Test Failures**:

```bash
# Update test snapshots
npm test -- --updateSnapshot

# Run tests in debug mode
node --inspect-brk node_modules/.bin/react-scripts test --runInBand --no-cache
```

### Performance Issues

**Bundle Size Analysis**:

```bash
npm install --save-dev webpack-bundle-analyzer
npm run analyze
```

**Memory Leaks**:

```typescript
// Check for proper cleanup in useEffect
useEffect(() => {
  const subscription = someService.subscribe();

  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);
```

**Render Performance**:

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive render */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

---

## Best Practices

### Performance Optimization

**Component Optimization**:

- Use React.memo for components that re-render frequently
- Implement useMemo for expensive calculations
- Use useCallback for stable function references
- Avoid creating objects/functions in render

**State Management**:

- Keep state as flat as possible
- Use useReducer for complex state logic
- Minimize context provider re-renders
- Implement proper dependency arrays in useEffect

### Security Considerations

**Input Validation**:

```typescript
const validateBudgetAmount = (amount: string): number | null => {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 0 || parsed > 999999999) {
    return null;
  }
  return parsed;
};
```

**File Handling**:

```typescript
const validateFileType = (file: File): boolean => {
  const allowedTypes = ["application/json", "text/csv"];
  return allowedTypes.includes(file.type);
};

const validateFileSize = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file.size <= maxSize;
};
```

### Accessibility Best Practices

**ARIA Support**:

```jsx
<button
  aria-label="Toggle forecast mode for January"
  aria-pressed={isForecastMode}
  role="switch"
  onClick={handleToggle}
>
  {isForecastMode ? "Forecast" : "Final"}
</button>
```

**Keyboard Navigation**:

```jsx
const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleAction();
  }
};
```

---

## Performance Guidelines

### Monitoring and Metrics

**Key Performance Indicators**:

- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.0s
- Bundle size < 500KB gzipped

**Performance Testing**:

```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse http://localhost:3000 --view

# Bundle analysis
npm run analyze

# Performance profiling in Chrome DevTools
# Performance tab → Record → Analyze
```

### Optimization Strategies

**Code Splitting**:

```typescript
// Route-based splitting
const MonthlyView = React.lazy(() => import("./components/MonthlyView"));
const YearlyDashboard = React.lazy(
  () => import("./components/YearlyBudgetDashboard")
);

// Feature-based splitting
const PlanningFeatures = React.lazy(() => import("./components/Planning"));
```

**Asset Optimization**:

- Optimize images (WebP format when possible)
- Minimize CSS and JavaScript
- Use CDN for static assets
- Implement service worker for caching

**Data Loading**:

- Implement pagination for large datasets
- Use virtualization for long lists
- Cache calculated values with useMemo
- Debounce user input for search/filter

---

**Last Updated**: January 2025  
**Version**: 2025.1  
**Target Audience**: Development Team  
**Review Cycle**: Quarterly updates
