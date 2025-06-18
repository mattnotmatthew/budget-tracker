import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import "./PersistenceIndicator.css";

const PersistenceIndicator: React.FC = () => {
  const {
    state,
    saveToFile,
    hasUnsavedChanges,
    getTimeSinceLastSave,
    getCacheStats,
  } = useBudget();

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const success = await saveToFile();
      if (success) {
        setSaveMessage("Saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Save failed");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (error) {
      setSaveMessage("Save error");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const unsavedChanges = hasUnsavedChanges();
  const timeSinceLastSave = getTimeSinceLastSave();
  const cacheStats = getCacheStats();

  return (
    <div className="persistence-indicator">
      <div className="save-section">
        <button
          className={`save-button ${unsavedChanges ? "has-changes" : "saved"}`}
          onClick={handleSave}
          disabled={isSaving || !state.currentFile}
          title={state.currentFile ? "Save to file" : "No file selected"}
        >
          {isSaving ? (
            <>
              <span className="spinner"></span>
              Saving...
            </>
          ) : (
            <>💾 {unsavedChanges ? "Save Changes" : "Saved"}</>
          )}
        </button>

        {saveMessage && (
          <span
            className={`save-message ${
              saveMessage.includes("error") || saveMessage.includes("failed")
                ? "error"
                : "success"
            }`}
          >
            {saveMessage}
          </span>
        )}
      </div>

      <div className="status-section">
        <div className="file-status">
          {state.currentFile ? (
            <>
              <span className="file-name">📄 {state.currentFile.name}</span>
              {timeSinceLastSave && (
                <span className="last-save">
                  Last saved: {timeSinceLastSave}
                </span>
              )}
            </>
          ) : (
            <span className="no-file">No file selected</span>
          )}
        </div>

        <div className="cache-status">
          <span className="cache-info">
            💾 Cache: {cacheStats.entryCount} entries
            {cacheStats.lastUpdated && (
              <span className="cache-time">
                {" "}
                (updated {new Date(cacheStats.lastUpdated).toLocaleTimeString()}
                )
              </span>
            )}
          </span>
        </div>

        {unsavedChanges && (
          <div className="unsaved-indicator">
            <span className="warning-dot">●</span>
            Unsaved changes
          </div>
        )}
      </div>
    </div>
  );
};

export default PersistenceIndicator;
