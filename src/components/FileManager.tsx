import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import {
  saveBudgetData,
  loadBudgetData,
  mergeBudgetData,
  saveToFileHandle,
  supportsFileSystemAccess,
} from "../utils/fileManager";

interface FileManagerProps {
  onClose: () => void;
}

const FileManager: React.FC<FileManagerProps> = ({ onClose }) => {
  const { state, dispatch } = useBudget();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<
    "replace" | "append" | "update"
  >("replace");
  const handleSave = async () => {
    try {
      let result;
      if (supportsFileSystemAccess()) {
        // Use new file handle system
        result = await saveToFileHandle(
          {
            entries: state.entries,
            selectedYear: state.selectedYear,
            yearlyBudgetTargets: state.yearlyBudgetTargets,
            monthlyForecastModes: state.monthlyForecastModes,
          },
          state.currentFile?.handle
        );

        // Update the current file if a new one was created
        if (result.saved && result.fileHandle) {
          dispatch({
            type: "SET_CURRENT_FILE",
            payload: {
              name: result.fileName,
              handle: result.fileHandle,
              lastSaved: new Date(),
            },
          });
        }
      } else {
        // Fallback to traditional download
        const savedData = saveBudgetData({
          entries: state.entries,
          selectedYear: state.selectedYear,
          yearlyBudgetTargets: state.yearlyBudgetTargets,
          monthlyForecastModes: state.monthlyForecastModes,
        });
        result = {
          saved: true,
          fileName: `budget-data-${state.selectedYear}.json`,
        };
      }

      if (result.saved) {
        setMessage({
          type: "success",
          text: `Successfully saved data for ${state.selectedYear} to ${result.fileName}`,
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to save file",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to save file: " + (error as Error).message,
      });
    }
  };
  const handleLoad = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      let loadedData;
      let fileHandle = null;
      let fileName = "loaded-file.json";
      if (supportsFileSystemAccess()) {
        try {
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
            setIsLoading(false);
            return;
          }

          const selectedFileHandle = fileHandles[0];
          const file = await selectedFileHandle.getFile?.();

          if (!file) {
            throw new Error("Could not read file");
          }

          const content = await file.text();
          loadedData = JSON.parse(content);
          fileHandle = selectedFileHandle;
          fileName = file.name;

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
        } catch (fsError) {
          if ((fsError as Error).name === "AbortError") {
            setIsLoading(false);
            return;
          }
          throw fsError;
        }
      } else {
        // Fallback to traditional file loading
        loadedData = await loadBudgetData();
      }

      const mergedEntries = mergeBudgetData(
        state.entries,
        loadedData,
        mergeStrategy
      );
      dispatch({ type: "LOAD_ENTRIES", payload: mergedEntries }); // Load yearly budget targets if they exist
      if (loadedData.yearlyBudgetTargets) {
        Object.entries(loadedData.yearlyBudgetTargets).forEach(
          ([year, amount]) => {
            dispatch({
              type: "SET_YEARLY_BUDGET_TARGET",
              payload: { year: parseInt(year), amount: amount as number },
            });
          }
        );
      } // Load monthly forecast modes if they exist
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

      // Update selected year to the loaded year
      dispatch({
        type: "SET_SELECTED_PERIOD",
        payload: { year: loadedData.year as number },
      });

      // Set the current file if we have a handle
      if (fileHandle) {
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            name: fileName,
            handle: fileHandle,
            lastSaved: new Date(),
          },
        });
      }

      setMessage({
        type: "success",
        text: `Successfully loaded ${loadedData.metadata.totalEntries} entries for ${loadedData.year} from ${fileName}. Strategy: ${mergeStrategy}`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to load file: " + (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleClearAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      dispatch({ type: "CLEAR_ALL_DATA" });
      // Note: localStorage caching removed - only clearing in-memory data
      setMessage({
        type: "info",
        text: "All data cleared successfully",
      });
    }
  };
  const getCurrentStats = () => {
    const currentYearEntries = state.entries.filter(
      (entry) => entry.year === state.selectedYear
    );
    const totalEntries = state.entries.length;
    const yearSet = new Set(state.entries.map((entry) => entry.year));

    return {
      currentYear: state.selectedYear,
      currentYearEntries: currentYearEntries.length,
      totalEntries,
      years: Array.from(yearSet).sort(),
    };
  };

  const stats = getCurrentStats();

  return (
    <div className="file-manager-overlay">
      <div className="file-manager-modal">
        <div className="modal-header">
          <h3>File Manager</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="file-manager-content">
          {" "}
          {/* Current Data Stats */}
          <div className="data-stats">
            <h4>Current Data</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Current Year:</span>
                <span className="stat-value">{stats.currentYear}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Entries this year:</span>
                <span className="stat-value">{stats.currentYearEntries}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total entries:</span>
                <span className="stat-value">{stats.totalEntries}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Years with data:</span>
                <span className="stat-value">
                  {stats.years.join(", ") || "None"}
                </span>
              </div>
              {state.currentFile ? (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Attached File:</span>
                    <span className="stat-value">{state.currentFile.name}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Saved:</span>
                    <span className="stat-value">
                      {state.currentFile.lastSaved
                        ? new Date(state.currentFile.lastSaved).toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="stat-item">
                  <span className="stat-label">Attached File:</span>
                  <span className="stat-value">None (saving locally)</span>
                </div>
              )}
            </div>
          </div>{" "}
          {/* Save Section */}
          <div className="file-section">
            <h4>Save Data</h4>
            <p>
              Save current year ({state.selectedYear}) data to a JSON file.{" "}
              {stats.currentYearEntries === 0
                ? "(Will create an empty file for this year)"
                : ""}
            </p>
            <button className="save-btn" onClick={handleSave}>
              Save {state.selectedYear} Data{" "}
              {stats.currentYearEntries === 0
                ? "(Empty)"
                : `(${stats.currentYearEntries} entries)`}
            </button>
          </div>
          {/* Load Section */}
          <div className="file-section">
            <h4>Load Data</h4>
            <p>Load budget data from a JSON file.</p>

            <div className="merge-strategy">
              <label>Merge Strategy:</label>
              <select
                value={mergeStrategy}
                onChange={(e) =>
                  setMergeStrategy(
                    e.target.value as "replace" | "append" | "update"
                  )
                }
              >
                <option value="replace">
                  Replace (overwrite data for the loaded year)
                </option>
                <option value="append">Append (add to existing data)</option>
                <option value="update">Update (merge by entry ID)</option>
              </select>
            </div>

            <button
              className="load-btn"
              onClick={handleLoad}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load Data from File"}
            </button>
          </div>
          {/* Clear Data Section */}
          <div className="file-section danger-section">
            <h4>Clear All Data</h4>
            <p>Remove all budget entries and auto-saved data.</p>
            <button className="clear-btn danger-btn" onClick={handleClearAll}>
              Clear All Data
            </button>
          </div>
          {/* Message Display */}
          {message && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}
        </div>

        <div className="file-manager-footer">
          <button className="close-footer-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
