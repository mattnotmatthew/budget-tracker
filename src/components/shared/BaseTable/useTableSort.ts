import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc";

interface UseTableSortProps<T> {
  data: T[];
  defaultSortField?: string;
  defaultSortDirection?: SortDirection;
  sortComparator?: (a: T, b: T, field: string, direction: SortDirection) => number;
}

export function useTableSort<T>({
  data,
  defaultSortField = "",
  defaultSortDirection = "asc",
  sortComparator,
}: UseTableSortProps<T>) {
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  const sortedData = useMemo(() => {
    if (!sortField) return data;

    const sorted = [...data].sort((a, b) => {
      if (sortComparator) {
        return sortComparator(a, b, sortField, sortDirection);
      }

      // Default comparator
      const aValue = (a as any)[sortField];
      const bValue = (b as any)[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortField, sortDirection, sortComparator]);

  return {
    sortedData,
    sortField,
    sortDirection,
    handleSort,
  };
}