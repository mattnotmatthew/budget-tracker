import React from "react";

interface AllocationFiltersProps {
  filters: {
    product: string;
    teamName: string;
    function: string;
    currentCostCenter: string;
  };
  onFiltersChange: (filters: {
    product: string;
    teamName: string;
    function: string;
    currentCostCenter: string;
  }) => void;
  allUniqueTeams: string[];
  allUniqueCostCenters: string[];
  functionOptions: string[];
  currentCount: number;
  totalCount: number;
}

const AllocationFilters: React.FC<AllocationFiltersProps> = ({
  filters,
  onFiltersChange,
  allUniqueTeams,
  allUniqueCostCenters,
  functionOptions,
  currentCount,
  totalCount,
}) => {
  const handleFilterChange = (field: string, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      product: "",
      teamName: "",
      function: "",
      currentCostCenter: "",
    });
  };

  return (
    <div className="filter-controls">
      <h3>Filters</h3>
      <div className="filter-row">
        <div className="filter-group">
          <label>Product:</label>
          <input
            type="text"
            value={filters.product}
            onChange={(e) => handleFilterChange("product", e.target.value)}
            placeholder="Filter by product..."
            className="form-input filter-input"
          />
        </div>
        <div className="filter-group">
          <label>Team:</label>
          <select
            value={filters.teamName}
            onChange={(e) => handleFilterChange("teamName", e.target.value)}
            className="form-select filter-select"
          >
            <option value="">All Teams</option>
            {allUniqueTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Function:</label>
          <select
            value={filters.function}
            onChange={(e) => handleFilterChange("function", e.target.value)}
            className="form-select filter-select"
          >
            <option value="">All Functions</option>
            {functionOptions.map((func) => (
              <option key={func} value={func}>
                {func}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Cost Center:</label>
          <select
            value={filters.currentCostCenter}
            onChange={(e) =>
              handleFilterChange("currentCostCenter", e.target.value)
            }
            className="form-select filter-select"
          >
            <option value="">All Cost Centers</option>
            {allUniqueCostCenters.map((costCenter) => (
              <option key={costCenter} value={costCenter}>
                {costCenter}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <button onClick={handleClearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>
      {/* Filter Summary */}
      <div className="filter-summary">
        Showing {currentCount} of {totalCount} allocations
        {Object.values(filters).some((f) => f.trim() !== "") && (
          <span className="active-filters">
            {" • Filters active: "}
            {Object.entries(filters)
              .filter(([, value]) => value.trim() !== "")
              .map(([key, value]) => `${key}: "${value}"`)
              .join(", ")}
          </span>
        )}
      </div>
    </div>
  );
};

export default AllocationFilters;
