import { useState } from "react";

export interface CopyToNextMonthConfig<T> {
  items: T[];
  selectedMonth: number;
  selectedYear: number;
  allItems: T[];
  getItemKey: (item: T) => string;
  createCopiedItem: (item: T, nextMonth: number, nextYear: number) => T;
  addItem: (item: T) => void;
  itemTypeName: string; // e.g., "teams", "allocations"
  itemDisplayName: string; // e.g., "teams", "functional allocations"
}

export const useCopyToNextMonth = <T>() => {
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const copyToNextMonth = (config: CopyToNextMonthConfig<T>) => {
    const {
      items,
      selectedMonth,
      selectedYear,
      allItems,
      getItemKey,
      createCopiedItem,
      addItem,
      itemTypeName,
      itemDisplayName,
    } = config;

    if (items.length === 0) {
      setPasteMessage(`No ${itemDisplayName} to copy`);
      setTimeout(() => setPasteMessage(null), 3000);
      return;
    }

    // Calculate next month and year
    let nextMonth = selectedMonth + 1;
    let nextYear = selectedYear;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = nextYear + 1;
    }

    // Check if items already exist for the next month (using the same filter logic as the source)
    const existingNextMonthItems = allItems.filter(
      (item: any) => item.month === nextMonth && item.year === nextYear
    );

    if (existingNextMonthItems.length > 0) {
      const confirmOverwrite = window.confirm(
        `${
          itemDisplayName.charAt(0).toUpperCase() + itemDisplayName.slice(1)
        } already exist for ${
          monthNames[nextMonth - 1]
        } ${nextYear}. Do you want to add these ${itemDisplayName} anyway?`
      );
      if (!confirmOverwrite) return;
    }

    // Copy all items to next month
    const copiedItems = items.map((item) =>
      createCopiedItem(item, nextMonth, nextYear)
    );

    // Add all copied items
    copiedItems.forEach((item) => {
      addItem(item);
    });

    setPasteMessage(
      `✅ Copied ${copiedItems.length} ${itemDisplayName} to ${
        monthNames[nextMonth - 1]
      } ${nextYear}`
    );
    setTimeout(() => setPasteMessage(null), 4000);
  };

  return {
    copyToNextMonth,
    pasteMessage,
    setPasteMessage,
  };
};
