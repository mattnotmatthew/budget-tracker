import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { VendorData } from "../types";
import { formatCurrencyExcelStyle } from "../utils/currencyFormatter";
import { VendorTrackingTable } from "./VendorTracking";
import { TableActionButtons } from "./shared";
import "../styles/App-new.css";

const VendorManagement: React.FC = () => {
  const { state, dispatch } = useBudget();

  // Track which rows are in edit mode
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  // State for paste messages
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<"budget" | "monthly" | "tracking">(
    "budget"
  );

  // Sort and filter state for budget table
  const [budgetSortConfig, setBudgetSortConfig] = useState<{
    field: keyof VendorData | null;
    direction: "asc" | "desc";
  }>({ field: null, direction: "asc" });

  const [budgetFilters, setBudgetFilters] = useState({
    vendorName: "",
    category: "",
    billingType: "",
    inBudget: "all" as "all" | "yes" | "no",
  });

  // Sort and filter state for monthly table
  const [monthlySortConfig, setMonthlySortConfig] = useState<{
    field: "vendorName" | "financeMappedCategory" | "category" | "total" | null;
    direction: "asc" | "desc";
  }>({ field: null, direction: "asc" });

  const [monthlyFilters, setMonthlyFilters] = useState({
    vendorName: "",
    financeMappedCategory: "",
    category: "",
  });

  // Group by state for monthly table
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [groupByType, setGroupByType] = useState<"finance" | "category">(
    "finance"
  );

  // Track which groups are expanded (collapsed by default)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // State for collapsible filters
  const [budgetFiltersCollapsed, setBudgetFiltersCollapsed] = useState(false);
  const [monthlyFiltersCollapsed, setMonthlyFiltersCollapsed] = useState(false);

  // Get vendors for the current year
  const currentYearVendors =
    state.vendorData?.filter((vendor) => vendor.year === state.selectedYear) ||
    [];

  // Sort vendors for budget table
  const sortVendors = (
    vendors: VendorData[],
    config: { field: keyof VendorData | null; direction: "asc" | "desc" }
  ) => {
    if (!config.field) return vendors;

    return [...vendors].sort((a, b) => {
      const aValue = a[config.field!];
      const bValue = b[config.field!];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return config.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

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

      const aStr = String(aValue || "").toLowerCase();
      const bStr = String(bValue || "").toLowerCase();

      return config.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  // Filter vendors for budget table
  const filterVendors = (vendors: VendorData[]) => {
    return vendors.filter((vendor) => {
      const nameMatch = vendor.vendorName
        .toLowerCase()
        .includes(budgetFilters.vendorName.toLowerCase());
      const categoryMatch = (vendor.category || "")
        .toLowerCase()
        .includes(budgetFilters.category.toLowerCase());
      const billingMatch = vendor.billingType
        .toLowerCase()
        .includes(budgetFilters.billingType.toLowerCase());
      const budgetMatch =
        budgetFilters.inBudget === "all"
          ? true
          : budgetFilters.inBudget === "yes"
          ? vendor.inBudget
          : !vendor.inBudget;

      return nameMatch && categoryMatch && billingMatch && budgetMatch;
    });
  };

  // Get filtered and sorted vendors for budget table
  const getFilteredAndSortedVendors = () => {
    const filtered = filterVendors(currentYearVendors);
    return sortVendors(filtered, budgetSortConfig);
  };

  // Sort vendors for monthly table
  const sortVendorsForMonthly = (
    vendors: VendorData[],
    config: {
      field:
        | "vendorName"
        | "financeMappedCategory"
        | "category"
        | "total"
        | null;
      direction: "asc" | "desc";
    }
  ) => {
    if (!config.field) return vendors;

    return [...vendors].sort((a, b) => {
      if (config.field === "total") {
        const aTotal = calculateMonthlyBreakdown(a).reduce(
          (sum, amount) => sum + amount,
          0
        );
        const bTotal = calculateMonthlyBreakdown(b).reduce(
          (sum, amount) => sum + amount,
          0
        );
        return config.direction === "asc" ? aTotal - bTotal : bTotal - aTotal;
      }

      const aValue = a[config.field as keyof VendorData];
      const bValue = b[config.field as keyof VendorData];
      const aStr = String(aValue || "").toLowerCase();
      const bStr = String(bValue || "").toLowerCase();

      return config.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  // Filter vendors for monthly table
  const filterVendorsForMonthly = (vendors: VendorData[]) => {
    return vendors.filter((vendor) => {
      const nameMatch = vendor.vendorName
        .toLowerCase()
        .includes(monthlyFilters.vendorName.toLowerCase());
      const financeCategoryMatch = (vendor.financeMappedCategory || "")
        .toLowerCase()
        .includes(monthlyFilters.financeMappedCategory.toLowerCase());
      const categoryMatch = (vendor.category || "")
        .toLowerCase()
        .includes(monthlyFilters.category.toLowerCase());
      return nameMatch && financeCategoryMatch && categoryMatch;
    });
  };

  // Get filtered and sorted vendors for monthly table
  const getFilteredAndSortedVendorsForMonthly = () => {
    const filtered = filterVendorsForMonthly(currentYearVendors);
    return sortVendorsForMonthly(filtered, monthlySortConfig);
  };

  // Handle sort for budget table
  const handleBudgetSort = (field: keyof VendorData) => {
    setBudgetSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle sort for monthly table
  const handleMonthlySort = (
    field: "vendorName" | "financeMappedCategory" | "category" | "total"
  ) => {
    setMonthlySortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Reset filters
  const resetBudgetFilters = () => {
    setBudgetFilters({
      vendorName: "",
      category: "",
      billingType: "",
      inBudget: "all",
    });
    setBudgetSortConfig({ field: null, direction: "asc" });
  };

  const resetMonthlyFilters = () => {
    setMonthlyFilters({
      vendorName: "",
      financeMappedCategory: "",
      category: "",
    });
    setMonthlySortConfig({ field: null, direction: "asc" });
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

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
      category: "", // <-- Add category field
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
          fieldType === "category" ||
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

  // Helper function to get month number from month name
  const getMonthNumber = (monthName: string): number => {
    const months = [
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
    return months.indexOf(monthName) + 1;
  };

  // Calculate monthly breakdown for a vendor
  const calculateMonthlyBreakdown = (vendor: VendorData): number[] => {
    const monthlyAmounts = new Array(12).fill(0);

    if (vendor.billingType === "monthly") {
      // For monthly billing, distribute evenly from the specified month to end of year
      const startMonth =
        vendor.month === "N/A" ? 1 : getMonthNumber(vendor.month);
      if (startMonth > 0) {
        const monthsRemaining = 12 - startMonth + 1;
        const monthlyAmount = vendor.budget / monthsRemaining;
        for (let i = startMonth - 1; i < 12; i++) {
          monthlyAmounts[i] = monthlyAmount;
        }
      }
    } else if (vendor.billingType === "quarterly") {
      // For quarterly billing, distribute quarterly amounts
      const startMonth =
        vendor.month === "N/A" ? 1 : getMonthNumber(vendor.month);
      if (startMonth > 0) {
        const quartersRemaining = Math.ceil((12 - startMonth + 1) / 3);
        const quarterlyAmount = vendor.budget / quartersRemaining;
        for (let i = startMonth - 1; i < 12; i += 3) {
          monthlyAmounts[i] = quarterlyAmount;
        }
      }
    } else if (vendor.billingType === "annual") {
      // For annual billing, put entire amount in specified month (or January if N/A)
      const targetMonth =
        vendor.month === "N/A" ? 1 : getMonthNumber(vendor.month);
      if (targetMonth > 0) {
        monthlyAmounts[targetMonth - 1] = vendor.budget;
      }
    } else if (vendor.billingType === "one-time") {
      // For one-time billing, put entire amount in specified month
      const targetMonth =
        vendor.month === "N/A" ? 1 : getMonthNumber(vendor.month);
      if (targetMonth > 0) {
        monthlyAmounts[targetMonth - 1] = vendor.budget;
      }
    } else {
      // For other billing types (hourly, project-based), distribute evenly across all months
      const monthlyAmount = vendor.budget / 12;
      monthlyAmounts.fill(monthlyAmount);
    }

    return monthlyAmounts;
  };

  // Calculate totals for each month
  const calculateMonthlyTotals = (
    vendors: VendorData[] = currentYearVendors
  ): number[] => {
    const totals = new Array(12).fill(0);
    vendors.forEach((vendor) => {
      const monthlyAmounts = calculateMonthlyBreakdown(vendor);
      monthlyAmounts.forEach((amount, index) => {
        totals[index] += amount;
      });
    });
    return totals;
  };

  // Calculate monthly totals for vendors that are in budget (inBudget = true)
  const calculateInBudgetMonthlyTotals = (
    vendors: VendorData[] = currentYearVendors
  ): number[] => {
    const inBudgetVendors = vendors.filter(
      (vendor) => vendor.inBudget === true
    );
    return calculateMonthlyTotals(inBudgetVendors);
  };

  // Calculate monthly totals for vendors that are not in budget (inBudget = false)
  const calculateNotInBudgetMonthlyTotals = (
    vendors: VendorData[] = currentYearVendors
  ): number[] => {
    const notInBudgetVendors = vendors.filter(
      (vendor) => vendor.inBudget === false
    );
    return calculateMonthlyTotals(notInBudgetVendors);
  };

  // Group vendors by financeMappedCategory only
  const getGroupedVendors = (vendors: VendorData[]) => {
    const groups = new Map<
      string,
      {
        financeMappedCategory: string;
        vendors: VendorData[];
        monthlyTotals: number[];
        totalSum: number;
        vendorNames: string[];
      }
    >();

    vendors.forEach((vendor) => {
      const key = vendor.financeMappedCategory || "Uncategorized";

      if (!groups.has(key)) {
        groups.set(key, {
          financeMappedCategory: key,
          vendors: [],
          monthlyTotals: new Array(12).fill(0),
          totalSum: 0,
          vendorNames: [],
        });
      }

      const group = groups.get(key)!;
      group.vendors.push(vendor);

      // Collect unique vendor names for display
      if (!group.vendorNames.includes(vendor.vendorName)) {
        group.vendorNames.push(vendor.vendorName);
      }

      // Sum up monthly amounts for this group
      const monthlyAmounts = calculateMonthlyBreakdown(vendor);
      monthlyAmounts.forEach((amount, index) => {
        group.monthlyTotals[index] += amount;
      });

      group.totalSum += vendor.budget;
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.financeMappedCategory.localeCompare(b.financeMappedCategory)
    );
  };

  // Group vendors by category only
  const getGroupedVendorsByCategory = (vendors: VendorData[]) => {
    const groups = new Map<
      string,
      {
        category: string;
        vendors: VendorData[];
        monthlyTotals: number[];
        totalSum: number;
        vendorNames: string[];
      }
    >();

    vendors.forEach((vendor) => {
      const key = vendor.category || "Uncategorized";

      if (!groups.has(key)) {
        groups.set(key, {
          category: key,
          vendors: [],
          monthlyTotals: new Array(12).fill(0),
          totalSum: 0,
          vendorNames: [],
        });
      }

      const group = groups.get(key)!;
      group.vendors.push(vendor);

      // Collect unique vendor names for display
      if (!group.vendorNames.includes(vendor.vendorName)) {
        group.vendorNames.push(vendor.vendorName);
      }

      // Sum up monthly amounts for this group
      const monthlyAmounts = calculateMonthlyBreakdown(vendor);
      monthlyAmounts.forEach((amount, index) => {
        group.monthlyTotals[index] += amount;
      });

      group.totalSum += vendor.budget;
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.category.localeCompare(b.category)
    );
  };

  // Edit all rows function
  const editAllRows = () => {
    const allVendorIds = new Set(currentYearVendors.map((vendor) => vendor.id));
    setEditingRows(allVendorIds);
  };

  // Save all rows function (exit edit mode for all rows)
  const saveAllRows = () => {
    setEditingRows(new Set());
  };

  // Check if all rows are in edit mode
  const areAllRowsInEditMode = () => {
    if (currentYearVendors.length === 0) return false;
    return currentYearVendors.every((vendor) => editingRows.has(vendor.id));
  };

  // CSV Export Functions
  const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) return "";
    const str = String(field);
    // If field contains comma, double quotes, or newlines, wrap in quotes and escape internal quotes
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBudgetToCSV = () => {
    const filteredVendors = getFilteredAndSortedVendors();

    // CSV Headers
    const headers = [
      "Vendor/Item Name",
      "Category",
      "Finance Mapped Category",
      "Billing Type",
      "Budget Amount (in thousands)",
      "Month",
      "In Budget",
      "Description",
      "Notes",
    ];

    // Create CSV content
    const csvRows = [headers.map(escapeCSVField).join(",")];

    filteredVendors.forEach((vendor) => {
      const row = [
        vendor.vendorName,
        vendor.category || "",
        vendor.financeMappedCategory || "",
        vendor.billingType,
        vendor.budget,
        vendor.month,
        vendor.inBudget ? "Yes" : "No",
        vendor.description,
        vendor.notes || "",
      ];
      csvRows.push(row.map(escapeCSVField).join(","));
    });

    const csvContent = csvRows.join("\n");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `budget-management-${state.selectedYear}-${timestamp}.csv`;

    downloadCSV(csvContent, filename);
  };

  const exportMonthlyToCSV = () => {
    const filteredVendors = getFilteredAndSortedVendorsForMonthly();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let csvRows: string[] = [];

    if (isGroupedView) {
      // Export grouped view
      const groupedData =
        groupByType === "finance"
          ? getGroupedVendors(filteredVendors)
          : getGroupedVendorsByCategory(filteredVendors);

      // CSV Headers for grouped view
      const headers = [
        "Group Type",
        "Group Name",
        "Vendor/Item Name",
        groupByType === "category" ? "Category" : "Finance Mapped Category",
        groupByType === "category" ? "Finance Mapped Category" : "Category",
        ...monthNames,
        "Total",
      ];

      csvRows = [headers.map(escapeCSVField).join(",")];

      groupedData.forEach((group) => {
        const groupKey =
          groupByType === "finance"
            ? (group as any).financeMappedCategory
            : (group as any).category;

        // Add group header row
        const groupRow = [
          groupByType === "finance" ? "Finance Mapped Category" : "Category",
          groupKey,
          "",
          "",
          "",
          ...group.monthlyTotals.map((amount) => amount.toFixed(2)),
          group.totalSum.toFixed(2),
        ];
        csvRows.push(groupRow.map(escapeCSVField).join(","));

        // Add vendor rows
        group.vendors.forEach((vendor) => {
          const monthlyAmounts = calculateMonthlyBreakdown(vendor);
          const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);

          const vendorRow = [
            "", // Group Type (empty for vendor rows)
            "", // Group Name (empty for vendor rows)
            vendor.vendorName,
            groupByType === "category"
              ? vendor.category || ""
              : vendor.financeMappedCategory || "",
            groupByType === "category"
              ? vendor.financeMappedCategory || ""
              : vendor.category || "",
            ...monthlyAmounts.map((amount) => amount.toFixed(2)),
            total.toFixed(2),
          ];
          csvRows.push(vendorRow.map(escapeCSVField).join(","));
        });

        // Add empty row between groups
        csvRows.push("");
      });

      // Add grand total row
      const grandTotals = calculateMonthlyTotals(filteredVendors);
      const grandTotal = grandTotals.reduce((sum, amount) => sum + amount, 0);
      const grandTotalRow = [
        "GRAND TOTAL",
        "",
        "",
        "",
        "",
        ...grandTotals.map((amount) => amount.toFixed(2)),
        grandTotal.toFixed(2),
      ];
      csvRows.push(grandTotalRow.map(escapeCSVField).join(","));
    } else {
      // Export flat view
      const headers = [
        "Vendor/Item Name",
        "Finance Mapped Category",
        "Category",
        ...monthNames,
        "Total",
      ];

      csvRows = [headers.map(escapeCSVField).join(",")];

      filteredVendors.forEach((vendor) => {
        const monthlyAmounts = calculateMonthlyBreakdown(vendor);
        const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);

        const row = [
          vendor.vendorName,
          vendor.financeMappedCategory || "",
          vendor.category || "",
          ...monthlyAmounts.map((amount) => amount.toFixed(2)),
          total.toFixed(2),
        ];
        csvRows.push(row.map(escapeCSVField).join(","));
      });

      // Add totals row
      const totals = calculateMonthlyTotals(filteredVendors);
      const totalSum = totals.reduce((sum, amount) => sum + amount, 0);
      const totalsRow = [
        "TOTALS",
        "",
        "",
        ...totals.map((amount) => amount.toFixed(2)),
        totalSum.toFixed(2),
      ];
      csvRows.push(totalsRow.map(escapeCSVField).join(","));
    }

    const csvContent = csvRows.join("\n");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const viewType = isGroupedView ? `grouped-by-${groupByType}` : "flat";
    const filename = `monthly-breakdown-${viewType}-${state.selectedYear}-${timestamp}.csv`;

    downloadCSV(csvContent, filename);
  };

  return (
    <div className="vendor-management">
      <div className="vendor-management-header">
        <h2>Vendor Management & Budget Planning ({state.selectedYear})</h2>
        <p>
          Manage vendor information, billing types, and annual budget planning.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="vendor-tabs">
        <button
          className={`vendor-tab ${activeTab === "budget" ? "active" : ""}`}
          onClick={() => setActiveTab("budget")}
        >
          Budget Inputs
        </button>
        <button
          className={`vendor-tab ${activeTab === "monthly" ? "active" : ""}`}
          onClick={() => setActiveTab("monthly")}
        >
          Vendor Budget
        </button>
        <button
          className={`vendor-tab ${activeTab === "tracking" ? "active" : ""}`}
          onClick={() => setActiveTab("tracking")}
        >
          Vendor Actuals
        </button>
      </div>

      {activeTab === "budget" && (
        <>
          <div className="vendor-management-controls">
            <div className="vendor-controls-left">
              <button className="add-row-btn" onClick={addNewRow}>
                + Add New Vendor
              </button>
              <button
                className={`edit-all-btn ${
                  areAllRowsInEditMode() ? "save-mode" : ""
                }`}
                onClick={areAllRowsInEditMode() ? saveAllRows : editAllRows}
                disabled={currentYearVendors.length === 0}
              >
                {areAllRowsInEditMode() ? "✓ Save All" : "✏️ Edit All"}
              </button>
              <button
                className="export-csv-btn"
                onClick={exportBudgetToCSV}
                disabled={currentYearVendors.length === 0}
                title="Export current view to CSV"
              >
                📊 Export to CSV
              </button>
            </div>
            <div className="budget-totals-container">
              <div className="budget-total-display">
                <span className="budget-total-label">Total Budget:</span>
                <span className="budget-total-amount">
                  {formatCurrencyExcelStyle(calculateInBudgetTotal() * 1000)}
                </span>
              </div>
              <div className="budget-total-display not-in-budget">
                <span className="budget-total-label">
                  Not in original budget:
                </span>
                <span className="not-in-budget-total-amount ">
                  {formatCurrencyExcelStyle(calculateNotInBudgetTotal() * 1000)}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Controls for Budget Table */}
          <div className="vendor-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Filter by Vendor Name:</label>
                <input
                  type="text"
                  value={budgetFilters.vendorName}
                  onChange={(e) =>
                    setBudgetFilters((prev) => ({
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
                  value={budgetFilters.category}
                  onChange={(e) =>
                    setBudgetFilters((prev) => ({
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
                <select
                  value={budgetFilters.billingType}
                  onChange={(e) =>
                    setBudgetFilters((prev) => ({
                      ...prev,
                      billingType: e.target.value,
                    }))
                  }
                  className="filter-select"
                >
                  <option value="">All billing types</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="one-time">One-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="project-based">Project-based</option>
                </select>
              </div>
              <div className="filter-group">
                <label>In Budget:</label>
                <select
                  value={budgetFilters.inBudget}
                  onChange={(e) =>
                    setBudgetFilters((prev) => ({
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
              <div className="filter-group">
                <button
                  onClick={resetBudgetFilters}
                  className="reset-filters-btn"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {pasteMessage && <div className="save-message">{pasteMessage}</div>}
          <div className="vendor-table-container">
            <table className="budget-management-table">
              <thead>
                <tr>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleBudgetSort("vendorName")}
                    >
                      Item/Vendor Name
                      {budgetSortConfig.field === "vendorName" && (
                        <span className="sort-indicator">
                          {budgetSortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleBudgetSort("financeMappedCategory")}
                    >
                      Finance Mapped Category/Vendor
                      {budgetSortConfig.field === "financeMappedCategory" && (
                        <span className="sort-indicator">
                          {budgetSortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleBudgetSort("category")}
                    >
                      Category
                      {budgetSortConfig.field === "category" && (
                        <span className="sort-indicator">
                          {budgetSortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleBudgetSort("description")}
                    >
                      Description
                      {budgetSortConfig.field === "description" && (
                        <span className="sort-indicator">
                          {budgetSortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleBudgetSort("budget")}
                    >
                      Budget
                      {budgetSortConfig.field === "budget" && (
                        <span className="sort-indicator">
                          {budgetSortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleBudgetSort("billingType")}
                    >
                      Billing Type
                      {budgetSortConfig.field === "billingType" && (
                        <span className="sort-indicator">
                          {budgetSortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleBudgetSort("month")}
                    >
                      Month
                      {budgetSortConfig.field === "month" && (
                        <span className="sort-indicator">
                          {budgetSortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleBudgetSort("inBudget")}
                    >
                      In Budget
                      {budgetSortConfig.field === "inBudget" && (
                        <span className="sort-indicator">
                          {budgetSortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedVendors().length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      {currentYearVendors.length === 0
                        ? `No vendors found for ${state.selectedYear}. Click "Add New Vendor" to get started.`
                        : "No vendors match the current filters."}
                    </td>
                  </tr>
                ) : (
                  getFilteredAndSortedVendors().map((vendor) => {
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
                              className="budget-label-name"
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
                                handlePaste(
                                  e,
                                  vendor.id,
                                  "financeMappedCategory"
                                )
                              }
                              placeholder="Enter finance category"
                              className="vendor-input"
                            />
                          ) : (
                            <span
                              className="budget-label-finance"
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
                              value={vendor.category || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  vendor.id,
                                  "category",
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => handleKeyDown(e, vendor.id)}
                              onPaste={(e) =>
                                handlePaste(e, vendor.id, "category")
                              }
                              placeholder="Enter category"
                              className="vendor-input"
                            />
                          ) : (
                            <span
                              className="budget-label-category"
                              title={vendor.category}
                            >
                              {vendor.category || "-"}
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
                              className="budget-label-description"
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
                              onPaste={(e) =>
                                handlePaste(e, vendor.id, "budget")
                              }
                              placeholder="0.00"
                              className="vendor-input currency-input"
                              step="0.01"
                            />
                          ) : (
                            <span
                              className="vendor-label vendor-label-currency"
                              title={formatCurrencyExcelStyle(
                                vendor.budget * 1000
                              )}
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
                              <option value="project-based">
                                Project-based
                              </option>
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
                              onPaste={(e) =>
                                handlePaste(e, vendor.id, "month")
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
                              onKeyDown={(e) =>
                                handleNotesKeyDown(e, vendor.id)
                              }
                              onPaste={(e) =>
                                handlePaste(e, vendor.id, "notes")
                              }
                              placeholder="Add notes..."
                              className="vendor-textarea"
                              rows={2}
                            />
                          ) : (
                            <span
                              className="budget-label-notes"
                              title={vendor.notes}
                            >
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
                              deleteTooltip={currentYearVendors.length === 1 ? "Cannot delete the last vendor" : "Remove vendor"}
                            />
                          )}
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
                ⌨️ Press Enter in any field to add a new row | Tab out of Notes
                to add a new row | 📋 Paste Excel data from clipboard (creates
                new rows as needed) | ✏️ Edit completed vendors | ✓ Finish
                editing
              </small>
            </p>
          </div>
        </>
      )}

      {activeTab === "monthly" && (
        <>
          <div className="vendor-management-controls">
            <div className="budget-totals-container">
              <div className="budget-total-display">
                <span className="budget-total-label">Annual Total:</span>
                <span className="budget-total-amount">
                  {formatCurrencyExcelStyle(calculateInBudgetTotal() * 1000)}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Controls for Monthly Table */}
          <div className="vendor-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Filter by Vendor Name:</label>
                <input
                  type="text"
                  value={monthlyFilters.vendorName}
                  onChange={(e) =>
                    setMonthlyFilters((prev) => ({
                      ...prev,
                      vendorName: e.target.value,
                    }))
                  }
                  placeholder="Search vendor name..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Filter by Finance Category:</label>
                <input
                  type="text"
                  value={monthlyFilters.financeMappedCategory}
                  onChange={(e) =>
                    setMonthlyFilters((prev) => ({
                      ...prev,
                      financeMappedCategory: e.target.value,
                    }))
                  }
                  placeholder="Search finance category..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Filter by Category:</label>
                <input
                  type="text"
                  value={monthlyFilters.category}
                  onChange={(e) =>
                    setMonthlyFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Search category..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <button
                  onClick={resetMonthlyFilters}
                  className="reset-filters-btn"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Group By Controls */}
            <div className="group-by-controls">
              <div className="filter-group">
                <button
                  onClick={() => setIsGroupedView(!isGroupedView)}
                  className={`group-by-btn individual-btn ${
                    !isGroupedView ? "active" : ""
                  }`}
                >
                  📋 Show Individual
                </button>
              </div>
              <div className="filter-group">
                <button
                  onClick={() => {
                    setGroupByType("finance");
                    setIsGroupedView(true);
                    setExpandedGroups(new Set()); // Collapse all groups
                  }}
                  className={`group-by-btn ${
                    isGroupedView && groupByType === "finance" ? "active" : ""
                  }`}
                >
                  📊 Group By Finance Category
                </button>
              </div>
              <div className="filter-group">
                <button
                  onClick={() => {
                    setGroupByType("category");
                    setIsGroupedView(true);
                    setExpandedGroups(new Set()); // Collapse all groups
                  }}
                  className={`group-by-btn ${
                    isGroupedView && groupByType === "category" ? "active" : ""
                  }`}
                >
                  📋 Group By Category
                </button>
              </div>
              <div className="filter-group">
                <button
                  className="export-csv-btn"
                  onClick={exportMonthlyToCSV}
                  disabled={currentYearVendors.length === 0}
                  title="Export current view to CSV"
                >
                  📊 Export to CSV
                </button>
              </div>
            </div>
          </div>

          <div className="vendor-table-container">
            <table className="monthly-breakdown-table">
              <thead>
                <tr>
                  {groupByType === "category" ? (
                    <>
                      <th>
                        <button
                          className="sort-header"
                          onClick={() => handleMonthlySort("category")}
                        >
                          Category
                          {monthlySortConfig.field === "category" && (
                            <span className="sort-indicator">
                              {monthlySortConfig.direction === "asc"
                                ? " ↑"
                                : " ↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th>
                        <button
                          className="sort-header"
                          onClick={() =>
                            handleMonthlySort("financeMappedCategory")
                          }
                        >
                          Finance Mapped Category
                          {monthlySortConfig.field ===
                            "financeMappedCategory" && (
                            <span className="sort-indicator">
                              {monthlySortConfig.direction === "asc"
                                ? " ↑"
                                : " ↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th>
                        <button
                          className="sort-header"
                          onClick={() => handleMonthlySort("vendorName")}
                        >
                          Item/Vendor Name
                          {monthlySortConfig.field === "vendorName" && (
                            <span className="sort-indicator">
                              {monthlySortConfig.direction === "asc"
                                ? " ↑"
                                : " ↓"}
                            </span>
                          )}
                        </button>
                      </th>
                    </>
                  ) : (
                    <>
                      <th>
                        <button
                          className="sort-header"
                          onClick={() =>
                            handleMonthlySort("financeMappedCategory")
                          }
                        >
                          Finance Mapped Category
                          {monthlySortConfig.field ===
                            "financeMappedCategory" && (
                            <span className="sort-indicator">
                              {monthlySortConfig.direction === "asc"
                                ? " ↑"
                                : " ↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th>
                        <button
                          className="sort-header"
                          onClick={() => handleMonthlySort("vendorName")}
                        >
                          Item/Vendor Name
                          {monthlySortConfig.field === "vendorName" && (
                            <span className="sort-indicator">
                              {monthlySortConfig.direction === "asc"
                                ? " ↑"
                                : " ↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th>
                        <button
                          className="sort-header"
                          onClick={() => handleMonthlySort("category")}
                        >
                          Category
                          {monthlySortConfig.field === "category" && (
                            <span className="sort-indicator">
                              {monthlySortConfig.direction === "asc"
                                ? " ↑"
                                : " ↓"}
                            </span>
                          )}
                        </button>
                      </th>
                    </>
                  )}
                  <th>Jan</th>
                  <th>Feb</th>
                  <th>Mar</th>
                  <th>Apr</th>
                  <th>May</th>
                  <th>Jun</th>
                  <th>Jul</th>
                  <th>Aug</th>
                  <th>Sep</th>
                  <th>Oct</th>
                  <th>Nov</th>
                  <th>Dec</th>
                  <th>
                    <button
                      className="sort-header"
                      onClick={() => handleMonthlySort("total")}
                    >
                      Total
                      {monthlySortConfig.field === "total" && (
                        <span className="sort-indicator">
                          {monthlySortConfig.direction === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedVendorsForMonthly().length === 0 ? (
                  <tr>
                    <td
                      colSpan={16}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      {currentYearVendors.length === 0
                        ? `No vendors found for ${state.selectedYear}. Go to Budget Management tab to add vendors.`
                        : "No vendors match the current filters."}
                    </td>
                  </tr>
                ) : isGroupedView ? (
                  // Grouped view with nested vendors and collapsible groups
                  <>
                    {groupByType === "finance"
                      ? getGroupedVendors(
                          getFilteredAndSortedVendorsForMonthly()
                        ).map((group, groupIndex) => {
                          const groupKey =
                            group.financeMappedCategory || "Uncategorized";
                          const isExpanded = expandedGroups.has(groupKey);

                          return (
                            <React.Fragment key={`group-${groupIndex}`}>
                              {/* Parent row - Finance Category Summary (Collapsible) */}
                              <tr className="vendor-monthly-row grouped-row group-header">
                                <td colSpan={3}>
                                  <button
                                    className="group-toggle-btn"
                                    onClick={() =>
                                      toggleGroupExpansion(groupKey)
                                    }
                                    title={
                                      isExpanded
                                        ? "Collapse group"
                                        : "Expand group"
                                    }
                                  >
                                    <span className="group-toggle-icon">
                                      {isExpanded ? "📂" : "📁"}
                                    </span>
                                    <span className="grouped-finance-category">
                                      <strong>
                                        {groupKey} ({group.vendors.length}{" "}
                                        vendors)
                                      </strong>
                                    </span>
                                    <span className="expand-indicator">
                                      {isExpanded ? "▼" : "▶"}
                                    </span>
                                  </button>
                                </td>
                                {group.monthlyTotals.map((amount, index) => (
                                  <td
                                    key={index}
                                    className="monthly-amount grouped-amount"
                                  >
                                    <strong>
                                      {amount > 0
                                        ? formatCurrencyExcelStyle(
                                            amount * 1000
                                          )
                                        : "-"}
                                    </strong>
                                  </td>
                                ))}
                                <td className="monthly-total grouped-total">
                                  <strong>
                                    {formatCurrencyExcelStyle(
                                      group.monthlyTotals.reduce(
                                        (sum, amount) => sum + amount,
                                        0
                                      ) * 1000
                                    )}
                                  </strong>
                                </td>
                              </tr>

                              {/* Child rows - Individual Vendors (only show if expanded) */}
                              {isExpanded &&
                                group.vendors.map((vendor) => {
                                  const monthlyAmounts =
                                    calculateMonthlyBreakdown(vendor);
                                  const total = monthlyAmounts.reduce(
                                    (sum, amount) => sum + amount,
                                    0
                                  );

                                  return (
                                    <tr
                                      key={vendor.id}
                                      className="vendor-monthly-row nested-vendor-row"
                                    >
                                      <td colSpan={2}>
                                        <span
                                          className="vendor-label-name nested-vendor-name"
                                          title={`${vendor.vendorName}${
                                            vendor.description
                                              ? ` - ${vendor.description}`
                                              : ""
                                          }`}
                                        >
                                          ├─ {vendor.vendorName || "-"}
                                        </span>
                                      </td>
                                      <td>
                                        <span
                                          className="vendor-label-category nested-category"
                                          title={vendor.category}
                                        >
                                          {vendor.category || "-"}
                                        </span>
                                      </td>
                                      {monthlyAmounts.map((amount, index) => (
                                        <td
                                          key={index}
                                          className="monthly-amount nested-amount"
                                        >
                                          {amount > 0
                                            ? formatCurrencyExcelStyle(
                                                amount * 1000
                                              )
                                            : "-"}
                                        </td>
                                      ))}
                                      <td className="monthly-total nested-total">
                                        {formatCurrencyExcelStyle(total * 1000)}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })
                      : getGroupedVendorsByCategory(
                          getFilteredAndSortedVendorsForMonthly()
                        ).map((group, groupIndex) => {
                          const groupKey = group.category || "Uncategorized";
                          const isExpanded = expandedGroups.has(groupKey);

                          return (
                            <React.Fragment
                              key={`category-group-${groupIndex}`}
                            >
                              {/* Parent row - Category Summary (Collapsible) */}
                              <tr className="vendor-monthly-row grouped-row group-header">
                                <td colSpan={3}>
                                  <button
                                    className="group-toggle-btn"
                                    onClick={() =>
                                      toggleGroupExpansion(groupKey)
                                    }
                                    title={
                                      isExpanded
                                        ? "Collapse group"
                                        : "Expand group"
                                    }
                                  >
                                    <span className="group-toggle-icon">
                                      {isExpanded ? "📂" : "📁"}
                                    </span>
                                    <span className="grouped-category">
                                      <strong>
                                        {groupKey} ({group.vendors.length}{" "}
                                        vendors)
                                      </strong>
                                    </span>
                                    <span className="expand-indicator">
                                      {isExpanded ? "▼" : "▶"}
                                    </span>
                                  </button>
                                </td>
                                {group.monthlyTotals.map((amount, index) => (
                                  <td
                                    key={index}
                                    className="monthly-amount grouped-amount"
                                  >
                                    <strong>
                                      {amount > 0
                                        ? formatCurrencyExcelStyle(
                                            amount * 1000
                                          )
                                        : "-"}
                                    </strong>
                                  </td>
                                ))}
                                <td className="monthly-total grouped-total">
                                  <strong>
                                    {formatCurrencyExcelStyle(
                                      group.monthlyTotals.reduce(
                                        (sum, amount) => sum + amount,
                                        0
                                      ) * 1000
                                    )}
                                  </strong>
                                </td>
                              </tr>

                              {/* Child rows - Individual Vendors (only show if expanded) */}
                              {isExpanded &&
                                group.vendors.map((vendor) => {
                                  const monthlyAmounts =
                                    calculateMonthlyBreakdown(vendor);
                                  const total = monthlyAmounts.reduce(
                                    (sum, amount) => sum + amount,
                                    0
                                  );

                                  return (
                                    <tr
                                      key={vendor.id}
                                      className="vendor-monthly-row nested-vendor-row"
                                    >
                                      <td>
                                        <span
                                          className="vendor-label-finance nested-finance"
                                          title={vendor.financeMappedCategory}
                                        >
                                          {vendor.financeMappedCategory || "-"}
                                        </span>
                                      </td>
                                      <td colSpan={2}>
                                        <span
                                          className="vendor-label-name nested-vendor-name"
                                          title={`${vendor.vendorName}${
                                            vendor.description
                                              ? ` - ${vendor.description}`
                                              : ""
                                          }`}
                                        >
                                          ├─ {vendor.vendorName || "-"}
                                        </span>
                                      </td>
                                      {monthlyAmounts.map((amount, index) => (
                                        <td
                                          key={index}
                                          className="monthly-amount nested-amount"
                                        >
                                          {amount > 0
                                            ? formatCurrencyExcelStyle(
                                                amount * 1000
                                              )
                                            : "-"}
                                        </td>
                                      ))}
                                      <td className="monthly-total nested-total">
                                        {formatCurrencyExcelStyle(total * 1000)}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
                    <tr className="monthly-totals-row in-budget-totals">
                      <td colSpan={3} className="totals-label">
                        <strong>Total In Budget</strong>
                      </td>
                      {calculateInBudgetMonthlyTotals(
                        getFilteredAndSortedVendorsForMonthly()
                      ).map((total, index) => (
                        <td key={index} className="monthly-total-cell">
                          <strong>
                            {formatCurrencyExcelStyle(total * 1000)}
                          </strong>
                        </td>
                      ))}
                      <td className="grand-total">
                        <strong>
                          {formatCurrencyExcelStyle(
                            getFilteredAndSortedVendorsForMonthly()
                              .filter((vendor) => vendor.inBudget === true)
                              .reduce((sum, vendor) => sum + vendor.budget, 0) *
                              1000
                          )}
                        </strong>
                      </td>
                    </tr>
                    <tr className="monthly-totals-row not-in-budget-totals">
                      <td colSpan={3} className="totals-label">
                        <strong>Total Not in Budget</strong>
                      </td>
                      {calculateNotInBudgetMonthlyTotals(
                        getFilteredAndSortedVendorsForMonthly()
                      ).map((total, index) => (
                        <td key={index} className="monthly-total-cell">
                          <strong>
                            {formatCurrencyExcelStyle(total * 1000)}
                          </strong>
                        </td>
                      ))}
                      <td className="grand-total">
                        <strong>
                          {formatCurrencyExcelStyle(
                            getFilteredAndSortedVendorsForMonthly()
                              .filter((vendor) => vendor.inBudget === false)
                              .reduce((sum, vendor) => sum + vendor.budget, 0) *
                              1000
                          )}
                        </strong>
                      </td>
                    </tr>
                    <tr className="monthly-totals-row">
                      <td colSpan={3} className="totals-label">
                        <strong>Monthly Totals</strong>
                      </td>
                      {calculateMonthlyTotals(
                        getFilteredAndSortedVendorsForMonthly()
                      ).map((total, index) => (
                        <td key={index} className="monthly-total-cell">
                          <strong>
                            {formatCurrencyExcelStyle(total * 1000)}
                          </strong>
                        </td>
                      ))}
                      <td className="grand-total">
                        <strong>
                          {formatCurrencyExcelStyle(
                            getFilteredAndSortedVendorsForMonthly().reduce(
                              (sum, vendor) => sum + vendor.budget,
                              0
                            ) * 1000
                          )}
                        </strong>
                      </td>
                    </tr>
                  </>
                ) : (
                  // Individual view
                  <>
                    {getFilteredAndSortedVendorsForMonthly().map((vendor) => {
                      const monthlyAmounts = calculateMonthlyBreakdown(vendor);
                      const total = monthlyAmounts.reduce(
                        (sum, amount) => sum + amount,
                        0
                      );

                      return (
                        <tr key={vendor.id} className="vendor-monthly-row">
                          {groupByType === "category" ? (
                            <>
                              <td>
                                <span
                                  className="monthly-label-info"
                                  title={vendor.category}
                                >
                                  {vendor.category || "-"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="monthly-label-info"
                                  title={vendor.financeMappedCategory}
                                >
                                  {vendor.financeMappedCategory || "-"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="vendor-label-name"
                                  title={vendor.vendorName}
                                >
                                  {vendor.vendorName || "-"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>
                                <span
                                  className="vendor-label-finance"
                                  title={vendor.financeMappedCategory}
                                >
                                  {vendor.financeMappedCategory || "-"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="vendor-label-name"
                                  title={vendor.vendorName}
                                >
                                  {vendor.vendorName || "-"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="vendor-label-category"
                                  title={vendor.category}
                                >
                                  {vendor.category || "-"}
                                </span>
                              </td>
                            </>
                          )}
                          {monthlyAmounts.map((amount, index) => (
                            <td key={index} className="monthly-amount">
                              {amount > 0
                                ? formatCurrencyExcelStyle(amount * 1000)
                                : "-"}
                            </td>
                          ))}
                          <td className="monthly-total">
                            {formatCurrencyExcelStyle(total * 1000)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="monthly-totals-row in-budget-totals">
                      <td colSpan={3} className="totals-label">
                        <strong>Total In Budget</strong>
                      </td>
                      {calculateInBudgetMonthlyTotals(
                        getFilteredAndSortedVendorsForMonthly()
                      ).map((total, index) => (
                        <td key={index} className="monthly-total-cell">
                          <strong>
                            {formatCurrencyExcelStyle(total * 1000)}
                          </strong>
                        </td>
                      ))}
                      <td className="grand-total">
                        <strong>
                          {formatCurrencyExcelStyle(
                            getFilteredAndSortedVendorsForMonthly()
                              .filter((vendor) => vendor.inBudget === true)
                              .reduce((sum, vendor) => sum + vendor.budget, 0) *
                              1000
                          )}
                        </strong>
                      </td>
                    </tr>
                    <tr className="monthly-totals-row not-in-budget-totals">
                      <td colSpan={3} className="totals-label">
                        <strong>Total Not in Budget</strong>
                      </td>
                      {calculateNotInBudgetMonthlyTotals(
                        getFilteredAndSortedVendorsForMonthly()
                      ).map((total, index) => (
                        <td key={index} className="monthly-total-cell">
                          <strong>
                            {formatCurrencyExcelStyle(total * 1000)}
                          </strong>
                        </td>
                      ))}
                      <td className="grand-total">
                        <strong>
                          {formatCurrencyExcelStyle(
                            getFilteredAndSortedVendorsForMonthly()
                              .filter((vendor) => vendor.inBudget === false)
                              .reduce((sum, vendor) => sum + vendor.budget, 0) *
                              1000
                          )}
                        </strong>
                      </td>
                    </tr>
                    <tr className="monthly-totals-row">
                      <td colSpan={3} className="totals-label">
                        <strong>Monthly Totals</strong>
                      </td>
                      {calculateMonthlyTotals(
                        getFilteredAndSortedVendorsForMonthly()
                      ).map((total, index) => (
                        <td key={index} className="monthly-total-cell">
                          <strong>
                            {formatCurrencyExcelStyle(total * 1000)}
                          </strong>
                        </td>
                      ))}
                      <td className="grand-total">
                        <strong>
                          {formatCurrencyExcelStyle(
                            getFilteredAndSortedVendorsForMonthly().reduce(
                              (sum, vendor) => sum + vendor.budget,
                              0
                            ) * 1000
                          )}
                        </strong>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "tracking" && (
        <>
          <VendorTrackingTable />
        </>
      )}
    </div>
  );
};

export default VendorManagement;
