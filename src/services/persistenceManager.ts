import {
  BudgetState,
  BudgetEntry,
  VendorData,
  VendorTracking,
  CategoryAllocation,
  TeamData,
  FunctionalAllocation,
} from "../types";

// Cache keys
const CACHE_KEY = "budget-tracker-data";
const FILE_INFO_KEY = "budget-tracker-file-info";
const PERSISTENCE_STATE_KEY = "budget-tracker-persistence";

// Auto-save interval (5 minutes)
const DEFAULT_CACHE_AUTOSAVE_INTERVAL = 5 * 60 * 1000;

export interface PersistenceState {
  hasUnsavedChanges: boolean;
  lastCacheUpdate: Date | null;
  lastFileSave: Date | null;
  isFirstTimeUser: boolean;
  cacheAutoSaveInterval: number;
}

export interface FileInfo {
  name: string;
  handle?: FileSystemFileHandle;
  lastSaved?: Date;
  size?: number;
  lastModified?: Date;
  contentHash?: string;
}

export interface CachedBudgetData {
  entries: BudgetEntry[];
  allocations: CategoryAllocation[];
  vendorData: VendorData[];
  vendorTrackingData: VendorTracking[];
  teams: TeamData[];
  functionalAllocations: FunctionalAllocation[];
  selectedYear: number;
  yearlyBudgetTargets: { [year: number]: number };
  monthlyForecastModes: { [year: number]: { [month: number]: boolean } };
  lastUpdated: string;
  version: string;
}

export class PersistenceManager {
  private static instance: PersistenceManager;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private beforeUnloadListener: ((event: BeforeUnloadEvent) => void) | null =
    null;

  public static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  /**
   * Initialize persistence manager
   */
  public initialize(): void {
    this.setupBeforeUnloadListener();
  }

  /**
   * Check if this is a first-time user
   */
  public isFirstTimeUser(): boolean {
    const cachedData = this.getCachedData();
    const fileInfo = this.getFileInfo();
    const persistenceState = this.getPersistenceState();

    return (
      !cachedData && !fileInfo && persistenceState?.isFirstTimeUser !== false
    );
  }

  /**
   * Mark user as no longer first-time
   */
  public markUserAsReturning(): void {
    const state =
      this.getPersistenceState() || this.createDefaultPersistenceState();
    state.isFirstTimeUser = false;
    this.savePersistenceState(state);
  }
  /**
   * Save data to cache
   */
  public saveToCache(
    budgetState: BudgetState & {
      teams?: TeamData[];
      functionalAllocations?: FunctionalAllocation[];
    }
  ): void {
    try {
      const cacheData: CachedBudgetData = {
        entries: budgetState.entries,
        allocations: budgetState.allocations || [],
        vendorData: budgetState.vendorData || [],
        vendorTrackingData: budgetState.vendorTrackingData || [],
        teams: budgetState.teams || [],
        functionalAllocations: budgetState.functionalAllocations || [],
        selectedYear: budgetState.selectedYear,
        yearlyBudgetTargets: budgetState.yearlyBudgetTargets,
        monthlyForecastModes: budgetState.monthlyForecastModes,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      }; // Debug logging to track empty data saves
      // console.log("PersistenceManager.saveToCache called with:", {
      //   entriesCount: cacheData.entries.length,
      //   allocationsCount: cacheData.allocations.length,
      //   vendorDataCount: cacheData.vendorData.length,
      //   vendorTrackingDataCount: cacheData.vendorTrackingData.length,
      //   yearlyTargetsCount: Object.keys(cacheData.yearlyBudgetTargets).length,
      //   monthlyModesCount: Object.keys(cacheData.monthlyForecastModes).length,
      //   timestamp: cacheData.lastUpdated,
      // });

      if (
        cacheData.entries.length === 0 &&
        cacheData.allocations.length === 0 &&
        cacheData.vendorData.length === 0 &&
        cacheData.vendorTrackingData.length === 0 &&
        cacheData.teams.length === 0 &&
        cacheData.functionalAllocations.length === 0 &&
        Object.keys(cacheData.yearlyBudgetTargets).length === 0 &&
        Object.keys(cacheData.monthlyForecastModes).length === 0
      ) {
        // console.warn(
        //   "WARNING: Saving empty data to cache! Stack trace:",
        //   new Error().stack
        // );
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData)); // Update persistence state - but preserve the current hasUnsavedChanges value
      // since saveToCache is called for both data changes and periodic saves
      const persistenceState =
        this.getPersistenceState() || this.createDefaultPersistenceState();
      persistenceState.lastCacheUpdate = new Date();
      // Don't automatically set hasUnsavedChanges = true here
      // This should only be set when actual data changes occur
      this.savePersistenceState(persistenceState);

      // console.log(
      //   "Data saved to cache at",
      //   new Date().toLocaleTimeString(),
      //   "with",
      //   cacheData.entries.length,
      //   "entries"
      // );
    } catch (error) {
      console.error("Failed to save data to cache:", error);
    }
  }

  /**
   * Load data from cache
   */
  public getCachedData(): CachedBudgetData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Convert date strings back to Date objects for entries
        if (data.entries) {
          data.entries = data.entries.map((entry: any) => ({
            ...entry,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          }));
        }
        // Convert date strings back to Date objects for allocations
        if (data.allocations) {
          data.allocations = data.allocations.map((allocation: any) => ({
            ...allocation,
            createdAt: new Date(allocation.createdAt),
            updatedAt: new Date(allocation.updatedAt),
          }));
        }
        // Convert date strings back to Date objects for vendor data
        if (data.vendorData) {
          data.vendorData = data.vendorData.map((vendor: any) => ({
            ...vendor,
            createdAt: new Date(vendor.createdAt),
            updatedAt: new Date(vendor.updatedAt),
          }));
        }
        // Convert date strings back to Date objects for vendor tracking data
        if (data.vendorTrackingData) {
          data.vendorTrackingData = data.vendorTrackingData.map(
            (tracking: any) => ({
              ...tracking,
              createdAt: new Date(tracking.createdAt),
              updatedAt: new Date(tracking.updatedAt),
            })
          );
        }
        // Convert date strings back to Date objects for team data
        if (data.teams) {
          data.teams = data.teams.map((team: any) => ({
            ...team,
            createdAt: new Date(team.createdAt),
            updatedAt: new Date(team.updatedAt),
          }));
        }
        // Convert date strings back to Date objects for functional allocations
        if (data.functionalAllocations) {
          data.functionalAllocations = data.functionalAllocations.map(
            (allocation: any) => ({
              ...allocation,
              createdAt: new Date(allocation.createdAt),
              updatedAt: new Date(allocation.updatedAt),
            })
          );
        }
        return data;
      }
    } catch (error) {
      console.error("Failed to load cached data:", error);
    }
    return null;
  }

  /**
   * Clear cache data
   */
  public clearCache(): void {
    try {
      // Clear all budget tracker related cache
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(PERSISTENCE_STATE_KEY);
      localStorage.removeItem(FILE_INFO_KEY);

      // Also clear the file info key used by combinedReducer
      localStorage.removeItem("budget-tracker-file-info");

      console.log("✅ All cache data cleared successfully");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      throw error;
    }
  }

  /**
   * Save file info to local storage
   */
  public saveFileInfo(fileInfo: FileInfo): void {
    try {
      const serializableInfo = {
        name: fileInfo.name,
        lastSaved: fileInfo.lastSaved?.toISOString(),
        size: fileInfo.size,
        lastModified: fileInfo.lastModified?.toISOString(),
        contentHash: fileInfo.contentHash,
        // Note: FileSystemFileHandle cannot be serialized
      };
      localStorage.setItem(FILE_INFO_KEY, JSON.stringify(serializableInfo));
    } catch (error) {
      console.error("Failed to save file info:", error);
    }
  }

  /**
   * Get file info from local storage
   */
  public getFileInfo(): FileInfo | null {
    try {
      const stored = localStorage.getItem(FILE_INFO_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          name: parsed.name,
          lastSaved: parsed.lastSaved ? new Date(parsed.lastSaved) : undefined,
          size: parsed.size,
          lastModified: parsed.lastModified
            ? new Date(parsed.lastModified)
            : undefined,
          contentHash: parsed.contentHash,
          // handle will need to be re-established by user interaction
        };
      }
    } catch (error) {
      console.error("Failed to load file info:", error);
    }
    return null;
  }

  /**
   * Clear file info
   */
  public clearFileInfo(): void {
    try {
      localStorage.removeItem(FILE_INFO_KEY);
    } catch (error) {
      console.error("Failed to clear file info:", error);
    }
  }

  /**
   * Get persistence state
   */
  public getPersistenceState(): PersistenceState | null {
    try {
      const stored = localStorage.getItem(PERSISTENCE_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          lastCacheUpdate: parsed.lastCacheUpdate
            ? new Date(parsed.lastCacheUpdate)
            : null,
          lastFileSave: parsed.lastFileSave
            ? new Date(parsed.lastFileSave)
            : null,
        };
      }
    } catch (error) {
      console.error("Failed to load persistence state:", error);
    }
    return null;
  }

  /**
   * Save persistence state
   */
  public savePersistenceState(state: PersistenceState): void {
    try {
      const serializableState = {
        ...state,
        lastCacheUpdate: state.lastCacheUpdate?.toISOString(),
        lastFileSave: state.lastFileSave?.toISOString(),
      };
      localStorage.setItem(
        PERSISTENCE_STATE_KEY,
        JSON.stringify(serializableState)
      );
    } catch (error) {
      console.error("Failed to save persistence state:", error);
    }
  }

  /**
   * Create default persistence state
   */
  private createDefaultPersistenceState(): PersistenceState {
    return {
      hasUnsavedChanges: false,
      lastCacheUpdate: null,
      lastFileSave: null,
      isFirstTimeUser: true,
      cacheAutoSaveInterval: DEFAULT_CACHE_AUTOSAVE_INTERVAL,
    };
  }

  /**
   * Mark changes as saved to file
   */
  public markAsSavedToFile(): void {
    const state =
      this.getPersistenceState() || this.createDefaultPersistenceState();
    state.hasUnsavedChanges = false;
    state.lastFileSave = new Date();
    this.savePersistenceState(state);
  }

  /**
   * Check if there are unsaved changes
   */
  public hasUnsavedChanges(): boolean {
    const state = this.getPersistenceState();
    return state?.hasUnsavedChanges || false;
  }

  /**
   * Start auto-save timer for cache
   */
  public startAutoSave(callback: () => void, interval?: number): void {
    this.stopAutoSave(); // Clear any existing timer

    const saveInterval = interval || DEFAULT_CACHE_AUTOSAVE_INTERVAL;
    this.autoSaveTimer = setInterval(() => {
      callback();
      // console.log("Auto-save to cache triggered");
    }, saveInterval);

    // console.log(
    //   `Auto-save started with ${saveInterval / 1000} second interval`
    // );
  }

  /**
   * Stop auto-save timer
   */
  public stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      // console.log("Auto-save stopped");
    }
  }

  /**
   * Setup beforeunload listener for unsaved changes warning
   */
  private setupBeforeUnloadListener(): void {
    this.beforeUnloadListener = (event: BeforeUnloadEvent) => {
      if (this.hasUnsavedChanges()) {
        const message =
          "You have unsaved changes. Are you sure you want to leave?";
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", this.beforeUnloadListener);
  }

  /**
   * Remove beforeunload listener
   */
  public cleanup(): void {
    this.stopAutoSave();
    if (this.beforeUnloadListener) {
      window.removeEventListener("beforeunload", this.beforeUnloadListener);
      this.beforeUnloadListener = null;
    }
  }

  /**
   * Get time since last file save
   */
  public getTimeSinceLastFileSave(): string | null {
    const state = this.getPersistenceState();
    if (!state?.lastFileSave) return null;

    const now = new Date();
    const diff = now.getTime() - state.lastFileSave.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Less than a minute ago";
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    hasData: boolean;
    entryCount: number;
    lastUpdated: Date | null;
    sizeMB: number;
  } {
    const cachedData = this.getCachedData();
    const cacheSize = localStorage.getItem(CACHE_KEY)?.length || 0;

    return {
      hasData: !!cachedData,
      entryCount: cachedData?.entries?.length || 0,
      lastUpdated: cachedData?.lastUpdated
        ? new Date(cachedData.lastUpdated)
        : null,
      sizeMB: Math.round(((cacheSize * 2) / 1024 / 1024) * 100) / 100, // approximate size in MB
    };
  }

  /**
   * Mark that data has changed (separate from cache saves)
   */
  public markDataChanged(): void {
    const state =
      this.getPersistenceState() || this.createDefaultPersistenceState();
    state.hasUnsavedChanges = true;
    this.savePersistenceState(state);
  }
}
