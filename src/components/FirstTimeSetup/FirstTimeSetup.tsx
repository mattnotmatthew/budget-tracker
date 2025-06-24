import React, { useState } from "react";
import "./FirstTimeSetup.css";

interface FirstTimeSetupProps {
  onLoadFromFile: () => Promise<void>;
  onCreateNewFile: () => Promise<void>;
  onSkipForNow: () => void;
}

const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({
  onLoadFromFile,
  onCreateNewFile,
  onSkipForNow,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>("");

  const handleLoadFromFile = async () => {
    setIsLoading(true);
    setLoadingAction("Loading file...");
    try {
      await onLoadFromFile();
    } catch (error) {
      console.error("Error loading file:", error);
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const handleCreateNewFile = async () => {
    setIsLoading(true);
    setLoadingAction("Setting up new file...");
    try {
      await onCreateNewFile();
    } catch (error) {
      console.error("Error creating new file:", error);
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  return (
    <div className="first-time-setup-overlay">
      <div className="first-time-setup-modal">
        <div className="setup-header">
          <h2>Welcome to Budget Tracker!</h2>
          <p>Let's get you started. How would you like to begin?</p>
        </div>

        <div className="setup-options">
          <div className="option-card">
            <div className="option-icon">📂</div>
            <h3>Load Existing File</h3>
            <p>
              Load budget data from an existing JSON file you've created before.
              This will import all your previous entries and settings.
            </p>
            <button
              className="option-button load-button"
              onClick={handleLoadFromFile}
              disabled={isLoading}
            >
              {isLoading && loadingAction === "Loading file..."
                ? "Loading..."
                : "Load from File"}
            </button>
          </div>{" "}
          <div className="option-card">
            <div className="option-icon">📝</div>
            <h3>Start New Budget</h3>
            <p>
              Begin with a fresh budget. You'll be taken to the main dashboard
              where you can create and save a new budget file when you're ready.
            </p>
            <button
              className="option-button new-button"
              onClick={handleCreateNewFile}
              disabled={isLoading}
            >
              {isLoading && loadingAction === "Setting up new file..."
                ? "Setting up..."
                : "Start New Budget"}
            </button>
          </div>
          <div className="option-card">
            <div className="option-icon">⏭️</div>
            <h3>Skip for Now</h3>
            <p>
              Start using the app without setting up file persistence. Your data
              will be stored temporarily and you can set up a file later.
            </p>
            <button
              className="option-button skip-button"
              onClick={onSkipForNow}
              disabled={isLoading}
            >
              Skip Setup
            </button>
          </div>
        </div>

        <div className="setup-info">
          <h4>How it works:</h4>
          <ul>
            <li>
              <strong>Short-term storage:</strong> Your changes are
              automatically saved to your browser's cache every 5 minutes
            </li>
            <li>
              <strong>Long-term storage:</strong> Use the Save button to save
              your data to a JSON file on your computer
            </li>
            <li>
              <strong>Data safety:</strong> You'll be warned before closing if
              you have unsaved changes
            </li>
          </ul>
        </div>

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>{loadingAction}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirstTimeSetup;
