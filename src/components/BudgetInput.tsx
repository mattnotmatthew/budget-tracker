import React, { useState, useEffect } from "react";
import { useBudget } from "../context/BudgetContext";
import { BudgetEntry } from "../types";
import { smartAutoSave } from "../utils/fileManager";

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
  const handleInputChange = (
    categoryId: string,
    field: keyof CategoryData,
    value: string
  ) => {
    setCategoryData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value,
      },
    }));
  };
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
      }); // Save to file
      const result = await smartAutoSave(
        {
          entries: state.entries,
          selectedYear: state.selectedYear,
          yearlyBudgetTargets: state.yearlyBudgetTargets,
          monthlyForecastModes: state.monthlyForecastModes,
        },
        state.currentFile
      ); // Update the current file if a new one was created
      if (result.fileHandle) {
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
  return (
    <div className="budget-input-overlay">
      <div className="budget-input-modal">
        <div className="modal-header">
          <h3>
            {isReadOnly ? "Budget View" : "Budget Input"} - {state.selectedYear}
          </h3>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>
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
                  <div key={category.id} className="category-row">
                    <div className="category-name">{category.name}</div>
                    <input
                      id={`${category.id}-budgetAmount`}
                      type="text"
                      placeholder="Budget"
                      className="amount-input"
                      value={categoryData[category.id]?.budgetAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          category.id,
                          "budgetAmount",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, category.id, "budgetAmount")
                      }
                      onPaste={(e) =>
                        handlePaste(e, category.id, "budgetAmount")
                      }
                    />
                    <input
                      id={`${category.id}-actualAmount`}
                      type="text"
                      placeholder="Actual"
                      className="amount-input"
                      value={categoryData[category.id]?.actualAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          category.id,
                          "actualAmount",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, category.id, "actualAmount")
                      }
                      onPaste={(e) =>
                        handlePaste(e, category.id, "actualAmount")
                      }
                    />
                    <input
                      id={`${category.id}-reforecastAmount`}
                      type="text"
                      placeholder="Reforecast"
                      className="amount-input"
                      value={categoryData[category.id]?.reforecastAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          category.id,
                          "reforecastAmount",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, category.id, "reforecastAmount")
                      }
                      onPaste={(e) =>
                        handlePaste(e, category.id, "reforecastAmount")
                      }
                    />
                    <input
                      id={`${category.id}-adjustmentAmount`}
                      type="text"
                      placeholder="Adjustments"
                      className="amount-input"
                      value={categoryData[category.id]?.adjustmentAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          category.id,
                          "adjustmentAmount",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, category.id, "adjustmentAmount")
                      }
                      onPaste={(e) =>
                        handlePaste(e, category.id, "adjustmentAmount")
                      }
                    />
                    <input
                      id={`${category.id}-notes`}
                      type="text"
                      placeholder="Notes"
                      className="notes-input"
                      value={categoryData[category.id]?.notes || ""}
                      onChange={(e) =>
                        handleInputChange(category.id, "notes", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, category.id, "notes")}
                      onPaste={(e) => handlePaste(e, category.id, "notes")}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Operating Expenses Section */}
            <div className="category-section">
              <h3 className="category-section-title">Operating Expenses</h3>
              <div className="category-grid">
                {opexCategories.map((category) => (
                  <div key={category.id} className="category-row">
                    <div className="category-name">{category.name}</div>
                    <input
                      id={`${category.id}-budgetAmount`}
                      type="text"
                      placeholder="Budget"
                      className="amount-input"
                      value={categoryData[category.id]?.budgetAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          category.id,
                          "budgetAmount",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, category.id, "budgetAmount")
                      }
                      onPaste={(e) =>
                        handlePaste(e, category.id, "budgetAmount")
                      }
                    />
                    <input
                      id={`${category.id}-actualAmount`}
                      type="text"
                      placeholder="Actual"
                      className="amount-input"
                      value={categoryData[category.id]?.actualAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          category.id,
                          "actualAmount",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, category.id, "actualAmount")
                      }
                      onPaste={(e) =>
                        handlePaste(e, category.id, "actualAmount")
                      }
                    />
                    <input
                      id={`${category.id}-reforecastAmount`}
                      type="text"
                      placeholder="Reforecast"
                      className="amount-input"
                      value={categoryData[category.id]?.reforecastAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          category.id,
                          "reforecastAmount",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, category.id, "reforecastAmount")
                      }
                      onPaste={(e) =>
                        handlePaste(e, category.id, "reforecastAmount")
                      }
                    />
                    <input
                      id={`${category.id}-adjustmentAmount`}
                      type="text"
                      placeholder="Adjustments"
                      className="amount-input"
                      value={categoryData[category.id]?.adjustmentAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          category.id,
                          "adjustmentAmount",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, category.id, "adjustmentAmount")
                      }
                      onPaste={(e) =>
                        handlePaste(e, category.id, "adjustmentAmount")
                      }
                    />
                    <input
                      id={`${category.id}-notes`}
                      type="text"
                      placeholder="Notes"
                      className="notes-input"
                      value={categoryData[category.id]?.notes || ""}
                      onChange={(e) =>
                        handleInputChange(category.id, "notes", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, category.id, "notes")}
                      onPaste={(e) => handlePaste(e, category.id, "notes")}
                    />
                  </div>
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
  );
};
export default BudgetInput;
