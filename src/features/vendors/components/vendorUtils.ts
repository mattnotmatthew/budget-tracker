import { VendorData } from "../../../types";

// Sort vendors
export const sortVendors = (
  vendors: VendorData[],
  config: { field: keyof VendorData | null; direction: "asc" | "desc" }
) => {
  if (!config.field) return vendors;

  return [...vendors].sort((a, b) => {
    const aValue = a[config.field!];
    const bValue = b[config.field!];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return config.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      return config.direction === "asc"
        ? aValue === bValue
          ? 0
          : aValue
          ? 1
          : -1
        : aValue === bValue
        ? 0
        : aValue
        ? -1
        : 1;
    }

    const aStr = String(aValue || "").toLowerCase();
    const bStr = String(bValue || "").toLowerCase();

    return config.direction === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
};

// Filter vendors for budget table
export const filterVendors = (
  vendors: VendorData[],
  filters: {
    vendorName: string;
    category: string;
    billingType: string;
    inBudget: "all" | "yes" | "no";
  }
) => {
  return vendors.filter((vendor) => {
    const nameMatch = vendor.vendorName
      .toLowerCase()
      .includes(filters.vendorName.toLowerCase());
    const categoryMatch = (vendor.category || "")
      .toLowerCase()
      .includes(filters.category.toLowerCase());
    const billingMatch = vendor.billingType
      .toLowerCase()
      .includes(filters.billingType.toLowerCase());
    const budgetMatch =
      filters.inBudget === "all"
        ? true
        : filters.inBudget === "yes"
        ? vendor.inBudget
        : !vendor.inBudget;

    return nameMatch && categoryMatch && billingMatch && budgetMatch;
  });
};

// Clean Excel-style numbers
export const cleanExcelNumber = (value: string): number => {
  const cleaned = value
    .replace(/[$,\s]/g, "")
    .replace(/[()]/g, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Escape CSV field
export const escapeCSVField = (field: string): string => {
  if (field == null) return "";
  const fieldStr = String(field);
  if (fieldStr.includes(",") || fieldStr.includes('"') || fieldStr.includes("\n")) {
    return `"${fieldStr.replace(/"/g, '""')}"`;
  }
  return fieldStr;
};

// Download CSV
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};