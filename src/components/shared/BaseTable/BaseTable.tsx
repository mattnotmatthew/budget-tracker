import React, { useRef } from "react";
import TableHeader from "./TableHeader";
import "./BaseTable.css";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface BaseTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onRowClick?: (item: T, index: number) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  highlightOnHover?: boolean;
  actions?: (item: T, index: number) => React.ReactNode;
}

function BaseTable<T>({
  data,
  columns,
  keyExtractor,
  onSort,
  sortField,
  sortDirection,
  onRowClick,
  onPaste,
  emptyMessage = "No data available",
  className = "",
  stickyHeader = true,
  highlightOnHover = true,
  actions,
}: BaseTableProps<T>) {
  const tableRef = useRef<HTMLTableElement>(null);

  const getSortIndicator = (field: string): string => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const getCellAlignment = (align?: "left" | "center" | "right"): string => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div 
      className={`table-container ${className}`} 
      onPaste={onPaste}
    >
      <table 
        ref={tableRef} 
        className={`data-table base-table ${stickyHeader ? "sticky-header" : ""}`}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <TableHeader
                key={column.key}
                column={column}
                onSort={handleSort}
                sortIndicator={getSortIndicator(column.key)}
              />
            ))}
            {actions && <th className="actions-column">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + (actions ? 1 : 0)} 
                className="no-data"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                onClick={() => onRowClick?.(item, index)}
                className={`
                  ${onRowClick ? "clickable" : ""} 
                  ${highlightOnHover ? "highlight-on-hover" : ""}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      ${getCellAlignment(column.align)}
                      ${column.className || ""}
                    `}
                    style={{ width: column.width }}
                  >
                    {column.render
                      ? column.render(item, index)
                      : (item as any)[column.key]?.toString() || "-"}
                  </td>
                ))}
                {actions && (
                  <td className="actions-cell">
                    {actions(item, index)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BaseTable;