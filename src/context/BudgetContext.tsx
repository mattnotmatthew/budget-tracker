import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { BudgetEntry, BudgetCategory, ViewMode, BudgetState } from "../types";

type BudgetAction =
  | { type: "ADD_ENTRY"; payload: BudgetEntry }
  | { type: "UPDATE_ENTRY"; payload: BudgetEntry }
  | { type: "DELETE_ENTRY"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | {
      type: "SET_SELECTED_PERIOD";
      payload: { year?: number; quarter?: number; month?: number };
    }
  | { type: "ADD_CATEGORY"; payload: BudgetCategory }
  | { type: "LOAD_ENTRIES"; payload: BudgetEntry[] }
  | {
      type: "SET_CURRENT_FILE";
      payload:
        | { name: string; handle?: FileSystemFileHandle; lastSaved?: Date }
        | undefined;
    }
  | { type: "CLEAR_ALL_DATA" }
  | {
      type: "SET_YEARLY_BUDGET_TARGET";
      payload: { year: number; amount: number };
    }
  | {
      type: "SET_MONTHLY_FORECAST_MODE";
      payload: { year: number; month: number; isFinal: boolean };
    };

const initialCategories: BudgetCategory[] = [
  // Cost of Sales
  {
    id: "cos-recurring-software",
    name: "Recurring Software",
    parentCategory: "cost-of-sales",
  },
  {
    id: "cos-onetime-software",
    name: "One-Time Software",
    parentCategory: "cost-of-sales",
  },
  {
    id: "cos-recurring-service",
    name: "Recurring Service",
    parentCategory: "cost-of-sales",
  },
  {
    id: "cos-onetime-service",
    name: "One-time Service",
    parentCategory: "cost-of-sales",
  },
  {
    id: "cos-reclass-opex",
    name: "Reclass from Opex",
    parentCategory: "cost-of-sales",
  },
  { id: "cos-other", name: "Other", parentCategory: "cost-of-sales" },
  // OpEx
  { id: "opex-base-pay", name: "Base Pay", parentCategory: "opex" },
  {
    id: "opex-capitalized-salaries",
    name: "Capitalized Salaries",
    parentCategory: "opex",
  },
  { id: "opex-commissions", name: "Commissions", parentCategory: "opex" },
  { id: "opex-reclass-cogs", name: "Reclass to COGS", parentCategory: "opex" },
  { id: "opex-bonus", name: "Bonus", parentCategory: "opex" },
  { id: "opex-benefits", name: "Benefits", parentCategory: "opex" },
  { id: "opex-payroll-taxes", name: "Payroll Taxes", parentCategory: "opex" },
  {
    id: "opex-other-compensation",
    name: "Other Compensation",
    parentCategory: "opex",
  },
  {
    id: "opex-travel-entertainment",
    name: "Travel & Entertainment",
    parentCategory: "opex",
  },
  {
    id: "opex-employee-related",
    name: "Employee Related",
    parentCategory: "opex",
  },
  { id: "opex-facilities", name: "Facilities", parentCategory: "opex" },
  {
    id: "opex-information-technology",
    name: "Information Technology",
    parentCategory: "opex",
  },
  {
    id: "opex-professional-services",
    name: "Professional Services",
    parentCategory: "opex",
  },
  { id: "opex-corporate", name: "Corporate", parentCategory: "opex" },
  { id: "opex-marketing", name: "Marketing", parentCategory: "opex" },
];

// Initialize state with empty data - no caching
const getInitialState = (): BudgetState => {
  // Always start with empty data - user must load/create a file
  return {
    entries: [],
    categories: initialCategories,
    viewMode: "monthly",
    selectedYear: 2025,
    yearlyBudgetTargets: {},
    monthlyForecastModes: {},
  };
};

const initialState: BudgetState = getInitialState();

const budgetReducer = (
  state: BudgetState,
  action: BudgetAction
): BudgetState => {
  switch (action.type) {
    case "ADD_ENTRY":
      return { ...state, entries: [...state.entries, action.payload] };
    case "UPDATE_ENTRY":
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
    case "DELETE_ENTRY":
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.payload),
      };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_SELECTED_PERIOD":
      return {
        ...state,
        selectedYear: action.payload.year ?? state.selectedYear,
        selectedQuarter: action.payload.quarter,
        selectedMonth: action.payload.month,
      };
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] };
    case "LOAD_ENTRIES":
      return { ...state, entries: action.payload };
    case "SET_CURRENT_FILE":
      return { ...state, currentFile: action.payload };
    case "CLEAR_ALL_DATA":
      return {
        ...state,
        entries: [],
        selectedQuarter: undefined,
        selectedMonth: undefined,
        currentFile: undefined,
        yearlyBudgetTargets: {},
        monthlyForecastModes: {},
      };
    case "SET_YEARLY_BUDGET_TARGET":
      return {
        ...state,
        yearlyBudgetTargets: {
          ...state.yearlyBudgetTargets,
          [action.payload.year]: action.payload.amount,
        },
      };
    case "SET_MONTHLY_FORECAST_MODE":
      const { year, month, isFinal } = action.payload;
      return {
        ...state,
        monthlyForecastModes: {
          ...state.monthlyForecastModes,
          [year]: {
            ...state.monthlyForecastModes[year],
            [month]: isFinal,
          },
        },
      };
    default:
      return state;
  }
};

const BudgetContext = createContext<{
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
} | null>(null);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};
