import { BudgetEntry, BudgetState } from "../types";

// Cache key for storing file information
const CACHE_KEY = "budget-tracker-file-info";

// Type extensions for File System Access API compatibility
declare global {
  interface Window {
    showSaveFilePicker?: (options?: any) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: any) => Promise<FileSystemFileHandle[]>;
  }
}

export interface BudgetDataFile {
  version: string;
  exportDate: string;
  year: number;
  entries: BudgetEntry[];
  yearlyBudgetTargets?: { [year: number]: number };
  monthlyForecastModes?: { [year: number]: { [month: number]: boolean } };
  metadata: {
    totalEntries: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
    categories: string[];
  };
}

// Save budget data to JSON file
export const saveBudgetData = (
  state: Omit<
    BudgetState,
    "categories" | "viewMode" | "selectedQuarter" | "selectedMonth"
  >
) => {
  const { entries, selectedYear } = state;

  // Filter entries for the selected year
  const yearEntries = entries.filter(
    (entry: BudgetEntry) => entry.year === selectedYear
  );

  // Create metadata
  const dates = yearEntries.map((entry: BudgetEntry) => entry.createdAt);
  const categorySet = new Set(
    yearEntries.map((entry: BudgetEntry) => entry.categoryId)
  );
  const categories = Array.from(categorySet);

  const dataToSave: BudgetDataFile = {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    year: selectedYear,
    entries: yearEntries,
    yearlyBudgetTargets: state.yearlyBudgetTargets || {},
    monthlyForecastModes: state.monthlyForecastModes || {},
    metadata: {
      totalEntries: yearEntries.length,
      dateRange: {
        earliest:
          dates.length > 0
            ? new Date(
                Math.min(...dates.map((d: Date) => d.getTime()))
              ).toISOString()
            : "",
        latest:
          dates.length > 0
            ? new Date(
                Math.max(...dates.map((d: Date) => d.getTime()))
              ).toISOString()
            : "",
      },
      categories,
    },
  };

  // Create and download file
  const jsonString = JSON.stringify(dataToSave, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-data-${selectedYear}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return dataToSave;
};

// Load budget data from JSON file
export const loadBudgetData = (): Promise<BudgetDataFile> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content) as BudgetDataFile;

          // Validate file structure
          if (!data.version || !data.entries || !Array.isArray(data.entries)) {
            throw new Error("Invalid file format");
          }

          // Convert date strings back to Date objects
          data.entries = data.entries.map((entry) => ({
            ...entry,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          }));

          resolve(data);
        } catch (error) {
          reject(
            new Error("Failed to parse JSON file: " + (error as Error).message)
          );
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    };

    input.oncancel = () => {
      reject(new Error("File selection cancelled"));
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
};

// Merge loaded data with existing data
export const mergeBudgetData = (
  existingEntries: BudgetEntry[],
  loadedData: BudgetDataFile,
  mergeStrategy: "replace" | "append" | "update" = "replace"
): BudgetEntry[] => {
  const loadedEntries = loadedData.entries;

  switch (mergeStrategy) {
    case "replace":
      // Replace all entries for the loaded year
      const otherYearEntries = existingEntries.filter(
        (entry) => entry.year !== loadedData.year
      );
      return [...otherYearEntries, ...loadedEntries];

    case "append":
      // Add loaded entries, keeping existing ones
      return [...existingEntries, ...loadedEntries];

    case "update":
      // Update existing entries, add new ones
      const updatedEntries = [...existingEntries];

      loadedEntries.forEach((loadedEntry) => {
        const existingIndex = updatedEntries.findIndex(
          (entry) => entry.id === loadedEntry.id
        );
        if (existingIndex >= 0) {
          updatedEntries[existingIndex] = loadedEntry;
        } else {
          updatedEntries.push(loadedEntry);
        }
      });

      return updatedEntries;

    default:
      return existingEntries;
  }
};

// NOTE: All localStorage caching removed to fix double display issue
// Data now requires explicit file loading/creation only

// Enhanced file management with File System Access API support
export const supportsFileSystemAccess = (): boolean => {
  return "showSaveFilePicker" in window && "showOpenFilePicker" in window;
};

// Save data to an existing file handle or prompt for new file
export const saveToFileHandle = async (
  state: Omit<
    BudgetState,
    "categories" | "viewMode" | "selectedQuarter" | "selectedMonth"
  >,
  fileHandle?: FileSystemFileHandle
): Promise<{
  saved: boolean;
  fileHandle?: FileSystemFileHandle;
  fileName: string;
  error?: string;
}> => {
  try {
    if (!supportsFileSystemAccess()) {
      // Fallback to download method
      saveBudgetData(state);
      return {
        saved: true,
        fileName: `budget-data-${state.selectedYear}.json`,
      };
    }

    const { entries, selectedYear } = state;
    const yearEntries = entries.filter(
      (entry: BudgetEntry) => entry.year === selectedYear
    );

    const dates = yearEntries.map((entry: BudgetEntry) => entry.createdAt);
    const categorySet = new Set(
      yearEntries.map((entry: BudgetEntry) => entry.categoryId)
    );
    const categories = Array.from(categorySet);
    const dataToSave: BudgetDataFile = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      year: selectedYear,
      entries: yearEntries,
      yearlyBudgetTargets: state.yearlyBudgetTargets || {},
      monthlyForecastModes: state.monthlyForecastModes || {},
      metadata: {
        totalEntries: yearEntries.length,
        dateRange: {
          earliest:
            dates.length > 0
              ? new Date(
                  Math.min(...dates.map((d: Date) => d.getTime()))
                ).toISOString()
              : "",
          latest:
            dates.length > 0
              ? new Date(
                  Math.max(...dates.map((d: Date) => d.getTime()))
                ).toISOString()
              : "",
        },
        categories,
      },
    };

    let targetFileHandle = fileHandle;
    // If no file handle provided, ask user to choose/create file
    if (!targetFileHandle) {
      targetFileHandle = await window.showSaveFilePicker?.({
        suggestedName: `budget-data-${selectedYear}.json`,
        types: [
          {
            description: "JSON files",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });
    }
    if (!targetFileHandle) {
      throw new Error("No file handle available");
    }

    // Write to the file - cast to any to handle TypeScript type limitations
    const writable = await (targetFileHandle as any).createWritable();
    await writable.write(JSON.stringify(dataToSave, null, 2));
    await writable.close();

    return {
      saved: true,
      fileHandle: targetFileHandle,
      fileName: targetFileHandle.name,
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return {
        saved: false,
        fileName: "",
        error: "Save cancelled by user",
      };
    }

    console.error("Failed to save file:", error);
    return {
      saved: false,
      fileName: "",
      error: (error as Error).message,
    };
  }
};

// Enhanced auto-save with file session management (localStorage removed)
export const smartAutoSave = async (
  state: Omit<
    BudgetState,
    "categories" | "viewMode" | "selectedQuarter" | "selectedMonth"
  >,
  currentFile?: {
    name: string;
    handle?: FileSystemFileHandle;
    lastSaved?: Date;
  }
): Promise<{
  saved: boolean;
  method: "file" | "newFile";
  fileHandle?: FileSystemFileHandle;
  fileName?: string;
  userCancelled?: boolean;
}> => {
  // If we have a file handle, save directly to it
  if (currentFile?.handle && supportsFileSystemAccess()) {
    try {
      const result = await saveToFileHandle(state, currentFile.handle);
      if (result.saved) {
        return {
          saved: true,
          method: "file",
          fileHandle: result.fileHandle,
          fileName: result.fileName,
        };
      }
    } catch (error) {
      console.warn("Failed to save to attached file:", error);
      throw error; // Don't fall back to localStorage, require explicit file operations
    }
  }

  // No attached file - prompt to create a file (required, no localStorage fallback)
  const shouldSave = window.confirm(
    "No file attached. Would you like to save your budget data to a file?\n\nClick OK to create a file, or Cancel to abort saving."
  );

  if (shouldSave) {
    try {
      const result = await saveToFileHandle(state);
      if (result.saved) {
        return {
          saved: true,
          method: "newFile",
          fileHandle: result.fileHandle,
          fileName: result.fileName,
        };
      }
    } catch (error) {
      console.error("Failed to create new file:", error);
      throw error;
    }
  }

  // User cancelled - no fallback to localStorage
  return {
    saved: false,
    method: "newFile",
    userCancelled: true,
  };
};

// Function to attempt restoring the last used file from cache
export const attemptRestoreCachedFile = async (): Promise<{
  success: boolean;
  data?: any;
  fileName?: string;
  error?: string;
}> => {
  try {
    // Check if browser supports File System Access API
    if (!supportsFileSystemAccess()) {
      return {
        success: false,
        error:
          "File System Access API not supported - cannot restore cached file",
      };
    }

    // Get cached file info
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return {
        success: false,
        error: "No cached file information found",
      };
    }
    const cachedFileInfo = JSON.parse(cached);
    const { name, lastSaved, size, lastModified, contentHash, timestamp } =
      cachedFileInfo;

    // Show a more detailed confirmation dialog to user before attempting to restore
    const cacheAge = timestamp
      ? Math.round((Date.now() - new Date(timestamp).getTime()) / (1000 * 60))
      : 0;
    const shouldRestore = window.confirm(
      `Would you like to restore your last session?\n\nFile: ${name}${
        size ? ` (${Math.round(size / 1024)}KB)` : ""
      }\nLast saved: ${
        lastSaved ? new Date(lastSaved).toLocaleString() : "Unknown"
      }${
        lastModified
          ? `\nFile modified: ${new Date(lastModified).toLocaleString()}`
          : ""
      }${
        cacheAge > 0 ? `\nCached: ${cacheAge} minutes ago` : ""
      }\n\nClick OK to select the file again, or Cancel to start fresh.`
    );

    if (!shouldRestore) {
      return {
        success: false,
        error: "User declined to restore cached file",
      };
    }

    // Prompt user to re-select the file (since FileSystemFileHandle can't be cached)
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
      return {
        success: false,
        error: "No file selected",
      };
    }

    const fileHandle = fileHandles[0];
    const file = await fileHandle.getFile?.();

    if (!file) {
      return {
        success: false,
        error: "Could not read selected file",
      };
    } // Enhanced verification of the selected file
    let verificationWarnings = [];

    if (file.name !== name) {
      verificationWarnings.push(
        `File name mismatch: expected "${name}", got "${file.name}"`
      );
    }

    if (size && Math.abs(file.size - size) > 1024) {
      // Allow 1KB difference
      verificationWarnings.push(
        `File size mismatch: expected ~${Math.round(
          size / 1024
        )}KB, got ${Math.round(file.size / 1024)}KB`
      );
    }

    if (
      lastModified &&
      Math.abs(file.lastModified - lastModified.getTime()) > 60000
    ) {
      // Allow 1 minute difference
      verificationWarnings.push(`File modification time mismatch`);
    }

    if (verificationWarnings.length > 0) {
      const proceedAnyway = window.confirm(
        `File verification warnings:\n\n${verificationWarnings.join(
          "\n"
        )}\n\nThis might not be the same file. Do you want to proceed anyway?`
      );

      if (!proceedAnyway) {
        return {
          success: false,
          error: "File verification failed - user declined to proceed",
        };
      }
    }

    const content = await file.text();

    // Verify content hash if available
    if (contentHash) {
      const newContentHash = btoa(content.substring(0, 1000))
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 20);
      if (newContentHash !== contentHash) {
        const proceedAnyway = window.confirm(
          `File content appears to have changed since it was cached. Do you want to proceed anyway?`
        );

        if (!proceedAnyway) {
          return {
            success: false,
            error: "Content verification failed - user declined to proceed",
          };
        }
      }
    }
    const data = JSON.parse(content);

    // Validate file format
    if (!data.version || !data.entries || !Array.isArray(data.entries)) {
      return {
        success: false,
        error: "Invalid file format",
      };
    }

    // Convert date strings back to Date objects
    data.entries = data.entries.map((entry: any) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
    }));

    return {
      success: true,
      data,
      fileName: file.name,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to restore cached file: ${(error as Error).message}`,
    };
  }
};
