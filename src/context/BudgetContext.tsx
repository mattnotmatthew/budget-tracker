import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  BudgetEntry,
  BudgetCategory,
  ViewMode,
  BudgetState,
  PlanningData,
  HistoricalAnalysis,
} from "../types";
import { attemptRestoreCachedFile } from "../utils/fileManager";
import { PersistenceManager } from "../services/persistenceManager";
import { isFeatureEnabled } from "../utils/featureFlags";

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
        | {
            name: string;
            handle?: FileSystemFileHandle;
            lastSaved?: Date;
            userLastSaved?: Date;
          }
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
    }
  | { type: "MARK_UNSAVED_CHANGES" }
  | { type: "MARK_SAVED_TO_FILE" }
  | { type: "UPDATE_CACHE_TIMESTAMP" }
  | { type: "LOAD_FROM_CACHE"; payload: any }
  | { type: "SET_FIRST_TIME_USER"; payload: boolean }
  // NEW: Planning feature actions (optional - only available when feature enabled)
  | { type: "SET_PLANNING_MODE"; payload: boolean }
  | { type: "SET_PLANNING_DATA"; payload: { year: number; data: PlanningData } }
  | {
      type: "UPDATE_PLANNING_DATA";
      payload: { year: number; data: Partial<PlanningData> };
    }
  | { type: "DELETE_PLANNING_DATA"; payload: number }
  | { type: "SET_SELECTED_SCENARIO"; payload: string }
  | {
      type: "SET_HISTORICAL_ANALYSIS";
      payload: { year: number; analysis: HistoricalAnalysis };
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
  const persistenceManager = PersistenceManager.getInstance();

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
    persistence: {
      hasUnsavedChanges: false,
      lastCacheUpdate: null,
      lastFileSave: null,
      isFirstTimeUser: persistenceManager.isFirstTimeUser(),
      cacheAutoSaveInterval: 5 * 60 * 1000, // 5 minutes
    },
    // NEW: Planning feature properties (optional, only initialized if feature enabled)
    planningMode: false, // Always start in tracking mode
    planningData: {}, // Empty planning data by default
    selectedScenario: undefined, // No scenario selected initially
    historicalAnalysis: {}, // Empty historical analysis by default
  };
};

const initialState: BudgetState = getInitialState();

const budgetReducer = (
  state: BudgetState,
  action: BudgetAction
): BudgetState => {
  switch (action.type) {
    case "ADD_ENTRY":
      return {
        ...state,
        entries: [...state.entries, action.payload],
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "UPDATE_ENTRY":
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id ? action.payload : entry
        ),
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "DELETE_ENTRY":
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.payload),
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
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
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
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
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "MARK_UNSAVED_CHANGES":
      return {
        ...state,
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "MARK_SAVED_TO_FILE":
      return {
        ...state,
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: false,
          lastFileSave: new Date(),
        },
      };
    case "UPDATE_CACHE_TIMESTAMP":
      return {
        ...state,
        persistence: {
          ...state.persistence,
          lastCacheUpdate: new Date(),
        },
      };
    case "LOAD_FROM_CACHE":
      return {
        ...state,
        entries: action.payload.entries || [],
        selectedYear: action.payload.selectedYear || state.selectedYear,
        yearlyBudgetTargets: action.payload.yearlyBudgetTargets || {},
        monthlyForecastModes: action.payload.monthlyForecastModes || {},
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: false,
        },
      };
    case "SET_FIRST_TIME_USER":
      return {
        ...state,
        persistence: {
          ...state.persistence,
          isFirstTimeUser: action.payload,
        },
      }; // NEW: Planning feature action handlers (only process if feature enabled)
    case "SET_PLANNING_MODE":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      return {
        ...state,
        planningMode: action.payload,
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "SET_PLANNING_DATA":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      return {
        ...state,
        planningData: {
          ...state.planningData,
          [action.payload.year]: action.payload.data,
        },
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "UPDATE_PLANNING_DATA":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      const existingData = state.planningData?.[action.payload.year];
      if (!existingData) {
        console.warn(`No planning data found for year ${action.payload.year}`);
        return state;
      }
      return {
        ...state,
        planningData: {
          ...state.planningData,
          [action.payload.year]: {
            ...existingData,
            ...action.payload.data,
            metadata: {
              ...existingData.metadata,
              lastModified: new Date(),
            },
          },
        },
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "DELETE_PLANNING_DATA":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      const { [action.payload]: deletedData, ...remainingData } =
        state.planningData || {};
      return {
        ...state,
        planningData: remainingData,
        selectedScenario:
          state.selectedScenario &&
          deletedData?.scenarios.some((s) => s.id === state.selectedScenario)
            ? undefined
            : state.selectedScenario,
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "SET_SELECTED_SCENARIO":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      return {
        ...state,
        selectedScenario: action.payload,
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };
    case "SET_HISTORICAL_ANALYSIS":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      return {
        ...state,
        historicalAnalysis: {
          ...state.historicalAnalysis,
          [action.payload.year]: action.payload.analysis,
        },
        persistence: {
          ...state.persistence,
          hasUnsavedChanges: true,
        },
      };

    default:
      return state;
  }
};

const BudgetContext = createContext<{
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
  // Persistence functions
  saveToFile: () => Promise<boolean>;
  loadFromFile: () => Promise<boolean>;
  createNewFile: () => Promise<boolean>;
  saveToCache: () => void;
  loadFromCache: () => boolean;
  clearAllData: () => void;
  // Utility functions
  hasUnsavedChanges: () => boolean;
  getTimeSinceLastSave: () => string | null;
  getCacheStats: () => any;
  // NEW: Planning feature functions (only available when feature enabled)
  setPlanningMode: (enabled: boolean) => void;
  setPlanningData: (year: number, data: PlanningData) => void;
  updatePlanningData: (year: number, data: Partial<PlanningData>) => void;
  deletePlanningData: (year: number) => void;
  setSelectedScenario: (scenarioId: string) => void;
  setHistoricalAnalysis: (year: number, analysis: HistoricalAnalysis) => void;
  // Planning utility functions
  isPlanningEnabled: () => boolean;
  getCurrentPlanningData: () => PlanningData | undefined;
  getActiveScenario: () => any | undefined;
} | null>(null);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  const persistenceManager = PersistenceManager.getInstance();

  // Initialize persistence manager and load cached data on startup
  useEffect(() => {
    persistenceManager.initialize();

    // Always try to load cached data on startup, regardless of first-time user status
    const cachedData = persistenceManager.getCachedData();
    if (cachedData) {
      console.log("Found cached data, loading...", cachedData);
      dispatch({ type: "LOAD_FROM_CACHE", payload: cachedData });
      console.log("Loaded data from cache on startup");
    } else {
      console.log("No cached data found");
    }

    return () => {
      persistenceManager.cleanup();
    };
  }, []); // REMOVED: Save current state to cache after loading (was causing data loss)
  // useEffect(() => {
  //   // Small delay to ensure state is fully updated after cache load
  //   const timeoutId = setTimeout(() => {
  //     console.log('Initial state save to cache after load');
  //     persistenceManager.saveToCache(state);
  //   }, 100);

  //   return () => clearTimeout(timeoutId);
  // }, [state.entries.length]); // Only trigger when entries count changes
  // REMOVED: Force cache save when first-time user status changes (was causing data loss)
  // useEffect(() => {
  //   if (!state.persistence.isFirstTimeUser) {
  //     console.log('User is no longer first-time, saving state to cache');
  //     persistenceManager.saveToCache(state);
  //     // Also mark user as returning in persistence manager
  //     persistenceManager.markUserAsReturning();
  //   }
  // }, [state.persistence.isFirstTimeUser]);
  // DISABLED: Set up auto-save to cache after state is loaded (causing issues)
  // useEffect(() => {
  //   const autoSaveToCache = () => {
  //     persistenceManager.saveToCache(state);
  //     dispatch({ type: "UPDATE_CACHE_TIMESTAMP" });
  //   };

  //   persistenceManager.startAutoSave(autoSaveToCache, state.persistence.cacheAutoSaveInterval);

  //   return () => {
  //     persistenceManager.stopAutoSave();
  //   };
  // }, [state.persistence.cacheAutoSaveInterval]);  // Auto-save to cache whenever important data changes (immediate)
  useEffect(() => {
    // Skip on very first render with empty state
    if (state === initialState) {
      console.log("Skipping cache save - still on initial state");
      return;
    }

    console.log("Data changed, immediately saving to cache:", {
      entriesCount: state.entries.length,
      yearlyTargetsCount: Object.keys(state.yearlyBudgetTargets).length,
      monthlyModesCount: Object.keys(state.monthlyForecastModes).length,
      currentFile: state.currentFile?.name,
      hasUnsavedChanges: state.persistence.hasUnsavedChanges,
      stackTrace: new Error().stack?.split("\n").slice(0, 5).join("\n"),
    });

    // Don't save empty data to cache
    if (
      state.entries.length === 0 &&
      Object.keys(state.yearlyBudgetTargets).length === 0 &&
      Object.keys(state.monthlyForecastModes).length === 0
    ) {
      console.warn("PREVENTED saving empty data to cache!");
      return;
    }

    persistenceManager.saveToCache(state);

    // Only mark as unsaved if this is not triggered by loading from cache
    // Check if hasUnsavedChanges is already true (meaning actual changes occurred)
    if (state.persistence.hasUnsavedChanges) {
      persistenceManager.markDataChanged();
    }

    dispatch({ type: "UPDATE_CACHE_TIMESTAMP" });
  }, [state.entries, state.yearlyBudgetTargets, state.monthlyForecastModes]);

  // Persistence functions
  const saveToFile = async (): Promise<boolean> => {
    try {
      const fileManager = await import("../utils/fileManager");

      // Use smartAutoSave with enhanced handle validation
      const result = await fileManager.smartAutoSave(
        {
          entries: state.entries,
          selectedYear: state.selectedYear,
          yearlyBudgetTargets: state.yearlyBudgetTargets,
          monthlyForecastModes: state.monthlyForecastModes,
        },
        state.currentFile
      );

      if (result.saved) {
        // Check if we got a new file handle from reconnection
        if (result.newFileHandle) {
          console.log("🔄 Updating context with reconnected file handle");

          // Update the file handle in the context
          dispatch({
            type: "SET_CURRENT_FILE",
            payload: {
              name: result.newFileHandle.name,
              handle: result.newFileHandle,
              lastSaved: new Date(),
              // Clear userLastSaved when reconnecting
              userLastSaved: new Date(),
            },
          });

          // Update persistence manager
          persistenceManager.saveFileInfo({
            name: result.newFileHandle.name,
            handle: result.newFileHandle,
            lastSaved: new Date(),
          });
        } else if (result.fileHandle) {
          // Normal save with existing or new file handle
          dispatch({
            type: "SET_CURRENT_FILE",
            payload: {
              name: result.fileName || state.currentFile?.name || "budget.json",
              handle: result.fileHandle,
              lastSaved: new Date(),
              // Preserve existing userLastSaved when auto-saving from context
              userLastSaved: state.currentFile?.userLastSaved,
            },
          });

          // Save file info to persistence manager
          persistenceManager.saveFileInfo({
            name: result.fileName || "budget.json",
            handle: result.fileHandle,
            lastSaved: new Date(),
          });
        }

        dispatch({ type: "MARK_SAVED_TO_FILE" });
        persistenceManager.markAsSavedToFile();

        // Show success message if provided
        if (result.message) {
          console.log("📢 Save result message:", result.message);
        }

        return true;
      } else {
        console.log("❌ Save failed or was cancelled:", result);
        return false;
      }
    } catch (error) {
      console.error("❌ Save to file failed:", error);
      return false;
    }
  };

  const loadFromFile = async (): Promise<boolean> => {
    try {
      const fileManager = await import("../utils/fileManager");

      if (fileManager.supportsFileSystemAccess()) {
        const fileHandles = await window.showOpenFilePicker?.({
          types: [
            {
              description: "JSON files",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });

        if (!fileHandles || fileHandles.length === 0) {
          return false;
        }

        const selectedFileHandle = fileHandles[0];
        const file = await selectedFileHandle.getFile?.();

        if (!file) {
          throw new Error("Could not read file");
        }

        const content = await file.text();
        const loadedData = JSON.parse(content);

        // Validate and convert dates
        if (
          !loadedData.version ||
          !loadedData.entries ||
          !Array.isArray(loadedData.entries)
        ) {
          throw new Error("Invalid file format");
        }

        loadedData.entries = loadedData.entries.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        }));

        // Load data into state
        dispatch({ type: "LOAD_ENTRIES", payload: loadedData.entries });

        // Load yearly budget targets
        if (loadedData.yearlyBudgetTargets) {
          Object.entries(loadedData.yearlyBudgetTargets).forEach(
            ([year, amount]) => {
              dispatch({
                type: "SET_YEARLY_BUDGET_TARGET",
                payload: { year: parseInt(year), amount: amount as number },
              });
            }
          );
        }

        // Load monthly forecast modes
        if (loadedData.monthlyForecastModes) {
          Object.entries(loadedData.monthlyForecastModes).forEach(
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

        // Update selected year
        dispatch({
          type: "SET_SELECTED_PERIOD",
          payload: { year: loadedData.year as number },
        }); // Set current file
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            name: file.name,
            handle: selectedFileHandle,
            lastSaved: new Date(),
            // Clear userLastSaved when loading a new file
            userLastSaved: undefined,
          },
        });

        // Save file info to persistence manager
        persistenceManager.saveFileInfo({
          name: file.name,
          handle: selectedFileHandle,
          lastSaved: new Date(),
          size: file.size,
          lastModified: new Date(file.lastModified),
        });

        // Mark as no longer first-time user
        persistenceManager.markUserAsReturning();
        dispatch({ type: "SET_FIRST_TIME_USER", payload: false });

        // Save to cache
        persistenceManager.saveToCache(state);
        dispatch({ type: "MARK_SAVED_TO_FILE" });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to load file:", error);
      return false;
    }
  };

  const createNewFile = async (): Promise<boolean> => {
    try {
      const fileManager = await import("../utils/fileManager");

      if (fileManager.supportsFileSystemAccess()) {
        const fileHandle = await window.showSaveFilePicker?.({
          types: [
            {
              description: "JSON files",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
          suggestedName: `budget-${state.selectedYear}.json`,
        });

        if (!fileHandle) {
          return false;
        } // Set current file
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            name: fileHandle.name,
            handle: fileHandle,
            lastSaved: new Date(),
            // Clear userLastSaved when creating a new file
            userLastSaved: undefined,
          },
        }); // Save file info to persistence manager
        persistenceManager.saveFileInfo({
          name: fileHandle.name,
          handle: fileHandle,
          lastSaved: new Date(),
        });

        // Mark as no longer first-time user
        persistenceManager.markUserAsReturning();
        dispatch({ type: "SET_FIRST_TIME_USER", payload: false });

        // Save initial empty state directly to the new file handle
        const initialData = {
          version: "1.0.0",
          exportDate: new Date().toISOString(),
          year: state.selectedYear,
          entries: [],
          yearlyBudgetTargets: state.yearlyBudgetTargets || {},
          monthlyForecastModes: state.monthlyForecastModes || {},
          metadata: {
            totalEntries: 0,
            dateRange: { earliest: "", latest: "" },
            categories: [],
          },
        };

        // Write initial data to the file
        const writable = await (fileHandle as any).createWritable();
        await writable.write(JSON.stringify(initialData, null, 2));
        await writable.close();

        // Mark as saved
        dispatch({ type: "MARK_SAVED_TO_FILE" });
        persistenceManager.markAsSavedToFile();

        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to create new file:", error);
      return false;
    }
  };
  const saveToCache = (): void => {
    console.log("Manual save to cache called with state:", {
      entriesCount: state.entries.length,
      hasUnsavedChanges: state.persistence.hasUnsavedChanges,
    });
    persistenceManager.saveToCache(state);
    dispatch({ type: "UPDATE_CACHE_TIMESTAMP" });
  };

  const loadFromCache = (): boolean => {
    const cachedData = persistenceManager.getCachedData();
    if (cachedData) {
      dispatch({ type: "LOAD_FROM_CACHE", payload: cachedData });
      return true;
    }
    return false;
  };

  const clearAllData = (): void => {
    persistenceManager.clearCache();
    persistenceManager.clearFileInfo();
    dispatch({ type: "CLEAR_ALL_DATA" });
  };

  const hasUnsavedChanges = (): boolean => {
    return state.persistence.hasUnsavedChanges;
  };

  const getTimeSinceLastSave = (): string | null => {
    return persistenceManager.getTimeSinceLastFileSave();
  };
  const getCacheStats = () => {
    return persistenceManager.getCacheStats();
  };

  // NEW: Planning feature functions (only available when feature enabled)
  const setPlanningMode = (enabled: boolean) => {
    dispatch({ type: "SET_PLANNING_MODE", payload: enabled });
  };

  const setPlanningData = (year: number, data: PlanningData) => {
    dispatch({ type: "SET_PLANNING_DATA", payload: { year, data } });
  };

  const updatePlanningData = (year: number, data: Partial<PlanningData>) => {
    dispatch({ type: "UPDATE_PLANNING_DATA", payload: { year, data } });
  };

  const deletePlanningData = (year: number) => {
    dispatch({ type: "DELETE_PLANNING_DATA", payload: year });
  };

  const setSelectedScenario = (scenarioId: string) => {
    dispatch({ type: "SET_SELECTED_SCENARIO", payload: scenarioId });
  };

  const setHistoricalAnalysis = (
    year: number,
    analysis: HistoricalAnalysis
  ) => {
    dispatch({ type: "SET_HISTORICAL_ANALYSIS", payload: { year, analysis } });
  };
  const isPlanningEnabled = (): boolean => {
    return isFeatureEnabled("BUDGET_PLANNING");
  };

  const getCurrentPlanningData = (): PlanningData | undefined => {
    return state.planningData?.[state.selectedYear];
  };

  const getActiveScenario = () => {
    const currentPlanningData = getCurrentPlanningData();
    if (!currentPlanningData || !state.selectedScenario) {
      return undefined;
    }
    return currentPlanningData.scenarios.find(
      (s) => s.id === state.selectedScenario
    );
  };

  // Skip first-time setup (for demo/testing purposes)
  const skipFirstTimeSetup = () => {
    persistenceManager.markUserAsReturning();
    dispatch({ type: "SET_FIRST_TIME_USER", payload: false });
  };
  return (
    <BudgetContext.Provider
      value={{
        state,
        dispatch,
        saveToFile,
        loadFromFile,
        createNewFile,
        saveToCache,
        loadFromCache,
        clearAllData,
        hasUnsavedChanges,
        getTimeSinceLastSave,
        getCacheStats,
        // Planning feature functions
        setPlanningMode,
        setPlanningData,
        updatePlanningData,
        deletePlanningData,
        setSelectedScenario,
        setHistoricalAnalysis,
        isPlanningEnabled,
        getCurrentPlanningData,
        getActiveScenario,
      }}
    >
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
