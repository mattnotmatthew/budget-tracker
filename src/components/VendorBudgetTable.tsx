import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { VendorData } from "../types";
import { formatCurrencyExcelStyle } from "../utils/currencyFormatter";
import { TableActionButtons } from "./shared";

interface VendorBudgetTableProps {
  vendors: VendorData[];
  onVendorUpdate: (vendor: VendorData) => void;
  onVendorDelete: (vendorId: string) => void;
  onVendorAdd: (vendor: Partial<VendorData>) => void;
}

const VendorBudgetTable: React.FC<VendorBudgetTableProps> = ({
  vendors,
  onVendorUpdate,
  onVendorDelete,
  onVendorAdd,
}) => {
  const { state } = useBudget();

  // Track which rows are in edit mode
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  // State for paste messages
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  // Sort and filter state
  const [sortConfig, setSortConfig] = useState<{
    field: keyof VendorData | null;
    direction: "asc" | "desc";
  }>({ field: null, direction: "asc" });

  const [filters, setFilters] = useState({
    vendorName: "",
    category: "",
    billingType: "",
    inBudget: "all" as "all" | "yes" | "no",
  });

  // State for collapsible filters
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Sort vendors
  const sortVendors = (
    vendorsToSort: VendorData[],
    config: { field: keyof VendorData | null; direction: "asc" | "desc" }
  ) => {
    if (!config.field) return vendorsToSort;

    return [...vendorsToSort].sort((a, b) => {
      const aValue = a[config.field!];
      const bValue = b[config.field!];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return config.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return config.direction === "asc"
          ? aValue === bValue ? 0 : aValue ? 1 : -1
          : aValue === bValue ? 0 : aValue ? -1 : 1;
      }

      const aStr = String(aValue || "").toLowerCase();
      const bStr = String(bValue || "").toLowerCase();

      return config.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  // Filter vendors
  const filterVendors = (vendorsToFilter: VendorData[]) => {
    return vendorsToFilter.filter((vendor) => {
      const nameMatch = vendor.vendorName
        .toLowerCase()
        .includes(filters.vendorName.toLowerCase());
      const categoryMatch = (vendor.category || "")
        .toLowerCase()
        .includes(filters.category.toLowerCase());
      const billingMatch = vendor.billingType
        .toLowerCase()
        .includes(filters.billingType.toLowerCase());
      const budgetMatch =
        filters.inBudget === "all"
          ? true
          : filters.inBudget === "yes"
          ? vendor.inBudget
          : !vendor.inBudget;

      return nameMatch && categoryMatch && billingMatch && budgetMatch;
    });
  };

  // Get filtered and sorted vendors
  const getFilteredAndSortedVendors = () => {
    const filtered = filterVendors(vendors);
    return sortVendors(filtered, sortConfig);
  };

  // Handle sort
  const handleSort = (field: keyof VendorData) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Toggle edit mode for a vendor
  const toggleEditMode = (vendorId: string) => {
    setEditingRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  // Handle input changes during edit
  const handleInputChange = (
    vendorId: string,
    field: keyof VendorData,
    value: any
  ) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      const updatedVendor = { ...vendor, [field]: value };
      onVendorUpdate(updatedVendor);
    }
  };

  // Clean Excel-style numbers
  const cleanExcelNumber = (value: string): number => {
    const cleaned = value
      .replace(/[$,\s]/g, "")
      .replace(/[()]/g, "")
      .trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Handle paste events for Excel data
  const handlePaste = (
    e: React.ClipboardEvent,
    vendorId: string,
    field: keyof VendorData
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");

    if (field === "budget") {
      const cleanedValue = cleanExcelNumber(pastedData);
      handleInputChange(vendorId, field, cleanedValue / 1000);
      setPasteMessage("Excel number cleaned and pasted!");
      setTimeout(() => setPasteMessage(null), 3000);
    } else {
      handleInputChange(vendorId, field, pastedData);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent,
    vendorId: string,
    field: keyof VendorData
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewVendor();
    }
  };

  // Handle notes field keyboard events
  const handleNotesKeyDown = (e: React.KeyboardEvent, vendorId: string) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      addNewVendor();
    }
  };

  // Add new vendor
  const addNewVendor = () => {
    const newVendor: Partial<VendorData> = {
      vendorName: "",
      category: "",
      financeMappedCategory: "",
      billingType: "monthly",
      budget: 0,
      description: "",
      month: "N/A",
      inBudget: true,
      notes: "",
      year: state.selectedYear,
    };
    onVendorAdd(newVendor);
  };

  // Delete vendor
  const deleteVendor = (vendorId: string) => {
    onVendorDelete(vendorId);
    setEditingRows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(vendorId);
      return newSet;
    });
  };

  // Calculate totals
  const calculateTotal = () => {
    return getFilteredAndSortedVendors().reduce(
      (sum, vendor) => sum + vendor.budget,
      0
    );
  };

  const calculateInBudgetTotal = () => {
    return getFilteredAndSortedVendors()
      .filter((vendor) => vendor.inBudget)
      .reduce((sum, vendor) => sum + vendor.budget, 0);
  };

  const calculateNotInBudgetTotal = () => {
    return getFilteredAndSortedVendors()
      .filter((vendor) => !vendor.inBudget)
      .reduce((sum, vendor) => sum + vendor.budget, 0);
  };

  const displayedVendors = getFilteredAndSortedVendors();

  return (
    <div className="vendor-budget-table">
      {/* Controls */}
      <div className="vendor-management-controls">
        <div className="budget-totals-container">
          <div className="budget-total-display">
            <span className="budget-total-label">Annual Total:</span>
            <span className="budget-total-amount">
              {formatCurrencyExcelStyle(calculateTotal() * 1000)}
            </span>
          </div>
        </div>
      </div>

      {/* Paste Message */}
      {pasteMessage && (
        <div className="paste-message-popup">{pasteMessage}</div>
      )}

      {/* Filter Controls */}
      <div className="vendor-filters">
        <div className="filter-header">
          <h3>Filters</h3>
          <button
            className="collapse-toggle"
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
          >
            {filtersCollapsed ? "▼" : "▲"}
          </button>
        </div>
        {!filtersCollapsed && (
          <div className="filter-content">
            <div className="filter-row">
              <div className="filter-group">
                <label>Filter by Vendor Name:</label>
                <input
                  type="text"
                  value={filters.vendorName}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      vendorName: e.target.value,
                    }))
                  }
                  placeholder="Search vendor name..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Filter by Category:</label>
                <input
                  type="text"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Search category..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Filter by Billing Type:</label>
                <input
                  type="text"
                  value={filters.billingType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      billingType: e.target.value,
                    }))
                  }
                  placeholder="Search billing type..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Filter by In Budget:</label>
                <select
                  value={filters.inBudget}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      inBudget: e.target.value as "all" | "yes" | "no",
                    }))
                  }
                  className="filter-select"
                >
                  <option value="all">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="vendor-table-container">
        <table className="vendor-table">
          <thead>
            <tr>
              <th
                onClick={() => handleSort("vendorName")}
                className="sortable-header"
              >
                Vendor Name{" "}
                {sortConfig.field === "vendorName" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("category")}
                className="sortable-header"
              >
                Category{" "}
                {sortConfig.field === "category" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("financeMappedCategory")}
                className="sortable-header"
              >
                Finance Mapped Category{" "}
                {sortConfig.field === "financeMappedCategory" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("billingType")}
                className="sortable-header"
              >
                Billing Type{" "}
                {sortConfig.field === "billingType" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("budget")}
                className="sortable-header"
              >
                Budget (000s){" "}
                {sortConfig.field === "budget" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th>Description</th>
              <th
                onClick={() => handleSort("month")}
                className="sortable-header"
              >
                Month{" "}
                {sortConfig.field === "month" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("inBudget")}
                className="sortable-header"
              >
                In Budget{" "}
                {sortConfig.field === "inBudget" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedVendors.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-data">
                  No vendors found. Add a vendor to get started.
                </td>
              </tr>
            ) : (
              displayedVendors.map((vendor) => {
                const inEditMode = editingRows.has(vendor.id);
                const isComplete = Object.values(vendor).every(
                  (value) => value !== "" && value !== null && value !== undefined
                );

                return (
                  <tr
                    key={vendor.id}
                    className={`vendor-row ${inEditMode ? "editing" : ""} ${
                      isComplete ? "complete" : "incomplete"
                    }`}
                  >
                    <td>
                      {inEditMode ? (
                        <input
                          type="text"
                          value={vendor.vendorName}
                          onChange={(e) =>
                            handleInputChange(vendor.id, "vendorName", e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, vendor.id, "vendorName")
                          }
                          onPaste={(e) =>
                            handlePaste(e, vendor.id, "vendorName")
                          }
                          placeholder="Enter vendor name"
                          className="vendor-input"
                        />
                      ) : (
                        <span className="vendor-label" title={vendor.vendorName}>
                          {vendor.vendorName || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <input
                          type="text"
                          value={vendor.category || ""}
                          onChange={(e) =>
                            handleInputChange(vendor.id, "category", e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, vendor.id, "category")
                          }
                          onPaste={(e) => handlePaste(e, vendor.id, "category")}
                          placeholder="Enter category"
                          className="vendor-input"
                        />
                      ) : (
                        <span className="vendor-label" title={vendor.category}>
                          {vendor.category || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <input
                          type="text"
                          value={vendor.financeMappedCategory || ""}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "financeMappedCategory",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, vendor.id, "financeMappedCategory")
                          }
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
                        <select
                          value={vendor.billingType}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "billingType",
                              e.target.value
                            )
                          }
                          className="vendor-select"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annual">Annual</option>
                          <option value="one-time">One-time</option>
                          <option value="hourly">Hourly</option>
                          <option value="project-based">Project-based</option>
                        </select>
                      ) : (
                        <span className="vendor-label" title={vendor.billingType}>
                          {vendor.billingType}
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
                          onKeyDown={(e) => handleKeyDown(e, vendor.id, "budget")}
                          onPaste={(e) => handlePaste(e, vendor.id, "budget")}
                          placeholder="Enter budget"
                          className="vendor-input budget-input"
                          step="0.1"
                        />
                      ) : (
                        <span className="vendor-label budget-amount">
                          {formatCurrencyExcelStyle(vendor.budget * 1000)}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <input
                          type="text"
                          value={vendor.description || ""}
                          onChange={(e) =>
                            handleInputChange(
                              vendor.id,
                              "description",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, vendor.id, "description")
                          }
                          onPaste={(e) =>
                            handlePaste(e, vendor.id, "description")
                          }
                          placeholder="Enter description"
                          className="vendor-input"
                        />
                      ) : (
                        <span className="vendor-label" title={vendor.description}>
                          {vendor.description || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {inEditMode ? (
                        <select
                          value={vendor.month || "N/A"}
                          onChange={(e) =>
                            handleInputChange(vendor.id, "month", e.target.value)
                          }
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
                        <div className="vendor-toggle">
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
                          value={vendor.notes || ""}
                          onChange={(e) =>
                            handleInputChange(vendor.id, "notes", e.target.value)
                          }
                          onKeyDown={(e) => handleNotesKeyDown(e, vendor.id)}
                          onPaste={(e) => handlePaste(e, vendor.id, "notes")}
                          placeholder="Add notes..."
                          className="vendor-textarea"
                          rows={2}
                        />
                      ) : (
                        <span className="budget-label-notes" title={vendor.notes}>
                          {vendor.notes || "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {isComplete && (
                        <TableActionButtons
                          isEditing={inEditMode}
                          onEdit={() => toggleEditMode(vendor.id)}
                          onDelete={() => deleteVendor(vendor.id)}
                          editTooltip={inEditMode ? "Finish editing" : "Edit vendor"}
                          deleteTooltip={vendors.length === 1 ? "Cannot delete the last vendor" : "Remove vendor"}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {/* Totals Rows */}
            <tr className="totals-row">
              <td colSpan={4} className="totals-label">
                <strong>In Budget Total</strong>
              </td>
              <td className="totals-amount">
                <strong>
                  {formatCurrencyExcelStyle(calculateInBudgetTotal() * 1000)}
                </strong>
              </td>
              <td colSpan={5}></td>
            </tr>
            <tr className="totals-row not-in-budget">
              <td colSpan={4} className="totals-label">
                <strong>Not In Budget Total</strong>
              </td>
              <td className="totals-amount">
                <strong>
                  {formatCurrencyExcelStyle(calculateNotInBudgetTotal() * 1000)}
                </strong>
              </td>
              <td colSpan={5}></td>
            </tr>
            <tr className="totals-row grand-total">
              <td colSpan={4} className="totals-label">
                <strong>Grand Total</strong>
              </td>
              <td className="totals-amount">
                <strong>
                  {formatCurrencyExcelStyle(calculateTotal() * 1000)}
                </strong>
              </td>
              <td colSpan={5}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="vendor-management-footer">
        <p className="keyboard-shortcuts">
          <small>
            ⌨️ Press Enter in any field to add a new row | Tab out of Notes to
            add a new row | 📋 Paste Excel data from clipboard | ✏️ Edit
            completed vendors | ✓ Finish editing
          </small>
        </p>
      </div>
    </div>
  );
};

export default VendorBudgetTable;