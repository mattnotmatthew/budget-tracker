# Budget Tracker Technical Documentation

Comprehensive technical documentation for the Budget vs Actual Tracker 2025 React TypeScript application, covering architecture, business logic, data flow, and development guidelines.

## 📖 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Business Logic](#business-logic)
6. [Data Models & Types](#data-models--types)
7. [State Management](#state-management)
8. [Utility Functions](#utility-functions)
9. [File Management System](#file-management-system)
10. [Calculation Engine](#calculation-engine)
11. [UI/UX Implementation](#uiux-implementation)
12. [Feature Flags](#feature-flags)
13. [Testing Strategy](#testing-strategy)
14. [Development Workflow](#development-workflow)
15. [Deployment & Maintenance](#deployment--maintenance)

---

## Architecture Overview

### Application Design Pattern

The Budget Tracker follows a **component-based architecture** with clear separation of concerns:

```
├── Presentation Layer (React Components)
├── Business Logic Layer (Context + Reducers)
├── Data Access Layer (File Management + Utilities)
└── Calculation Engine (Pure Functions)
```

### Key Architectural Principles

1. **Unidirectional Data Flow**: State flows down, events flow up
2. **Pure Functions**: All calculations are side-effect free
3. **Type Safety**: Comprehensive TypeScript typing throughout
4. **Component Isolation**: Each component handles specific responsibilities
5. **Immutable State**: State updates through reducers only

### System Integration Points

- **File System API**: Native browser file handling
- **Local Storage**: Cached data and user preferences
- **Context API**: Global state management
- **Custom Hooks**: Reusable business logic

---

## Technology Stack

### Core Technologies

**Frontend Framework**:

- **React 18**: Latest features including concurrent rendering
- **TypeScript 4.9+**: Full type safety and modern language features
- **JSX/TSX**: Component templating with type checking

**State Management**:

- **React Context API**: Global application state
- **useReducer Hook**: Complex state logic management
- **Custom Hooks**: Reusable stateful logic

**Styling & UI**:

- **CSS3**: Modern CSS with Grid and Flexbox
- **CSS Modules**: Scoped styling approach
- **Responsive Design**: Mobile-first responsive layout

**Development Tools**:

- **Create React App**: Build toolchain and development server
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript Compiler**: Type checking and compilation

### Dependencies

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^4.9.0",
  "date-fns": "^2.29.0",
  "recharts": "^2.5.0",
  "file-saver": "^2.0.5"
}
```

---

## Project Structure

### Directory Organization

```
src/
├── components/           # React components
│   ├── Dashboard.tsx     # Main application shell
│   ├── MonthlyView.tsx   # Monthly budget interface
│   ├── YearlyBudgetDashboard.tsx  # Executive dashboard
│   ├── VendorManagement.tsx       # Vendor tracking
│   ├── ExecutiveSummary/          # Executive reporting
│   ├── Planning/                  # Future planning features
│   └── ...
├── context/              # State management
│   └── BudgetContext.tsx # Global state and actions
├── types/                # TypeScript definitions
│   └── index.ts          # Core type definitions
├── utils/                # Utility functions
│   ├── budgetCalculations.ts      # Calculation engine
│   ├── currencyFormatter.ts      # Display formatting
│   ├── fileManager.ts            # File operations
│   ├── featureFlags.ts           # Feature toggles
│   └── ...
├── styles/               # CSS styling
│   └── App.css          # Global styles
└── services/            # External integrations
    └── ...
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `BudgetInput.tsx`)
- **Utilities**: camelCase (e.g., `budgetCalculations.ts`)
- **Types**: PascalCase interfaces (e.g., `BudgetEntry`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `COMP_AND_BENEFITS_CATEGORIES`)

---

## Core Components

### Dashboard.tsx

**Purpose**: Main application container and navigation hub

**Key Responsibilities**:

- Year and quarter selection
- View mode coordination
- Global navigation state
- Feature integration point

**State Management**:

```typescript
const { state, dispatch } = useBudget();
const [activeView, setActiveView] = useState<ViewMode>("monthly");
```

**Key Functions**:

- `handleYearChange()`: Updates global year selection
- `handleQuarterChange()`: Updates quarter focus
- `navigateToView()`: Switches between main views

### MonthlyView.tsx

**Purpose**: Detailed monthly budget entry and management

**Core Features**:

- IOSToggle integration for Final/Forecast modes
- Category-based budget entry
- Real-time variance calculation
- Quarterly summary aggregation

**Data Flow**:

```typescript
Monthly Entries → Category Summaries → Quarterly Aggregation → YTD Calculations
```

**Key Functions**:

- `calculateMonthlyData()`: Processes monthly entries
- `handleToggleMode()`: Switches Final/Forecast states
- `generateQuarterlySummary()`: Aggregates monthly data

### YearlyBudgetDashboard.tsx

**Purpose**: Executive-level performance monitoring

**Performance Metrics**:

- YTD Actual vs Budget
- Full Year Forecast
- Budget Utilization
- Remaining Budget Analysis

**Calculation Dependencies**:

- `calculateYTDData()`: Year-to-date aggregation
- `calculateBudgetTracking()`: Performance metrics
- `generateExecutiveInsights()`: Automated insights

### VendorManagement.tsx

**Purpose**: Vendor tracking and budget allocation

**Features**:

- Vendor data entry with validation
- Read-only mode for completed entries
- Edit mode toggle functionality
- Automatic row creation

**Data Model**:

```typescript
interface VendorData {
  id: string;
  vendorName: string;
  billingType: string;
  budget: number;
  notes: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Business Logic

### IOSToggle Logic

**Core Concept**: Each month can be in "Final" or "Forecast" mode

**Final Mode**:

- Uses actual spending data
- Adjustments appear in Actual column
- Variance calculated against actuals
- Represents completed/closed months

**Forecast Mode**:

- Uses projected spending data
- Adjustments appear in Forecast column
- Variance calculated against forecasts
- Represents future/projected months

**Implementation**:

```typescript
const getMonthForecastMode = (month: number): boolean => {
  return state.monthlyForecastModes[state.selectedYear]?.[month] ?? false;
};

// true = Final (actual), false = Forecast (projected)
```

### Variance Calculation Logic

**Primary Rule**:

```typescript
if (actual !== 0) {
  variance = (actual - budget) * -1;
} else {
  variance = (reforecast - budget) * -1;
}
```

**Interpretation**:

- **Positive Variance**: Under budget (good)
- **Negative Variance**: Over budget (needs attention)

### Budget Tracking Calculations

**Purpose**: Net spending after adjustments

**Formula**:

```typescript
const budgetTrackingActual = netTotal.actual - netTotal.adjustments;
const budgetTrackingReforecast =
  netTotal.actual === 0
    ? netTotal.reforecast - netTotal.adjustments
    : netTotal.reforecast;
```

### Category Hierarchy

**Cost of Sales Categories**:

```typescript
const COST_OF_SALES_CATEGORIES = [
  "cos-recurring-software",
  "cos-onetime-software",
  "cos-recurring-service",
  "cos-onetime-service",
  "cos-reclass-from-opex",
  "cos-other",
];
```

**OpEx Categories**:

```typescript
const COMP_AND_BENEFITS_CATEGORIES = [
  "opex-base-pay",
  "opex-capitalized-salaries",
  "opex-commissions",
  "opex-bonus",
  "opex-benefits",
  // ... more categories
];
```

---

## Data Models & Types

### Core Interfaces

**BudgetEntry**:

```typescript
interface BudgetEntry {
  id: string;
  categoryId: string;
  year: number;
  quarter: number;
  month: number;
  budgetAmount: number;
  actualAmount?: number;
  reforecastAmount?: number;
  adjustmentAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**BudgetState**:

```typescript
interface BudgetState {
  entries: BudgetEntry[];
  categories: BudgetCategory[];
  viewMode: ViewMode;
  selectedYear: number;
  selectedQuarter?: number;
  currentFile?: FileInfo;
  yearlyBudgetTargets: Record<number, number>;
  monthlyForecastModes: Record<number, Record<number, boolean>>;
  persistence: PersistenceState;
  vendorData?: VendorData[];
  // Planning features (optional)
  planningMode?: boolean;
  planningData?: Record<number, PlanningData>;
}
```

### Type Safety Implementation

**Strict TypeScript Configuration**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Type Guards**:

```typescript
const isBudgetEntry = (obj: any): obj is BudgetEntry => {
  return (
    obj && typeof obj.id === "string" && typeof obj.categoryId === "string"
  );
};
```

---

## State Management

### Context Architecture

**BudgetContext.tsx** provides global state management:

```typescript
const BudgetContext = createContext<{
  state: BudgetState;
  dispatch: Dispatch<BudgetAction>;
} | null>(null);
```

### Reducer Pattern

**Action Types**:

```typescript
type BudgetAction =
  | { type: "ADD_ENTRY"; payload: BudgetEntry }
  | {
      type: "UPDATE_ENTRY";
      payload: { id: string; updates: Partial<BudgetEntry> };
    }
  | { type: "DELETE_ENTRY"; payload: string }
  | { type: "SET_YEAR"; payload: number }
  | { type: "TOGGLE_FORECAST_MODE"; payload: { year: number; month: number } }
  | { type: "LOAD_DATA"; payload: BudgetState };
// ... more actions
```

**Reducer Implementation**:

```typescript
const budgetReducer = (
  state: BudgetState,
  action: BudgetAction
): BudgetState => {
  switch (action.type) {
    case "ADD_ENTRY":
      return {
        ...state,
        entries: [...state.entries, action.payload],
        persistence: { ...state.persistence, hasUnsavedChanges: true },
      };
    // ... other cases
  }
};
```

### Custom Hooks

**useBudget Hook**:

```typescript
export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};
```

---

## Utility Functions

### budgetCalculations.ts

**Core Calculation Functions**:

```typescript
// Calculate category summary for any period
export const calculateCategorySummary = (
  entries: BudgetEntry[],
  category: BudgetCategory,
  quarter?: number,
  month?: number,
  year?: number
): CategorySummary => {
  // Implementation details...
};

// Calculate YTD data through specific month
export const calculateYTDData = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  year: number
): { data: QuarterlyData; lastMonthWithActuals: number } => {
  // Implementation details...
};

// Budget tracking calculations
export const calculateBudgetTracking = (
  netTotal: NetTotalData,
  isForecastMode?: boolean
) => {
  // Implementation details...
};
```

### currencyFormatter.ts

**Excel-Style Formatting**:

```typescript
export const formatCurrencyExcelStyle = (value: number): string => {
  if (value === 0) return "-";

  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absValue);

  return value < 0 ? `(${formatted.replace("$", "$")})` : formatted;
};
```

### fileManager.ts

**File Operations**:

```typescript
// Save budget data to file
export const saveBudgetData = async (
  state: BudgetState,
  filename?: string
): Promise<void> => {
  // Implementation details...
};

// Load budget data from file
export const loadBudgetData = async (file: File): Promise<BudgetState> => {
  // Implementation details...
};
```

---

## File Management System

### Smart File Handling

**Auto-Save Features**:

- Periodic auto-save every 5 minutes
- Save on navigation between views
- Save on year/quarter changes
- Recovery from unexpected closures

**File Formats**:

- **Native Format**: JSON with full application state
- **Export Formats**: CSV, HTML, PDF (via print)
- **Import Formats**: JSON, CSV (limited)

### Persistence Strategy

**State Caching**:

```typescript
interface PersistenceState {
  hasUnsavedChanges: boolean;
  lastCacheUpdate: Date | null;
  lastFileSave: Date | null;
  isFirstTimeUser: boolean;
  cacheAutoSaveInterval: number;
}
```

**File System Integration**:

- Uses modern File System Access API when available
- Fallback to traditional download/upload for compatibility
- Maintains file handles for direct file updates

---

## Calculation Engine

### Monthly Calculations

**Data Aggregation Flow**:

```
Individual Entries → Category Summaries → Monthly Totals → Quarterly Aggregation
```

**Key Functions**:

- `calculateMonthlyData()`: Processes single month
- `calculateQuarterlyData()`: Aggregates quarter
- `calculateYTDData()`: Year-to-date through specific month

### Variance Analysis

**Multi-Level Variance**:

1. **Category Level**: Individual category performance
2. **Group Level**: Cost of Sales vs OpEx performance
3. **Total Level**: Overall budget performance

**Smart Variance Logic**:

- Uses actual amounts when available
- Falls back to forecast for future periods
- Adjusts calculation based on IOSToggle state

### Performance Optimization

**Calculation Caching**:

```typescript
const memoizedCalculation = useMemo(() => {
  return calculateComplexData(entries, categories, year);
}, [entries, categories, year]);
```

**Efficient Updates**:

- Only recalculate affected periods
- Batch multiple updates together
- Debounce rapid state changes

---

## UI/UX Implementation

### Responsive Design

**Breakpoint Strategy**:

```css
/* Mobile-first approach */
.container {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    width: 750px;
  }
}

@media (min-width: 1024px) {
  .container {
    width: 970px;
  }
}
```

### Component Design Patterns

**Higher-Order Components**:

```typescript
const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
};
```

**Render Props Pattern**:

```typescript
interface DataProviderProps {
  children: (data: CalculatedData) => React.ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const data = useCalculatedData();
  return <>{children(data)}</>;
};
```

### Accessibility Implementation

**ARIA Support**:

```jsx
<button
  aria-label="Toggle forecast mode for January"
  aria-pressed={isForecastMode}
  role="switch"
>
  {isForecastMode ? "Forecast" : "Final"}
</button>
```

**Keyboard Navigation**:

- Tab order management
- Enter/Space for activation
- Escape for cancellation
- Arrow keys for grid navigation

---

## Feature Flags

### Implementation

**Feature Flag System**:

```typescript
const FEATURE_FLAGS = {
  BUDGET_PLANNING: process.env.REACT_APP_ENABLE_BUDGET_PLANNING === "true",
  ADVANCED_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === "true",
  EXPORT_FEATURES: process.env.REACT_APP_ENABLE_EXPORTS === "true",
};

export const isFeatureEnabled = (flag: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[flag] ?? false;
};
```

**Conditional Rendering**:

```typescript
{
  isFeatureEnabled("BUDGET_PLANNING") && <PlanningDashboard />;
}
```

### Environment Configuration

**.env Files**:

```bash
# .env.development
REACT_APP_ENABLE_BUDGET_PLANNING=true
REACT_APP_ENABLE_ANALYTICS=false

# .env.production
REACT_APP_ENABLE_BUDGET_PLANNING=false
REACT_APP_ENABLE_ANALYTICS=true
```

---

## Testing Strategy

### Testing Pyramid

**Unit Tests** (70%):

- Utility functions
- Pure calculation logic
- Individual component behavior

**Integration Tests** (20%):

- Component interactions
- Context provider behavior
- Data flow validation

**End-to-End Tests** (10%):

- Complete user workflows
- File operations
- Cross-browser compatibility

### Test Implementation

**Jest Configuration**:

```javascript
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapping: {
    "\\.(css|less|scss)$": "identity-obj-proxy",
  },
};
```

**React Testing Library**:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetProvider } from "../context/BudgetContext";

test("should calculate variance correctly", () => {
  render(
    <BudgetProvider>
      <MonthlyView />
    </BudgetProvider>
  );

  // Test implementation...
});
```

---

## Development Workflow

### Setup Process

1. **Clone Repository**
2. **Install Dependencies**: `npm install`
3. **Environment Setup**: Configure `.env` files
4. **Start Development**: `npm start`
5. **Run Tests**: `npm test`

### Code Quality Standards

**ESLint Configuration**:

```json
{
  "extends": ["react-app", "@typescript-eslint/recommended"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/explicit-function-return-type": "error"
  }
}
```

**Prettier Configuration**:

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}
```

### Git Workflow

**Branch Strategy**:

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Critical fixes

**Commit Message Format**:

```
type(scope): description

feat(dashboard): add quarterly summary component
fix(calculations): correct variance calculation logic
docs(readme): update installation instructions
```

---

## Deployment & Maintenance

### Build Process

**Production Build**:

```bash
npm run build
```

**Build Output**:

```
build/
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── index.html
└── asset-manifest.json
```

### Performance Monitoring

**Key Metrics**:

- Bundle size optimization
- Load time performance
- Memory usage monitoring
- Error tracking and reporting

### Maintenance Tasks

**Regular Maintenance**:

- Dependency updates
- Security patch application
- Performance optimization
- Bug fix deployment

**Monitoring**:

- Application error tracking
- User feedback collection
- Performance metric analysis
- Feature usage analytics

---

## API Reference

### Context Methods

```typescript
// Add new budget entry
dispatch({
  type: "ADD_ENTRY",
  payload: newEntry,
});

// Update existing entry
dispatch({
  type: "UPDATE_ENTRY",
  payload: { id: entryId, updates: changes },
});

// Toggle forecast mode
dispatch({
  type: "TOGGLE_FORECAST_MODE",
  payload: { year: 2025, month: 3 },
});
```

### Calculation Functions

```typescript
// Calculate category summary
const summary = calculateCategorySummary(
  entries,
  category,
  quarter,
  month,
  year
);

// Calculate YTD data
const { data, lastMonthWithActuals } = calculateYTDData(
  entries,
  categories,
  year
);

// Format currency
const formatted = formatCurrencyExcelStyle(amount);
```

---

## Conclusion

This technical documentation provides a comprehensive overview of the Budget Tracker application's architecture, implementation details, and development practices. The application is built with scalability, maintainability, and type safety as core principles.

For user-facing documentation, see the [User Guide](./USER_GUIDE.md).

---

**Last Updated**: January 2025  
**Version**: 2025.1  
**Maintainers**: Development Team  
**License**: Internal Use Only
