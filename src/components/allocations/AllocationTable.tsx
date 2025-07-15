import React, { useRef } from "react";
import { FunctionalAllocation as FunctionalAllocationType } from "../../types";
import TableActionButtons from "../shared/TableActionButtons";

interface AllocationTableProps {
  allocations: FunctionalAllocationType[];
  editingRows: Set<string>;
  errors: Record<string, string>;
  uniqueTeams: string[];
  uniqueCostCenters: string[];
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
  calculateCostPer: (allocation: FunctionalAllocationType) => number;
  noDataMessage: string;
}

const AllocationTable: React.FC<AllocationTableProps> = ({
  allocations,
  editingRows,
  errors,
  uniqueTeams,
  uniqueCostCenters,
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
  calculateCostPer,
  noDataMessage,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <div className="table-container" onPaste={onPaste}>
      <table ref={tableRef} className="functional-allocation-table">
        <thead>
          <tr>
            <th
              onClick={() => onSort("teamName")}
              className="sortable-header"
              style={{ cursor: "pointer" }}
            >
              Team{getSortIndicator("teamName")}
            </th>
            <th
              onClick={() => onSort("product")}
              className="sortable-header"
              style={{ cursor: "pointer" }}
            >
              Product{getSortIndicator("product")}
            </th>
            <th
              onClick={() => onSort("function")}
              className="sortable-header"
              style={{ cursor: "pointer" }}
            >
              Function{getSortIndicator("function")}
            </th>
            <th
              onClick={() => onSort("currentCostCenter")}
              className="sortable-header"
              style={{ cursor: "pointer" }}
            >
              Current Cost Center{getSortIndicator("currentCostCenter")}
            </th>
            <th
              onClick={() => onSort("cost")}
              className="sortable-header"
              style={{ cursor: "pointer" }}
            >
              Cost ({monthNames[selectedMonth - 1]}){getSortIndicator("cost")}
            </th>
            <th
              onClick={() => onSort("percentOfWork")}
              className="sortable-header"
              style={{ cursor: "pointer" }}
            >
              % of Work{getSortIndicator("percentOfWork")}
            </th>
            <th
              onClick={() => onSort("costPer")}
              className="sortable-header"
              style={{ cursor: "pointer" }}
            >
              Cost Per Product ({monthNames[selectedMonth - 1]})
              {getSortIndicator("costPer")}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allocations.length === 0 ? (
            <tr>
              <td colSpan={8} className="no-data">
                {noDataMessage}
              </td>
            </tr>
          ) : (
            allocations.map((allocation) => (
              <tr key={allocation.id}>
                <td>
                  {editingRows.has(allocation.id) ? (
                    <select
                      value={allocation.teamName}
                      data-allocation-id={allocation.id}
                      data-field="teamName"
                      onChange={(e) =>
                        onFieldChange(allocation.id, "teamName", e.target.value)
                      }
                      onKeyDown={(e) => onKeyDown(e, allocation.id, "teamName")}
                      onPaste={(e) =>
                        onMultiRowPaste(e, allocation.id, "teamName")
                      }
                      className="form-select"
                    >
                      <option value="">Select Team</option>
                      {uniqueTeams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span onClick={() => onToggleEditMode(allocation.id)}>
                      {allocation.teamName || "-"}
                    </span>
                  )}
                </td>
                <td>
                  {editingRows.has(allocation.id) ? (
                    <input
                      type="text"
                      value={allocation.product}
                      data-allocation-id={allocation.id}
                      data-field="product"
                      onChange={(e) =>
                        onFieldChange(allocation.id, "product", e.target.value)
                      }
                      onKeyDown={(e) => onKeyDown(e, allocation.id, "product")}
                      onPaste={(e) =>
                        onMultiRowPaste(e, allocation.id, "product")
                      }
                      className="form-input"
                    />
                  ) : (
                    <span onClick={() => onToggleEditMode(allocation.id)}>
                      {allocation.product || "-"}
                    </span>
                  )}
                </td>
                <td>
                  {editingRows.has(allocation.id) ? (
                    <select
                      value={allocation.function}
                      data-allocation-id={allocation.id}
                      data-field="function"
                      onChange={(e) =>
                        onFieldChange(allocation.id, "function", e.target.value)
                      }
                      onKeyDown={(e) => onKeyDown(e, allocation.id, "function")}
                      onPaste={(e) =>
                        onMultiRowPaste(e, allocation.id, "function")
                      }
                      className="form-select"
                    >
                      {functionOptions.map((func) => (
                        <option key={func} value={func}>
                          {func}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span onClick={() => onToggleEditMode(allocation.id)}>
                      {allocation.function}
                    </span>
                  )}
                </td>
                <td>
                  {editingRows.has(allocation.id) ? (
                    <select
                      value={allocation.currentCostCenter}
                      data-allocation-id={allocation.id}
                      data-field="currentCostCenter"
                      onChange={(e) =>
                        onFieldChange(
                          allocation.id,
                          "currentCostCenter",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        onKeyDown(e, allocation.id, "currentCostCenter")
                      }
                      onPaste={(e) =>
                        onMultiRowPaste(e, allocation.id, "currentCostCenter")
                      }
                      className="form-select"
                    >
                      <option value="">Select Cost Center</option>
                      {uniqueCostCenters.map((cc) => (
                        <option key={cc} value={cc}>
                          {cc}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span onClick={() => onToggleEditMode(allocation.id)}>
                      {allocation.currentCostCenter || "-"}
                    </span>
                  )}
                </td>
                <td className="cost-display-field">
                  {editingRows.has(allocation.id) &&
                  allocation.function !== "Development" &&
                  allocation.function !== "Support" ? (
                    <input
                      type="text"
                      value={Number(allocation.cost).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      data-allocation-id={allocation.id}
                      data-field="cost"
                      onChange={(e) => {
                        // Remove commas and convert to number
                        const numericValue =
                          parseFloat(e.target.value.replace(/,/g, "")) || 0;
                        onFieldChange(allocation.id, "cost", numericValue);
                      }}
                      onKeyDown={(e) => onKeyDown(e, allocation.id, "cost")}
                      onPaste={(e) => onMultiRowPaste(e, allocation.id, "cost")}
                      className={`form-input ${
                        errors[`${allocation.id}-cost`] ? "error" : ""
                      }`}
                    />
                  ) : (
                    <span
                      className="cost-value"
                      onClick={() => onToggleEditMode(allocation.id)}
                    >
                      $
                      {Number(allocation.cost).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {(allocation.function === "Development" ||
                        allocation.function === "Support") && (
                        <span
                          className="auto-calculated-indicator"
                          title="Auto-calculated from team cost"
                        >
                          {" "}
                          (auto)
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td>
                  {editingRows.has(allocation.id) ? (
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        value={allocation.percentOfWork}
                        data-allocation-id={allocation.id}
                        data-field="percentOfWork"
                        onChange={(e) =>
                          onFieldChange(
                            allocation.id,
                            "percentOfWork",
                            Number(e.target.value)
                          )
                        }
                        onKeyDown={(e) =>
                          onKeyDown(e, allocation.id, "percentOfWork")
                        }
                        onPaste={(e) =>
                          onMultiRowPaste(e, allocation.id, "percentOfWork")
                        }
                        className={`form-input ${
                          errors[`${allocation.id}-percentOfWork`]
                            ? "error"
                            : ""
                        }`}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="suffix">%</span>
                    </div>
                  ) : (
                    <span onClick={() => onToggleEditMode(allocation.id)}>
                      {allocation.percentOfWork}%
                    </span>
                  )}
                </td>
                <td className="calculated-field">
                  $
                  {Number(calculateCostPer(allocation)).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>
                <td>
                  <TableActionButtons
                    isEditing={editingRows.has(allocation.id)}
                    onEdit={() => onToggleEditMode(allocation.id)}
                    onDelete={() => onDeleteAllocation(allocation.id)}
                    editTooltip={
                      editingRows.has(allocation.id)
                        ? "Save allocation"
                        : "Edit allocation"
                    }
                    deleteTooltip="Delete allocation"
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(AllocationTable);
