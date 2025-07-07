import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { TeamData } from "../types";
import { formatCurrencyExcelStyle } from "../utils/currencyFormatter";
import { TableActionButtons } from "./shared";
import "../styles/App-new.css";

const Resources: React.FC = () => {
  const { state, dispatch } = useBudget();

  // Track which rows are in edit mode
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  // State for paste messages
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  // Sort configuration
  const [sortConfig, setSortConfig] = useState<{
    field: keyof TeamData | null;
    direction: "asc" | "desc";
  }>({ field: null, direction: "asc" });

  // Get teams from state
  const teams = state.teams || [];

  // Calculate summary stats
  const totalHeadcount = teams.reduce((sum, team) => sum + team.headcount, 0);
  const totalCost = teams.reduce((sum, team) => sum + team.cost, 0);
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
      return newSet;
    });
  };

  // Add new team
  const handleAddTeam = () => {
    const newTeam: TeamData = {
      id: Date.now().toString(),
      teamName: "",
      currentCostCenter: "",
      location: "",
      headcount: 0,
      cost: 0,
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: "ADD_TEAM", payload: newTeam });
    setEditingRows(new Set([newTeam.id]));

    // Auto-focus on the new row
    setTimeout(() => {
      const firstInput = document.querySelector(
        `tr[data-team-id="${newTeam.id}"] input`
      ) as HTMLInputElement;
      firstInput?.focus();
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
    }
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
          // Expected: Team Name, Current Cost Center, Location, Headcount, Cost, Notes (optional)
          const teamName = cells[0].trim();
          const currentCostCenter = cells[1].trim();
          const location = cells[2]?.trim() || "";
          const headcount = parseInt(cells[3]) || 0;
          const cost = parseFloat(cells[4]) || 0;
          const notes = cells[5]?.trim() || "";

          if (teamName) {
            newTeams.push({
              id: Date.now().toString() + Math.random(),
              teamName,
              currentCostCenter,
              location,
              headcount,
              cost,
              notes,
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
    e: React.KeyboardEvent<HTMLInputElement>,
    teamId: string,
    field: keyof TeamData
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Save and potentially add new row
      toggleEditMode(teamId);
      
      // If this is the last row and Enter was pressed, add a new team
      const teamIndex = sortedTeams.findIndex((t) => t.id === teamId);
      if (teamIndex === sortedTeams.length - 1) {
        handleAddTeam();
      }
    } else if (e.key === "Tab") {
      // Let default tab behavior work
    }
  };

  return (
    <div className="resources-section">
      <div className="resources-header">
        <h2>Team Allocation</h2>
        <p>Track development team headcount and costs</p>
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
          <h3>Total Cost</h3>
          <p className="summary-value">{formatCurrencyExcelStyle(totalCost)}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="table-actions">
        <button onClick={handleAddTeam} className="btn btn-primary">
          Add Team
        </button>
        {pasteMessage && (
          <span className="paste-message success">{pasteMessage}</span>
        )}
      </div>

      {/* Team Table */}
      <div className="table-container" onPaste={handlePaste}>
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
              <th onClick={() => handleSort("currentCostCenter")} className="sortable">
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
                Cost (USD)
                {sortConfig.field === "cost" && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No teams added yet. Click "Add Team" to get started.
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
                        onChange={(e) =>
                          handleUpdateTeam({ ...team, teamName: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, team.id, "teamName")}
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
                      <input
                        type="text"
                        value={team.currentCostCenter}
                        onChange={(e) =>
                          handleUpdateTeam({
                            ...team,
                            currentCostCenter: e.target.value,
                          })
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, team.id, "currentCostCenter")
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
                        onChange={(e) =>
                          handleUpdateTeam({
                            ...team,
                            headcount: parseInt(e.target.value) || 0,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, team.id, "headcount")}
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
                        onChange={(e) =>
                          handleUpdateTeam({
                            ...team,
                            cost: parseFloat(e.target.value) || 0,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, team.id, "cost")}
                        className="table-input number-input"
                      />
                    ) : (
                      <span onClick={() => toggleEditMode(team.id)}>
                        {formatCurrencyExcelStyle(team.cost)}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRows.has(team.id) ? (
                      <input
                        type="text"
                        value={team.notes || ""}
                        onChange={(e) =>
                          handleUpdateTeam({ ...team, notes: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, team.id, "notes")}
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
                      editTooltip={editingRows.has(team.id) ? "Save team" : "Edit team"}
                      deleteTooltip={teams.length <= 1 ? "Cannot delete the last team" : "Delete team"}
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
          <strong>Tip:</strong> You can paste data from Excel. Copy rows with
          columns: Team Name, Current Cost Center, Location, Headcount, Cost, Notes (optional)
        </p>
      </div>
    </div>
  );
};

export default Resources;