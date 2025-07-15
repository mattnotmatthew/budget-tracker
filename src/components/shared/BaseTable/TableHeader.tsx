import React from "react";
import { Column } from "./BaseTable";

interface TableHeaderProps<T> {
  column: Column<T>;
  onSort: (field: string) => void;
  sortIndicator: string;
}

function TableHeader<T>({ column, onSort, sortIndicator }: TableHeaderProps<T>) {
  const handleClick = () => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  return (
    <th
      onClick={handleClick}
      className={`
        ${column.sortable ? "sortable-header" : ""}
        ${column.className || ""}
      `}
      style={{ 
        width: column.width,
        cursor: column.sortable ? "pointer" : "default"
      }}
    >
      {column.header}
      {column.sortable && (
        <span className="sort-indicator">{sortIndicator}</span>
      )}
    </th>
  );
}

export default TableHeader;