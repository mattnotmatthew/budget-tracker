import React, { useState, useEffect, useCallback } from "react";
import { useBudget } from "../context/BudgetContext";
import { isFeatureEnabled } from "../utils/featureFlags";
import {
  getNextPlanningYear,
  getAvailablePlanningYears,
  getPlanningYearLabel,
} from "../utils/yearUtils";
import MonthlyView from "./MonthlyView";
import QuarterSelector from "./QuarterSelector";
import BudgetInput from "./BudgetInput";
// import AlertPanel from "./AlertPanel";
import FileManager from "./FileManager";
import YearlyBudgetDashboard from "./YearlyBudgetDashboard";

import "../styles/App-new.css";
import { useNavigate } from "react-router-dom";
import ExecutiveSummary from "./ExecutiveSummary/ExecutiveSummary";
import VendorManagement from "./VendorManagement";
import Resources from "./Resources";
import FunctionalAllocation from "./FunctionalAllocation";

// Utility function to get current quarter
const getCurrentQuarter = (): number => {
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11, so add 1
  return Math.ceil(currentMonth / 3);
};

// Utility function to get months for a specific quarter
const getQuarterMonths = (quarter: number): number[] => {
  const quarterToMonths: { [key: number]: number[] } = {
    1: [1, 2, 3], // Q1: Jan, Feb, Mar
    2: [4, 5, 6], // Q2: Apr, May, Jun
    3: [7, 8, 9], // Q3: Jul, Aug, Sep
    4: [10, 11, 12], // Q4: Oct, Nov, Dec
  };
  return quarterToMonths[quarter] || [];
};

const Dashboard: React.FC = () => {
  const { state, dispatch } = useBudget();
  const [showInput, setShowInput] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [collapseAll, setCollapseAll] = useState(true);
  const [selectedQuarters, setSelectedQuarters] = useState<number[]>([]);
  const [showHotkeysHelp, setShowHotkeysHelp] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true); // Default to Read Only mode
  const [currentView, setCurrentView] = useState<
    "executive" | "budget" | "vendor" | "resources" | "functionalAllocation"
  >("executive"); // Default to Executive Summary
  const navigate = useNavigate();

  // Generate year options dynamically (year-agnostic)
  const yearOptions = React.useMemo(() => {
    const years = [
      { value: 2024, label: "2024", mode: "tracking" },
      { value: 2025, label: "2025", mode: "tracking" },
    ];

    // Add planning year if feature is enabled
    if (isFeatureEnabled("BUDGET_PLANNING")) {
      const planningYear = getNextPlanningYear();
      years.push({
        value: planningYear,
        label: getPlanningYearLabel(planningYear),
        mode: "planning",
      });
    }

    return years;
  }, []);
  // Determine current mode based on selected year
  const currentMode = React.useMemo(() => {
    const selectedYearOption = yearOptions.find(
      (y) => y.value === state.selectedYear
    );
    return selectedYearOption?.mode || "tracking";
  }, [state.selectedYear, yearOptions]);

  // Auto-navigate to planning dashboard when planning year is selected
  React.useEffect(() => {
    if (currentMode === "planning" && isFeatureEnabled("BUDGET_PLANNING")) {
      // Only navigate if we're not already on a planning route
      if (!window.location.pathname.startsWith("/planning")) {
        navigate("/planning");
      }
    }
  }, [currentMode, navigate]);

  // Handle year change with automatic route navigation
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    dispatch({
      type: "SET_SELECTED_PERIOD",
      payload: { year: newYear },
    });

    // Navigation will be handled by the useEffect above
  };

  const handleQuarterToggle = (quarter: number) => {
    setSelectedQuarters((prev) => {
      if (prev.includes(quarter)) {
        return prev.filter((q) => q !== quarter);
      } else {
        return [...prev, quarter].sort();
      }
    });
  };

  const handleEditDataClick = () => {
    // Check if a file is attached
    if (!state.currentFile) {
      // No file attached, force file manager first
      setShowFileManager(true);
      return;
    }
    // File is attached, proceed with edit data
    setShowInput(!showInput);
  };

  const handleFileManagerToEditTransition = () => {
    // Called when user completes file manager and wants to go to edit data
    setShowFileManager(false);
    setShowInput(true);
  };

  // Hotkey handlers
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const { key, ctrlKey, altKey, shiftKey } = event;

      // Help overlay
      if (key === "F1" || (ctrlKey && key === "?")) {
        event.preventDefault();
        setShowHotkeysHelp(!showHotkeysHelp);
        return;
      }

      // Close help overlay with Escape
      if (key === "Escape" && showHotkeysHelp) {
        event.preventDefault();
        setShowHotkeysHelp(false);
        return;
      }

      // View switching
      if (ctrlKey && !altKey && !shiftKey) {
        switch (key) {
          case "m":
          case "M":
            event.preventDefault();
            // Monthly view is now the only view
            break;
          case "e":
          case "E":
            event.preventDefault();
            handleEditDataClick();
            break;
          case "f":
          case "F":
            event.preventDefault();
            setShowFileManager(!showFileManager);
            break;
          case "s":
          case "S":
            event.preventDefault();
            // Cycle through views: executive -> budget -> vendor -> resources -> functionalAllocation -> executive
            if (currentView === "executive") {
              setCurrentView("budget");
            } else if (currentView === "budget") {
              setCurrentView("vendor");
            } else if (currentView === "vendor") {
              setCurrentView("resources");
            } else if (currentView === "resources") {
              setCurrentView("functionalAllocation");
            } else {
              setCurrentView("executive");
            }
            break;
          case "v":
          case "V":
            event.preventDefault();
            setCurrentView("vendor");
            break;
        }
      }

      // Alt key combinations for toggles
      if (altKey && !ctrlKey && !shiftKey) {
        switch (key) {
          case "c":
          case "C":
            event.preventDefault();
            setCollapseAll(!collapseAll);
            break;
          case "q":
          case "Q":
            event.preventDefault();
            // Rotate through quarters: Q1 -> Q2 -> Q3 -> Q4 -> None -> Q1...
            if (selectedQuarters.length === 0) {
              // No quarters selected, start with Q1
              setSelectedQuarters([1]);
            } else if (selectedQuarters.length === 1) {
              const currentQuarter = selectedQuarters[0];
              if (currentQuarter === 4) {
                // Q4 selected, go to none
                setSelectedQuarters([]);
              } else {
                // Q1, Q2, or Q3 selected, go to next quarter
                setSelectedQuarters([currentQuarter + 1]);
              }
            } else {
              // Multiple quarters selected, start fresh with Q1
              setSelectedQuarters([1]);
            }
            break;
        }
      }

      // Year switching with number keys
      if (ctrlKey && !altKey && !shiftKey) {
        switch (key) {
          case "1":
            event.preventDefault();
            if (yearOptions[0]) {
              dispatch({
                type: "SET_SELECTED_PERIOD",
                payload: { year: yearOptions[0].value },
              });
            }
            break;
          case "2":
            event.preventDefault();
            if (yearOptions[1]) {
              dispatch({
                type: "SET_SELECTED_PERIOD",
                payload: { year: yearOptions[1].value },
              });
            }
            break;
          case "3":
            event.preventDefault();
            if (yearOptions[2]) {
              dispatch({
                type: "SET_SELECTED_PERIOD",
                payload: { year: yearOptions[2].value },
              });
            }
            break;
        }
      }

      // Quick close modals with Escape
      if (key === "Escape" && !showHotkeysHelp) {
        if (showInput) {
          event.preventDefault();
          setShowInput(false);
        } else if (showFileManager) {
          event.preventDefault();
          setShowFileManager(false);
        }
      }
    },
    [
      showInput,
      showFileManager,
      collapseAll,
      selectedQuarters,
      showHotkeysHelp,
      currentView,
      state.viewMode,
      dispatch,
      yearOptions,
    ]
  ); // Close input when switching away from Budget view
  useEffect(() => {
    if (currentView !== "budget" && showInput) {
      setShowInput(false);
    }
  }, [currentView, showInput]);

  // Add event listener for hotkeys
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Route guard: Redirect to planning if planning year is selected and we're on the main dashboard
  if (currentMode === "planning" && isFeatureEnabled("BUDGET_PLANNING")) {
    return null; // The useEffect will handle navigation
  }
  return (
    <div className="dashboard">
      {/* Welcome message for new users */}
      {!state.currentFile && (
        <div
          className="welcome-message"
          style={{
            background: "linear-gradient(135deg, #affe76 0%, #023f40 100%)",
            color: "white",
            padding: "15px 20px",
            borderRadius: "8px",
            margin: "0 0 20px 0",
            textAlign: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          {" "}
          <strong>👋 Welcome to Budget Tracker!</strong>
          <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem" }}>
            To get started, click <strong>"💾 File Manager"</strong> below to
            create a new budget file or load an existing one, or click{" "}
            <strong>"✏️ Edit Data"</strong> to begin entering data immediately.
          </p>
        </div>
      )}{" "}
      <div className="dashboard-header">
        <div className={`view-controls ${currentView ? 'has-active-view' : ''}`}>
          <div className="year-selector">
            <label>Year: </label>{" "}
            <div className="year-selector-container">
              {" "}
              <select value={state.selectedYear} onChange={handleYearChange}>
                {yearOptions.map((yearOption) => (
                  <option key={yearOption.value} value={yearOption.value}>
                    {yearOption.label}
                  </option>
                ))}
              </select>
              {/* Mode indicator (only show when planning is enabled) */}
              {isFeatureEnabled("BUDGET_PLANNING") &&
                currentMode === "planning" && (
                  <div className="mode-indicator planning-mode">
                    📋 Planning Mode
                  </div>
                )}{" "}
            </div>
          </div>{" "}
          {/* Navigation buttons */}
          <button
            className={`view-btn ${currentView === "budget" ? "active" : ""}`}
            onClick={() => setCurrentView("budget")}
            title="Budget View"
          >
            Budget
          </button>
          <button
            className={`view-btn ${currentView === "vendor" ? "active" : ""}`}
            onClick={() => setCurrentView("vendor")}
            title="Vendor Management"
            // style={{ display: "none" }} //vendor management display none for now.
          >
            Vendor Management
          </button>
          <button
            className={`view-btn ${currentView === "resources" ? "active" : ""}`}
            onClick={() => setCurrentView("resources")}
            title="Team Allocation"
          >
            Team Allocation
          </button>
          <button
            className={`view-btn ${currentView === "functionalAllocation" ? "active" : ""}`}
            onClick={() => setCurrentView("functionalAllocation")}
            title="Product Allocation"
          >
            Product Allocation
          </button>
          <button
            className={`view-btn ${
              currentView === "executive" ? "active" : ""
            }`}
            onClick={() => setCurrentView("executive")}
            title="Executive Summary"
          >
            Executive Summary
          </button>
        </div>{" "}
        <div className="action-controls">

          <button
            className="file-manager-btn"
            onClick={() => setShowFileManager(!showFileManager)}
            title="Save/Load budget data (Ctrl+F)"
          >
            💾 File Manager <small>(Ctrl+F)</small>
          </button>
          <button
            className="help-btn"
            onClick={() => setShowHotkeysHelp(!showHotkeysHelp)}
            title="Show keyboard shortcuts (F1)"
          >
            ❓ Help <small>(F1)</small>
          </button>
        </div>
      </div>
      <br />
      {showInput && currentView === "budget" && (
        <BudgetInput
          onClose={() => setShowInput(false)}
          onForceFileManager={handleFileManagerToEditTransition}
          isReadOnly={isReadOnly}
        />
      )}{" "}
      {showFileManager && (
        <FileManager onClose={() => setShowFileManager(false)} />
      )}
      {showHotkeysHelp && (
        <div
          className="hotkeys-overlay"
          onClick={() => setShowHotkeysHelp(false)}
        >
          <div className="hotkeys-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hotkeys-header">
              <h2>Keyboard Shortcuts</h2>
              <button
                className="close-btn"
                onClick={() => setShowHotkeysHelp(false)}
                title="Close (Esc)"
              >
                ×
              </button>
            </div>
            <div className="hotkeys-content">
              <div className="hotkeys-section">
                <h3>General</h3>
                <div className="hotkey-item">
                  <span className="hotkey">F1</span>
                  <span className="description">Show/Hide this help</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey">Esc</span>
                  <span className="description">Close modals/help</span>
                </div>
              </div>{" "}
              <div className="hotkeys-section">
                <h3>File Operations</h3>
                <div className="hotkey-item">
                  <span className="hotkey">Ctrl + E</span>
                  <span className="description">Edit/Add Data</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey">Ctrl + F</span>
                  <span className="description">File Manager</span>
                </div>{" "}
                <div className="hotkey-item">
                  <span className="hotkey">Ctrl + S</span>
                  <span className="description">
                    Cycle Views (Executive→Budget→Vendor→Team Allocation→Product Allocation)
                  </span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey">Ctrl + V</span>
                  <span className="description">Vendor Management</span>
                </div>
              </div>
              <div className="hotkeys-section">
                <h3>View Controls</h3>
                <div className="hotkey-item">
                  <span className="hotkey">Alt + C</span>
                  <span className="description">Toggle Collapse All</span>
                </div>{" "}
                <div className="hotkey-item">
                  <span className="hotkey">Alt + Q</span>
                  <span className="description">
                    Rotate Quarters (Q1→Q2→Q3→Q4→None)
                  </span>
                </div>
              </div>
              <div className="hotkeys-section">
                <h3>Year Selection</h3>
                <div className="hotkey-item">
                  <span className="hotkey">Ctrl + 1</span>
                  <span className="description">Switch to first year</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey">Ctrl + 2</span>
                  <span className="description">Switch to second year</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey">Ctrl + 3</span>
                  <span className="description">Switch to third year</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}{" "}
      <div className="dashboard-content">
        {" "}
        {currentView === "budget" && (
          <>
            <div className="budget-controls-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <QuarterSelector
                    selectedQuarters={selectedQuarters}
                    onQuarterToggle={handleQuarterToggle}
                  />
                  <button
                    className="input-btn"
                    onClick={handleEditDataClick}
                    title={
                      isReadOnly ? "View Data (Ctrl+E)" : "Edit/Add Data (Ctrl+E)"
                    }
                  >
                    {showInput
                      ? "Close"
                      : isReadOnly
                      ? "👁️ View Data"
                      : "✏️ Edit Data"}{" "}
                    <small>(Ctrl+E)</small>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="toggle-control">
                    <label className="toggle-label">
                      <span className="toggle-text">
                        {isReadOnly ? "Read Only" : "Edit Mode"}
                      </span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={isReadOnly}
                          onChange={() => setIsReadOnly(!isReadOnly)}
                        />
                        <span className="toggle-slider round"></span>
                      </label>
                    </label>
                  </div>
                  <div className="toggle-control">
                    <label className="toggle-label">
                      <span className="toggle-text">
                        Collapse All <small>(Alt+C)</small>
                      </span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={collapseAll}
                          onChange={() => setCollapseAll(!collapseAll)}
                        />
                        <span className="toggle-slider round"></span>
                      </label>
                    </label>
                  </div>
                  <span className="currency-note">
                    <small>💡 (USD in Thousands)</small>
                  </span>
                </div>
              </div>
            </div>
            <YearlyBudgetDashboard collapseAll={collapseAll} />
            <MonthlyView
              collapseAll={collapseAll}
              selectedQuarters={selectedQuarters}
            />
          </>
        )}
        {currentView === "vendor" && <VendorManagement />}
        {currentView === "resources" && <Resources />}
        {currentView === "functionalAllocation" && <FunctionalAllocation />}
        {currentView === "executive" && <ExecutiveSummary />}
      </div>
    </div>
  );
};

export default Dashboard;
