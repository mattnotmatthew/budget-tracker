import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { TeamData } from "../types";
import { formatCurrencyFull } from "../utils/currencyFormatter";
import { getLastFinalMonthNumber } from "../utils/monthUtils";
import { TableActionButtons } from "./shared";
import { useCopyToNextMonth } from "../hooks/useCopyToNextMonth";
import "../styles/App-new.css";

const Resources: React.FC = () => {
  const { state, dispatch } = useBudget();

  // Use the reusable copy to next month hook
  const {
    copyToNextMonth,
    pasteMessage: copyPasteMessage,
    setPasteMessage: setCopyPasteMessage,
  } = useCopyToNextMonth<TeamData>();

  // Track which rows are in edit mode (changed from single editingId to Set)
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  // State for edit all mode
  const [isEditAllMode, setIsEditAllMode] = useState<boolean>(false);

  // State for paste messages (separate from copy messages)
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  // Month selection state - default to last final month
  const [selectedMonth, setSelectedMonth] = useState<number>(
    getLastFinalMonthNumber(state)
  );

  // Sort configuration
  const [sortConfig, setSortConfig] = useState<{
    field: keyof TeamData | null;
    direction: "asc" | "desc";
  }>({ field: null, direction: "asc" });

  // Month names for dropdown
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Filter teams for selected month and year
  const allTeams = state.teams || [];

  // Filter out incomplete team data and get teams for selected month/year
  const monthTeams = allTeams.filter((team) => {
    // Validate that team has required fields to prevent corrupted data issues
    const hasRequiredFields =
      team &&
      typeof team === "object" &&
      team.id &&
      typeof team.month === "number" &&
      typeof team.year === "number" &&
      team.teamName !== undefined; // teamName can be empty string but should exist

    return (
      hasRequiredFields &&
      team.month === selectedMonth &&
      team.year === state.selectedYear
    );
  });

  // Get teams from filtered month teams
  const teams = monthTeams;

  // Calculate summary stats
  const totalHeadcount = teams.reduce((sum, team) => sum + team.headcount, 0);
  const totalCost = teams.reduce((sum, team) => sum + team.cost, 0);
  const totalMonthlyCost = teams.reduce((sum, team) => sum + team.cost / 12, 0);
  const teamCount = teams.length;

  // Sort teams
  const sortTeams = (
    teamsToSort: TeamData[],
    config: { field: keyof TeamData | null; direction: "asc" | "desc" }
  ) => {
    if (!config.field) return teamsToSort;

    return [...teamsToSort].sort((a, b) => {
      const aValue = a[config.field!];
      const bValue = b[config.field!];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return config.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue || "").toLowerCase();
      const bStr = String(bValue || "").toLowerCase();

      return config.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  // Get sorted teams
  const sortedTeams = sortTeams(teams, sortConfig);

  // Handle sort click
  const handleSort = (field: keyof TeamData) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Toggle edit mode for a row
  const toggleEditMode = (id: string) => {
    setEditingRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }

      // Update edit all mode state based on how many rows are being edited
      const updatedSet = newSet;
      const allTeamIds = sortedTeams.map((team) => team.id);

      // If all rows are now in edit mode, set isEditAllMode to true
      if (
        allTeamIds.every((teamId) => updatedSet.has(teamId)) &&
        allTeamIds.length > 1
      ) {
        setIsEditAllMode(true);
      } else {
        // If not all rows are in edit mode, set isEditAllMode to false
        setIsEditAllMode(false);
      }

      return newSet;
    });
  };

  // Toggle all rows between edit and read-only mode
  const toggleEditAllMode = () => {
    if (isEditAllMode) {
      // Save all mode - remove all rows from editing
      setEditingRows(new Set());
      setIsEditAllMode(false);
    } else {
      // Edit all mode - add all rows to editing
      const allTeamIds = sortedTeams.map((team) => team.id);
      setEditingRows(new Set(allTeamIds));
      setIsEditAllMode(true);
    }
  };

  // Add new team
  const handleAddTeam = () => {
    const newTeam: TeamData = {
      id: Date.now().toString(),
      teamName: "",
      category: "",
      currentCostCenter: "",
      location: "",
      headcount: 0,
      cost: 0,
      notes: "",
      year: state.selectedYear,
      month: selectedMonth,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: "ADD_TEAM", payload: newTeam });
    setEditingRows(new Set([newTeam.id]));
    setIsEditAllMode(false); // Reset edit all mode when adding a new team

    // Auto-focus on the new row - first field
    setTimeout(() => {
      const firstInput = document.querySelector(
        `input[data-team-id="${newTeam.id}"][data-field="teamName"]`
      ) as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 100);
  };

  // Update team
  const handleUpdateTeam = (updatedTeam: TeamData) => {
    dispatch({
      type: "UPDATE_TEAM",
      payload: { ...updatedTeam, updatedAt: new Date() },
    });
  };

  // Delete team
  const handleDeleteTeam = (id: string) => {
    // Prevent deletion if it's the last team
    if (teams.length <= 1) {
      alert("Cannot delete the last team");
      return;
    }

    if (confirm("Are you sure you want to delete this team?")) {
      dispatch({ type: "DELETE_TEAM", payload: id });

      // Remove the deleted team from editing rows and update edit all mode
      setEditingRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      // Reset edit all mode after deletion
      setIsEditAllMode(false);
    }
  };

  // Clean Excel number formats
  const cleanExcelNumber = (value: string): number => {
    if (!value || value === "-" || value === "") return 0;

    // Remove common Excel formatting
    let cleaned = value
      .replace(/[$,\s]/g, "") // Remove $ signs, commas, and spaces
      .replace(/^\((.+)\)$/, "-$1") // Convert (123) to -123 for negatives
      .replace(/[()]/g, "") // Remove any remaining parentheses
      .trim();

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Handle multi-row paste from Excel (for vertical column pasting)
  const handleMultiRowPaste = async (
    e: React.ClipboardEvent<HTMLInputElement | HTMLSelectElement>,
    teamId: string,
    field: keyof TeamData
  ) => {
    e.preventDefault();

    try {
      const pasteData = e.clipboardData.getData("text");
      const lines = pasteData.split("\n").filter((line) => line.trim() !== "");

      if (lines.length === 0) return;

      const startTeamIndex = sortedTeams.findIndex(
        (team) => team.id === teamId
      );
      if (startTeamIndex === -1) return;

      let successCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const targetTeamIndex = startTeamIndex + i;
        let targetTeam = sortedTeams[targetTeamIndex];

        // If we don't have enough rows, create new ones
        if (!targetTeam) {
          handleAddTeam();
          // Wait for new rows to be created and get updated list
          await new Promise((resolve) => setTimeout(resolve, 100));
          // Get the newly created team (it will be the last one added)
          const updatedSortedTeams = sortTeams(teams, sortConfig);
          targetTeam = updatedSortedTeams[updatedSortedTeams.length - 1];
        }

        if (!targetTeam) continue;

        let value = lines[i].trim();
        let processedValue: any = value;

        // Process the value based on field type
        if (field === "headcount") {
          processedValue = Math.round(cleanExcelNumber(value));
        } else if (field === "cost") {
          processedValue = cleanExcelNumber(value);
        } else if (
          field === "teamName" ||
          field === "category" ||
          field === "currentCostCenter" ||
          field === "location" ||
          field === "notes"
        ) {
          // For text fields, use the text as-is
          processedValue = value;
        }

        // Update the team
        handleUpdateTeam({ ...targetTeam, [field]: processedValue });
        successCount++;
      }

      if (successCount > 0) {
        setPasteMessage(`✅ Pasted ${successCount} values successfully!`);
        setTimeout(() => setPasteMessage(null), 3000);
      } else {
        setPasteMessage(`⚠️ Paste failed - no valid values found`);
        setTimeout(() => setPasteMessage(null), 3000);
      }
    } catch (error) {
      setPasteMessage(`⚠️ Paste failed`);
      setTimeout(() => setPasteMessage(null), 3000);
    }
  };

  // Handle single field paste from Excel (fallback for simple cases)
  const handleFieldPaste = (
    e: React.ClipboardEvent,
    teamId: string,
    field: keyof TeamData
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const team = teams.find((t) => t.id === teamId);

    if (!team) return;

    let processedValue: any = pastedData.trim();

    // Process based on field type
    if (field === "headcount") {
      processedValue = Math.round(cleanExcelNumber(pastedData));
    } else if (field === "cost") {
      processedValue = cleanExcelNumber(pastedData);
    }

    // Update the team
    handleUpdateTeam({ ...team, [field]: processedValue });

    // Show paste message
    setPasteMessage("Excel data pasted!");
    setTimeout(() => setPasteMessage(null), 3000);
  };

  // Handle paste from Excel
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const rows = pastedData.trim().split("\n");

    try {
      const newTeams: TeamData[] = [];

      rows.forEach((row) => {
        const cells = row.split("\t");
        if (cells.length >= 4) {
          // Expected: Team Name, Category, Current Cost Center, Location, Headcount, Cost, Notes (optional)
          const teamName = cells[0].trim();
          const category = cells[1]?.trim() || "";
          const currentCostCenter = cells[2].trim();
          const location = cells[3]?.trim() || "";
          const headcount = parseInt(cells[4]) || 0;
          const cost = parseFloat(cells[5]) || 0;
          const notes = cells[6]?.trim() || "";

          if (teamName) {
            newTeams.push({
              id: Date.now().toString() + Math.random(),
              teamName,
              category,
              currentCostCenter,
              location,
              headcount,
              cost,
              notes,
              year: state.selectedYear,
              month: selectedMonth,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      });

      if (newTeams.length > 0) {
        newTeams.forEach((team) => {
          dispatch({ type: "ADD_TEAM", payload: team });
        });
        setPasteMessage(`Successfully added ${newTeams.length} teams`);
        setTimeout(() => setPasteMessage(null), 3000);
      }
    } catch (error) {
      setPasteMessage("Error parsing pasted data");
      setTimeout(() => setPasteMessage(null), 3000);
    }
  };

  // Handle key down for navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    teamId: string,
    currentField: keyof TeamData
  ) => {
    // Field order for navigation
    const fieldTypes: (keyof TeamData)[] = [
      "teamName",
      "category",
      "currentCostCenter",
      "location",
      "headcount",
      "cost",
      "notes",
    ];

    const currentTeamIndex = sortedTeams.findIndex((t) => t.id === teamId);
    const currentFieldIndex = fieldTypes.indexOf(currentField);

    if (currentTeamIndex === -1 || currentFieldIndex === -1) return;

    let targetTeamIndex = currentTeamIndex;
    let targetFieldIndex = currentFieldIndex;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        // Enter moves to next row, same field
        if (currentTeamIndex === sortedTeams.length - 1) {
          // At last row, add new team
          handleAddTeam();
          // Focus will be set in handleAddTeam
          return;
        }
        targetTeamIndex = currentTeamIndex + 1;
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab moves left/up
          if (currentFieldIndex > 0) {
            targetFieldIndex = currentFieldIndex - 1;
          } else if (currentTeamIndex > 0) {
            targetTeamIndex = currentTeamIndex - 1;
            targetFieldIndex = fieldTypes.length - 1;
          }
        } else {
          // Tab moves right/down
          if (currentFieldIndex < fieldTypes.length - 1) {
            targetFieldIndex = currentFieldIndex + 1;
          } else if (currentTeamIndex < sortedTeams.length - 1) {
            targetTeamIndex = currentTeamIndex + 1;
            targetFieldIndex = 0;
          } else {
            // At last cell, add new row and move to first field
            handleAddTeam();
            return;
          }
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (currentTeamIndex < sortedTeams.length - 1) {
          targetTeamIndex = currentTeamIndex + 1;
        } else {
          // At last row, add new team
          handleAddTeam();
          return;
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        targetTeamIndex = Math.max(currentTeamIndex - 1, 0);
        break;
      case "ArrowRight":
        e.preventDefault();
        targetFieldIndex = Math.min(
          currentFieldIndex + 1,
          fieldTypes.length - 1
        );
        break;
      case "ArrowLeft":
        e.preventDefault();
        targetFieldIndex = Math.max(currentFieldIndex - 1, 0);
        break;
      default:
        return; // Don't handle other keys
    }

    // Focus the target input
    const targetTeam = sortedTeams[targetTeamIndex];
    const targetField = fieldTypes[targetFieldIndex];

    if (targetTeam) {
      // Ensure target row is in edit mode
      if (!editingRows.has(targetTeam.id)) {
        toggleEditMode(targetTeam.id);
      }

      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        const targetInput = document.querySelector(
          `input[data-team-id="${targetTeam.id}"][data-field="${targetField}"], select[data-team-id="${targetTeam.id}"][data-field="${targetField}"]`
        ) as HTMLInputElement | HTMLSelectElement;
        if (targetInput) {
          targetInput.focus();
          // Only select text for text inputs, not selects
          if (targetInput.type !== "select-one") {
            (targetInput as HTMLInputElement).select();
          }
        }
      }, 50);
    }
  };

  // Copy teams to next month using the reusable hook
  const handleCopyToNextMonth = () => {
    copyToNextMonth({
      items: teams,
      selectedMonth,
      selectedYear: state.selectedYear,
      allItems: allTeams,
      getItemKey: (team) => team.id,
      createCopiedItem: (team, nextMonth, nextYear) => ({
        ...team,
        id: Date.now().toString() + Math.random(), // Generate new ID
        month: nextMonth,
        year: nextYear,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      addItem: (team) => dispatch({ type: "ADD_TEAM", payload: team }),
      itemTypeName: "teams",
      itemDisplayName: "teams",
    });
  };

  return (
    <div className="resources-section">
      <div className="resources-header">
        <div>
          <h2>Team Costs</h2>
          <p>Track development team headcount and costs</p>
        </div>
        <div className="header-controls">
          <div className="month-selector">
            <label>Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="form-select"
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month} {state.selectedYear}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="resources-summary">
        <div className="summary-card">
          <h3>Total Teams</h3>
          <p className="summary-value">{teamCount}</p>
        </div>
        <div className="summary-card">
          <h3>Total Headcount</h3>
          <p className="summary-value">{totalHeadcount}</p>
        </div>
        <div className="summary-card">
          <h3>Total Annual Cost</h3>
          <p className="summary-value">{formatCurrencyFull(totalCost)}</p>
          <p className="summary-subtitle">
            as of {monthNames[selectedMonth - 1]}
          </p>
        </div>
        <div className="summary-card">
          <h3>Total Monthly Cost</h3>
          <p className="summary-value">
            {formatCurrencyFull(totalMonthlyCost)}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="table-actions">
        <button onClick={handleAddTeam} className="btn btn-primary">
          Add Team
        </button>
        {teams.length > 1 && (
          <button
            onClick={toggleEditAllMode}
            className={`btn ${isEditAllMode ? "btn-success" : "btn-secondary"}`}
          >
            {isEditAllMode ? "Save All" : "Edit All"}
          </button>
        )}
        <button onClick={handleCopyToNextMonth} className="btn btn-info">
          Copy to Next Month
        </button>
        {(pasteMessage || copyPasteMessage) && (
          <span className="paste-message success">
            {pasteMessage || copyPasteMessage}
          </span>
        )}
      </div>

      {/* Team Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("teamName")} className="sortable">
                Team Name
                {sortConfig.field === "teamName" && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort("category")} className="sortable">
                Category
                {sortConfig.field === "category" && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("currentCostCenter")}
                className="sortable"
              >
                Current Cost Center
                {sortConfig.field === "currentCostCenter" && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort("location")} className="sortable">
                Location
                {sortConfig.field === "location" && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort("headcount")} className="sortable">
                Headcount
                {sortConfig.field === "headcount" && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort("cost")} className="sortable">
                Annual Salary (USD)
                {sortConfig.field === "cost" && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th>Month Cost</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state">
                  No teams added for {monthNames[selectedMonth - 1]}{" "}
                  {state.selectedYear}. Click "Add Team" to get started.
                </td>
              </tr>
            ) : (
              sortedTeams.map((team) => (
                <tr key={team.id} data-team-id={team.id}>
                  <td>
                    {editingRows.has(team.id) ? (
                      <input
                        type="text"
                        value={team.teamName}
                        data-team-id={team.id}
                        data-field="teamName"
                        onChange={(e) =>
                          handleUpdateTeam({
                            ...team,
                            teamName: e.target.value,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, team.id, "teamName")}
                        onPaste={(e) =>
                          handleMultiRowPaste(e, team.id, "teamName")
                        }
                        className="table-input"
                      />
                    ) : (
                      <span onClick={() => toggleEditMode(team.id)}>
                        {team.teamName || "-"}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRows.has(team.id) ? (
                      <select
                        value={team.category || ""}
                        data-team-id={team.id}
                        data-field="category"
                        onChange={(e) => {
                          dispatch({
                            type: "UPDATE_TEAM",
                            payload: {
                              ...team,
                              category: e.target.value,
                              updatedAt: new Date(),
                            },
                          });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, team.id, "category")}
                        onPaste={(e) =>
                          handleMultiRowPaste(e, team.id, "category")
                        }
                        className="vendor-select"
                      >
                        <option value="">Select category</option>
                        <option value="Application Engineering">
                          Application Engineering
                        </option>
                        <option value="Architecture">Architecture</option>
                        <option value="DevOps">DevOps</option>
                        <option value="Implementation/Support">
                          Implementation/Support
                        </option>
                        <option value="Management">Management</option>
                        <option value="Platform Engineering">
                          Platform Engineering
                        </option>
                        <option value="QA">QA</option>
                        <option value="UI/UX">UI/UX</option>
                        <option value="Data Engineering">
                          Data Engineering
                        </option>
                      </select>
                    ) : (
                      <span
                        className="editable-cell"
                        onClick={() => toggleEditMode(team.id)}
                        title={team.category || "Click to edit"}
                      >
                        {team.category || "-"}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRows.has(team.id) ? (
                      <input
                        type="text"
                        value={team.currentCostCenter}
                        data-team-id={team.id}
                        data-field="currentCostCenter"
                        onChange={(e) =>
                          handleUpdateTeam({
                            ...team,
                            currentCostCenter: e.target.value,
                          })
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, team.id, "currentCostCenter")
                        }
                        onPaste={(e) =>
                          handleMultiRowPaste(e, team.id, "currentCostCenter")
                        }
                        className="table-input"
                      />
                    ) : (
                      <span onClick={() => toggleEditMode(team.id)}>
                        {team.currentCostCenter || "-"}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRows.has(team.id) ? (
                      <select
                        value={team.location || ""}
                        data-team-id={team.id}
                        data-field="location"
                        onChange={(e) => {
                          dispatch({
                            type: "UPDATE_TEAM",
                            payload: {
                              ...team,
                              location: e.target.value,
                              updatedAt: new Date(),
                            },
                          });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, team.id, "location")}
                        className="vendor-select"
                      >
                        <option value="">Select location</option>
                        <option value="US">US</option>
                        <option value="India">India</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    ) : (
                      <span
                        className="editable-cell"
                        onClick={() => toggleEditMode(team.id)}
                        title={team.location || "Click to edit"}
                      >
                        {team.location || "-"}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRows.has(team.id) ? (
                      <input
                        type="number"
                        value={team.headcount}
                        data-team-id={team.id}
                        data-field="headcount"
                        onChange={(e) =>
                          handleUpdateTeam({
                            ...team,
                            headcount: parseInt(e.target.value) || 0,
                          })
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, team.id, "headcount")
                        }
                        onPaste={(e) =>
                          handleMultiRowPaste(e, team.id, "headcount")
                        }
                        className="table-input number-input"
                      />
                    ) : (
                      <span onClick={() => toggleEditMode(team.id)}>
                        {team.headcount}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRows.has(team.id) ? (
                      <input
                        type="number"
                        value={team.cost}
                        data-team-id={team.id}
                        data-field="cost"
                        onChange={(e) =>
                          handleUpdateTeam({
                            ...team,
                            cost: parseFloat(e.target.value) || 0,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, team.id, "cost")}
                        onPaste={(e) => handleMultiRowPaste(e, team.id, "cost")}
                        className="table-input number-input"
                      />
                    ) : (
                      <span onClick={() => toggleEditMode(team.id)}>
                        {formatCurrencyFull(team.cost)}
                      </span>
                    )}
                  </td>
                  <td>
                    <span>{formatCurrencyFull(team.cost / 12)}</span>
                  </td>
                  <td>
                    {editingRows.has(team.id) ? (
                      <input
                        type="text"
                        value={team.notes || ""}
                        data-team-id={team.id}
                        data-field="notes"
                        onChange={(e) =>
                          handleUpdateTeam({ ...team, notes: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, team.id, "notes")}
                        onPaste={(e) =>
                          handleMultiRowPaste(e, team.id, "notes")
                        }
                        className="table-input"
                      />
                    ) : (
                      <span onClick={() => toggleEditMode(team.id)}>
                        {team.notes || "-"}
                      </span>
                    )}
                  </td>
                  <td>
                    <TableActionButtons
                      isEditing={editingRows.has(team.id)}
                      onEdit={() => toggleEditMode(team.id)}
                      onDelete={() => handleDeleteTeam(team.id)}
                      editTooltip={
                        editingRows.has(team.id) ? "Save team" : "Edit team"
                      }
                      deleteTooltip={
                        teams.length <= 1
                          ? "Cannot delete the last team"
                          : "Delete team"
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="resources-help">
        <p>
          <strong>Tip:</strong> Teams are tracked by month. You can paste data
          from Excel in two ways:
        </p>
        <ul>
          <li>
            <strong>Full rows:</strong> Copy rows with columns: Team Name,
            Category, Current Cost Center, Location, Headcount, Annual Salary,
            Notes (optional)
          </li>
          <li>
            <strong>Column values:</strong> Copy a column of values (A1, A2, A3,
            A4) and paste into any field to fill multiple rows vertically
          </li>
        </ul>
        <p>
          <strong>Keyboard Navigation:</strong> Use Tab/Shift+Tab to move
          between fields, Enter/↓ to move to next row, ↑ to move to previous
          row, ←→ to move between columns.
        </p>
      </div>
    </div>
  );
};

export default React.memo(Resources);
