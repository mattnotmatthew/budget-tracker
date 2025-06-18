import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { BudgetEntry, BudgetCategory, ViewMode, BudgetState } from "../types";
import { attemptRestoreCachedFile } from "../utils/fileManager";

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

// Cache key for storing file information
const CACHE_KEY = "budget-tracker-file-info";

// Helper function to save file info to cache
const saveFileInfoToCache = (fileInfo: {
  name: string;
  path?: string;
  lastSaved?: Date;
  size?: number;
  lastModified?: Date;
  contentHash?: string;
}) => {
  try {
    const cacheData = {
      ...fileInfo,
      lastSaved: fileInfo.lastSaved?.toISOString(),
      lastModified: fileInfo.lastModified?.toISOString(),
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Failed to save file info to cache:", error);
  }
};

// Helper function to load file info from cache
const loadFileInfoFromCache = (): {
  name: string;
  path?: string;
  lastSaved?: Date;
  size?: number;
  lastModified?: Date;
  contentHash?: string;
  timestamp?: Date;
} | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...parsed,
        lastSaved: parsed.lastSaved ? new Date(parsed.lastSaved) : undefined,
        lastModified: parsed.lastModified
          ? new Date(parsed.lastModified)
          : undefined,
        timestamp: parsed.timestamp ? new Date(parsed.timestamp) : undefined,
      };
    }
  } catch (error) {
    console.warn("Failed to load file info from cache:", error);
  }
  return null;
};

// Helper function to clear file info from cache
const clearFileInfoFromCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn("Failed to clear file info from cache:", error);
  }
};

// Initialize state with cached file info if available
const getInitialState = (): BudgetState => {
  const cachedFileInfo = loadFileInfoFromCache();

  return {
    entries: [],
    categories: initialCategories,
    viewMode: "monthly",
    selectedYear: 2025,
    yearlyBudgetTargets: {},
    monthlyForecastModes: {},
    currentFile: cachedFileInfo
      ? {
          name: cachedFileInfo.name,
          lastSaved: cachedFileInfo.lastSaved,
          // Note: FileSystemFileHandle cannot be serialized, so it's not cached
          // The app will need to prompt user to re-select the file for new file system access
        }
      : undefined,
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
      // Save file info to cache when setting current file
      if (action.payload) {
        saveFileInfoToCache({
          name: action.payload.name,
          lastSaved: action.payload.lastSaved,
        });
      } else {
        // Clear cache when unsetting current file
        clearFileInfoFromCache();
      }
      return { ...state, currentFile: action.payload };
    case "CLEAR_ALL_DATA":
      // Clear file info from cache when clearing all data
      clearFileInfoFromCache();
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

  // Attempt to restore cached file on app load
  useEffect(() => {
    const restoreCachedFile = async () => {
      // Only attempt restore if we have cached file info but no current data
      if (state.currentFile && state.entries.length === 0) {
        try {
          const result = await attemptRestoreCachedFile();

          if (result.success && result.data) {
            // Load the restored data
            dispatch({ type: "LOAD_ENTRIES", payload: result.data.entries });

            // Load yearly budget targets if they exist
            if (result.data.yearlyBudgetTargets) {
              Object.entries(result.data.yearlyBudgetTargets).forEach(
                ([year, amount]) => {
                  dispatch({
                    type: "SET_YEARLY_BUDGET_TARGET",
                    payload: { year: parseInt(year), amount: amount as number },
                  });
                }
              );
            }

            // Load monthly forecast modes if they exist
            if (result.data.monthlyForecastModes) {
              Object.entries(result.data.monthlyForecastModes).forEach(
                ([year, monthModes]) => {
                  if (monthModes && typeof monthModes === "object") {
                    Object.entries(
                      monthModes as { [month: number]: boolean }
                    ).forEach(([month, isFinal]) => {
                      dispatch({
                        type: "SET_MONTHLY_FORECAST_MODE",
                        payload: {
                          year: parseInt(year),
                          month: parseInt(month),
                          isFinal: isFinal as boolean,
                        },
                      });
                    });
                  }
                }
              );
            }

            // Update selected year to the loaded year
            if (result.data.year) {
              dispatch({
                type: "SET_SELECTED_PERIOD",
                payload: { year: result.data.year as number },
              });
            }

            // Update current file info with the restored file name
            dispatch({
              type: "SET_CURRENT_FILE",
              payload: {
                name: result.fileName || state.currentFile.name,
                lastSaved: new Date(),
              },
            });

            console.log("Successfully restored cached file:", result.fileName);
          } else if (result.error && !result.error.includes("User declined")) {
            console.warn("Failed to restore cached file:", result.error);
          }
        } catch (error) {
          console.error("Error during file restoration:", error);
        }
      }
    };

    // Run restoration after a short delay to ensure component is mounted
    const timeoutId = setTimeout(restoreCachedFile, 1000);

    return () => clearTimeout(timeoutId);
  }, []); // Only run once on mount

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
