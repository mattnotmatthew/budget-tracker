import { useState, useMemo, useCallback } from "react";

interface UseTableFiltersProps<T> {
  data: T[];
  filterFn?: (item: T, filters: Record<string, any>) => boolean;
}

export function useTableFilters<T>({
  data,
  filterFn,
}: UseTableFiltersProps<T>) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const filteredData = useMemo(() => {
    // If no filters are set, return all data
    const hasActiveFilters = Object.values(filters).some(
      (value) => value !== "" && value !== null && value !== undefined
    );
    
    if (!hasActiveFilters) return data;

    return data.filter((item) => {
      if (filterFn) {
        return filterFn(item, filters);
      }

      // Default filter behavior - check if all filters match
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue || filterValue === "") return true;
        
        const itemValue = (item as any)[key];
        if (itemValue === null || itemValue === undefined) return false;

        // Case-insensitive string matching
        if (typeof itemValue === "string" && typeof filterValue === "string") {
          return itemValue.toLowerCase().includes(filterValue.toLowerCase());
        }

        // Exact match for other types
        return itemValue === filterValue;
      });
    });
  }, [data, filters, filterFn]);

  return {
    filters,
    filteredData,
    updateFilter,
    resetFilters,
    hasActiveFilters: Object.values(filters).some(
      (value) => value !== "" && value !== null && value !== undefined
    ),
  };
}