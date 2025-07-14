import React, { useState } from "react";
import { FunctionalAllocation as FunctionalAllocationType } from "../../types";
import AllocationFilters from "./AllocationFilters";
import AllocationActions from "./AllocationActions";
import AllocationTable from "./AllocationTable";

interface AllocationTableSectionProps {
  title: string;
  allocations: FunctionalAllocationType[];
  baseAllocations: FunctionalAllocationType[];
  editingRows: Set<string>;
  errors: Record<string, string>;
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
  uniqueTeams: string[];
  allUniqueTeams: string[];
  uniqueCostCenters: string[];
  allUniqueCostCenters: string[];
  functionOptions: string[];
  monthNames: string[];
  selectedMonth: number;
  onSort: (field: keyof FunctionalAllocationType | "costPer") => void;
  getSortIndicator: (
    field: keyof FunctionalAllocationType | "costPer"
  ) => string;
  onFieldChange: (
    id: string,
    field: keyof FunctionalAllocationType,
    value: any
  ) => void;
  onToggleEditMode: (id: string) => void;
  onDeleteAllocation: (id: string) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    allocationId: string,
    currentField: keyof FunctionalAllocationType
  ) => void;
  onMultiRowPaste: (
    e: React.ClipboardEvent<HTMLInputElement | HTMLSelectElement>,
    allocationId: string,
    field: keyof FunctionalAllocationType
  ) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onExportCSV: () => void;
  onAddAllocation: () => void;
  calculateCostPer: (allocation: FunctionalAllocationType) => number;
  pasteMessage: string | null;
  addButtonText?: string;
  showFilters?: boolean;
  defaultCollapsed?: boolean;
  headerClassName?: string;
}

const AllocationTableSection: React.FC<AllocationTableSectionProps> = ({
  title,
  allocations,
  baseAllocations,
  editingRows,
  errors,
  filters,
  onFiltersChange,
  uniqueTeams,
  allUniqueTeams,
  uniqueCostCenters,
  allUniqueCostCenters,
  functionOptions,
  monthNames,
  selectedMonth,
  onSort,
  getSortIndicator,
  onFieldChange,
  onToggleEditMode,
  onDeleteAllocation,
  onKeyDown,
  onMultiRowPaste,
  onPaste,
  onExportCSV,
  onAddAllocation,
  calculateCostPer,
  pasteMessage,
  addButtonText = "Add Allocation",
  showFilters = true,
  defaultCollapsed = false,
  headerClassName,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const noDataMessage = `No allocations for ${monthNames[selectedMonth - 1]}`;

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="table-section">
      <div className={` ${headerClassName || "table-section-header"}`}>
        <h2
          onClick={toggleCollapsed}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            userSelect: "none",
          }}
        >
          <span style={{ marginRight: "8px" }}>{isCollapsed ? "▶" : "▼"}</span>
          {title}
          <span
            style={{
              marginLeft: "10px",
              fontSize: "0.8em",
              color: "#666",
              fontWeight: "normal",
            }}
          >
            ({allocations.length} {allocations.length === 1 ? "item" : "items"})
          </span>
        </h2>
      </div>

      {!isCollapsed && (
        <>
          {showFilters && (
            <AllocationFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
              allUniqueTeams={allUniqueTeams}
              allUniqueCostCenters={allUniqueCostCenters}
              functionOptions={functionOptions}
              currentCount={allocations.length}
              totalCount={baseAllocations.length}
            />
          )}

          <AllocationActions
            onExportCSV={onExportCSV}
            onAddAllocation={onAddAllocation}
            pasteMessage={pasteMessage}
            addButtonText={addButtonText}
          />

          <AllocationTable
            allocations={allocations}
            editingRows={editingRows}
            errors={errors}
            uniqueTeams={uniqueTeams}
            uniqueCostCenters={uniqueCostCenters}
            functionOptions={functionOptions}
            monthNames={monthNames}
            selectedMonth={selectedMonth}
            onSort={onSort}
            getSortIndicator={getSortIndicator}
            onFieldChange={onFieldChange}
            onToggleEditMode={onToggleEditMode}
            onDeleteAllocation={onDeleteAllocation}
            onKeyDown={onKeyDown}
            onMultiRowPaste={onMultiRowPaste}
            onPaste={onPaste}
            calculateCostPer={calculateCostPer}
            noDataMessage={noDataMessage}
          />
        </>
      )}
    </div>
  );
};

export default AllocationTableSection;
