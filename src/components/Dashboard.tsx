import React, { useState, useEffect, useCallback } from "react";
import { useBudget } from "../context/BudgetContext";
import MonthlyView from "./MonthlyView";
import QuarterSelector from "./QuarterSelector";
import BudgetInput from "./BudgetInput";
import AlertPanel from "./AlertPanel";
import FileManager from "./FileManager";
import YearlyBudgetDashboard from "./YearlyBudgetDashboard";
import {
  exportToCSV,
  downloadCSV,
  generateSummaryReport,
} from "../utils/dataExport";
import "../styles/App.css";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

  const handleExportCSV = () => {
    const csvContent = exportToCSV(state.entries, state.categories);
    downloadCSV(csvContent, `budget-data-${state.selectedYear}.csv`);
  };

  const handleExportReport = () => {
    const report = generateSummaryReport(
      state.entries,
      state.categories,
      state.selectedYear
    );
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-report-${state.selectedYear}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
            handleExportCSV();
            break;
          case "r":
          case "R":
            event.preventDefault();
            handleExportReport();
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
          case "t":
          case "T":
            event.preventDefault();
            // Toggle current quarter on/off for quick access
            const currentQuarter = getCurrentQuarter();
            if (selectedQuarters.includes(currentQuarter)) {
              setSelectedQuarters(
                selectedQuarters.filter((q) => q !== currentQuarter)
              );
            } else {
              setSelectedQuarters([currentQuarter]);
            }
            break;
        }
      }

      // Year switching with number keys
      if (ctrlKey && !altKey && !shiftKey) {
        switch (key) {
          case "1":
            event.preventDefault();
            dispatch({ type: "SET_SELECTED_PERIOD", payload: { year: 2024 } });
            break;
          case "2":
            event.preventDefault();
            dispatch({ type: "SET_SELECTED_PERIOD", payload: { year: 2025 } });
            break;
          case "3":
            event.preventDefault();
            dispatch({ type: "SET_SELECTED_PERIOD", payload: { year: 2026 } });
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
      state.viewMode,
      dispatch,
    ]
  );

  // Add event listener for hotkeys
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="dashboard">
      {/* Executive Summary Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      ></div>

      <div className="dashboard-header">
        <div className="view-controls">
          <div className="year-selector">
            <label>Year: </label>
            <select
              value={state.selectedYear}
              onChange={(e) =>
                dispatch({
                  type: "SET_SELECTED_PERIOD",
                  payload: { year: parseInt(e.target.value) },
                })
              }
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <button className={`view-btn active`} title="Monthly View">
            Monthly View
          </button>
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
          <QuarterSelector
            selectedQuarters={selectedQuarters}
            onQuarterToggle={handleQuarterToggle}
          />
        </div>

        <div className="action-controls">
          <button
            className="executive-summary-btn"
            onClick={() => navigate("/executive-summary")}
            title="View Executive Summary"
            style={{
              background: "#2d3a4a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "0.7rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            Executive Summary
          </button>
          <button
            className="input-btn"
            onClick={handleEditDataClick}
            title="Edit/Add Data (Ctrl+E)"
          >
            {showInput ? "Close" : "✏️ Edit Data"} <small>(Ctrl+E)</small>
          </button>
          <button
            className="file-manager-btn"
            onClick={() => setShowFileManager(!showFileManager)}
            title="Save/Load budget data (Ctrl+F)"
          >
            💾 File Manager <small>(Ctrl+F)</small>
          </button>
          <button
            className="export-btn"
            onClick={handleExportCSV}
            title="Export data to CSV (Ctrl+S)"
          >
            📊 Export CSV <small>(Ctrl+S)</small>
          </button>
          <button
            className="export-btn"
            onClick={handleExportReport}
            title="Generate summary report (Ctrl+R)"
          >
            📋 Report <small>(Ctrl+R)</small>
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
      <AlertPanel />

      {showInput && (
        <BudgetInput
          onClose={() => setShowInput(false)}
          onForceFileManager={handleFileManagerToEditTransition}
        />
      )}
      {showFileManager && (
        <FileManager onClose={() => setShowFileManager(false)} />
      )}

      <div className="dashboard-content">
        <div className="currency-note">
          <small>💡 (USD in Thousands)</small>
        </div>

        {/* Yearly Budget Dashboard */}
        <YearlyBudgetDashboard collapseAll={collapseAll} />

        <MonthlyView
          collapseAll={collapseAll}
          selectedQuarters={selectedQuarters}
        />
      </div>
    </div>
  );
};

export default Dashboard;
