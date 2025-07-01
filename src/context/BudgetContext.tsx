import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  BudgetState,
  PlanningData,
  HistoricalAnalysis,
} from "../types";
import { PersistenceManager } from "../services/persistenceManager";
import { isFeatureEnabled } from "../utils/featureFlags";
import { 
  combinedReducer, 
  CombinedAction, 
  CombinedState, 
  getInitialCombinedState 
} from "./reducers/combinedReducer";
import { useDebouncedAutoSave } from "../hooks/useDebouncedAutoSave";

const initialState: CombinedState = getInitialCombinedState();


const BudgetContext = createContext<{
  state: CombinedState;
  dispatch: React.Dispatch<CombinedAction>;
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
  const [state, dispatch] = useReducer(combinedReducer, initialState);
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
  // }, [state.persistence.cacheAutoSaveInterval]);  // Debounced auto-save to cache to prevent excessive writes
  const debouncedCacheSave = useCallback((stateToSave: CombinedState) => {
    console.log("Executing debounced cache save:", {
      entriesCount: stateToSave.entries.length,
      vendorDataCount: (stateToSave.vendorData || []).length,
      yearlyTargetsCount: Object.keys(stateToSave.yearlyBudgetTargets).length,
      monthlyModesCount: Object.keys(stateToSave.monthlyForecastModes).length,
      currentFile: stateToSave.currentFile?.name,
      hasUnsavedChanges: stateToSave.persistence.hasUnsavedChanges,
    });

    persistenceManager.saveToCache(stateToSave);

    // Only mark as unsaved if this is not triggered by loading from cache
    if (stateToSave.persistence.hasUnsavedChanges) {
      persistenceManager.markDataChanged();
    }
    dispatch({ type: "UPDATE_CACHE_TIMESTAMP" });
  }, [persistenceManager]);

  const shouldSkipCacheSave = useCallback((stateToCheck: CombinedState) => {
    // Skip if it's the initial state
    if (stateToCheck === initialState) {
      console.log("Skipping cache save - still on initial state");
      return true;
    }

    // Don't save empty data to cache
    if (
      stateToCheck.entries.length === 0 &&
      (stateToCheck.vendorData || []).length === 0 &&
      Object.keys(stateToCheck.yearlyBudgetTargets).length === 0 &&
      Object.keys(stateToCheck.monthlyForecastModes).length === 0
    ) {
      console.warn("PREVENTED saving empty data to cache!");
      return true;
    }

    return false;
  }, []);

  // Use debounced auto-save with 2 second delay
  const { forceSave: forceCacheSave } = useDebouncedAutoSave(
    state,
    debouncedCacheSave,
    2000, // 2 second delay
    shouldSkipCacheSave
  );

  // Persistence functions
  const saveToFile = async (): Promise<boolean> => {
    try {
      const fileManager = await import("../utils/fileManager"); // Use smartAutoSave with enhanced handle validation
      const result = await fileManager.smartAutoSave(
        {
          entries: state.entries,
          selectedYear: state.selectedYear,
          yearlyBudgetTargets: state.yearlyBudgetTargets,
          monthlyForecastModes: state.monthlyForecastModes,
          vendorData: state.vendorData,
          vendorTrackingData: state.vendorTrackingData,
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
    console.log("🔄 BudgetContext: loadFromFile called");
    try {
      const fileManager = await import("../utils/fileManager");
      console.log("📦 File manager imported");

      console.log("🔍 Checking File System Access API support:");
      console.log("- showSaveFilePicker available:", "showSaveFilePicker" in window);
      console.log("- showOpenFilePicker available:", "showOpenFilePicker" in window);
      console.log("- supportsFileSystemAccess():", fileManager.supportsFileSystemAccess());
      
      if (fileManager.supportsFileSystemAccess()) {
        console.log("✅ File System Access API supported, opening file picker");
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

        console.log("📁 File picker result:", fileHandles);
        if (!fileHandles || fileHandles.length === 0) {
          console.log("❌ No files selected or picker cancelled");
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

        // Load vendor data
        if (loadedData.vendorData) {
          const vendorDataWithDates = loadedData.vendorData.map(
            (vendor: any) => {
              // Transform legacy data structure to current structure
              const transformedVendor = {
                id: vendor.id,
                vendorName: vendor.vendorName || "",
                category: vendor.category || "",
                financeMappedCategory:
                  vendor.financeMappedCategory || vendor.mapsTo || "",
                billingType: vendor.billingType || "",
                budget: vendor.budget || 0,
                description: vendor.description || "",
                month: vendor.month || "N/A",
                inBudget:
                  vendor.inBudget !== undefined
                    ? vendor.inBudget
                    : !vendor.notInBudget,
                notes: vendor.notes || "",
                year: vendor.year,
                createdAt: new Date(vendor.createdAt),
                updatedAt: new Date(vendor.updatedAt),
              };
              return transformedVendor;
            }
          );
          dispatch({
            type: "LOAD_VENDOR_DATA",
            payload: vendorDataWithDates,
          });
        }

        // Load vendor tracking data
        if (loadedData.vendorTrackingData) {
          const vendorTrackingWithDates = loadedData.vendorTrackingData.map(
            (tracking: any) => ({
              ...tracking,
              createdAt: new Date(tracking.createdAt),
              updatedAt: new Date(tracking.updatedAt),
            })
          );
          dispatch({
            type: "LOAD_VENDOR_TRACKING",
            payload: vendorTrackingWithDates,
          });
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

        // Save to cache with updated state (including new file info)
        // Note: We need to create the updated state since dispatch is async
        const updatedState = {
          ...state,
          currentFile: {
            name: file.name,
            handle: selectedFileHandle,
            lastSaved: new Date(),
            userLastSaved: undefined,
          },
          persistence: {
            ...state.persistence,
            isFirstTimeUser: false,
          },
          entries: loadedData.entries,
          selectedYear: loadedData.year as number,
          yearlyBudgetTargets: {
            ...state.yearlyBudgetTargets,
            ...loadedData.yearlyBudgetTargets,
          },
          monthlyForecastModes: {
            ...state.monthlyForecastModes,
            ...loadedData.monthlyForecastModes,
          },
          vendorData: loadedData.vendorData ? loadedData.vendorData.map(
            (vendor: any) => ({
              id: vendor.id,
              vendorName: vendor.vendorName || "",
              category: vendor.category || "",
              financeMappedCategory:
                vendor.financeMappedCategory || vendor.mapsTo || "",
              billingType: vendor.billingType || "",
              budget: vendor.budget || 0,
              description: vendor.description || "",
              month: vendor.month || "N/A",
              inBudget:
                vendor.inBudget !== undefined
                  ? vendor.inBudget
                  : !vendor.notInBudget,
              notes: vendor.notes || "",
              year: vendor.year,
              createdAt: new Date(vendor.createdAt),
              updatedAt: new Date(vendor.updatedAt),
            })
          ) : state.vendorData,
          vendorTrackingData: loadedData.vendorTrackingData ? loadedData.vendorTrackingData.map(
            (tracking: any) => ({
              ...tracking,
              createdAt: new Date(tracking.createdAt),
              updatedAt: new Date(tracking.updatedAt),
            })
          ) : state.vendorTrackingData,
        };
        
        persistenceManager.saveToCache(updatedState);
        dispatch({ type: "MARK_SAVED_TO_FILE" });

        return true;
      } else {
        console.log("❌ File System Access API not supported, trying fallback");
        // Fallback to traditional file input
        const fileManager = await import("../utils/fileManager");
        const loadedData = await fileManager.loadBudgetData();
        
        // Process the loaded data similar to the File System Access API path
        dispatch({ type: "LOAD_ENTRIES", payload: loadedData.entries });
        
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
        
        if (loadedData.vendorData) {
          const vendorDataWithDates = loadedData.vendorData.map(
            (vendor: any) => ({
              id: vendor.id,
              vendorName: vendor.vendorName || "",
              category: vendor.category || "",
              financeMappedCategory:
                vendor.financeMappedCategory || vendor.mapsTo || "",
              billingType: vendor.billingType || "",
              budget: vendor.budget || 0,
              description: vendor.description || "",
              month: vendor.month || "N/A",
              inBudget:
                vendor.inBudget !== undefined
                  ? vendor.inBudget
                  : !vendor.notInBudget,
              notes: vendor.notes || "",
              year: vendor.year,
              createdAt: new Date(vendor.createdAt),
              updatedAt: new Date(vendor.updatedAt),
            })
          );
          dispatch({
            type: "LOAD_VENDOR_DATA",
            payload: vendorDataWithDates,
          });
        }
        
        if (loadedData.vendorTrackingData) {
          const vendorTrackingWithDates = loadedData.vendorTrackingData.map(
            (tracking: any) => ({
              ...tracking,
              createdAt: new Date(tracking.createdAt),
              updatedAt: new Date(tracking.updatedAt),
            })
          );
          dispatch({
            type: "LOAD_VENDOR_TRACKING",
            payload: vendorTrackingWithDates,
          });
        }
        
        dispatch({
          type: "SET_SELECTED_PERIOD",
          payload: { year: loadedData.year as number },
        });
        
        // For fallback, we don't have a file handle
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            name: "loaded-file.json",
            lastSaved: new Date(),
            userLastSaved: undefined,
          },
        });
        
        persistenceManager.markUserAsReturning();
        dispatch({ type: "SET_FIRST_TIME_USER", payload: false });
        
        const updatedState = {
          ...state,
          currentFile: {
            name: "loaded-file.json",
            lastSaved: new Date(),
            userLastSaved: undefined,
          },
          persistence: {
            ...state.persistence,
            isFirstTimeUser: false,
          },
          entries: loadedData.entries,
          selectedYear: loadedData.year as number,
          yearlyBudgetTargets: {
            ...state.yearlyBudgetTargets,
            ...loadedData.yearlyBudgetTargets,
          },
          monthlyForecastModes: {
            ...state.monthlyForecastModes,
            ...loadedData.monthlyForecastModes,
          },
          vendorData: loadedData.vendorData || state.vendorData,
          vendorTrackingData: loadedData.vendorTrackingData || state.vendorTrackingData,
        };
        
        persistenceManager.saveToCache(updatedState);
        dispatch({ type: "MARK_SAVED_TO_FILE" });
        
        return true;
      }
    } catch (error) {
      console.error("❌ Failed to load file:", error);
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
        dispatch({ type: "SET_FIRST_TIME_USER", payload: false }); // Save initial empty state directly to the new file handle
        const initialData = {
          version: "1.0.0",
          exportDate: new Date().toISOString(),
          year: state.selectedYear,
          entries: [],
          yearlyBudgetTargets: state.yearlyBudgetTargets || {},
          monthlyForecastModes: state.monthlyForecastModes || {},
          vendorData: state.vendorData || [],
          vendorTrackingData: state.vendorTrackingData || [],
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
    // Use force save for manual saves (immediate)
    forceCacheSave();
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
