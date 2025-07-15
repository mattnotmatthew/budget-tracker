import React, { useState } from "react";
import { VendorData } from "../../../types";
import { formatCurrencyExcelStyle } from "../../../utils/currencyFormatter";

interface VendorMonthlyTableProps {
  vendors: VendorData[];
}

const VendorMonthlyTable: React.FC<VendorMonthlyTableProps> = ({ vendors }) => {
  // Sort and filter state
  const [sortConfig, setSortConfig] = useState<{
    field: "vendorName" | "financeMappedCategory" | "category" | "total" | null;
    direction: "asc" | "desc";
  }>({ field: null, direction: "asc" });

  const [filters, setFilters] = useState({
    vendorName: "",
    financeMappedCategory: "",
    category: "",
  });

  // Group by state
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [groupByType, setGroupByType] = useState<"finance" | "category">("finance");

  // Track which groups are expanded (collapsed by default)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // State for collapsible filters
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Helper function to get month number from name
  const getMonthNumber = (monthName: string): number => {
    const months: { [key: string]: number } = {
      "January": 1, "February": 2, "March": 3, "April": 4,
      "May": 5, "June": 6, "July": 7, "August": 8,
      "September": 9, "October": 10, "November": 11, "December": 12
    };
    return months[monthName] || 0;
  };

  // Calculate monthly breakdown for a vendor
  const calculateMonthlyBreakdown = (vendor: VendorData): number[] => {
    const monthlyAmounts = new Array(12).fill(0);

    if (vendor.billingType === "monthly") {
      // For monthly billing, distribute evenly across all 12 months
      const monthlyAmount = vendor.budget / 12;
      monthlyAmounts.fill(monthlyAmount);
    } else if (vendor.billingType === "quarterly") {
      // For quarterly billing, distribute evenly across quarters
      // Determine which quarters remain based on current month
      const currentMonth = new Date().getMonth() + 1; // 1-based
      const startQuarter = Math.ceil(currentMonth / 3);
      const quartersRemaining = 4 - startQuarter + 1;
      
      if (quartersRemaining > 0) {
        const startMonth = (startQuarter - 1) * 3 + 1;
        const quarterlyAmount = vendor.budget / quartersRemaining;
        for (let i = startMonth - 1; i < 12; i += 3) {
          monthlyAmounts[i] = quarterlyAmount;
        }
      }
    } else if (vendor.billingType === "annual") {
      // For annual billing, put entire amount in specified month (or January if N/A)
      const targetMonth = vendor.month === "N/A" ? 1 : getMonthNumber(vendor.month);
      if (targetMonth > 0) {
        monthlyAmounts[targetMonth - 1] = vendor.budget;
      }
    } else if (vendor.billingType === "one-time") {
      // For one-time billing, put entire amount in specified month
      const targetMonth = vendor.month === "N/A" ? 1 : getMonthNumber(vendor.month);
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
  const calculateMonthlyTotals = (vendorsToCalculate: VendorData[] = vendors): number[] => {
    const totals = new Array(12).fill(0);
    vendorsToCalculate.forEach((vendor) => {
      const monthlyAmounts = calculateMonthlyBreakdown(vendor);
      monthlyAmounts.forEach((amount, index) => {
        totals[index] += amount;
      });
    });
    return totals;
  };

  // Calculate monthly totals for vendors that are in budget
  const calculateInBudgetMonthlyTotals = (vendorsToCalculate: VendorData[] = vendors): number[] => {
    const inBudgetVendors = vendorsToCalculate.filter((vendor) => vendor.inBudget === true);
    return calculateMonthlyTotals(inBudgetVendors);
  };

  // Calculate monthly totals for vendors that are not in budget
  const calculateNotInBudgetMonthlyTotals = (vendorsToCalculate: VendorData[] = vendors): number[] => {
    const notInBudgetVendors = vendorsToCalculate.filter((vendor) => vendor.inBudget === false);
    return calculateMonthlyTotals(notInBudgetVendors);
  };

  // Sort vendors for monthly table
  const sortVendorsForMonthly = (
    vendorsToSort: VendorData[],
    config: {
      field: "vendorName" | "financeMappedCategory" | "category" | "total" | null;
      direction: "asc" | "desc";
    }
  ) => {
    if (!config.field) return vendorsToSort;

    return [...vendorsToSort].sort((a, b) => {
      if (config.field === "total") {
        const aTotal = calculateMonthlyBreakdown(a).reduce((sum, amount) => sum + amount, 0);
        const bTotal = calculateMonthlyBreakdown(b).reduce((sum, amount) => sum + amount, 0);
        return config.direction === "asc" ? aTotal - bTotal : bTotal - aTotal;
      }

      const aValue = a[config.field as keyof VendorData];
      const bValue = b[config.field as keyof VendorData];
      const aStr = String(aValue || "").toLowerCase();
      const bStr = String(bValue || "").toLowerCase();

      return config.direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  };

  // Filter vendors for monthly table
  const filterVendorsForMonthly = (vendorsToFilter: VendorData[]) => {
    return vendorsToFilter.filter((vendor) => {
      const nameMatch = vendor.vendorName
        .toLowerCase()
        .includes(filters.vendorName.toLowerCase());
      const financeCategoryMatch = (vendor.financeMappedCategory || "")
        .toLowerCase()
        .includes(filters.financeMappedCategory.toLowerCase());
      const categoryMatch = (vendor.category || "")
        .toLowerCase()
        .includes(filters.category.toLowerCase());
      return nameMatch && financeCategoryMatch && categoryMatch;
    });
  };

  // Get filtered and sorted vendors for monthly table
  const getFilteredAndSortedVendorsForMonthly = () => {
    const filtered = filterVendorsForMonthly(vendors);
    return sortVendorsForMonthly(filtered, sortConfig);
  };

  // Handle sort for monthly table
  const handleMonthlySort = (field: "vendorName" | "financeMappedCategory" | "category" | "total") => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Group vendors by financeMappedCategory
  const getGroupedVendors = (vendorsToGroup: VendorData[]) => {
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

    vendorsToGroup.forEach((vendor) => {
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

  // Group vendors by category
  const getGroupedVendorsByCategory = (vendorsToGroup: VendorData[]) => {
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

    vendorsToGroup.forEach((vendor) => {
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

  // Calculate totals
  const calculateInBudgetTotal = () => {
    return getFilteredAndSortedVendorsForMonthly()
      .filter((vendor) => vendor.inBudget)
      .reduce((sum, vendor) => sum + vendor.budget, 0);
  };

  const displayedVendors = getFilteredAndSortedVendorsForMonthly();

  return (
    <div className="vendor-monthly-table">
      {/* Controls */}
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
                <label>Filter by Finance Category:</label>
                <input
                  type="text"
                  value={filters.financeMappedCategory}
                  onChange={(e) =>
                    setFilters((prev) => ({
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
            </div>
          </div>
        )}
      </div>

      {/* Group Controls */}
      <div className="group-controls">
        <label className="group-toggle">
          <input
            type="checkbox"
            checked={isGroupedView}
            onChange={(e) => setIsGroupedView(e.target.checked)}
          />
          Group by:
        </label>
        {isGroupedView && (
          <select
            value={groupByType}
            onChange={(e) => setGroupByType(e.target.value as "finance" | "category")}
            className="group-select"
          >
            <option value="finance">Finance Category</option>
            <option value="category">Category</option>
          </select>
        )}
      </div>

      {/* Table */}
      <div className="vendor-table-container">
        <table className="vendor-monthly-table">
          <thead>
            <tr>
              <th
                onClick={() => handleMonthlySort("vendorName")}
                className="sortable-header"
              >
                Vendor Name{" "}
                {sortConfig.field === "vendorName" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleMonthlySort("financeMappedCategory")}
                className="sortable-header"
              >
                Finance Category{" "}
                {sortConfig.field === "financeMappedCategory" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleMonthlySort("category")}
                className="sortable-header"
              >
                Category{" "}
                {sortConfig.field === "category" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              {monthNames.map((month) => (
                <th key={month} className="month-header">
                  {month}
                </th>
              ))}
              <th
                onClick={() => handleMonthlySort("total")}
                className="sortable-header total-header"
              >
                Total{" "}
                {sortConfig.field === "total" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isGroupedView ? (
              // Grouped view
              <>
                {(groupByType === "finance"
                  ? getGroupedVendors(displayedVendors)
                  : getGroupedVendorsByCategory(displayedVendors)
                ).map((group) => {
                  const groupKey = groupByType === "finance" 
                    ? (group as any).financeMappedCategory 
                    : (group as any).category;
                  const isExpanded = expandedGroups.has(groupKey);

                  return (
                    <React.Fragment key={groupKey}>
                      {/* Group Header */}
                      <tr
                        className="group-header-row"
                        onClick={() => toggleGroupExpansion(groupKey)}
                      >
                        <td className="group-title collapsible">
                          <span className="group-icon">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                          <strong>{groupKey}</strong>
                          <span className="vendor-count">
                            ({group.vendors.length} vendors:{" "}
                            {group.vendorNames.join(", ")})
                          </span>
                        </td>
                        <td></td>
                        <td></td>
                        {group.monthlyTotals.map((total, index) => (
                          <td key={index} className="group-monthly-total">
                            <strong>
                              {formatCurrencyExcelStyle(total * 1000)}
                            </strong>
                          </td>
                        ))}
                        <td className="group-total">
                          <strong>
                            {formatCurrencyExcelStyle(group.totalSum * 1000)}
                          </strong>
                        </td>
                      </tr>

                      {/* Individual Vendors (if expanded) */}
                      {isExpanded &&
                        group.vendors.map((vendor) => {
                          const monthlyAmounts = calculateMonthlyBreakdown(vendor);
                          const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);

                          return (
                            <tr key={vendor.id} className="vendor-detail-row">
                              <td className="vendor-name-cell">
                                {vendor.vendorName}
                              </td>
                              <td>{vendor.financeMappedCategory || "-"}</td>
                              <td>{vendor.category || "-"}</td>
                              {monthlyAmounts.map((amount, index) => (
                                <td key={index} className="monthly-amount">
                                  {formatCurrencyExcelStyle(amount * 1000)}
                                </td>
                              ))}
                              <td className="vendor-total">
                                {formatCurrencyExcelStyle(total * 1000)}
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </>
            ) : (
              // Regular view
              displayedVendors.map((vendor) => {
                const monthlyAmounts = calculateMonthlyBreakdown(vendor);
                const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);

                return (
                  <tr key={vendor.id} className="vendor-row">
                    <td>{vendor.vendorName}</td>
                    <td>{vendor.financeMappedCategory || "-"}</td>
                    <td>{vendor.category || "-"}</td>
                    {monthlyAmounts.map((amount, index) => (
                      <td key={index} className="monthly-amount">
                        {formatCurrencyExcelStyle(amount * 1000)}
                      </td>
                    ))}
                    <td className="vendor-total">
                      {formatCurrencyExcelStyle(total * 1000)}
                    </td>
                  </tr>
                );
              })
            )}

            {/* Summary Rows */}
            {!isGroupedView && (
              <>
                <tr className="summary-divider">
                  <td colSpan={16}></td>
                </tr>
                <tr className="monthly-totals-row in-budget">
                  <td colSpan={3} className="totals-label">
                    <strong>In Budget Totals</strong>
                  </td>
                  {calculateInBudgetMonthlyTotals(displayedVendors).map((total, index) => (
                    <td key={index} className="monthly-total-cell">
                      <strong>
                        {formatCurrencyExcelStyle(total * 1000)}
                      </strong>
                    </td>
                  ))}
                  <td className="grand-total">
                    <strong>
                      {formatCurrencyExcelStyle(
                        displayedVendors
                          .filter((vendor) => vendor.inBudget === true)
                          .reduce((sum, vendor) => sum + vendor.budget, 0) * 1000
                      )}
                    </strong>
                  </td>
                </tr>
                <tr className="monthly-totals-row not-in-budget">
                  <td colSpan={3} className="totals-label">
                    <strong>Not In Budget Totals</strong>
                  </td>
                  {calculateNotInBudgetMonthlyTotals(displayedVendors).map((total, index) => (
                    <td key={index} className="monthly-total-cell">
                      <strong>
                        {formatCurrencyExcelStyle(total * 1000)}
                      </strong>
                    </td>
                  ))}
                  <td className="grand-total">
                    <strong>
                      {formatCurrencyExcelStyle(
                        displayedVendors
                          .filter((vendor) => vendor.inBudget === false)
                          .reduce((sum, vendor) => sum + vendor.budget, 0) * 1000
                      )}
                    </strong>
                  </td>
                </tr>
                <tr className="monthly-totals-row">
                  <td colSpan={3} className="totals-label">
                    <strong>Monthly Totals</strong>
                  </td>
                  {calculateMonthlyTotals(displayedVendors).map((total, index) => (
                    <td key={index} className="monthly-total-cell">
                      <strong>
                        {formatCurrencyExcelStyle(total * 1000)}
                      </strong>
                    </td>
                  ))}
                  <td className="grand-total">
                    <strong>
                      {formatCurrencyExcelStyle(
                        displayedVendors.reduce((sum, vendor) => sum + vendor.budget, 0) * 1000
                      )}
                    </strong>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(VendorMonthlyTable);