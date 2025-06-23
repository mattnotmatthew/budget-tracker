// Planning feature imports (added for 2026 planning functionality)
import { PlanningData, HistoricalAnalysis } from "./planning";

export interface BudgetCategory {
  id: string;
  name: string;
  parentCategory?: string;
  description?: string;
  isNegative?: boolean;
}

export interface BudgetEntry {
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

export interface CategoryGroup {
  id: string;
  name: string;
  categories: CategorySummary[];
  subGroups?: SubCategoryGroup[];
  total: {
    budget: number;
    actual: number;
    reforecast: number;
    adjustments: number;
    variance: number;
  };
}

export interface SubCategoryGroup {
  id: string;
  name: string;
  categories: CategorySummary[];
  total: {
    budget: number;
    actual: number;
    reforecast: number;
    adjustments: number;
    variance: number;
  };
}

export interface MonthlyData {
  month: number;
  costOfSales: CategoryGroup;
  opex: CategoryGroup;
  netTotal: {
    budget: number;
    actual: number;
    reforecast: number;
    adjustments: number;
    variance: number;
  };
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  budget: number;
  actual: number;
  reforecast: number;
  adjustments: number;
  variance: number;
  variancePercent: number;
  isNegative?: boolean;
}

export interface BudgetAlert {
  id: string;
  type: "warning" | "danger" | "info";
  category: string;
  message: string;
  variance: number;
}

export type ViewMode = "monthly";
export type DataType = "budget" | "actual" | "reforecast";

export interface BudgetState {
  entries: BudgetEntry[];
  categories: BudgetCategory[];
  viewMode: ViewMode;
  selectedYear: number;
  selectedQuarter?: number;
  selectedMonth?: number;
  currentFile?: {
    name: string;
    handle?: FileSystemFileHandle;
    lastSaved?: Date; // Cache last saved timestamp
    userLastSaved?: Date; // User manual save timestamp
    size?: number;
    lastModified?: Date;
    contentHash?: string;
  };
  yearlyBudgetTargets: {
    [year: number]: number;
  };
  monthlyForecastModes: {
    [year: number]: {
      [month: number]: boolean; // true = final (use actual), false = forecast (use forecast)
    };
  };
  // Persistence state
  persistence: {
    hasUnsavedChanges: boolean;
    lastCacheUpdate: Date | null;
    lastFileSave: Date | null;
    isFirstTimeUser: boolean;
    cacheAutoSaveInterval: number; // in milliseconds
  };

  // NEW: Planning feature properties (optional for backward compatibility)
  planningMode?: boolean; // Default: false - whether app is in planning mode
  planningData?: Record<number, PlanningData>; // Default: {} - planning data by year
  selectedScenario?: string; // Default: undefined - active scenario ID
  historicalAnalysis?: Record<number, HistoricalAnalysis>; // Default: {} - analysis by base year
}

// Re-export planning types for convenience
export * from "./planning";
