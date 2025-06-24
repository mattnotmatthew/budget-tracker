import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import {
  loadBudgetData,
  supportsFileSystemAccess,
  attemptRestoreCachedFile,
} from "../utils/fileManager";
import { PersistenceManager } from "../services/persistenceManager";

interface FileManagerProps {
  onClose: () => void;
}

const FileManager: React.FC<FileManagerProps> = ({ onClose }) => {
  const { state, dispatch, clearAllData, createNewFile } = useBudget();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [lastSelectedFileTimestamp, setLastSelectedFileTimestamp] =
    useState<Date | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState("");
  const [isClearSectionCollapsed, setIsClearSectionCollapsed] = useState(true);
  const handleLoad = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      let loadedData;
      let fileHandle = null;
      let fileName = "loaded-file.json";
      let fileObj = null;
      let content = "";

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
          content = await file.text();
          loadedData = JSON.parse(content);
          fileHandle = selectedFileHandle;
          fileName = file.name;
          fileObj = file;

          // Capture file timestamp
          setLastSelectedFileTimestamp(new Date(file.lastModified));

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

      // Replace all data with loaded data (no merging)
      dispatch({ type: "LOAD_ENTRIES", payload: loadedData.entries }); // Load yearly budget targets if they exist
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
      }); // Set the current file if we have a handle
      if (fileHandle && fileObj) {
        // Create a simple hash of the content for verification
        const contentHash = btoa(content.substring(0, 1000))
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 20);
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            name: fileName,
            handle: fileHandle,
            lastSaved: new Date(),
            // Preserve existing userLastSaved if it exists
            userLastSaved: state.currentFile?.userLastSaved,
          },
        });
      }

      const entriesCount = loadedData.entries.length;
      setMessage({
        type: "success",
        text: `Successfully loaded ${entriesCount} entries from ${fileName} for year ${loadedData.year}`,
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
  const handleRestoreCached = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await attemptRestoreCachedFile();

      if (result.success && result.data) {
        // Replace all data with restored data (no merging)
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
        } // Update current file info
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            name: result.fileName || "restored-file.json",
            lastSaved: new Date(),
            // Preserve existing userLastSaved if it exists
            userLastSaved: state.currentFile?.userLastSaved,
          },
        });

        setMessage({
          type: "success",
          text: `Successfully restored cached file: ${result.fileName}`,
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to restore cached file",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error during file restoration: " + (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleClearAll = () => {
    setShowClearConfirmation(true);
    setClearConfirmationText("");
  };
  const handleClearCacheOnly = () => {
    const persistenceManager = PersistenceManager.getInstance();
    persistenceManager.clearCache();
    setMessage({
      type: "success",
      text: "✅ Cache cleared successfully! Your JSON file remains intact.",
    });
    // Scroll to top to make the message visible
    const modal = document.querySelector(".file-manager-content");
    if (modal) {
      modal.scrollTop = 0;
    }
  };
  const confirmClearAll = () => {
    if (clearConfirmationText.toLowerCase() === "clear all my data") {
      clearAllData();
      setMessage({
        type: "success",
        text: "✅ All data cleared successfully! Both cache and file data have been removed.",
      });
      setShowClearConfirmation(false);
      setClearConfirmationText("");
      // Scroll to top to make the message visible
      const modal = document.querySelector(".file-manager-content");
      if (modal) {
        modal.scrollTop = 0;
      }
    } else {
      setMessage({
        type: "error",
        text: "❌ Please type exactly 'clear all my data' to confirm",
      });
    }
  };

  const cancelClearAll = () => {
    setShowClearConfirmation(false);
    setClearConfirmationText("");
    setMessage(null);
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

  const handleCreateNewFile = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const success = await createNewFile();
      if (success) {
        setMessage({
          type: "success",
          text: "✅ New file created successfully! You can now start entering budget data.",
        });
      } else {
        setMessage({
          type: "info",
          text: "❌ File creation cancelled",
        });
      }
    } catch (error) {
      console.error("Error creating new file:", error);
      setMessage({
        type: "error",
        text: "❌ Failed to create new file: " + (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = getCurrentStats();
  return (
    <div className="file-manager-overlay">
      <div className="file-manager-modal">
        <div className="file-manager-header">
          <h2>File Manager</h2>
          <button className="close-btn" onClick={onClose} title="Close (Esc)">
            ×
          </button>{" "}
        </div>{" "}
        <div className="file-manager-content">
          {/* Message Display - Moved to top for better visibility */}
          {message && (
            <div
              className={`message ${message.type}`}
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                borderRadius: "8px",
                fontWeight: "500",
              }}
            >
              {message.text}
            </div>
          )}
          {/* Create New File Section - For new users */}
          {!state.currentFile && (
            <div className="file-section">
              <h4>Create New Budget File</h4>
              <p>
                Start fresh with a new budget file. You'll choose where to save
                it on your computer.
              </p>
              <button
                className="create-btn primary-create"
                onClick={handleCreateNewFile}
                disabled={isLoading}
                style={{
                  background:
                    "linear-gradient(135deg, #affe76 0%, #023f40 100%)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: "1rem",
                }}
              >
                {isLoading ? "Creating..." : "📝 Create New Budget File"}
              </button>
              <div
                style={{ textAlign: "center", margin: "1rem 0", color: "#666" }}
              >
                <span>— OR —</span>
              </div>
            </div>
          )}
          {/* Load Section - Moved to top */}
          <div className="file-section">
            <h4>Load Data</h4>
            <p>
              Load budget data from a JSON file. This will replace all current
              data.
            </p>

            {/* Load from File - Primary Action */}
            <div className="load-from-file-section">
              <h5>Load from File</h5>
              <p className="load-description">
                Select a JSON file from your computer to load budget data.
              </p>
              <button
                className="load-btn primary-load"
                onClick={handleLoad}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "📁 Load Data from File"}
              </button>
              {lastSelectedFileTimestamp && (
                <div className="file-timestamp">
                  <strong>Last selected file modified:</strong>{" "}
                  {lastSelectedFileTimestamp.toLocaleString()}
                </div>
              )}
            </div>

            {/* Restore Cached File - Secondary Action */}
            {state.currentFile && supportsFileSystemAccess() && (
              <>
                <div className="load-separator">
                  <span>OR</span>
                </div>
                <div className="restore-cached-section">
                  <h5>Restore Cached File</h5>
                  <p className="restore-description">
                    Restore the previously opened file from browser cache.
                  </p>
                  <button
                    className="restore-btn secondary-load"
                    onClick={handleRestoreCached}
                    disabled={isLoading}
                  >
                    {isLoading ? "Restoring..." : "🔄 Restore Cached File"}
                  </button>
                  {state.currentFile.lastSaved && (
                    <div className="cache-timestamp">
                      <strong>Cache last saved:</strong>{" "}
                      {new Date(state.currentFile.lastSaved).toLocaleString()}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>{" "}
          {/* Current Session - Enhanced with both timestamps */}
          {state.currentFile && (
            <div className="file-section current-session-compact">
              <h4>Current Session</h4>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <strong>File:</strong> {state.currentFile.name}
                </span>
                <span>
                  <strong>Cache Last Saved:</strong>{" "}
                  {state.currentFile.lastSaved
                    ? new Date(state.currentFile.lastSaved).toLocaleString()
                    : "Never"}
                </span>
                <span>
                  <strong>User Last Saved:</strong>{" "}
                  {state.currentFile.userLastSaved
                    ? new Date(state.currentFile.userLastSaved).toLocaleString()
                    : "Never"}
                </span>
                <span style={{ fontSize: "0.9em", color: "#666" }}>
                  📝 <em>Cached - will restore on refresh</em>
                </span>
              </div>
            </div>
          )}
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
              {!state.currentFile && (
                <div className="stat-item">
                  <span className="stat-label">Attached File:</span>
                  <span className="stat-value">None (saving locally)</span>
                </div>
              )}
            </div>
          </div>{" "}
          {/* Clear Data Section */}
          <div className="file-section danger-section">
            <div
              className="collapsible-header"
              onClick={() =>
                setIsClearSectionCollapsed(!isClearSectionCollapsed)
              }
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h4>Clear Data</h4>
              <span className="collapse-icon">
                {isClearSectionCollapsed ? "▶" : "▼"}
              </span>
            </div>

            {!isClearSectionCollapsed && (
              <div className="collapsible-content">
                <p>
                  Clear JSON file AND clear cache OR clear cache only and leave
                  JSON file intact.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="clear-btn danger-btn"
                    onClick={handleClearCacheOnly}
                    style={{ flex: "1", minWidth: "200px" }}
                  >
                    Clear Cache Only
                  </button>

                  {!showClearConfirmation ? (
                    <button
                      className="clear-btn danger-btn"
                      onClick={handleClearAll}
                      style={{ flex: "1", minWidth: "200px" }}
                    >
                      Clear All Data
                    </button>
                  ) : null}
                </div>
                {showClearConfirmation && (
                  <div className="clear-confirmation">
                    <p className="confirmation-warning">
                      ⚠️ This action will permanently delete all your budget
                      data and cannot be undone.
                    </p>
                    <p className="confirmation-instruction">
                      To confirm, please type{" "}
                      <strong>"clear all my data"</strong> below:
                    </p>
                    <input
                      type="text"
                      className="confirmation-input"
                      value={clearConfirmationText}
                      onChange={(e) => setClearConfirmationText(e.target.value)}
                      placeholder="Type: clear all my data"
                      autoFocus
                    />
                    <div className="confirmation-buttons">
                      <button
                        className="confirm-clear-btn danger-btn"
                        onClick={confirmClearAll}
                        disabled={
                          clearConfirmationText.toLowerCase() !==
                          "clear all my data"
                        }
                      >
                        Confirm Clear All Data
                      </button>
                      <button
                        className="cancel-clear-btn"
                        onClick={cancelClearAll}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}{" "}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
