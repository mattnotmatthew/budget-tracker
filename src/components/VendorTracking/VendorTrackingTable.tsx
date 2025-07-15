import React, { useState } from "react";
import { useBudget } from "../../context/BudgetContext";
import { VendorTracking } from "../../types";
import { formatCurrencyExcelStyle } from "../../utils/currencyFormatter";
import { TableActionButtons } from "../shared";
import "./vendor-tracking.css";

/**
 * VendorTra      // Focus the target input
      setTimeout(() => {
        const targetInput = document.querySelector(
          `input[data-tracking-id="${targetTracking.id}"][data-field="${targetField}"]`
        ) as HTMLInputElement;
        if (targetInput) {
          targetInput.focus();
          // Only select text for text inputs, not checkboxes
          if (targetInput.type !== "checkbox") {
            targetInput.select();
          }
        }
      }, 50); Component
 *
 * Features:
 * - Add/Edit/Delete vendor tracking rows with monthly data (Jan-Dec)
 * - Excel-style pasting: Paste multiple rows/cells from clipboard
 * - Keyboard navigation: Tab, Enter, Arrow keys for cell navigation
 * - Auto-row creation: Adds new rows when pasting beyond existing data
 * - Column sorting: Sort by any column with visual indicators
 * - Persistent data: Integrated with BudgetContext and file persistence
 */

interface VendorTrackingTableProps {
  // Props will be added later when we hook up data logic
}

const VendorTrackingTable: React.FC<VendorTrackingTableProps> = (props) => {
  const { state, dispatch } = useBudget();

  // Track which rows are in edit mode
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  // State for paste messages
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  // Sort state for vendor tracking table
  const [sortConfig, setSortConfig] = useState<{
    field: keyof VendorTracking | null;
    direction: "asc" | "desc";
  }>({ field: null, direction: "asc" });

  // Get vendor tracking data for the current year
  const currentYearTrackingData =
    state.vendorTrackingData?.filter(
      (tracking) => tracking.year === state.selectedYear
    ) || [];

  // Calculate monthly totals
  const calculateMonthlyTotals = () => {
    const totals = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
      aug: 0,
      sep: 0,
      oct: 0,
      nov: 0,
      dec: 0,
    };

    currentYearTrackingData.forEach((item) => {
      totals.jan += parseFloat(item.jan) || 0;
      totals.feb += parseFloat(item.feb) || 0;
      totals.mar += parseFloat(item.mar) || 0;
      totals.apr += parseFloat(item.apr) || 0;
      totals.may += parseFloat(item.may) || 0;
      totals.jun += parseFloat(item.jun) || 0;
      totals.jul += parseFloat(item.jul) || 0;
      totals.aug += parseFloat(item.aug) || 0;
      totals.sep += parseFloat(item.sep) || 0;
      totals.oct += parseFloat(item.oct) || 0;
      totals.nov += parseFloat(item.nov) || 0;
      totals.dec += parseFloat(item.dec) || 0;
    });

    return totals;
  };

  // Sort tracking data
  const sortTrackingData = (
    trackingData: VendorTracking[],
    config: { field: keyof VendorTracking | null; direction: "asc" | "desc" }
  ) => {
    if (!config.field) return trackingData;

    return [...trackingData].sort((a, b) => {
      const aValue = a[config.field!];
      const bValue = b[config.field!];

      // Handle boolean values (inBudget field)
      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return config.direction === "asc"
          ? aValue === bValue
            ? 0
            : aValue
            ? 1
            : -1
          : aValue === bValue
          ? 0
          : aValue
          ? -1
          : 1;
      }

      // Handle numeric values ONLY for monthly amount columns
      const monthlyFields = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];
      if (
        typeof aValue === "string" &&
        typeof bValue === "string" &&
        monthlyFields.includes(config.field!)
      ) {
        // Check if both are numeric strings (for monthly amount columns only)
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return config.direction === "asc" ? aNum - bNum : bNum - aNum;
        }
      }

      // Handle string comparison (including financeMappedCategory, vendorName, notes)
      // Convert to strings and handle null/undefined values
      const aStr = String(aValue || "")
        .toLowerCase()
        .trim();
      const bStr = String(bValue || "")
        .toLowerCase()
        .trim();

      // Handle empty values - empty strings should sort to the end
      if (aStr === "" && bStr === "") return 0;
      if (aStr === "") return config.direction === "asc" ? 1 : -1;
      if (bStr === "") return config.direction === "asc" ? -1 : 1;

      return config.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  // Get sorted tracking data
  const getSortedTrackingData = () => {
    return sortTrackingData(currentYearTrackingData, sortConfig);
  };

  // Handle sort for tracking table
  const handleSort = (field: keyof VendorTracking) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Keyboard navigation handler
  const handleKeyDown = (
    e: React.KeyboardEvent,
    trackingId: string,
    currentField: keyof VendorTracking
  ) => {
    // Field order for navigation
    const fieldTypes: (keyof VendorTracking)[] = [
      "financeMappedCategory",
      "vendorName",
      "inBudget",
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
      "notes",
    ];

    const allTrackingData = getSortedTrackingData();
    const currentTrackingIndex = allTrackingData.findIndex(
      (t) => t.id === trackingId
    );
    const currentFieldIndex = fieldTypes.indexOf(currentField);

    if (currentTrackingIndex === -1 || currentFieldIndex === -1) return;

    let targetTrackingIndex = currentTrackingIndex;
    let targetFieldIndex = currentFieldIndex;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        // Enter moves to next row, same field
        if (currentTrackingIndex === allTrackingData.length - 1) {
          // At last row, add new item
          addNewItem();
          // Focus will be set in addNewItem
          return;
        }
        targetTrackingIndex = currentTrackingIndex + 1;
        break;
      case " ": // Space key
        // For inBudget field (checkbox), toggle the value
        if (currentField === "inBudget") {
          e.preventDefault();
          const currentTracking = allTrackingData[currentTrackingIndex];
          if (currentTracking) {
            handleInputChange(
              currentTracking.id,
              "inBudget",
              !currentTracking.inBudget
            );
          }
          return; // Don't navigate, just toggle
        }
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab moves left/up
          if (currentFieldIndex > 0) {
            targetFieldIndex = currentFieldIndex - 1;
          } else if (currentTrackingIndex > 0) {
            targetTrackingIndex = currentTrackingIndex - 1;
            targetFieldIndex = fieldTypes.length - 1;
          }
        } else {
          // Tab moves right/down
          if (currentFieldIndex < fieldTypes.length - 1) {
            targetFieldIndex = currentFieldIndex + 1;
          } else if (currentTrackingIndex < allTrackingData.length - 1) {
            targetTrackingIndex = currentTrackingIndex + 1;
            targetFieldIndex = 0;
          } else {
            // At last cell, add new row and move to first field
            addNewItem();
            return;
          }
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (currentTrackingIndex < allTrackingData.length - 1) {
          targetTrackingIndex = currentTrackingIndex + 1;
        } else {
          // At last row, add new item
          addNewItem();
          return;
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        targetTrackingIndex = Math.max(currentTrackingIndex - 1, 0);
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
    const targetTracking = allTrackingData[targetTrackingIndex];
    const targetField = fieldTypes[targetFieldIndex];

    if (targetTracking) {
      // Ensure target row is in edit mode
      if (!isRowInEditMode(targetTracking.id)) {
        toggleEditMode(targetTracking.id);
      }

      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        const targetInput = document.querySelector(
          `input[data-tracking-id="${targetTracking.id}"][data-field="${targetField}"]`
        ) as HTMLInputElement;
        if (targetInput) {
          targetInput.focus();
          targetInput.select();
        }
      }, 50);
    }
  };

  // Clean Excel number formats
  const cleanExcelNumber = (value: string): number | null => {
    if (!value || value === "-" || value === "") return 0;
    // Remove common Excel formatting
    let cleaned = value
      .replace(/[$,]/g, "") // Remove $ and commas
      .replace(/^\((.+)\)$/, "-$1") // Convert (123) to -123
      .trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // Excel paste handler for vendor tracking data
  const handlePaste = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    trackingId: string,
    fieldType: keyof VendorTracking
  ) => {
    e.preventDefault();

    try {
      const pasteData = e.clipboardData.getData("text");
      const lines = pasteData.split("\n").filter((line) => line.trim() !== "");

      if (lines.length === 0) return;

      const allTrackingData = getSortedTrackingData();
      const startTrackingIndex = allTrackingData.findIndex(
        (tracking) => tracking.id === trackingId
      );

      if (startTrackingIndex === -1) return;

      let successCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const targetTrackingIndex = startTrackingIndex + i;

        // If we don't have enough rows, create new ones
        if (targetTrackingIndex >= allTrackingData.length) {
          for (let j = allTrackingData.length; j <= targetTrackingIndex; j++) {
            addNewItem();
          }
          // Wait for new rows to be created
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Get the updated tracking list after potential new rows
        const updatedTrackingData = getSortedTrackingData();
        const targetTracking = updatedTrackingData[targetTrackingIndex];

        if (!targetTracking) continue;

        let value = lines[i].trim();

        // Process the value based on field type
        if (
          fieldType === "financeMappedCategory" ||
          fieldType === "vendorName" ||
          fieldType === "notes"
        ) {
          // For text fields, use the text as-is
          handleInputChange(targetTracking.id, fieldType, value);
          successCount++;
        } else if (fieldType === "inBudget") {
          // For inBudget field, convert to boolean
          const lowerValue = value.toLowerCase().trim();
          const boolValue =
            lowerValue === "yes" ||
            lowerValue === "true" ||
            lowerValue === "1" ||
            lowerValue === "y";
          handleInputChange(targetTracking.id, fieldType, boolValue);
          successCount++;
        } else if (
          fieldType === "jan" ||
          fieldType === "feb" ||
          fieldType === "mar" ||
          fieldType === "apr" ||
          fieldType === "may" ||
          fieldType === "jun" ||
          fieldType === "jul" ||
          fieldType === "aug" ||
          fieldType === "sep" ||
          fieldType === "oct" ||
          fieldType === "nov" ||
          fieldType === "dec"
        ) {
          // For monthly amount fields, clean and validate number
          const cleanValue = cleanExcelNumber(value);
          if (cleanValue !== null) {
            handleInputChange(
              targetTracking.id,
              fieldType,
              cleanValue.toString()
            );
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

  // Check if a row is in edit mode
  const isRowInEditMode = (id: string): boolean => {
    return editingRows.has(id);
  };

  // Toggle edit mode for a specific row
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
  // Handle input changes
  const handleInputChange = (
    id: string,
    field: keyof VendorTracking,
    value: string | boolean
  ) => {
    const tracking = currentYearTrackingData.find((t) => t.id === id);
    if (tracking) {
      const updatedTracking = {
        ...tracking,
        [field]: value,
        updatedAt: new Date(),
      };
      dispatch({ type: "UPDATE_VENDOR_TRACKING", payload: updatedTracking });
    }
  };

  // Add new item functionality
  const addNewItem = () => {
    const newItem: VendorTracking = {
      id: Date.now().toString(), // Use timestamp as unique ID
      year: state.selectedYear,
      financeMappedCategory: "",
      vendorName: "",
      inBudget: true, // Default to true (Yes)
      notes: "",
      jan: "0",
      feb: "0",
      mar: "0",
      apr: "0",
      may: "0",
      jun: "0",
      jul: "0",
      aug: "0",
      sep: "0",
      oct: "0",
      nov: "0",
      dec: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: "ADD_VENDOR_TRACKING", payload: newItem });

    // Add the new item to editing rows so it stays in edit mode
    setEditingRows((prev) => new Set(prev).add(newItem.id));

    // Focus on the first input of the new row after it's rendered
    setTimeout(() => {
      const firstInput = document.querySelector(
        `input[data-tracking-id="${newItem.id}"][data-field="financeMappedCategory"]`
      ) as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 50);
  };

  const handleEdit = (id: string) => {
    toggleEditMode(id);
  };

  const handleDelete = (id: string) => {
    // Remove item from context
    dispatch({ type: "DELETE_VENDOR_TRACKING", payload: id });

    // Remove from editing rows if it was being edited
    setEditingRows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  return (
    <div className="vendor-table-container">
      {pasteMessage && <div className="paste-message">{pasteMessage}</div>}

      <div className="table-section">
        <div className="table-section-header">
          <h2>Finance Vendor Input</h2>
          <button className="add-btn" onClick={addNewItem}>
            Add New Item
          </button>
        </div>
        <div className="table-container">
          <table className="vendor-tracking-table">
            <thead>
              <tr>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("financeMappedCategory")}
                  >
                    Finance Mapped Category/Vendor
                    {sortConfig.field === "financeMappedCategory" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("vendorName")}
                  >
                    Vendor Category
                    {sortConfig.field === "vendorName" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("inBudget")}
                  >
                    In Budget
                    {sortConfig.field === "inBudget" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("jan")}
                  >
                    Jan
                    {sortConfig.field === "jan" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("feb")}
                  >
                    Feb
                    {sortConfig.field === "feb" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("mar")}
                  >
                    Mar
                    {sortConfig.field === "mar" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("apr")}
                  >
                    Apr
                    {sortConfig.field === "apr" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("may")}
                  >
                    May
                    {sortConfig.field === "may" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("jun")}
                  >
                    Jun
                    {sortConfig.field === "jun" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("jul")}
                  >
                    Jul
                    {sortConfig.field === "jul" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("aug")}
                  >
                    Aug
                    {sortConfig.field === "aug" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("sep")}
                  >
                    Sep
                    {sortConfig.field === "sep" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("oct")}
                  >
                    Oct
                    {sortConfig.field === "oct" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("nov")}
                  >
                    Nov
                    {sortConfig.field === "nov" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("dec")}
                  >
                    Dec
                    {sortConfig.field === "dec" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-header"
                    onClick={() => handleSort("notes")}
                  >
                    Notes
                    {sortConfig.field === "notes" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedTrackingData().map((item) => (
                <tr
                  key={item.id}
                  className={
                    isRowInEditMode(item.id)
                      ? "vendor-row-editing"
                      : "vendor-row-complete"
                  }
                >
                  <td className="vendor-col-finance-category">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="text"
                        className="vendor-input"
                        value={item.financeMappedCategory}
                        data-tracking-id={item.id}
                        data-field="financeMappedCategory"
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "financeMappedCategory",
                            e.target.value
                          )
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, item.id, "financeMappedCategory")
                        }
                        onPaste={(e) =>
                          handlePaste(e, item.id, "financeMappedCategory")
                        }
                      />
                    ) : (
                      <span className="vendor-label vendor-label-finance">
                        {item.financeMappedCategory}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-vendor-name">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="text"
                        className="vendor-input"
                        value={item.vendorName}
                        data-tracking-id={item.id}
                        data-field="vendorName"
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "vendorName",
                            e.target.value
                          )
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, item.id, "vendorName")
                        }
                        onPaste={(e) => handlePaste(e, item.id, "vendorName")}
                      />
                    ) : (
                      <span className="vendor-label vendor-label-name">
                        {item.vendorName}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-in-budget">
                    {isRowInEditMode(item.id) ? (
                      <div className="vendor-toggle-container">
                        <label className="vendor-toggle-label">
                          <input
                            type="checkbox"
                            checked={item.inBudget}
                            data-tracking-id={item.id}
                            data-field="inBudget"
                            onChange={(e) =>
                              handleInputChange(
                                item.id,
                                "inBudget",
                                e.target.checked
                              )
                            }
                            onKeyDown={(e) =>
                              handleKeyDown(e, item.id, "inBudget")
                            }
                            className="vendor-toggle-input"
                            aria-label={`In Budget: ${
                              item.inBudget ? "Yes" : "No"
                            }`}
                            title={`Click or press Space to toggle. Currently: ${
                              item.inBudget ? "Yes" : "No"
                            }`}
                          />
                          <span className="vendor-toggle-slider"></span>
                        </label>
                      </div>
                    ) : (
                      <span
                        className="vendor-label"
                        title={item.inBudget ? "Yes" : "No"}
                      >
                        {item.inBudget ? "Yes" : "No"}
                      </span>
                    )}
                  </td>

                  {/* Monthly columns */}
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.jan}
                        data-tracking-id={item.id}
                        data-field="jan"
                        onChange={(e) =>
                          handleInputChange(item.id, "jan", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "jan")}
                        onPaste={(e) => handlePaste(e, item.id, "jan")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.jan) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.feb}
                        data-tracking-id={item.id}
                        data-field="feb"
                        onChange={(e) =>
                          handleInputChange(item.id, "feb", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "feb")}
                        onPaste={(e) => handlePaste(e, item.id, "feb")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.feb) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.mar}
                        data-tracking-id={item.id}
                        data-field="mar"
                        onChange={(e) =>
                          handleInputChange(item.id, "mar", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "mar")}
                        onPaste={(e) => handlePaste(e, item.id, "mar")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.mar) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.apr}
                        data-tracking-id={item.id}
                        data-field="apr"
                        onChange={(e) =>
                          handleInputChange(item.id, "apr", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "apr")}
                        onPaste={(e) => handlePaste(e, item.id, "apr")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.apr) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.may}
                        data-tracking-id={item.id}
                        data-field="may"
                        onChange={(e) =>
                          handleInputChange(item.id, "may", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "may")}
                        onPaste={(e) => handlePaste(e, item.id, "may")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.may) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.jun}
                        data-tracking-id={item.id}
                        data-field="jun"
                        onChange={(e) =>
                          handleInputChange(item.id, "jun", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "jun")}
                        onPaste={(e) => handlePaste(e, item.id, "jun")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.jun) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.jul}
                        data-tracking-id={item.id}
                        data-field="jul"
                        onChange={(e) =>
                          handleInputChange(item.id, "jul", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "jul")}
                        onPaste={(e) => handlePaste(e, item.id, "jul")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.jul) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.aug}
                        data-tracking-id={item.id}
                        data-field="aug"
                        onChange={(e) =>
                          handleInputChange(item.id, "aug", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "aug")}
                        onPaste={(e) => handlePaste(e, item.id, "aug")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.aug) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.sep}
                        data-tracking-id={item.id}
                        data-field="sep"
                        onChange={(e) =>
                          handleInputChange(item.id, "sep", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "sep")}
                        onPaste={(e) => handlePaste(e, item.id, "sep")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.sep) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.oct}
                        data-tracking-id={item.id}
                        data-field="oct"
                        onChange={(e) =>
                          handleInputChange(item.id, "oct", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "oct")}
                        onPaste={(e) => handlePaste(e, item.id, "oct")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.oct) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.nov}
                        data-tracking-id={item.id}
                        data-field="nov"
                        onChange={(e) =>
                          handleInputChange(item.id, "nov", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "nov")}
                        onPaste={(e) => handlePaste(e, item.id, "nov")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.nov) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>
                  <td className="vendor-col-month">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="number"
                        className="vendor-input currency-input"
                        value={item.dec}
                        data-tracking-id={item.id}
                        data-field="dec"
                        onChange={(e) =>
                          handleInputChange(item.id, "dec", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "dec")}
                        onPaste={(e) => handlePaste(e, item.id, "dec")}
                      />
                    ) : (
                      <span className="vendor-label monthly-amount">
                        {formatCurrencyExcelStyle(
                          (parseFloat(item.dec) || 0) * 1000
                        )}
                      </span>
                    )}
                  </td>

                  <td className="vendor-col-notes">
                    {isRowInEditMode(item.id) ? (
                      <input
                        type="text"
                        className="vendor-input"
                        value={item.notes}
                        data-tracking-id={item.id}
                        data-field="notes"
                        onChange={(e) =>
                          handleInputChange(item.id, "notes", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, item.id, "notes")}
                        onPaste={(e) => handlePaste(e, item.id, "notes")}
                      />
                    ) : (
                      <span className="vendor-label vendor-label-notes">
                        {item.notes}
                      </span>
                    )}
                  </td>
                  <td>
                    <TableActionButtons
                      isEditing={isRowInEditMode(item.id)}
                      onEdit={() => handleEdit(item.id)}
                      onDelete={() => handleDelete(item.id)}
                      editTooltip={
                        isRowInEditMode(item.id) ? "Save Row" : "Edit Row"
                      }
                      deleteTooltip="Delete Row"
                    />
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              {currentYearTrackingData.length > 0 &&
                (() => {
                  const monthlyTotals = calculateMonthlyTotals();
                  return (
                    <tr className="vendor-totals-row">
                      <td className="vendor-col-finance-category">
                        <strong>TOTALS</strong>
                      </td>
                      <td className="vendor-col-vendor-name">
                        <span className="vendor-label">-</span>
                      </td>
                      <td className="vendor-col-in-budget">
                        <span className="vendor-label">-</span>
                      </td>

                      {/* Monthly total columns */}
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.jan * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.feb * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.mar * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.apr * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.may * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.jun * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.jul * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.aug * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.sep * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.oct * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.nov * 1000)}
                        </strong>
                      </td>
                      <td className="vendor-col-month">
                        <strong className="vendor-label monthly-amount">
                          {formatCurrencyExcelStyle(monthlyTotals.dec * 1000)}
                        </strong>
                      </td>

                      <td className="vendor-col-notes">
                        <span className="vendor-label">-</span>
                      </td>
                      <td>
                        <span className="vendor-label">-</span>
                      </td>
                    </tr>
                  );
                })()}
            </tbody>
          </table>
        </div>
      </div>

      <div className="vendor-tracking-footer">
        <p className="keyboard-shortcuts">
          <small>
            ⌨️ Press Enter to add a new row | Tab/Shift+Tab to navigate cells |
            Arrow keys for grid navigation | Space to toggle In Budget | 📋
            Paste Excel data from clipboard (creates new rows as needed) | ✏️
            Click Edit to modify data
          </small>
        </p>
      </div>
    </div>
  );
};

VendorTrackingTable.displayName = "VendorTrackingTable";

export default React.memo(VendorTrackingTable);
