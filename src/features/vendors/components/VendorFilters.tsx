import React from "react";

interface VendorFiltersProps {
  filters: {
    vendorName: string;
    category: string;
    billingType?: string;
    financeMappedCategory?: string;
    inBudget?: "all" | "yes" | "no";
  };
  onFilterChange: (filters: any) => void;
  type: "budget" | "monthly";
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onExportCSV: () => void;
  onToggleGroupView?: () => void;
  isGroupedView?: boolean;
  groupByType?: "finance" | "category";
  onGroupByChange?: (type: "finance" | "category") => void;
}

const VendorFilters: React.FC<VendorFiltersProps> = ({
  filters,
  onFilterChange,
  type,
  isCollapsed,
  onToggleCollapse,
  onExportCSV,
  onToggleGroupView,
  isGroupedView,
  groupByType,
  onGroupByChange,
}) => {
  const handleFilterChange = (field: string, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="vendor-filters">
      <div className="filter-row">
        <div className="filter-group">
          <label>Vendor Name</label>
          <input
            type="text"
            value={filters.vendorName}
            onChange={(e) => handleFilterChange("vendorName", e.target.value)}
            placeholder="Filter by vendor..."
          />
        </div>

        <div className="filter-group">
          <label>Category</label>
          <input
            type="text"
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            placeholder="Filter by category..."
          />
        </div>

        {type === "budget" && (
          <>
            <div className="filter-group">
              <label>Billing Type</label>
              <input
                type="text"
                value={filters.billingType || ""}
                onChange={(e) => handleFilterChange("billingType", e.target.value)}
                placeholder="Filter by billing type..."
              />
            </div>

            <div className="filter-group">
              <label>In Budget</label>
              <select
                value={filters.inBudget || "all"}
                onChange={(e) =>
                  handleFilterChange("inBudget", e.target.value as "all" | "yes" | "no")
                }
              >
                <option value="all">All Vendors</option>
                <option value="yes">In Budget</option>
                <option value="no">Not In Budget</option>
              </select>
            </div>
          </>
        )}

        {type === "monthly" && (
          <>
            <div className="filter-group">
              <label>Finance Category</label>
              <input
                type="text"
                value={filters.financeMappedCategory || ""}
                onChange={(e) =>
                  handleFilterChange("financeMappedCategory", e.target.value)
                }
                placeholder="Filter by finance category..."
              />
            </div>

            {onToggleGroupView && (
              <div className="filter-group">
                <label>&nbsp;</label>
                <div className="vendor-controls-left">
                  <button
                    onClick={onToggleGroupView}
                    className={`group-toggle-btn ${isGroupedView ? "active" : ""}`}
                    title={
                      isGroupedView
                        ? "Switch to flat view"
                        : "Group by Finance Category"
                    }
                  >
                    <span className="toggle-icon">
                      {isGroupedView ? "⊟" : "⊞"}
                    </span>
                    {isGroupedView ? "Flat View" : "Group View"}
                  </button>

                  {isGroupedView && onGroupByChange && (
                    <select
                      value={groupByType}
                      onChange={(e) =>
                        onGroupByChange(e.target.value as "finance" | "category")
                      }
                      className="group-by-select"
                    >
                      <option value="finance">Group by Finance Category</option>
                      <option value="category">Group by Category</option>
                    </select>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="filter-group">
          <label>&nbsp;</label>
          <button onClick={onToggleCollapse} className="collapse-filters-btn">
            {isCollapsed ? "Show Filters" : "Hide Filters"}
          </button>
        </div>

        <div className="filter-group">
          <label>&nbsp;</label>
          <button onClick={onExportCSV} className="export-btn">
            📊 Export to CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VendorFilters);