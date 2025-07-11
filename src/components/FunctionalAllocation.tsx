import React, { useState, useEffect, useRef } from "react";
import { useBudget } from "../context/BudgetContext";
import { FunctionalAllocation as FunctionalAllocationType } from "../types";
import { getLastFinalMonthNumber } from "../utils/monthUtils";
import TableActionButtons from "./shared/TableActionButtons";
import "../styles/components/functional-allocation.css";

const FunctionalAllocation: React.FC = () => {
  const { state, dispatch } = useBudget();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    getLastFinalMonthNumber(state)
  );
  // Track which rows are in edit mode (changed from single editingId to Set)
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // State for paste messages
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Get unique teams from Resources
  const uniqueTeams = Array.from(
    new Set(state.teams?.map((team) => team.teamName) || [])
  ).sort();

  // Get unique cost centers from Resources
  const uniqueCostCenters = Array.from(
    new Set(state.teams?.map((team) => team.currentCostCenter) || [])
  ).sort();

  // Filter allocations for selected month and year
  const monthAllocations =
    state.functionalAllocations?.filter(
      (allocation) =>
        allocation.month === selectedMonth &&
        allocation.year === state.selectedYear
    ) || [];

  // Calculate total cost and validation status
  const totalCost = monthAllocations.reduce(
    (sum, allocation) => sum + allocation.cost,
    0
  );

  // Group allocations by team to check if each team's percentages sum to 100%
  const teamValidation = monthAllocations.reduce((acc, allocation) => {
    if (!acc[allocation.teamName]) {
      acc[allocation.teamName] = 0;
    }
    acc[allocation.teamName] += allocation.percentOfWork;
    return acc;
  }, {} as { [teamName: string]: number });

  const validationErrors = Object.entries(teamValidation)
    .filter(([_, percentage]) => Math.abs(percentage - 100) > 0.01)
    .map(([teamName, percentage]) => ({
      teamName,
      percentage: percentage.toFixed(2),
    }));

  const isValid = validationErrors.length === 0;

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

  const handleAddAllocation = () => {
    const newAllocation: FunctionalAllocationType = {
      id: `fa-${Date.now()}`,
      year: state.selectedYear,
      month: selectedMonth,
      teamName: "",
      function: "Development",
      currentCostCenter: "",
      product: "",
      cost: 0,
      percentOfWork: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({
      type: "ADD_FUNCTIONAL_ALLOCATION",
      payload: newAllocation,
    });

    // Add the new allocation to existing editing rows instead of replacing them
    setEditingRows((prev) => {
      const newSet = new Set(prev);
      newSet.add(newAllocation.id);
      return newSet;
    });

    // Auto-focus on the new row - first field
    setTimeout(() => {
      const firstInput = document.querySelector(
        `input[data-allocation-id="${newAllocation.id}"][data-field="product"]`
      ) as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  };

  const handleUpdateAllocation = (allocation: FunctionalAllocationType) => {
    dispatch({
      type: "UPDATE_FUNCTIONAL_ALLOCATION",
      payload: {
        ...allocation,
        updatedAt: new Date(),
      },
    });
  };

  const handleDeleteAllocation = (id: string) => {
    if (window.confirm("Are you sure you want to delete this allocation?")) {
      dispatch({
        type: "DELETE_FUNCTIONAL_ALLOCATION",
        payload: id,
      });
    }
  };

  const handleFieldChange = (
    id: string,
    field: keyof FunctionalAllocationType,
    value: any
  ) => {
    const allocation = monthAllocations.find((a) => a.id === id);
    if (!allocation) return;

    let updatedAllocation = { ...allocation, [field]: value };

    // If team is selected, automatically update the cost from Resources
    if (field === "teamName") {
      const monthlyCost = getTeamMonthlyCost(value);
      updatedAllocation = { ...updatedAllocation, cost: monthlyCost };
    }

    // Validate the field
    if (field === "percentOfWork" && (value < 0 || value > 100)) {
      setErrors({
        ...errors,
        [`${id}-${field}`]: "Percentage must be between 0 and 100",
      });
      return;
    } else if (field === "cost" && value < 0) {
      setErrors({ ...errors, [`${id}-${field}`]: "Cost cannot be negative" });
      return;
    } else {
      const newErrors = { ...errors };
      delete newErrors[`${id}-${field}`];
      setErrors(newErrors);
    }

    handleUpdateAllocation(updatedAllocation);
  };

  const calculateCostPer = (allocation: FunctionalAllocationType): number => {
    return (allocation.percentOfWork / 100) * allocation.cost;
  };

  // Handle Excel paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");

    if (!text.trim()) return;

    const rows = text.split("\n").filter((row) => row.trim());
    if (rows.length === 0) return;

    const newAllocations: FunctionalAllocationType[] = [];

    rows.forEach((row, index) => {
      const cells = row.split("\t");

      // Expected columns: Product, Team, Function, Cost Center, Cost, % of Work
      if (cells.length >= 6) {
        const product = cells[0].trim();
        const teamName = cells[1].trim();
        const functionValue = cells[2].trim();
        const costCenter = cells[3].trim();
        // Cost will be automatically set from Resources component
        const percentOfWork =
          parseFloat(cells[5].replace(/[^0-9.-]/g, "")) || 0;

        // Get the monthly cost from Resources component
        const monthlyCost = getTeamMonthlyCost(teamName);

        // Validate function value
        const validFunctions = [
          "Development",
          "Infrastructure",
          "Revenue",
          "Support",
        ];
        const normalizedFunction =
          validFunctions.find(
            (f) => f.toLowerCase() === functionValue.toLowerCase()
          ) || "Development";

        const newAllocation: FunctionalAllocationType = {
          id: `fa-${Date.now()}-${index}`,
          year: state.selectedYear,
          month: selectedMonth,
          teamName,
          function: normalizedFunction as
            | "Development"
            | "Infrastructure"
            | "Revenue"
            | "Support",
          currentCostCenter: costCenter,
          product,
          cost: monthlyCost, // Use monthly cost from Resources
          percentOfWork,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        newAllocations.push(newAllocation);
      }
    });

    if (newAllocations.length > 0) {
      // Add all new allocations
      newAllocations.forEach((allocation) => {
        dispatch({
          type: "ADD_FUNCTIONAL_ALLOCATION",
          payload: allocation,
        });
      });

      alert(`Successfully pasted ${newAllocations.length} allocation(s)`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Product",
      "Team",
      "Function",
      "Current Cost Center",
      "Cost ($k)",
      "% of Work",
      "Cost Per ($k)",
    ];
    const rows = monthAllocations.map((allocation) => [
      allocation.product,
      allocation.teamName,
      allocation.function,
      allocation.currentCostCenter,
      allocation.cost.toString(),
      allocation.percentOfWork.toString(),
      calculateCostPer(allocation).toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-allocation-${monthNames[selectedMonth - 1]}-${
      state.selectedYear
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get team's monthly cost from Resources component
  const getTeamMonthlyCost = (teamName: string): number => {
    if (!teamName) return 0;

    const team = state.teams?.find(
      (team) =>
        team.teamName === teamName &&
        team.month === selectedMonth &&
        team.year === state.selectedYear
    );

    return team ? team.cost / 12 : 0; // Convert annual cost to monthly cost
  };

  // Update costs when month changes
  useEffect(() => {
    // Update costs for all allocations when the month changes
    monthAllocations.forEach((allocation) => {
      if (allocation.teamName) {
        const newMonthlyCost = getTeamMonthlyCost(allocation.teamName);
        if (newMonthlyCost !== allocation.cost) {
          handleUpdateAllocation({
            ...allocation,
            cost: newMonthlyCost,
          });
        }
      }
    });
  }, [selectedMonth, state.selectedYear]);

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
    allocationId: string,
    field: keyof FunctionalAllocationType
  ) => {
    e.preventDefault();

    try {
      const pasteData = e.clipboardData.getData("text");
      const lines = pasteData.split("\n").filter((line) => line.trim() !== "");

      if (lines.length === 0) return;

      const startAllocationIndex = monthAllocations.findIndex(
        (allocation) => allocation.id === allocationId
      );
      if (startAllocationIndex === -1) return;

      let successCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const targetAllocationIndex = startAllocationIndex + i;

        // Check if we have an existing row at this index
        if (targetAllocationIndex < monthAllocations.length) {
          // Use existing row
          const targetAllocation = monthAllocations[targetAllocationIndex];

          let value = lines[i].trim();
          let processedValue: any = value;

          // Process the value based on field type
          if (field === "percentOfWork") {
            processedValue =
              parseFloat(cleanExcelNumber(value).toString()) || 0;
          } else if (
            field === "teamName" ||
            field === "function" ||
            field === "currentCostCenter" ||
            field === "product"
          ) {
            // For text fields, use the text as-is
            processedValue = value;
          }

          // Update the allocation
          handleFieldChange(targetAllocation.id, field, processedValue);
          successCount++;
        } else {
          // Only create new rows if we're pasting beyond existing rows
          handleAddAllocation();
          // Wait for new rows to be created
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Get the newly created allocation (it will be the last one added)
          const updatedAllocations =
            state.functionalAllocations?.filter(
              (allocation) =>
                allocation.month === selectedMonth &&
                allocation.year === state.selectedYear
            ) || [];
          const newAllocation =
            updatedAllocations[updatedAllocations.length - 1];

          if (newAllocation) {
            let value = lines[i].trim();
            let processedValue: any = value;

            // Process the value based on field type
            if (field === "percentOfWork") {
              processedValue =
                parseFloat(cleanExcelNumber(value).toString()) || 0;
            } else if (
              field === "teamName" ||
              field === "function" ||
              field === "currentCostCenter" ||
              field === "product"
            ) {
              // For text fields, use the text as-is
              processedValue = value;
            }

            // Update the allocation
            handleFieldChange(newAllocation.id, field, processedValue);
            successCount++;
          }
        }
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
    allocationId: string,
    field: keyof FunctionalAllocationType
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const allocation = monthAllocations.find((a) => a.id === allocationId);

    if (!allocation) return;

    let processedValue: any = pastedData.trim();

    // Process based on field type
    if (field === "percentOfWork") {
      processedValue = parseFloat(cleanExcelNumber(pastedData).toString()) || 0;
    }

    // Update the allocation
    handleFieldChange(allocation.id, field, processedValue);

    // Show paste message
    setPasteMessage("Excel data pasted!");
    setTimeout(() => setPasteMessage(null), 3000);
  };

  // Handle key down for navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    allocationId: string,
    currentField: keyof FunctionalAllocationType
  ) => {
    // Field order for navigation
    const fieldTypes: (keyof FunctionalAllocationType)[] = [
      "product",
      "teamName",
      "function",
      "currentCostCenter",
      "percentOfWork",
    ];

    const currentAllocationIndex = monthAllocations.findIndex(
      (a) => a.id === allocationId
    );
    const currentFieldIndex = fieldTypes.indexOf(currentField);

    if (currentAllocationIndex === -1 || currentFieldIndex === -1) return;

    let targetAllocationIndex = currentAllocationIndex;
    let targetFieldIndex = currentFieldIndex;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        // Enter moves to next row, same field
        if (currentAllocationIndex === monthAllocations.length - 1) {
          // At last row, add new allocation
          handleAddAllocation();
          // Focus will be set in handleAddAllocation
          return;
        }
        targetAllocationIndex = currentAllocationIndex + 1;
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab moves left/up
          if (currentFieldIndex > 0) {
            targetFieldIndex = currentFieldIndex - 1;
          } else if (currentAllocationIndex > 0) {
            targetAllocationIndex = currentAllocationIndex - 1;
            targetFieldIndex = fieldTypes.length - 1;
          }
        } else {
          // Tab moves right/down
          if (currentFieldIndex < fieldTypes.length - 1) {
            targetFieldIndex = currentFieldIndex + 1;
          } else if (currentAllocationIndex < monthAllocations.length - 1) {
            targetAllocationIndex = currentAllocationIndex + 1;
            targetFieldIndex = 0;
          } else {
            // At last cell, add new row and move to first field
            handleAddAllocation();
            return;
          }
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (currentAllocationIndex < monthAllocations.length - 1) {
          targetAllocationIndex = currentAllocationIndex + 1;
        } else {
          // At last row, add new allocation
          handleAddAllocation();
          return;
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        targetAllocationIndex = Math.max(currentAllocationIndex - 1, 0);
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
    const targetAllocation = monthAllocations[targetAllocationIndex];
    const targetField = fieldTypes[targetFieldIndex];

    if (targetAllocation) {
      // Ensure target row is in edit mode
      if (!editingRows.has(targetAllocation.id)) {
        toggleEditMode(targetAllocation.id);
      }

      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        const targetInput = document.querySelector(
          `input[data-allocation-id="${targetAllocation.id}"][data-field="${targetField}"], select[data-allocation-id="${targetAllocation.id}"][data-field="${targetField}"]`
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

  return (
    <div className="functional-allocation-container">
      <div className="functional-allocation-header">
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

      <div className="functional-allocation-actions">
        <button onClick={handleExportCSV} className="export-btn">
          Export to CSV
        </button>
        {pasteMessage && (
          <span className="paste-message success">{pasteMessage}</span>
        )}
      </div>

      <div className="table-section">
        <div className="table-section-header">
          <h2>Product Allocation</h2>
          <button onClick={handleAddAllocation} className="add-btn">
            Add Allocation
          </button>
        </div>
        <div className="table-container" onPaste={handlePaste}>
          <table ref={tableRef} className="functional-allocation-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Team</th>
                <th>Function</th>
                <th>Current Cost Center</th>
                <th>Team Cost ({monthNames[selectedMonth - 1]})</th>
                <th>% of Work</th>
                <th>Cost Per Product ({monthNames[selectedMonth - 1]})</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthAllocations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-data">
                    No allocations for {monthNames[selectedMonth - 1]}{" "}
                    {state.selectedYear}
                  </td>
                </tr>
              ) : (
                monthAllocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td>
                      {editingRows.has(allocation.id) ? (
                        <input
                          type="text"
                          value={allocation.product}
                          data-allocation-id={allocation.id}
                          data-field="product"
                          onChange={(e) =>
                            handleFieldChange(
                              allocation.id,
                              "product",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, allocation.id, "product")
                          }
                          onPaste={(e) =>
                            handleMultiRowPaste(e, allocation.id, "product")
                          }
                          className="form-input"
                        />
                      ) : (
                        <span onClick={() => toggleEditMode(allocation.id)}>
                          {allocation.product || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingRows.has(allocation.id) ? (
                        <select
                          value={allocation.teamName}
                          data-allocation-id={allocation.id}
                          data-field="teamName"
                          onChange={(e) =>
                            handleFieldChange(
                              allocation.id,
                              "teamName",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, allocation.id, "teamName")
                          }
                          onPaste={(e) =>
                            handleMultiRowPaste(e, allocation.id, "teamName")
                          }
                          className="form-select"
                        >
                          <option value="">Select Team</option>
                          {uniqueTeams.map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span onClick={() => toggleEditMode(allocation.id)}>
                          {allocation.teamName || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingRows.has(allocation.id) ? (
                        <select
                          value={allocation.function}
                          data-allocation-id={allocation.id}
                          data-field="function"
                          onChange={(e) =>
                            handleFieldChange(
                              allocation.id,
                              "function",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, allocation.id, "function")
                          }
                          onPaste={(e) =>
                            handleMultiRowPaste(e, allocation.id, "function")
                          }
                          className="form-select"
                        >
                          <option value="Development">Development</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Revenue">Revenue</option>
                          <option value="Support">Support</option>
                        </select>
                      ) : (
                        <span onClick={() => toggleEditMode(allocation.id)}>
                          {allocation.function}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingRows.has(allocation.id) ? (
                        <select
                          value={allocation.currentCostCenter}
                          data-allocation-id={allocation.id}
                          data-field="currentCostCenter"
                          onChange={(e) =>
                            handleFieldChange(
                              allocation.id,
                              "currentCostCenter",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, allocation.id, "currentCostCenter")
                          }
                          onPaste={(e) =>
                            handleMultiRowPaste(
                              e,
                              allocation.id,
                              "currentCostCenter"
                            )
                          }
                          className="form-select"
                        >
                          <option value="">Select Cost Center</option>
                          {uniqueCostCenters.map((cc) => (
                            <option key={cc} value={cc}>
                              {cc}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span onClick={() => toggleEditMode(allocation.id)}>
                          {allocation.currentCostCenter || "-"}
                        </span>
                      )}
                    </td>
                    <td className="calculated-field">
                      $
                      {allocation.cost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {editingRows.has(allocation.id) ? (
                        <div className="input-with-suffix">
                          <input
                            type="number"
                            value={allocation.percentOfWork}
                            data-allocation-id={allocation.id}
                            data-field="percentOfWork"
                            onChange={(e) =>
                              handleFieldChange(
                                allocation.id,
                                "percentOfWork",
                                Number(e.target.value)
                              )
                            }
                            onKeyDown={(e) =>
                              handleKeyDown(e, allocation.id, "percentOfWork")
                            }
                            onPaste={(e) =>
                              handleMultiRowPaste(
                                e,
                                allocation.id,
                                "percentOfWork"
                              )
                            }
                            className={`form-input ${
                              errors[`${allocation.id}-percentOfWork`]
                                ? "error"
                                : ""
                            }`}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <span className="suffix">%</span>
                        </div>
                      ) : (
                        <span onClick={() => toggleEditMode(allocation.id)}>
                          {allocation.percentOfWork}%
                        </span>
                      )}
                    </td>
                    <td className="calculated-field">
                      $
                      {calculateCostPer(allocation).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <TableActionButtons
                        isEditing={editingRows.has(allocation.id)}
                        onEdit={() => toggleEditMode(allocation.id)}
                        onDelete={() => handleDeleteAllocation(allocation.id)}
                        editTooltip={
                          editingRows.has(allocation.id)
                            ? "Save allocation"
                            : "Edit allocation"
                        }
                        deleteTooltip="Delete allocation"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="functional-allocation-help">
          <p>
            <strong>Tip:</strong> Product allocations are tracked by month. You
            can paste data from Excel in two ways:
          </p>
          <ul>
            <li>
              <strong>Full rows:</strong> Copy rows with columns: Product, Team,
              Function, Cost Center, Cost, % of Work
            </li>
            <li>
              <strong>Column values:</strong> Copy a column of values (A1, A2,
              A3, A4) and paste into any field to fill multiple rows vertically
            </li>
          </ul>
          <p>
            <strong>Keyboard Navigation:</strong> Use Tab/Shift+Tab to move
            between fields, Enter/↓ to move to next row, ↑ to move to previous
            row, ←→ to move between columns.
          </p>
          <p>
            <strong>Team Cost:</strong> The Team Cost column is automatically
            populated from the Resources section based on the selected team and
            month.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FunctionalAllocation;
