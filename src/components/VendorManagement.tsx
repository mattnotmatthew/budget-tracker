import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { VendorData } from "../types";
import { formatCurrencyExcelStyle } from "../utils/currencyFormatter";
import "../styles/App.css";

const VendorManagement: React.FC = () => {
  const { state, dispatch } = useBudget();

  // Track which rows are in edit mode
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  // State for paste messages
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  // Get vendors for the current year
  const currentYearVendors =
    state.vendorData?.filter((vendor) => vendor.year === state.selectedYear) ||
    [];

  // Check if a vendor row is complete (has all required fields filled)
  const isVendorComplete = (vendor: VendorData): boolean => {
    return (
      vendor.vendorName.trim() !== "" &&
      vendor.billingType.trim() !== "" &&
      vendor.budget > 0 &&
      vendor.description.trim() !== "" // Also require description to be filled
    );
  };

  // Check if a row should be in edit mode (incomplete or explicitly being edited)
  const isRowInEditMode = (vendor: VendorData): boolean => {
    // If explicitly being edited, stay in edit mode regardless of completeness
    if (editingRows.has(vendor.id)) {
      return true;
    }
    // If not explicitly being edited, only show in edit mode if incomplete
    return !isVendorComplete(vendor);
  };
  // Toggle edit mode for a specific row
  const toggleEditMode = (vendorId: string) => {
    setEditingRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);

        // If this was the last row and user finished editing, add a new row
        const vendor = currentYearVendors.find((v) => v.id === vendorId);
        const isLastRow =
          vendor &&
          currentYearVendors.indexOf(vendor) === currentYearVendors.length - 1;
        if (isLastRow && isVendorComplete(vendor)) {
          setTimeout(() => addNewRow(), 100);
        }
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  const addNewRow = () => {
    const newVendor: VendorData = {
      id: Date.now().toString(), // Use timestamp as unique ID
      year: state.selectedYear,
      vendorName: "",
      financeMappedCategory: "",
      billingType: "",
      budget: 0,
      description: "",
      month: "N/A", // Default to N/A
      inBudget: true, // Default to true (Yes)
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: "ADD_VENDOR_DATA", payload: newVendor });

    // Add the new vendor to editing rows so it stays in edit mode
    setEditingRows((prev) => new Set(prev).add(newVendor.id));

    // Focus on the first input of the new row after it's rendered
    setTimeout(() => {
      const lastRow = document.querySelector(
        ".vendor-table tbody tr:last-child"
      );
      const firstInput = lastRow?.querySelector("input") as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 50);
  };

  const handleInputChange = (
    id: string,
    field: keyof VendorData,
    value: string | number | boolean
  ) => {
    const vendor = currentYearVendors.find((v) => v.id === id);
    if (vendor) {
      // Ensure the row stays in edit mode when any field is being changed
      setEditingRows((prev) => new Set(prev).add(id));

      const updatedVendor = {
        ...vendor,
        [field]: value,
        updatedAt: new Date(),
      };
      dispatch({ type: "UPDATE_VENDOR_DATA", payload: updatedVendor });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, vendorId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewRow();
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

  // Excel paste handler for vendor data
  const handlePaste = async (
    e: React.ClipboardEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    vendorId: string,
    fieldType: keyof VendorData
  ) => {
    e.preventDefault();

    try {
      const pasteData = e.clipboardData.getData("text");
      const lines = pasteData.split("\n").filter((line) => line.trim() !== "");

      if (lines.length === 0) return;

      const startVendorIndex = currentYearVendors.findIndex(
        (vendor) => vendor.id === vendorId
      );

      if (startVendorIndex === -1) return;

      let successCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const targetVendorIndex = startVendorIndex + i;

        // If we don't have enough vendors, create new ones
        if (targetVendorIndex >= currentYearVendors.length) {
          for (let j = currentYearVendors.length; j <= targetVendorIndex; j++) {
            addNewRow();
          }
          // Wait for new rows to be created
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Get the updated vendor list after potential new rows
        const updatedVendors =
          state.vendorData?.filter(
            (vendor) => vendor.year === state.selectedYear
          ) || [];
        const targetVendor = updatedVendors[targetVendorIndex];

        if (!targetVendor) continue;

        let value = lines[i].trim();

        // Process the value based on field type
        if (
          fieldType === "vendorName" ||
          fieldType === "financeMappedCategory" ||
          fieldType === "description" ||
          fieldType === "notes"
        ) {
          // For text fields, use the text as-is
          handleInputChange(targetVendor.id, fieldType, value);
          successCount++;
        } else if (fieldType === "budget") {
          // For budget field, clean and validate number
          const cleanValue = cleanExcelNumber(value);
          if (cleanValue !== null) {
            handleInputChange(targetVendor.id, fieldType, cleanValue);
            successCount++;
          }
        } else if (fieldType === "billingType") {
          // For billing type, validate against allowed values
          const validBillingTypes = [
            "monthly",
            "quarterly",
            "annual",
            "one-time",
            "hourly",
            "project-based",
          ];
          const lowerValue = value.toLowerCase();
          const matchedType = validBillingTypes.find(
            (type) => type.includes(lowerValue) || lowerValue.includes(type)
          );
          if (matchedType) {
            handleInputChange(targetVendor.id, fieldType, matchedType);
            successCount++;
          } else if (value.trim() !== "") {
            // If no match but has value, use as-is (user can correct)
            handleInputChange(targetVendor.id, fieldType, value);
            successCount++;
          }
        } else if (fieldType === "month") {
          // For month field, validate against months
          const validMonths = [
            "N/A",
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
          const matchedMonth = validMonths.find(
            (month) =>
              month.toLowerCase() === value.toLowerCase() ||
              month
                .toLowerCase()
                .startsWith(value.toLowerCase().substring(0, 3))
          );
          if (matchedMonth) {
            handleInputChange(targetVendor.id, fieldType, matchedMonth);
            successCount++;
          } else if (value.trim() !== "") {
            // Default to N/A if no match
            handleInputChange(targetVendor.id, fieldType, "N/A");
            successCount++;
          }
        } else if (fieldType === "inBudget") {
          // For boolean field, interpret common values
          const lowerValue = value.toLowerCase().trim();
          if (["yes", "y", "true", "1", "on"].includes(lowerValue)) {
            handleInputChange(targetVendor.id, fieldType, true);
            successCount++;
          } else if (["no", "n", "false", "0", "off"].includes(lowerValue)) {
            handleInputChange(targetVendor.id, fieldType, false);
            successCount++;
          }
        }
      }

      // Show success message
      if (successCount > 0) {
        setPasteMessage(`✅ Pasted ${successCount} values successfully!`);
        setTimeout(() => setPasteMessage(null), 3000);
      } else {
        setPasteMessage(`⚠️ Paste failed - no valid values found`);
        setTimeout(() => setPasteMessage(null), 3000);
      }
    } catch (error) {
      console.error("Paste failed:", error);
      setPasteMessage(`⚠️ Paste failed`);
      setTimeout(() => setPasteMessage(null), 3000);
    }
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent, vendorId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewRow();
    } else if (e.key === "Tab" && !e.shiftKey) {
      // Tab out of Notes field - add new row if this is the last row
      const currentRow = (e.target as HTMLElement).closest("tr");
      if (currentRow) {
        const allRows = document.querySelectorAll(".vendor-table tbody tr");
        const currentRowIndex = Array.from(allRows).indexOf(
          currentRow as Element
        );

        if (currentRowIndex === allRows.length - 1) {
          // This is the last row, prevent default tab behavior and add new row
          e.preventDefault();
          addNewRow();
          // Focus on the first input of the new row after it's created
          setTimeout(() => {
            const newLastRow = document.querySelector(
              ".vendor-table tbody tr:last-child"
            );
            const firstInput = newLastRow?.querySelector(
              "input"
            ) as HTMLInputElement;
            if (firstInput) {
              firstInput.focus();
            }
          }, 100);
        }
      }
    }
  };

  const deleteVendor = (id: string) => {
    if (currentYearVendors.length > 1) {
      dispatch({ type: "DELETE_VENDOR_DATA", payload: id });
    }
  };

  // Calculate total budget for vendors that are in budget (In Budget = Yes)
  const calculateInBudgetTotal = (): number => {
    return currentYearVendors.reduce((total, vendor) => {
      return vendor.inBudget ? total + (vendor.budget || 0) : total;
    }, 0);
  };

  // Calculate total budget for vendors that are not in original budget (In Budget = No)
  const calculateNotInBudgetTotal = (): number => {
    return currentYearVendors.reduce((total, vendor) => {
      return !vendor.inBudget ? total + (vendor.budget || 0) : total;
    }, 0);
  };

  return (
    <div className="vendor-management">
      {" "}
      <div className="vendor-management-header">
        <h2>Vendor Management & Budget Planning ({state.selectedYear})</h2>
        <p>
          Manage vendor information, billing types, and annual budget planning.
        </p>
      </div>
      <div className="vendor-management-controls">
        <button className="add-row-btn" onClick={addNewRow}>
          + Add New Vendor
        </button>
        <div className="budget-totals-container">
          <div className="budget-total-display">
            <span className="budget-total-label">Total Budget:</span>
            <span className="budget-total-amount">
              {formatCurrencyExcelStyle(calculateInBudgetTotal() * 1000)}
            </span>
          </div>
          <div className="budget-total-display not-in-budget">
            <span className="budget-total-label">Not in original budget:</span>
            <span className="not-in-budget-total-amount ">
              {formatCurrencyExcelStyle(calculateNotInBudgetTotal() * 1000)}
            </span>
          </div>
        </div>
      </div>
      {pasteMessage && <div className="save-message">{pasteMessage}</div>}
      <div className="vendor-table-container">
        <table className="vendor-table">
          <thead>
            <tr>
              <th>Item/Vendor Name</th>
              <th>Finance Mapped Category/Vendor</th>
              <th>Description</th>
              <th>Budget</th>
              <th>Billing Type</th>
              <th>Month</th>
              <th>In Budget</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentYearVendors.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No vendors found for {state.selectedYear}. Click "Add New
                  Vendor" to get started.
                </td>
              </tr>
            ) : (
              currentYearVendors.map((vendor) => {
                const inEditMode = isRowInEditMode(vendor);
                const isComplete = isVendorComplete(vendor);

                return (
                  <tr
                    key={vendor.id}
                    className={
                      isComplete && !inEditMode
                        ? "vendor-row-complete"
                        : "vendor-row-editing"
                    }
                  >
                    <td>
                      {inEditMode ? (
                        <input
                          type="text"
                          value={vendor.vendorName}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "vendorName",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, vendor.id)}
                          onPaste={(e) =>
                            handlePaste(e, vendor.id, "vendorName")
                          }
                          placeholder="Enter vendor name"
                          className="vendor-input"
                        />
                      ) : (
                        <span
                          className="vendor-label"
                          title={vendor.vendorName}
                        >
                          {vendor.vendorName || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <input
                          type="text"
                          value={vendor.financeMappedCategory}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "financeMappedCategory",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, vendor.id)}
                          onPaste={(e) =>
                            handlePaste(e, vendor.id, "financeMappedCategory")
                          }
                          placeholder="Enter finance category"
                          className="vendor-input"
                        />
                      ) : (
                        <span
                          className="vendor-label"
                          title={vendor.financeMappedCategory}
                        >
                          {vendor.financeMappedCategory || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <input
                          type="text"
                          value={vendor.description}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "description",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, vendor.id)}
                          onPaste={(e) =>
                            handlePaste(e, vendor.id, "description")
                          }
                          placeholder="Enter description"
                          className="vendor-input"
                        />
                      ) : (
                        <span
                          className="vendor-label"
                          title={vendor.description}
                        >
                          {vendor.description || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <input
                          type="number"
                          value={vendor.budget}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "budget",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, vendor.id)}
                          onPaste={(e) => handlePaste(e, vendor.id, "budget")}
                          placeholder="0.00"
                          className="vendor-input currency-input"
                          step="0.01"
                        />
                      ) : (
                        <span
                          className="vendor-label vendor-label-currency"
                          title={formatCurrencyExcelStyle(vendor.budget * 1000)}
                        >
                          {formatCurrencyExcelStyle(vendor.budget * 1000)}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <select
                          value={vendor.billingType}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "billingType",
                              e.target.value
                            )
                          }
                          onPaste={(e) =>
                            handlePaste(e, vendor.id, "billingType")
                          }
                          //onKeyDown={(e) => handleKeyDown(e, vendor.id)}
                          className="vendor-select"
                        >
                          <option value="">Select billing type</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annual">Annual</option>
                          <option value="one-time">One-time</option>
                          <option value="hourly">Hourly</option>
                          <option value="project-based">Project-based</option>
                        </select>
                      ) : (
                        <span
                          className="vendor-label"
                          title={vendor.billingType}
                        >
                          {vendor.billingType || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <select
                          value={vendor.month}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "month",
                              e.target.value
                            )
                          }
                          onPaste={(e) => handlePaste(e, vendor.id, "month")}
                          className="vendor-select"
                        >
                          <option value="N/A">N/A</option>
                          <option value="January">January</option>
                          <option value="February">February</option>
                          <option value="March">March</option>
                          <option value="April">April</option>
                          <option value="May">May</option>
                          <option value="June">June</option>
                          <option value="July">July</option>
                          <option value="August">August</option>
                          <option value="September">September</option>
                          <option value="October">October</option>
                          <option value="November">November</option>
                          <option value="December">December</option>
                        </select>
                      ) : (
                        <span className="vendor-label" title={vendor.month}>
                          {vendor.month || "N/A"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <div className="vendor-toggle-container">
                          <label className="vendor-toggle-label">
                            <input
                              type="checkbox"
                              checked={vendor.inBudget}
                              onChange={(e) =>
                                handleInputChange(
                                  vendor.id,
                                  "inBudget",
                                  e.target.checked
                                )
                              }
                              className="vendor-toggle-input"
                            />
                            <span className="vendor-toggle-slider"></span>
                          </label>
                        </div>
                      ) : (
                        <span
                          className="vendor-label"
                          title={vendor.inBudget ? "Yes" : "No"}
                        >
                          {vendor.inBudget ? "Yes" : "No"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <textarea
                          value={vendor.notes}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "notes",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleNotesKeyDown(e, vendor.id)}
                          onPaste={(e) => handlePaste(e, vendor.id, "notes")}
                          placeholder="Add notes..."
                          className="vendor-textarea"
                          rows={2}
                        />
                      ) : (
                        <span
                          className="vendor-label vendor-label-notes"
                          title={vendor.notes}
                        >
                          {vendor.notes || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="vendor-actions">
                        {isComplete && (
                          <button
                            className="edit-row-btn"
                            onClick={() => toggleEditMode(vendor.id)}
                            title={
                              inEditMode ? "Finish editing" : "Edit vendor"
                            }
                          >
                            {inEditMode ? "✓" : "✏️"}
                          </button>
                        )}
                        <button
                          className="remove-row-btn"
                          onClick={() => deleteVendor(vendor.id)}
                          disabled={currentYearVendors.length === 1}
                          title="Remove vendor"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="vendor-management-footer">
        <p className="keyboard-shortcuts">
          <small>
            ⌨️ Press Enter in any field to add a new row | Tab out of Notes to
            add a new row | 📋 Paste Excel data from clipboard (creates new rows
            as needed) | ✏️ Edit completed vendors | ✓ Finish editing
          </small>
        </p>
      </div>
    </div>
  );
};

export default VendorManagement;
