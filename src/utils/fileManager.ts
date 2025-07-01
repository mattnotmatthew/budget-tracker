import { BudgetEntry, BudgetState, VendorData, VendorTracking, CategoryAllocation } from "../types";

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
  allocations?: CategoryAllocation[]; // NEW: Category allocations
  yearlyBudgetTargets?: { [year: number]: number };
  monthlyForecastModes?: { [year: number]: { [month: number]: boolean } };
  vendorData?: VendorData[]; // NEW: Vendor data
  vendorTrackingData?: VendorTracking[]; // NEW: Vendor tracking data
  metadata: {
    totalEntries: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
    categories: string[];
  };
}

// Enhanced SaveResult interface with new properties
export interface SaveResult {
  saved: boolean;
  method: "file" | "newFile" | "download" | "cancelled";
  fileHandle?: FileSystemFileHandle;
  fileName?: string;
  userCancelled?: boolean;
  error?: string;
  newFileHandle?: FileSystemFileHandle;
  message?: string;
}

/**
 * Validates if a file handle is still valid and accessible
 */
export const validateFileHandle = async (
  handle: FileSystemFileHandle
): Promise<boolean> => {
  try {
    // Try to get file info - this will fail if handle is invalid/expired
    await handle.getFile();
    return true;
  } catch (error) {
    console.log("File handle expired or invalid:", error);
    return false;
  }
};

// Save budget data to JSON file
export const saveBudgetData = (
  state: Omit<
    BudgetState,
    | "categories"
    | "viewMode"
    | "selectedQuarter"
    | "selectedMonth"
    | "persistence"
  >,
  customFileName?: string
) => {
  const { entries, allocations, selectedYear, vendorData, vendorTrackingData } = state;

  // Filter entries for the selected year
  const yearEntries = entries.filter(
    (entry: BudgetEntry) => entry.year === selectedYear
  );

  // Filter allocations for the selected year
  const yearAllocations =
    allocations?.filter((allocation: CategoryAllocation) => allocation.year === selectedYear) ||
    [];

  // Filter vendor data for the selected year
  const yearVendorData =
    vendorData?.filter((vendor: VendorData) => vendor.year === selectedYear) ||
    [];

  // Filter vendor tracking data for the selected year
  const yearVendorTrackingData =
    vendorTrackingData?.filter(
      (tracking: VendorTracking) => tracking.year === selectedYear
    ) || [];

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
    allocations: yearAllocations,
    yearlyBudgetTargets: state.yearlyBudgetTargets || {},
    monthlyForecastModes: state.monthlyForecastModes || {},
    vendorData: yearVendorData,
    vendorTrackingData: yearVendorTrackingData,
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
  link.download = customFileName || `budget-data-${selectedYear}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return dataToSave;
};

// Load budget data from JSON file
export const loadBudgetData = (): Promise<{ data: BudgetDataFile; fileName: string }> => {
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

          // Convert date strings in allocations
          if (data.allocations) {
            data.allocations = data.allocations.map((allocation) => ({
              ...allocation,
              createdAt: new Date(allocation.createdAt),
              updatedAt: new Date(allocation.updatedAt),
            }));
          }

          // Convert date strings in vendor data
          if (data.vendorData) {
            data.vendorData = data.vendorData.map((vendor) => ({
              ...vendor,
              createdAt: new Date(vendor.createdAt),
              updatedAt: new Date(vendor.updatedAt),
            }));
          }

          // Convert date strings in vendor tracking data
          if (data.vendorTrackingData) {
            data.vendorTrackingData = data.vendorTrackingData.map(
              (tracking) => ({
                ...tracking,
                createdAt: new Date(tracking.createdAt),
                updatedAt: new Date(tracking.updatedAt),
              })
            );
          }

          resolve({ data, fileName: file.name });
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
    | "categories"
    | "viewMode"
    | "selectedQuarter"
    | "selectedMonth"
    | "persistence"
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
    const { entries, allocations, selectedYear, vendorData, vendorTrackingData } = state;
    const yearEntries = entries.filter(
      (entry: BudgetEntry) => entry.year === selectedYear
    );

    // Filter allocations for the selected year
    const yearAllocations =
      allocations?.filter(
        (allocation: CategoryAllocation) => allocation.year === selectedYear
      ) || [];

    // Filter vendor data for the selected year
    const yearVendorData =
      vendorData?.filter(
        (vendor: VendorData) => vendor.year === selectedYear
      ) || [];

    // Filter vendor tracking data for the selected year
    const yearVendorTrackingData =
      vendorTrackingData?.filter(
        (tracking: VendorTracking) => tracking.year === selectedYear
      ) || [];

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
      allocations: yearAllocations,
      yearlyBudgetTargets: state.yearlyBudgetTargets || {},
      monthlyForecastModes: state.monthlyForecastModes || {},
      vendorData: yearVendorData,
      vendorTrackingData: yearVendorTrackingData,
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
    | "categories"
    | "viewMode"
    | "selectedQuarter"
    | "selectedMonth"
    | "persistence"
  >,
  currentFile?: {
    name: string;
    handle?: FileSystemFileHandle;
    lastSaved?: Date;
  }
): Promise<SaveResult> => {
  console.log("🔄 Smart auto-save triggered:", {
    hasCurrentFile: !!currentFile,
    hasHandle: !!currentFile?.handle,
    supportsFileSystemAccess: supportsFileSystemAccess(),
  });

  // Check if we have a file handle and browser supports File System Access API
  if (currentFile?.handle && supportsFileSystemAccess()) {
    console.log("📁 File handle available, validating...");

    // Validate handle before attempting save
    const isHandleValid = await validateFileHandle(currentFile.handle);

    if (!isHandleValid) {
      console.log("🔄 File handle expired - prompting for file reselection");

      const shouldReselect = window.confirm(
        `Your connection to "${currentFile.name}" has expired due to browser security policies.\n\n` +
          "This happens when the browser tab is inactive for extended periods (typically 20-30 minutes).\n\n" +
          "Would you like to reconnect to your existing file to save your changes?\n\n" +
          "Click OK to select your file again, or Cancel to continue without saving."
      );

      if (shouldReselect) {
        console.log("👤 User chose to reconnect to existing file");
        // Prompt user to reselect the same file
        try {
          const fileHandles = await window.showOpenFilePicker?.({
            types: [
              {
                description: "Budget JSON files",
                accept: { "application/json": [".json"] },
              },
            ],
            multiple: false,
          });

          if (!fileHandles || fileHandles.length === 0) {
            return {
              saved: false,
              method: "file",
              userCancelled: true,
              message: "File selection cancelled.",
            };
          }

          const newFileHandle = fileHandles[0];
          // Save to the newly selected file
          const result = await saveToFileHandle(state, newFileHandle);
          if (result.saved) {
            console.log("✅ Successfully reconnected and saved to file");
            return {
              ...result,
              method: "file",
              newFileHandle: newFileHandle,
              message: `Reconnected to "${newFileHandle.name}" and saved successfully.`,
            };
          }
          return { ...result, method: "file" };
        } catch (error) {
          console.log(
            "❌ User cancelled file selection or error occurred:",
            error
          );
          return {
            saved: false,
            method: "file",
            userCancelled: true,
            message: "File reconnection cancelled.",
          };
        }
      } else {
        console.log("👤 User chose not to reconnect");
        return {
          saved: false,
          method: "file",
          userCancelled: true,
          message: "Save cancelled - file handle expired.",
        };
      }
    }
    // Handle is valid, proceed with normal save
    console.log("✅ File handle is valid, proceeding with save");
    try {
      const result = await saveToFileHandle(state, currentFile.handle);
      if (result.saved) {
        console.log("💾 Successfully saved to existing file handle");
      }
      return { ...result, method: "file" };
    } catch (error) {
      console.error("❌ Save failed despite valid handle:", error);
      // Fall through to prompt for new file
    }
  }

  // Check if we had a file before (handle expired scenario vs truly no file)
  if (currentFile?.name && !currentFile?.handle) {
    console.log("🔄 Had file before but handle is missing");

    // If File System Access API is not supported, show Save As dialog for Safari users
    if (!supportsFileSystemAccess()) {
      console.log("📥 File System Access API not supported, showing Save As dialog");
      
      // Get the suggested filename (preserve original name or create default)
      const suggestedFileName = currentFile.name || `budget-data-${state.selectedYear}.json`;
      
      // Remember last save location from sessionStorage
      const lastSaveLocation = sessionStorage.getItem('lastSaveLocation');
      const dialogMessage = lastSaveLocation 
        ? `Choose where to save "${suggestedFileName}"\n\nLast saved to: ${lastSaveLocation}`
        : `Choose where to save "${suggestedFileName}"`;
      
      // Show confirmation dialog explaining the Save As behavior
      const userConfirmed = window.confirm(
        `${dialogMessage}\n\n` +
        `Click OK to choose save location, or Cancel to abort.`
      );
      
      if (!userConfirmed) {
        return {
          saved: false,
          method: "cancelled",
          message: "Save cancelled by user"
        };
      }
      
      // Prepare the data to save
      const { entries, allocations, selectedYear, vendorData, vendorTrackingData } = state;
      const yearEntries = entries.filter((entry) => entry.year === selectedYear);
      const yearAllocations = allocations?.filter((allocation) => allocation.year === selectedYear) || [];
      const yearVendorData = vendorData?.filter((vendor) => vendor.year === selectedYear) || [];
      const yearVendorTrackingData = vendorTrackingData?.filter((tracking) => tracking.year === selectedYear) || [];

      const dates = yearEntries.map((entry) => entry.createdAt);
      const categorySet = new Set(yearEntries.map((entry) => entry.categoryId));
      const categories = Array.from(categorySet);

      const dataToSave = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        year: selectedYear,
        entries: yearEntries,
        allocations: yearAllocations,
        yearlyBudgetTargets: state.yearlyBudgetTargets || {},
        monthlyForecastModes: state.monthlyForecastModes || {},
        vendorData: yearVendorData,
        vendorTrackingData: yearVendorTrackingData,
        metadata: {
          totalEntries: yearEntries.length,
          dateRange: {
            earliest: dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))).toISOString() : "",
            latest: dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString() : "",
          },
          categories,
        },
      };

      const jsonString = JSON.stringify(dataToSave, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create download link with suggested filename
      const link = document.createElement("a");
      link.href = url;
      link.download = suggestedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Store the filename in sessionStorage for next time
      sessionStorage.setItem('lastSaveLocation', suggestedFileName);

      return {
        saved: true,
        method: "download",
        fileName: suggestedFileName,
        message: `Saved as ${suggestedFileName}. Choose the same file next time to overwrite.`
      };
    }

    const shouldReconnect = window.confirm(
      `Connection to "${currentFile.name}" has been lost.\n\n` +
        "This happens when the browser tab is inactive for extended periods.\n\n" +
        "Would you like to reconnect to your file to save your changes?\n\n" +
        "Click OK to select your file, or Cancel to create a new file."
    );

    if (shouldReconnect) {
      console.log("👤 User chose to reconnect to lost file");
      try {
        const fileHandles = await window.showOpenFilePicker?.({
          types: [
            {
              description: "Budget JSON files",
              accept: { "application/json": [".json"] },
            },
          ],
          multiple: false,
        });

        if (!fileHandles || fileHandles.length === 0) {
          console.log("❌ User cancelled file selection or no files selected");
          // Fall through to create new file prompt
        } else {
          const newFileHandle = fileHandles[0];
          const result = await saveToFileHandle(state, newFileHandle);
          if (result.saved) {
            return {
              ...result,
              method: "file",
              newFileHandle: newFileHandle,
              message: `Reconnected to "${newFileHandle.name}" and saved successfully.`,
            };
          }
          return { ...result, method: "file" };
        }
      } catch (error) {
        console.log("❌ User cancelled reconnection or error occurred:", error);
        // Fall through to create new file prompt
      }
    }
  }

  // Truly no file attached - show regular prompt
  console.log("📄 No file attached - prompting user to create new file");

  // If File System Access API is not supported, show Save As dialog
  if (!supportsFileSystemAccess()) {
    console.log("📥 File System Access API not supported, showing Save As dialog");
    
    // Get suggested filename and remember last save location
    const suggestedFileName = `budget-data-${state.selectedYear}.json`;
    const lastSaveLocation = sessionStorage.getItem('lastSaveLocation');
    const dialogMessage = lastSaveLocation 
      ? `Choose where to save "${suggestedFileName}"\n\nLast saved to: ${lastSaveLocation}`
      : `Choose where to save "${suggestedFileName}"`;
    
    const shouldSave = window.confirm(
      `No file attached. ${dialogMessage}\n\n` +
        "Click OK to choose save location, or Cancel to abort saving."
    );

    if (shouldSave) {
      saveBudgetData(state, suggestedFileName);
      
      // Store the filename in sessionStorage for next time
      sessionStorage.setItem('lastSaveLocation', suggestedFileName);
      
      return {
        saved: true,
        method: "download",
        fileName: suggestedFileName,
        message: `Saved as ${suggestedFileName}. Choose the same file next time to overwrite.`
      };
    }
  } else {
    const shouldSave = window.confirm(
      "No file attached. Would you like to save your budget data to a file?\n\n" +
        "Click OK to create a file, or Cancel to abort saving."
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

    // Convert date strings in allocations
    if (data.allocations) {
      data.allocations = data.allocations.map((allocation: any) => ({
        ...allocation,
        createdAt: new Date(allocation.createdAt),
        updatedAt: new Date(allocation.updatedAt),
      }));
    }

    // Convert date strings in vendor data
    if (data.vendorData) {
      data.vendorData = data.vendorData.map((vendor: any) => ({
        ...vendor,
        createdAt: new Date(vendor.createdAt),
        updatedAt: new Date(vendor.updatedAt),
      }));
    }

    // Convert date strings in vendor tracking data
    if (data.vendorTrackingData) {
      data.vendorTrackingData = data.vendorTrackingData.map(
        (tracking: any) => ({
          ...tracking,
          createdAt: new Date(tracking.createdAt),
          updatedAt: new Date(tracking.updatedAt),
        })
      );
    }

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
