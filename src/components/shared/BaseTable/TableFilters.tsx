import React from "react";

export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
  value: any;
  onChange: (value: any) => void;
}

interface TableFiltersProps {
  filters: FilterConfig[];
  onReset?: () => void;
  className?: string;
}

const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  onReset,
  className = "",
}) => {
  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case "select":
        return (
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="filter-select"
          >
            <option value="">{filter.placeholder || `All ${filter.label}`}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case "text":
      case "number":
      case "date":
        return (
          <input
            type={filter.type}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            placeholder={filter.placeholder || filter.label}
            className="filter-input"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`table-filters ${className}`}>
      <div className="filter-row">
        {filters.map((filter) => (
          <div key={filter.key} className="filter-group">
            <label>{filter.label}</label>
            {renderFilter(filter)}
          </div>
        ))}
        {onReset && (
          <div className="filter-group">
            <label>&nbsp;</label>
            <button onClick={onReset} className="reset-filters-btn">
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableFilters;