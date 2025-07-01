export interface PersistenceState {
  currentFile?: {
    name: string;
    handle?: FileSystemFileHandle;
    lastSaved?: Date;
    userLastSaved?: Date;
  };
  persistence: {
    hasUnsavedChanges: boolean;
    lastCacheUpdate: Date | null;
    lastFileSave: Date | null;
    isFirstTimeUser: boolean;
    cacheAutoSaveInterval: number;
  };
}

export type PersistenceAction =
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
  | { type: "MARK_UNSAVED_CHANGES" }
  | { type: "MARK_SAVED_TO_FILE" }
  | { type: "UPDATE_CACHE_TIMESTAMP" }
  | { type: "SET_FIRST_TIME_USER"; payload: boolean };

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

// Helper function to clear file info from cache
const clearFileInfoFromCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn("Failed to clear file info from cache:", error);
  }
};

export const persistenceReducer = (
  state: PersistenceState,
  action: PersistenceAction
): PersistenceState => {
  switch (action.type) {
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

    case "SET_FIRST_TIME_USER":
      return {
        ...state,
        persistence: {
          ...state.persistence,
          isFirstTimeUser: action.payload,
        },
      };

    default:
      return state;
  }
};