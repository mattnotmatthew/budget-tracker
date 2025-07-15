import React, { useState, useEffect } from "react";
import { useBudget } from "../../../context/BudgetContext";
import { BudgetEntry } from "../../../types";
import { smartAutoSave } from "../../../utils/fileManager";
import { formatCurrencyExcelStyle } from "../../../utils/currencyFormatter";

interface CategoryData {
  categoryId: string;
  budgetAmount: string;
  actualAmount: string;
  reforecastAmount: string;
  adjustmentAmount: string;
  notes: string;
}

interface BudgetInputProps {
  onClose: () => void;
  onForceFileManager?: () => void;
  isReadOnly?: boolean;
}

const BudgetInput: React.FC<BudgetInputProps> = ({
  onClose,
  onForceFileManager,
  isReadOnly = false,
}) => {
  const { state, dispatch } = useBudget();
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Allocation state management
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [allocationData, setAllocationData] = useState<{
    [categoryId: string]: { support: string; rd: string };
  }>({});
  
  // Yearly budget target state
  const [isEditingYearlyBudget, setIsEditingYearlyBudget] = useState(false);
  const [yearlyBudgetInput, setYearlyBudgetInput] = useState("");
  const [isYearlyBudgetCollapsed, setIsYearlyBudgetCollapsed] = useState(true); // Collapsed by default
  const currentYearTarget = state.yearlyBudgetTargets[state.selectedYear] || 0;
  // Separate categories by parent category
  const costOfSalesCategories = state.categories.filter(
    (cat) => cat.parentCategory === "cost-of-sales"
  );
  const opexCategories = state.categories.filter(
    (cat) => cat.parentCategory === "opex"
  );
  const allCategories = [...costOfSalesCategories, ...opexCategories];
  // Initialize category data
  const initializeCategoryData = (): { [key: string]: CategoryData } => {
    const data: { [key: string]: CategoryData } = {};
    // Get existing entries for the selected period
    const existingEntries = state.entries.filter(
      (entry) =>
        entry.year === state.selectedYear &&
        entry.quarter === selectedQuarter &&
        entry.month === selectedMonth
    );
    state.categories.forEach((category) => {
      // Find existing entry for this category
      const existingEntry = existingEntries.find(
        (entry) => entry.categoryId === category.id
      );
      data[category.id] = {
        categoryId: category.id,
        budgetAmount: existingEntry
          ? existingEntry.budgetAmount.toString()
          : "",
        actualAmount:
          existingEntry?.actualAmount !== undefined
            ? existingEntry.actualAmount.toString()
            : "",
        reforecastAmount:
          existingEntry?.reforecastAmount !== undefined
            ? existingEntry.reforecastAmount.toString()
            : "",
        adjustmentAmount:
          existingEntry?.adjustmentAmount !== undefined
            ? existingEntry.adjustmentAmount.toString()
            : "",
        notes: existingEntry?.notes || "",
      };
    });
    return data;
  };
  const [categoryData, setCategoryData] = useState<{
    [key: string]: CategoryData;
  }>(initializeCategoryData);
  // Show last saved timestamp when component opens
  useEffect(() => {
    if (state.currentFile?.lastSaved) {
      setLastSavedAt(state.currentFile.lastSaved);
    }
  }, [state.currentFile?.lastSaved]);
  // Check if file is attached on mount - if not, force file manager
  useEffect(() => {
    if (!state.currentFile && onForceFileManager) {
      setSaveMessage(
        "⚠️ No file attached. Please select or create a file first."
      );
      setTimeout(() => {
        onForceFileManager();
      }, 2000);
    }
  }, [state.currentFile, onForceFileManager]);
  // Reload data when quarter or month changes (NO AUTO-SAVE)
  useEffect(() => {
    setCategoryData(initializeCategoryData());
  }, [selectedQuarter, selectedMonth, state.selectedYear, state.entries]);
  // Reset month to first month of quarter when quarter changes
  useEffect(() => {
    const firstMonthOfQuarter = (selectedQuarter - 1) * 3 + 1;
    setSelectedMonth(firstMonthOfQuarter);
  }, [selectedQuarter]);

  // Load allocations when month, year, or allocations change
  useEffect(() => {
    loadAllocations();
  }, [selectedMonth, state.selectedYear, state.allocations]);

  // Restore expanded categories from sessionStorage on mount
  useEffect(() => {
    const savedExpanded = sessionStorage.getItem("budgetInput-expandedCategories");
    if (savedExpanded) {
      try {
        const expandedArray = JSON.parse(savedExpanded);
        setExpandedCategories(new Set(expandedArray));
      } catch (error) {
        console.warn("Failed to restore expanded categories from sessionStorage:", error);
      }
    }
  }, []);

  // Get months for the selected quarter
  const getMonthsForQuarter = (quarter: number): number[] => {
    const startMonth = (quarter - 1) * 3 + 1;
    return [startMonth, startMonth + 1, startMonth + 2];
  };
  const getMonthName = (month: number): string => {
    const monthNames = [
      "",
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
    return monthNames[month] || "";
  };
  // Keyboard navigation handler
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    categoryId: string,
    fieldType: keyof CategoryData
  ) => {
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      return;
    }
    e.preventDefault();
    const currentCategoryIndex = allCategories.findIndex(
      (cat) => cat.id === categoryId
    );
    const fieldTypes: (keyof CategoryData)[] = [
      "budgetAmount",
      "actualAmount",
      "reforecastAmount",
      "adjustmentAmount",
      "notes",
    ];
    const currentFieldIndex = fieldTypes.findIndex(
      (field) => field === fieldType
    );
    let targetCategoryIndex = currentCategoryIndex;
    let targetFieldIndex = currentFieldIndex;
    switch (e.key) {
      case "ArrowDown":
        targetCategoryIndex = Math.min(
          currentCategoryIndex + 1,
          allCategories.length - 1
        );
        break;
      case "ArrowUp":
        targetCategoryIndex = Math.max(currentCategoryIndex - 1, 0);
        break;
      case "ArrowRight":
        targetFieldIndex = Math.min(
          currentFieldIndex + 1,
          fieldTypes.length - 1
        );
        break;
      case "ArrowLeft":
        targetFieldIndex = Math.max(currentFieldIndex - 1, 0);
        break;
    }
    const targetCategoryId = allCategories[targetCategoryIndex].id;
    const targetFieldType = fieldTypes[targetFieldIndex];
    const targetInputId = `${targetCategoryId}-${targetFieldType}`;
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const targetInput = document.getElementById(
        targetInputId
      ) as HTMLInputElement;
      if (targetInput) {
        targetInput.focus();
        targetInput.select(); // Select all text for easy overwriting
      }
    }, 0);
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
  // Excel paste handler
  const handlePaste = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    categoryId: string,
    fieldType: keyof CategoryData
  ) => {
    e.preventDefault();
    try {
      const pasteData = e.clipboardData.getData("text");
      const lines = pasteData.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) return;
      const startCategoryIndex = allCategories.findIndex(
        (cat) => cat.id === categoryId
      );
      if (startCategoryIndex === -1) return;
      let successCount = 0;
      const newCategoryData = { ...categoryData };
      for (let i = 0; i < lines.length; i++) {
        const targetCategoryIndex = startCategoryIndex + i;
        if (targetCategoryIndex >= allCategories.length) break;
        const targetCategory = allCategories[targetCategoryIndex];
        let value = lines[i].trim();
        // Process the value based on field type
        if (fieldType === "notes") {
          // For notes, just use the text as-is
          newCategoryData[targetCategory.id] = {
            ...newCategoryData[targetCategory.id],
            [fieldType]: value,
          };
          successCount++;
        } else {
          // For number fields, clean and validate
          const cleanValue = cleanExcelNumber(value);
          if (cleanValue !== null) {
            newCategoryData[targetCategory.id] = {
              ...newCategoryData[targetCategory.id],
              [fieldType]: cleanValue.toString(),
            };
            successCount++;
          }
        }
      }
      setCategoryData(newCategoryData);
      if (successCount > 0) {
        setSaveMessage(`✅ Pasted ${successCount} values successfully!`);
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage(`⚠️ Paste failed - no valid values found`);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      setSaveMessage(`⚠️ Paste failed`);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Allocation management functions
  const loadAllocations = () => {
    const monthAllocations = state.allocations.filter(
      (a) => a.year === state.selectedYear && a.month === selectedMonth
    );
    
    const allocData: { [categoryId: string]: { support: string; rd: string } } = {};
    monthAllocations.forEach((alloc) => {
      allocData[alloc.categoryId] = {
        support: alloc.supportAmount.toString(),
        rd: alloc.rdAmount.toString(),
      };
    });
    
    setAllocationData(allocData);
  };

  const handleAllocationChange = (
    categoryId: string,
    field: "support" | "rd",
    value: string
  ) => {
    if (isReadOnly) return;

    const cleanedValue = value.replace(/[^0-9.-]/g, "");
    setAllocationData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: cleanedValue,
      },
    }));
  };

  const validateAllocation = (categoryId: string): boolean => {
    const actual = parseFloat(categoryData[categoryId]?.actualAmount) || 0;
    const support = parseFloat(allocationData[categoryId]?.support) || 0;
    const rd = parseFloat(allocationData[categoryId]?.rd) || 0;
    
    return Math.abs((support + rd) - actual) < 0.01; // Allow for rounding
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      
      // Save to sessionStorage
      sessionStorage.setItem(
        "budgetInput-expandedCategories",
        JSON.stringify(Array.from(newSet))
      );
      
      return newSet;
    });
  };

  const handleInputChange = (
    categoryId: string,
    field: keyof CategoryData,
    value: string
  ) => {
    // Don't allow changes in read-only mode
    if (isReadOnly) return;

    setCategoryData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value,
      },
    }));

    // Clear allocations when actual amount is cleared
    if (field === "actualAmount" && value === "") {
      setAllocationData((prev) => ({
        ...prev,
        [categoryId]: {
          support: "",
          rd: "",
        },
      }));
    }
  };
  // Helper function to get common input props
  const getInputProps = (
    categoryId: string,
    fieldType: keyof CategoryData
  ) => ({
    disabled: isReadOnly,
    readOnly: isReadOnly,
    value: categoryData[categoryId]?.[fieldType] || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      handleInputChange(categoryId, fieldType, e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
      !isReadOnly && handleKeyDown(e, categoryId, fieldType),
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) =>
      !isReadOnly && handlePaste(e, categoryId, fieldType),
  });
  // Save function that processes current form data and saves to file
  const handleSave = async () => {
    try {
      // Process current form data into entries
      const entriesToSave: BudgetEntry[] = [];
      // Get all existing entries except those for current period
      const otherEntries = state.entries.filter(
        (entry) =>
          !(
            entry.year === state.selectedYear &&
            entry.quarter === selectedQuarter &&
            entry.month === selectedMonth
          )
      ); // Process current form data
      Object.values(categoryData).forEach((catData) => {
        const hasBudget = catData.budgetAmount !== "";
        const hasActual = catData.actualAmount !== "";
        const hasReforecast = catData.reforecastAmount !== "";
        const hasAdjustment = catData.adjustmentAmount !== "";
        const hasNotes = catData.notes !== "";
        // Only create entry if at least one field has data
        if (
          hasBudget ||
          hasActual ||
          hasReforecast ||
          hasAdjustment ||
          hasNotes
        ) {
          // Check if entry already exists
          const existingEntry = state.entries.find(
            (entry) =>
              entry.year === state.selectedYear &&
              entry.quarter === selectedQuarter &&
              entry.month === selectedMonth &&
              entry.categoryId === catData.categoryId
          );
          const entryData = {
            categoryId: catData.categoryId,
            year: state.selectedYear,
            quarter: selectedQuarter,
            month: selectedMonth,
            budgetAmount: parseFloat(catData.budgetAmount) || 0,
            actualAmount: hasActual
              ? parseFloat(catData.actualAmount)
              : undefined,
            reforecastAmount: hasReforecast
              ? parseFloat(catData.reforecastAmount)
              : undefined,
            adjustmentAmount: hasAdjustment
              ? parseFloat(catData.adjustmentAmount)
              : undefined,
            notes: catData.notes || undefined,
            updatedAt: new Date(),
          };
          if (existingEntry) {
            // Update existing entry
            const updatedEntry: BudgetEntry = {
              ...existingEntry,
              ...entryData,
            };
            entriesToSave.push(updatedEntry);
            dispatch({ type: "UPDATE_ENTRY", payload: updatedEntry });
          } else {
            // Create new entry
            const newEntry: BudgetEntry = {
              id: `${Date.now()}-${catData.categoryId}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              ...entryData,
              createdAt: new Date(),
            };
            entriesToSave.push(newEntry);
            dispatch({ type: "ADD_ENTRY", payload: newEntry });
          }
        }
      });
      // Also handle deletion of entries that no longer have data
      state.entries.forEach((entry) => {
        if (
          entry.year === state.selectedYear &&
          entry.quarter === selectedQuarter &&
          entry.month === selectedMonth
        ) {
          const catData = categoryData[entry.categoryId];
          if (catData) {
            const hasBudget = catData.budgetAmount !== "";
            const hasActual = catData.actualAmount !== "";
            const hasReforecast = catData.reforecastAmount !== "";
            const hasAdjustment = catData.adjustmentAmount !== "";
            const hasNotes = catData.notes !== "";
            // If all fields are empty, delete the entry
            if (
              !hasBudget &&
              !hasActual &&
              !hasReforecast &&
              !hasAdjustment &&
              !hasNotes
            ) {
              dispatch({ type: "DELETE_ENTRY", payload: entry.id });
            }
          }
        }
      });

      // Process allocation data
      Object.entries(allocationData).forEach(([categoryId, allocation]) => {
        const supportAmount = parseFloat(allocation.support) || 0;
        const rdAmount = parseFloat(allocation.rd) || 0;
        
        if (supportAmount > 0 || rdAmount > 0) {
          // Check if allocation already exists for this category/month/year
          const existingAllocation = state.allocations.find(
            (alloc) =>
              alloc.categoryId === categoryId &&
              alloc.month === selectedMonth &&
              alloc.year === state.selectedYear
          );

          const allocationPayload = {
            categoryId,
            year: state.selectedYear,
            month: selectedMonth,
            supportAmount,
            rdAmount,
            updatedAt: new Date(),
          };

          if (existingAllocation) {
            // Update existing allocation
            dispatch({
              type: "UPDATE_ALLOCATION",
              payload: { ...allocationPayload, id: existingAllocation.id, createdAt: existingAllocation.createdAt },
            });
          } else {
            // Create new allocation
            const newAllocation = {
              id: `allocation-${categoryId}-${state.selectedYear}-${selectedMonth}`,
              ...allocationPayload,
              createdAt: new Date(),
            };
            dispatch({ type: "ADD_ALLOCATION", payload: newAllocation });
          }
        } else {
          // Remove allocation if both values are zero/empty
          const existingAllocation = state.allocations.find(
            (alloc) =>
              alloc.categoryId === categoryId &&
              alloc.month === selectedMonth &&
              alloc.year === state.selectedYear
          );
          if (existingAllocation) {
            dispatch({ type: "DELETE_ALLOCATION", payload: existingAllocation.id });
          }
        }
      });

      // Save to file
      const result = await smartAutoSave(
        {
          entries: state.entries,
          allocations: state.allocations,
          selectedYear: state.selectedYear,
          yearlyBudgetTargets: state.yearlyBudgetTargets,
          monthlyForecastModes: state.monthlyForecastModes,
          vendorData: state.vendorData,
          vendorTrackingData: state.vendorTrackingData,
        },
        state.currentFile
      ); // Update the current file if a new one was created or reconnected
      if (result.newFileHandle) {
        // Handle reconnection case - update with the new file handle
        const now = new Date();
        setLastSavedAt(now);
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            name: result.newFileHandle.name,
            handle: result.newFileHandle,
            lastSaved: now,
            userLastSaved: now,
          },
        });
      } else if (result.fileHandle) {
        const now = new Date();
        setLastSavedAt(now);
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            name: result.fileName || "",
            handle: result.fileHandle,
            lastSaved: now,
            userLastSaved: now, // Set both timestamps for new files
          },
        });
      } else if (state.currentFile) {
        const now = new Date();
        setLastSavedAt(now);
        dispatch({
          type: "SET_CURRENT_FILE",
          payload: {
            ...state.currentFile,
            lastSaved: now,
            userLastSaved: now, // Update user save timestamp
          },
        });
      }
      if (result.saved) {
        if (result.fileHandle) {
          setSaveMessage("✅ Data saved to new file successfully!");
        } else {
          setSaveMessage("✅ Data saved to file successfully!");
        }
      } else if (result.userCancelled) {
        setSaveMessage(
          "❌ Save cancelled - please select a file to save your data"
        );
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveMessage("❌ Save failed. Please try again.");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };
  const handleReset = () => {
    setCategoryData(initializeCategoryData());
  };
  const handleClose = async () => {
    // Check if there are unsaved changes
    const hasUnsavedChanges = Object.values(categoryData).some((catData) => {
      const existingEntry = state.entries.find(
        (entry) =>
          entry.year === state.selectedYear &&
          entry.quarter === selectedQuarter &&
          entry.month === selectedMonth &&
          entry.categoryId === catData.categoryId
      );
      const hasBudget = catData.budgetAmount !== "";
      const hasActual = catData.actualAmount !== "";
      const hasReforecast = catData.reforecastAmount !== "";
      const hasAdjustment = catData.adjustmentAmount !== "";
      const hasNotes = catData.notes !== "";
      // Check if current data differs from existing entry
      if (existingEntry) {
        const budgetChanged =
          (parseFloat(catData.budgetAmount) || 0) !==
          existingEntry.budgetAmount;
        const actualChanged =
          (parseFloat(catData.actualAmount) || 0) !==
          (existingEntry.actualAmount || 0);
        const reforecastChanged =
          (parseFloat(catData.reforecastAmount) || 0) !==
          (existingEntry.reforecastAmount || 0);
        const adjustmentChanged =
          (parseFloat(catData.adjustmentAmount) || 0) !==
          (existingEntry.adjustmentAmount || 0);
        const notesChanged = catData.notes !== (existingEntry.notes || "");
        return (
          budgetChanged ||
          actualChanged ||
          reforecastChanged ||
          adjustmentChanged ||
          notesChanged
        );
      } else {
        // New data that wasn't saved before
        return (
          hasBudget || hasActual || hasReforecast || hasAdjustment || hasNotes
        );
      }
    });
    if (hasUnsavedChanges) {
      if (!state.currentFile) {
        const confirmed = window.confirm(
          "No file is attached and you have unsaved changes. Changes will be lost. Do you want to close anyway?"
        );
        if (!confirmed) return;
      } else {
        // Offer to save before closing if file is attached
        const confirmed = window.confirm(
          "You have unsaved changes. Save before closing?"
        );
        if (confirmed) {
          await handleSave();
        }
      }
    }
    onClose();
  };

  // Yearly Budget Target Functions
  const handleEditYearlyBudget = () => {
    setIsEditingYearlyBudget(true);
    setYearlyBudgetInput(
      currentYearTarget > 0 ? currentYearTarget.toString() : ""
    );
  };

  const handleSaveYearlyBudget = async () => {
    const amount = parseFloat(yearlyBudgetInput.replace(/,/g, "")) || 0;

    // Update the state
    dispatch({
      type: "SET_YEARLY_BUDGET_TARGET",
      payload: { year: state.selectedYear, amount },
    });

    // Auto-save to file if one is attached
    try {
      if (state.currentFile) {
        const updatedState = {
          entries: state.entries,
          allocations: state.allocations,
          selectedYear: state.selectedYear,
          yearlyBudgetTargets: {
            ...state.yearlyBudgetTargets,
            [state.selectedYear]: amount,
          },
          monthlyForecastModes: state.monthlyForecastModes,
          vendorData: state.vendorData,
          vendorTrackingData: state.vendorTrackingData,
        };

        await smartAutoSave(updatedState, state.currentFile);
        setSaveMessage("✅ Yearly budget saved to file");
      } else {
        setSaveMessage("✅ Yearly budget saved (file not attached)");
      }
    } catch (error) {
      console.error("Failed to save yearly budget:", error);
      setSaveMessage("⚠️ Yearly budget saved locally, but file save failed");
    }

    setIsEditingYearlyBudget(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleCancelYearlyBudget = () => {
    setIsEditingYearlyBudget(false);
    setYearlyBudgetInput(
      currentYearTarget > 0 ? currentYearTarget.toString() : ""
    );
  };

  const handleYearlyBudgetKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveYearlyBudget();
    } else if (e.key === "Escape") {
      handleCancelYearlyBudget();
    }
  };

  // Initialize yearly budget input when component loads
  useEffect(() => {
    setYearlyBudgetInput(
      currentYearTarget > 0 ? currentYearTarget.toString() : ""
    );
  }, [currentYearTarget]);

  return (
    <div className="budget-input-overlay">
      <div className={`budget-input-modal ${isReadOnly ? "read-only" : ""}`}>
        <div className="budget-input-header">
          <h2>
            {isReadOnly ? "Budget View" : "Budget Input"} - {state.selectedYear}
          </h2>{" "}
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="budget-input-content">
          <div className="period-selectors">
            <div className="form-group">
              <label>Quarter:</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                disabled={isReadOnly}
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </select>
            </div>
            <div className="form-group">
              <label>Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                disabled={isReadOnly}
              >
                {getMonthsForQuarter(selectedQuarter).map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>{" "}
          </div>{" "}
          {/* Yearly Budget Target Section */}
          <div className="yearly-budget-section">
            <div className="yearly-budget-card">
              <div
                className="yearly-budget-header collapsible-header"
                onClick={() =>
                  setIsYearlyBudgetCollapsed(!isYearlyBudgetCollapsed)
                }
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span className="collapse-icon">
                    {isYearlyBudgetCollapsed ? "▶" : "▼"}
                  </span>
                  <h4>📊 {state.selectedYear} Annual Budget Target</h4>
                  {currentYearTarget > 0 && (
                    <span className="yearly-budget-preview">
                      ({formatCurrencyExcelStyle(currentYearTarget)})
                    </span>
                  )}
                </div>
                {!isYearlyBudgetCollapsed &&
                  !isEditingYearlyBudget &&
                  !isReadOnly && (
                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent collapse toggle
                        handleEditYearlyBudget();
                      }}
                      title="Edit yearly budget target"
                    >
                      ✏️ Edit
                    </button>
                  )}
              </div>

              {!isYearlyBudgetCollapsed && (
                <div className="yearly-budget-content">
                  {isEditingYearlyBudget ? (
                    <div className="yearly-budget-edit-form">
                      <input
                        type="text"
                        value={yearlyBudgetInput}
                        onChange={(e) => setYearlyBudgetInput(e.target.value)}
                        onKeyDown={handleYearlyBudgetKeyPress}
                        placeholder="Enter yearly budget (e.g., 1200000)"
                        className="yearly-budget-input"
                        autoFocus
                      />
                      <div className="yearly-budget-buttons">
                        <button
                          className="btn btn-success btn-small"
                          onClick={handleSaveYearlyBudget}
                        >
                          💾 Save
                        </button>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={handleCancelYearlyBudget}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                      <small className="yearly-budget-hint">
                        Press Enter to save, Escape to cancel
                      </small>
                    </div>
                  ) : (
                    <div className="yearly-budget-display">
                      <span className="yearly-budget-amount">
                        {currentYearTarget > 0
                          ? formatCurrencyExcelStyle(currentYearTarget)
                          : "Not Set"}
                      </span>
                      {currentYearTarget === 0 && (
                        <p className="no-budget-hint">
                          Click Edit to set your {state.selectedYear} budget
                          target
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {saveMessage && <div className="save-message">{saveMessage}</div>}
          {lastSavedAt && (
            <div className="last-saved">
              Last saved: {lastSavedAt.toLocaleString()}
            </div>
          )}{" "}
          <div className="budget-form">
            <div className="categories-container">
              {/* Floating Save Button - Sticky positioned outside form */}
              <div className="floating-save-container">
                <button
                  className="btn btn-success floating-save-btn"
                  onClick={handleSave}
                  disabled={isReadOnly}
                  style={{ opacity: isReadOnly ? 0.5 : 1 }}
                >
                  💾 Save to File
                </button>
              </div>{" "}
              <div className="category-headers">
                <div className="category-name-header">Category</div>
                <span>Budget</span>
                <span>Actual</span>
                <span>Forecast</span>
                <span>Adjustments</span>
                <span>Notes</span>
              </div>
              {/* Cost of Sales Section */}
              <div className="category-section">
                <h3 className="category-section-title">Cost of Sales</h3>
                <div className="category-grid">
                  {costOfSalesCategories.map((category) => (
                    <React.Fragment key={category.id}>
                      <div className="category-row">
                        <div className="category-name">
                          <span
                            className="collapse-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategory(category.id);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {expandedCategories.has(category.id) ? "▼" : "▶"}
                          </span>
                          {category.name}
                        </div>
                        <input
                          id={`${category.id}-budgetAmount`}
                          type="text"
                          placeholder="Budget"
                          className="amount-input"
                          {...getInputProps(category.id, "budgetAmount")}
                        />
                        <input
                          id={`${category.id}-actualAmount`}
                          type="text"
                          placeholder="Actual"
                          className="amount-input"
                          {...getInputProps(category.id, "actualAmount")}
                        />
                        <input
                          id={`${category.id}-reforecastAmount`}
                          type="text"
                          placeholder="Reforecast"
                          className="amount-input"
                          {...getInputProps(category.id, "reforecastAmount")}
                        />
                        <input
                          id={`${category.id}-adjustmentAmount`}
                          type="text"
                          placeholder="Adjustments"
                          className="amount-input"
                          {...getInputProps(category.id, "adjustmentAmount")}
                        />
                        <input
                          id={`${category.id}-notes`}
                          type="text"
                          placeholder="Notes"
                          className="notes-input"
                          {...getInputProps(category.id, "notes")}
                        />
                      </div>
                      {/* Allocation Row for this category */}
                      {expandedCategories.has(category.id) && (
                        <div className="allocation-row">
                          <div></div> {/* Empty cell for category name column */}
                          <div></div> {/* Empty cell for budget column */}
                          <div className="allocation-inputs">
                            <div className="allocation-input-group">
                              <div className="allocation-label">Support</div>
                              <input
                                type="text"
                                className="allocation-input"
                                value={allocationData[category.id]?.support || ""}
                                onChange={(e) =>
                                  handleAllocationChange(category.id, "support", e.target.value)
                                }
                                disabled={isReadOnly}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="allocation-input-group">
                              <div className="allocation-label">R&D</div>
                              <input
                                type="text"
                                className="allocation-input"
                                value={allocationData[category.id]?.rd || ""}
                                onChange={(e) =>
                                  handleAllocationChange(category.id, "rd", e.target.value)
                                }
                                disabled={isReadOnly}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          {!validateAllocation(category.id) && 
                           (allocationData[category.id]?.support || allocationData[category.id]?.rd) && (
                            <div className="allocation-error">
                              Support + R&D must equal Actual amount
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {/* Operating Expenses Section */}
              <div className="category-section">
                <h3 className="category-section-title">Operating Expenses</h3>
                <div className="category-grid">
                  {opexCategories.map((category) => (
                    <React.Fragment key={category.id}>
                      <div className="category-row">
                        <div className="category-name">
                          <span
                            className="collapse-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategory(category.id);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {expandedCategories.has(category.id) ? "▼" : "▶"}
                          </span>
                          {category.name}
                        </div>
                        <input
                          id={`${category.id}-budgetAmount`}
                          type="text"
                          placeholder="Budget"
                          className="amount-input"
                          {...getInputProps(category.id, "budgetAmount")}
                        />
                        <input
                          id={`${category.id}-actualAmount`}
                          type="text"
                          placeholder="Actual"
                          className="amount-input"
                          {...getInputProps(category.id, "actualAmount")}
                        />
                        <input
                          id={`${category.id}-reforecastAmount`}
                          type="text"
                          placeholder="Reforecast"
                          className="amount-input"
                          {...getInputProps(category.id, "reforecastAmount")}
                        />
                        <input
                          id={`${category.id}-adjustmentAmount`}
                          type="text"
                          placeholder="Adjustments"
                          className="amount-input"
                          {...getInputProps(category.id, "adjustmentAmount")}
                        />
                        <input
                          id={`${category.id}-notes`}
                          type="text"
                          placeholder="Notes"
                          className="notes-input"
                          {...getInputProps(category.id, "notes")}
                        />
                      </div>
                      {/* Allocation Row for this category */}
                      {expandedCategories.has(category.id) && (
                        <div className="allocation-row">
                          <div></div> {/* Empty cell for category name column */}
                          <div></div> {/* Empty cell for budget column */}
                          <div className="allocation-inputs">
                            <div className="allocation-input-group">
                              <div className="allocation-label">Support</div>
                              <input
                                type="text"
                                className="allocation-input"
                                value={allocationData[category.id]?.support || ""}
                                onChange={(e) =>
                                  handleAllocationChange(category.id, "support", e.target.value)
                                }
                                disabled={isReadOnly}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="allocation-input-group">
                              <div className="allocation-label">R&D</div>
                              <input
                                type="text"
                                className="allocation-input"
                                value={allocationData[category.id]?.rd || ""}
                                onChange={(e) =>
                                  handleAllocationChange(category.id, "rd", e.target.value)
                                }
                                disabled={isReadOnly}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          {!validateAllocation(category.id) && 
                           (allocationData[category.id]?.support || allocationData[category.id]?.rd) && (
                            <div className="allocation-error">
                              Support + R&D must equal Actual amount
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>{" "}
            <div className="budget-input-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                Reset
              </button>{" "}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default React.memo(BudgetInput);
