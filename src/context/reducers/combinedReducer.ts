import { budgetReducer, BudgetState, BudgetAction, initialBudgetState } from "./budgetReducer";
import { vendorReducer, VendorState, VendorAction, initialVendorState } from "./vendorReducer";
import { planningReducer, PlanningState, PlanningAction, initialPlanningState } from "./planningReducer";
import { persistenceReducer, PersistenceState, PersistenceAction } from "./persistenceReducer";
import { PersistenceManager } from "../../services/persistenceManager";

// Combined state interface
export interface CombinedState extends BudgetState, VendorState, PlanningState, PersistenceState {}

// Combined action type
export type CombinedAction = 
  | BudgetAction 
  | VendorAction 
  | PlanningAction 
  | PersistenceAction
  | { type: "LOAD_FROM_CACHE"; payload: any };

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
    const cached = localStorage.getItem("budget-tracker-file-info");
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

// Initialize combined state
export const getInitialCombinedState = (): CombinedState => {
  const cachedFileInfo = loadFileInfoFromCache();
  const persistenceManager = PersistenceManager.getInstance();

  return {
    // Budget state
    ...initialBudgetState,
    
    // Vendor state
    ...initialVendorState,
    
    // Planning state
    ...initialPlanningState,
    
    // Persistence state
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
  };
};

// Helper function to determine if action should trigger unsaved changes
const shouldMarkUnsaved = (action: CombinedAction): boolean => {
  const unsavedActions = [
    "ADD_ENTRY",
    "UPDATE_ENTRY", 
    "DELETE_ENTRY",
    "SET_YEARLY_BUDGET_TARGET",
    "SET_MONTHLY_FORECAST_MODE",
    "SET_PLANNING_MODE",
    "SET_PLANNING_DATA",
    "UPDATE_PLANNING_DATA",
    "DELETE_PLANNING_DATA",
    "SET_SELECTED_SCENARIO",
    "SET_HISTORICAL_ANALYSIS",
    "ADD_VENDOR_DATA",
    "UPDATE_VENDOR_DATA",
    "DELETE_VENDOR_DATA",
    "ADD_VENDOR_TRACKING",
    "UPDATE_VENDOR_TRACKING",
    "DELETE_VENDOR_TRACKING",
  ];
  
  return unsavedActions.includes(action.type);
};

// Combined reducer
export const combinedReducer = (
  state: CombinedState,
  action: CombinedAction
): CombinedState => {
  let newState = state;

  // Handle special case: LOAD_FROM_CACHE
  if (action.type === "LOAD_FROM_CACHE") {
    return {
      ...state,
      // Budget data
      entries: action.payload.entries || [],
      allocations: action.payload.allocations || [],
      selectedYear: action.payload.selectedYear || state.selectedYear,
      yearlyBudgetTargets: action.payload.yearlyBudgetTargets || {},
      monthlyForecastModes: action.payload.monthlyForecastModes || {},
      // Vendor data
      vendorData: action.payload.vendorData || [],
      vendorTrackingData: action.payload.vendorTrackingData || [],
      // Persistence state
      persistence: {
        ...state.persistence,
        hasUnsavedChanges: false,
      },
    };
  }

  // Handle special case: CLEAR_ALL_DATA
  if (action.type === "CLEAR_ALL_DATA") {
    // Clear file info from cache when clearing all data
    try {
      localStorage.removeItem("budget-tracker-file-info");
    } catch (error) {
      console.warn("Failed to clear file info from cache:", error);
    }
    
    return {
      ...state,
      // Reset budget state
      entries: [],
      allocations: [],
      selectedQuarter: undefined,
      selectedMonth: undefined,
      yearlyBudgetTargets: {},
      monthlyForecastModes: {},
      // Reset vendor state
      vendorData: [],
      vendorTrackingData: [],
      // Reset file state
      currentFile: undefined,
    };
  }

  // Route actions to appropriate reducers
  const budgetActions = [
    "ADD_ENTRY", "UPDATE_ENTRY", "DELETE_ENTRY", "SET_VIEW_MODE",
    "SET_SELECTED_PERIOD", "ADD_CATEGORY", "LOAD_ENTRIES", "CLEAR_ALL_DATA",
    "SET_YEARLY_BUDGET_TARGET", "SET_MONTHLY_FORECAST_MODE",
    "ADD_ALLOCATION", "UPDATE_ALLOCATION", "DELETE_ALLOCATION"
  ];

  const vendorActions = [
    "ADD_VENDOR_DATA", "UPDATE_VENDOR_DATA", "DELETE_VENDOR_DATA", "LOAD_VENDOR_DATA",
    "ADD_VENDOR_TRACKING", "UPDATE_VENDOR_TRACKING", "DELETE_VENDOR_TRACKING", "LOAD_VENDOR_TRACKING"
  ];

  const planningActions = [
    "SET_PLANNING_MODE", "SET_PLANNING_DATA", "UPDATE_PLANNING_DATA", 
    "DELETE_PLANNING_DATA", "SET_SELECTED_SCENARIO", "SET_HISTORICAL_ANALYSIS"
  ];

  const persistenceActions = [
    "SET_CURRENT_FILE", "MARK_UNSAVED_CHANGES", "MARK_SAVED_TO_FILE",
    "UPDATE_CACHE_TIMESTAMP", "SET_FIRST_TIME_USER"
  ];

  // Apply budget reducer
  if (budgetActions.includes(action.type)) {
    const budgetState = budgetReducer(
      {
        entries: state.entries,
        categories: state.categories,
        allocations: state.allocations,
        viewMode: state.viewMode,
        selectedYear: state.selectedYear,
        selectedQuarter: state.selectedQuarter,
        selectedMonth: state.selectedMonth,
        yearlyBudgetTargets: state.yearlyBudgetTargets,
        monthlyForecastModes: state.monthlyForecastModes,
      },
      action as BudgetAction
    );
    newState = { ...newState, ...budgetState };
  }

  // Apply vendor reducer
  if (vendorActions.includes(action.type)) {
    const vendorState = vendorReducer(
      {
        vendorData: state.vendorData,
        vendorTrackingData: state.vendorTrackingData,
      },
      action as VendorAction
    );
    newState = { ...newState, ...vendorState };
  }

  // Apply planning reducer
  if (planningActions.includes(action.type)) {
    const planningState = planningReducer(
      {
        planningMode: state.planningMode,
        planningData: state.planningData,
        selectedScenario: state.selectedScenario,
        historicalAnalysis: state.historicalAnalysis,
      },
      action as PlanningAction
    );
    newState = { ...newState, ...planningState };
  }

  // Apply persistence reducer
  if (persistenceActions.includes(action.type)) {
    const persistenceState = persistenceReducer(
      {
        currentFile: state.currentFile,
        persistence: state.persistence,
      },
      action as PersistenceAction
    );
    newState = { ...newState, ...persistenceState };
  }

  // Auto-mark unsaved changes for data-modifying actions
  if (shouldMarkUnsaved(action) && action.type !== "MARK_UNSAVED_CHANGES") {
    newState = {
      ...newState,
      persistence: {
        ...newState.persistence,
        hasUnsavedChanges: true,
      },
    };
  }

  return newState;
};