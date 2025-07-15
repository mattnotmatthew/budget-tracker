import React, { useState, useEffect, useRef } from "react";
import { useBudget } from "../../../context/BudgetContext";
import { FunctionalAllocation as FunctionalAllocationType } from "../../../types";
import { getLastFinalMonthNumber } from "../../../utils/monthUtils";
import { AllocationTableSection } from "../../../components/allocations";
import "../../../styles/components/functional-allocation.css";

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
  // State for sorting
  const [sortField, setSortField] = useState<
    keyof FunctionalAllocationType | "costPer" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // State for filtering
  const [filters, setFilters] = useState({
    product: "",
    teamName: "",
    function: "",
    currentCostCenter: "",
  });

  // Get unique teams from Resources
  const uniqueTeams = Array.from(
    new Set(state.teams?.map((team) => team.teamName) || [])
  ).sort();

  // Get unique cost centers from Resources
  const uniqueCostCenters = Array.from(
    new Set(state.teams?.map((team) => team.currentCostCenter) || [])
  ).sort();

  // Get unique values from allocations for better filter options
  const uniqueProducts = Array.from(
    new Set(
      state.functionalAllocations
        ?.filter(
          (a) => a.month === selectedMonth && a.year === state.selectedYear
        )
        ?.map((allocation) => allocation.product)
        ?.filter((product) => product && product.trim() !== "") || []
    )
  ).sort();

  const uniqueTeamsFromAllocations = Array.from(
    new Set(
      state.functionalAllocations
        ?.filter(
          (a) => a.month === selectedMonth && a.year === state.selectedYear
        )
        ?.map((allocation) => allocation.teamName)
        ?.filter((team) => team && team.trim() !== "") || []
    )
  ).sort();

  const uniqueCostCentersFromAllocations = Array.from(
    new Set(
      state.functionalAllocations
        ?.filter(
          (a) => a.month === selectedMonth && a.year === state.selectedYear
        )
        ?.map((allocation) => allocation.currentCostCenter)
        ?.filter((cc) => cc && cc.trim() !== "") || []
    )
  ).sort();

  // Combine unique values from both sources for comprehensive filter options
  const allUniqueTeams = Array.from(
    new Set([...uniqueTeams, ...uniqueTeamsFromAllocations])
  ).sort();
  const allUniqueCostCenters = Array.from(
    new Set([...uniqueCostCenters, ...uniqueCostCentersFromAllocations])
  ).sort();

  // Filter allocations for selected month and year
  const baseMonthAllocations =
    state.functionalAllocations?.filter(
      (allocation) =>
        allocation.month === selectedMonth &&
        allocation.year === state.selectedYear
    ) || [];

  // Get base allocations that are eligible for Team Allocations table (Development and Support only)
  const baseTeamAllocations = React.useMemo(() => {
    return baseMonthAllocations.filter(
      (allocation) =>
        allocation.function === "Development" ||
        allocation.function === "Support"
    );
  }, [baseMonthAllocations]);

  // Apply filters and sorting to allocations (excluding Revenue and Infrastructure which have their own tables)
  const monthAllocations = React.useMemo(() => {
    // First apply filters and exclude Revenue and Infrastructure allocations
    let filteredAllocations = baseMonthAllocations.filter((allocation) => {
      return (
        allocation.function !== "Revenue" && // Exclude Revenue allocations
        allocation.function !== "Infrastructure" && // Exclude Infrastructure allocations
        (!filters.product ||
          allocation.product
            .toLowerCase()
            .includes(filters.product.toLowerCase())) &&
        (!filters.teamName ||
          allocation.teamName
            .toLowerCase()
            .includes(filters.teamName.toLowerCase())) &&
        (!filters.function ||
          allocation.function
            .toLowerCase()
            .includes(filters.function.toLowerCase())) &&
        (!filters.currentCostCenter ||
          allocation.currentCostCenter
            .toLowerCase()
            .includes(filters.currentCostCenter.toLowerCase()))
      );
    });

    // Then apply sorting if a sort field is selected
    if (!sortField) return filteredAllocations;

    return [...filteredAllocations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === "costPer") {
        aValue = calculateCostPer(a);
        bValue = calculateCostPer(b);
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? 1 : -1;
      if (bValue == null) return sortDirection === "asc" ? -1 : 1;

      // Handle string comparisons
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue
          .toLowerCase()
          .localeCompare(bValue.toLowerCase());
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Handle number comparisons
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Fallback to string comparison
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [baseMonthAllocations, sortField, sortDirection, filters]);

  // Filter allocations for Revenue function
  const revenueAllocations = React.useMemo(() => {
    return baseMonthAllocations.filter(
      (allocation) => allocation.function === "Revenue"
    );
  }, [baseMonthAllocations]);

  // Filter allocations for Infrastructure function
  const infrastructureAllocations = React.useMemo(() => {
    return baseMonthAllocations.filter(
      (allocation) => allocation.function === "Infrastructure"
    );
  }, [baseMonthAllocations]);

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
    // Determine default values based on active filters
    let defaultFunction = "Development";

    // If only the function filter is active (and no other filters), use that as default
    const activeFilters = Object.entries(filters).filter(
      ([key, value]) => value.trim() !== ""
    );
    const isFunctionOnlyFilter =
      activeFilters.length === 1 && activeFilters[0][0] === "function";

    if (isFunctionOnlyFilter && filters.function) {
      // Find exact match for function filter value
      const validFunctions = [
        "Development",
        "Infrastructure",
        "Revenue",
        "Support",
      ];
      const matchedFunction = validFunctions.find(
        (func) => func.toLowerCase() === filters.function.toLowerCase()
      );
      if (matchedFunction) {
        defaultFunction = matchedFunction;
      }
    }

    const newAllocation: FunctionalAllocationType = {
      id: `fa-${Date.now()}`,
      year: state.selectedYear,
      month: selectedMonth,
      teamName: "",
      function: defaultFunction as
        | "Development"
        | "Infrastructure"
        | "Revenue"
        | "Support",
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

  const handleAddRevenueAllocation = () => {
    const newAllocation: FunctionalAllocationType = {
      id: `fa-${Date.now()}`,
      year: state.selectedYear,
      month: selectedMonth,
      teamName: "",
      function: "Revenue",
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

  const handleAddInfrastructureAllocation = () => {
    const newAllocation: FunctionalAllocationType = {
      id: `fa-${Date.now()}`,
      year: state.selectedYear,
      month: selectedMonth,
      teamName: "",
      function: "Infrastructure",
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

  // Handle column sorting
  const handleSort = (field: keyof FunctionalAllocationType | "costPer") => {
    if (sortField === field) {
      // If same field, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If different field, set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort indicator for column headers
  const getSortIndicator = (
    field: keyof FunctionalAllocationType | "costPer"
  ) => {
    if (sortField !== field) return " ⇅";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const handleFieldChange = (
    id: string,
    field: keyof FunctionalAllocationType,
    value: any
  ) => {
    const allocation = monthAllocations.find((a) => a.id === id);
    if (!allocation) return;

    let updatedAllocation = { ...allocation, [field]: value };

    // If team is selected, automatically update the cost from Resources only for Development and Support functions
    if (
      field === "teamName" &&
      (allocation.function === "Development" ||
        allocation.function === "Support")
    ) {
      const monthlyCost = getTeamMonthlyCost(value);
      updatedAllocation = { ...updatedAllocation, cost: monthlyCost };
    }

    // If function is changed to/from Development or Support, update cost accordingly
    if (field === "function") {
      if (value === "Development" || value === "Support") {
        // When changing to Development or Support, auto-calculate cost if team is selected
        if (allocation.teamName) {
          const monthlyCost = getTeamMonthlyCost(allocation.teamName);
          updatedAllocation = { ...updatedAllocation, cost: monthlyCost };
        }
      }
      // For other functions (Infrastructure, Revenue), keep the existing cost value
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
        const teamNameRaw = cells[1].trim();
        const functionValueRaw = cells[2].trim();
        const costCenterRaw = cells[3].trim();
        const costRaw = cells[4].trim(); // Cost from pasted data
        const percentOfWork =
          parseFloat(cells[5].replace(/[^0-9.-]/g, "")) || 0;

        // Use helper functions to find matching dropdown values
        const teamName = findMatchingTeam(teamNameRaw);
        const functionValue = findMatchingFunction(functionValueRaw);
        const costCenter = findMatchingCostCenter(costCenterRaw);

        // Get the monthly cost from Resources component only for Development and Support
        const monthlyCost =
          functionValue === "Development" || functionValue === "Support"
            ? getTeamMonthlyCost(teamName)
            : parseFloat(cells[4].replace(/[^0-9.-]/g, "")) || 0;

        const newAllocation: FunctionalAllocationType = {
          id: `fa-${Date.now()}-${index}`,
          year: state.selectedYear,
          month: selectedMonth,
          teamName,
          function: functionValue as
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
    // Update costs for all allocations when the month changes, but only for Development and Support functions
    monthAllocations.forEach((allocation) => {
      if (
        allocation.teamName &&
        (allocation.function === "Development" ||
          allocation.function === "Support")
      ) {
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

  // Helper function to find matching team name (case-insensitive, partial match)
  const findMatchingTeam = (pastedValue: string): string => {
    if (!pastedValue || !pastedValue.trim()) return "";

    const trimmedValue = pastedValue.trim().toLowerCase();

    // Try exact match first
    const exactMatch = uniqueTeams.find(
      (team) => team.toLowerCase() === trimmedValue
    );
    if (exactMatch) return exactMatch;

    // Try partial match (contains)
    const partialMatch = uniqueTeams.find(
      (team) =>
        team.toLowerCase().includes(trimmedValue) ||
        trimmedValue.includes(team.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    // If no match found, return empty string (will show as "Select Team")
    return "";
  };

  // Helper function to find matching function (case-insensitive)
  const findMatchingFunction = (pastedValue: string): string => {
    if (!pastedValue || !pastedValue.trim()) return "Development"; // Default

    const trimmedValue = pastedValue.trim().toLowerCase();
    const validFunctions = [
      "Development",
      "Infrastructure",
      "Revenue",
      "Support",
    ];

    // Try exact match first
    const exactMatch = validFunctions.find(
      (func) => func.toLowerCase() === trimmedValue
    );
    if (exactMatch) return exactMatch;

    // Try partial match (starts with)
    const partialMatch = validFunctions.find(
      (func) =>
        func.toLowerCase().startsWith(trimmedValue) ||
        trimmedValue.startsWith(func.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    // Common abbreviations/aliases
    const aliases: { [key: string]: string } = {
      dev: "Development",
      develop: "Development",
      infra: "Infrastructure",
      infrastructure: "Infrastructure",
      rev: "Revenue",
      revenue: "Revenue",
      sup: "Support",
      support: "Support",
    };

    const aliasMatch = aliases[trimmedValue];
    if (aliasMatch) return aliasMatch;

    // Default to Development if no match
    return "Development";
  };

  // Helper function to find matching cost center (case-insensitive, partial match)
  const findMatchingCostCenter = (pastedValue: string): string => {
    if (!pastedValue || !pastedValue.trim()) return "";

    const trimmedValue = pastedValue.trim().toLowerCase();

    // Try exact match first
    const exactMatch = uniqueCostCenters.find(
      (cc) => cc.toLowerCase() === trimmedValue
    );
    if (exactMatch) return exactMatch;

    // Try partial match (contains)
    const partialMatch = uniqueCostCenters.find(
      (cc) =>
        cc.toLowerCase().includes(trimmedValue) ||
        trimmedValue.includes(cc.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    // If no match found, return empty string (will show as "Select Cost Center")
    return "";
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
          } else if (field === "cost") {
            processedValue =
              parseFloat(cleanExcelNumber(value).toString()) || 0;
          } else if (field === "teamName") {
            processedValue = findMatchingTeam(value);
          } else if (field === "function") {
            processedValue = findMatchingFunction(value);
          } else if (field === "currentCostCenter") {
            processedValue = findMatchingCostCenter(value);
          } else if (field === "product") {
            // For product field, use the text as-is
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
            } else if (field === "cost") {
              processedValue =
                parseFloat(cleanExcelNumber(value).toString()) || 0;
            } else if (field === "teamName") {
              processedValue = findMatchingTeam(value);
            } else if (field === "function") {
              processedValue = findMatchingFunction(value);
            } else if (field === "currentCostCenter") {
              processedValue = findMatchingCostCenter(value);
            } else if (field === "product") {
              // For product field, use the text as-is
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
    } else if (field === "cost") {
      processedValue = parseFloat(cleanExcelNumber(pastedData).toString()) || 0;
    } else if (field === "teamName") {
      processedValue = findMatchingTeam(pastedData);
    } else if (field === "function") {
      processedValue = findMatchingFunction(pastedData);
    } else if (field === "currentCostCenter") {
      processedValue = findMatchingCostCenter(pastedData);
    } else if (field === "product") {
      // For product field, use the text as-is
      processedValue = pastedData.trim();
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
      "teamName",
      "product",
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

      {/* Team Allocations Section */}
      <AllocationTableSection
        title="Team Allocations"
        allocations={monthAllocations}
        baseAllocations={baseTeamAllocations}
        editingRows={editingRows}
        errors={errors}
        filters={filters}
        onFiltersChange={setFilters}
        uniqueTeams={uniqueTeams}
        allUniqueTeams={allUniqueTeams}
        uniqueCostCenters={uniqueCostCenters}
        allUniqueCostCenters={allUniqueCostCenters}
        functionOptions={["Development", "Support"]}
        monthNames={monthNames}
        selectedMonth={selectedMonth}
        onSort={handleSort}
        getSortIndicator={getSortIndicator}
        onFieldChange={handleFieldChange}
        onToggleEditMode={toggleEditMode}
        onDeleteAllocation={handleDeleteAllocation}
        onKeyDown={handleKeyDown}
        onMultiRowPaste={handleMultiRowPaste}
        onPaste={handlePaste}
        onExportCSV={handleExportCSV}
        onAddAllocation={handleAddAllocation}
        calculateCostPer={calculateCostPer}
        pasteMessage={pasteMessage}
        showFilters={true}
        headerClassName="table-section-header-first"
      />

      {/* Revenue Allocations Section */}
      <AllocationTableSection
        title="Revenue Allocations"
        allocations={revenueAllocations}
        baseAllocations={revenueAllocations}
        editingRows={editingRows}
        errors={errors}
        filters={{
          product: "",
          teamName: "",
          function: "",
          currentCostCenter: "",
        }}
        onFiltersChange={() => {}} // Revenue section doesn't use main filters
        uniqueTeams={uniqueTeams}
        allUniqueTeams={allUniqueTeams}
        uniqueCostCenters={uniqueCostCenters}
        allUniqueCostCenters={allUniqueCostCenters}
        functionOptions={["Revenue"]}
        monthNames={monthNames}
        selectedMonth={selectedMonth}
        onSort={handleSort}
        getSortIndicator={getSortIndicator}
        onFieldChange={handleFieldChange}
        onToggleEditMode={toggleEditMode}
        onDeleteAllocation={handleDeleteAllocation}
        onKeyDown={handleKeyDown}
        onMultiRowPaste={handleMultiRowPaste}
        onPaste={handlePaste}
        onExportCSV={handleExportCSV}
        onAddAllocation={handleAddRevenueAllocation}
        calculateCostPer={calculateCostPer}
        pasteMessage={pasteMessage}
        addButtonText="Add Revenue Allocation"
        showFilters={false}
        defaultCollapsed={true}
      />

      {/* Infrastructure Allocations Section */}
      <AllocationTableSection
        title="Infrastructure Allocations"
        allocations={infrastructureAllocations}
        baseAllocations={infrastructureAllocations}
        editingRows={editingRows}
        errors={errors}
        filters={{
          product: "",
          teamName: "",
          function: "",
          currentCostCenter: "",
        }}
        onFiltersChange={() => {}} // Infrastructure section doesn't use main filters
        uniqueTeams={uniqueTeams}
        allUniqueTeams={allUniqueTeams}
        uniqueCostCenters={uniqueCostCenters}
        allUniqueCostCenters={allUniqueCostCenters}
        functionOptions={["Infrastructure"]}
        monthNames={monthNames}
        selectedMonth={selectedMonth}
        onSort={handleSort}
        getSortIndicator={getSortIndicator}
        onFieldChange={handleFieldChange}
        onToggleEditMode={toggleEditMode}
        onDeleteAllocation={handleDeleteAllocation}
        onKeyDown={handleKeyDown}
        onMultiRowPaste={handleMultiRowPaste}
        onPaste={handlePaste}
        onExportCSV={handleExportCSV}
        onAddAllocation={handleAddInfrastructureAllocation}
        calculateCostPer={calculateCostPer}
        pasteMessage={pasteMessage}
        addButtonText="Add Infrastructure Allocation"
        showFilters={false}
        defaultCollapsed={true}
      />
    </div>
  );
};

export default React.memo(FunctionalAllocation);
