# BaseTable Component

A reusable table component based on the AllocationTable pattern, providing common table functionality like sorting, filtering, and actions.

## Features

- ✅ Sortable columns
- ✅ Customizable column rendering
- ✅ Row actions
- ✅ Filtering support
- ✅ Sticky header
- ✅ Row hover effects
- ✅ Empty state
- ✅ Responsive design
- ✅ TypeScript support
- ✅ Keyboard navigation support (via onPaste prop)

## Basic Usage

```tsx
import { BaseTable, useTableSort, useTableFilters, TableFilters } from '../shared/BaseTable';

interface VendorData {
  id: string;
  vendorName: string;
  category: string;
  budget: number;
}

function VendorTable() {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  
  // Sorting
  const { sortedData, sortField, sortDirection, handleSort } = useTableSort({
    data: vendors,
    defaultSortField: 'vendorName',
    defaultSortDirection: 'asc',
  });

  // Filtering
  const { filteredData, filters, updateFilter, resetFilters } = useTableFilters({
    data: sortedData,
  });

  // Define columns
  const columns = [
    {
      key: 'vendorName',
      header: 'Vendor Name',
      sortable: true,
      width: '200px',
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
    },
    {
      key: 'budget',
      header: 'Budget',
      sortable: true,
      align: 'right' as const,
      render: (vendor: VendorData) => `$${vendor.budget.toLocaleString()}`,
      className: 'currency-cell',
    },
  ];

  // Filter configuration
  const filterConfig = [
    {
      key: 'vendorName',
      label: 'Vendor',
      type: 'text' as const,
      value: filters.vendorName || '',
      onChange: (value: string) => updateFilter('vendorName', value),
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      options: categories.map(cat => ({ value: cat, label: cat })),
      value: filters.category || '',
      onChange: (value: string) => updateFilter('category', value),
    },
  ];

  return (
    <>
      <TableFilters
        filters={filterConfig}
        onReset={resetFilters}
      />
      
      <BaseTable
        data={filteredData}
        columns={columns}
        keyExtractor={(vendor) => vendor.id}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        emptyMessage="No vendors found"
        actions={(vendor) => (
          <TableActionButtons
            isEditing={editingRows.has(vendor.id)}
            onEdit={() => handleEdit(vendor.id)}
            onDelete={() => handleDelete(vendor.id)}
          />
        )}
      />
    </>
  );
}
```

## Props

### BaseTable Props

| Prop             | Type                                    | Required | Description                             |
|------------------|-----------------------------------------|----------|-----------------------------------------|
| data             | `T[]`                                   | Yes      | Array of data to display                |
| columns          | `Column<T>[]`                           | Yes      | Column configuration                    |
| keyExtractor     | `(item: T, index: number) => string`    | Yes      | Function to extract unique key          |
| onSort           | `(field: string) => void`               | No       | Sort handler                            |
| sortField        | `string`                                | No       | Current sort field                      |
| sortDirection    | `"asc" \| "desc"`                       | No       | Current sort direction                  |
| onRowClick       | `(item: T, index: number) => void`      | No       | Row click handler                       |
| onPaste          | `(e: React.ClipboardEvent) => void`     | No       | Paste event handler                     |
| emptyMessage     | `string`                                | No       | Message when no data                    |
| className        | `string`                                | No       | Additional CSS classes                  |
| stickyHeader     | `boolean`                               | No       | Enable sticky header (default: true)    |
| highlightOnHover | `boolean`                               | No       | Enable row hover effect (default: true) |
| actions          | `(item: T, index: number) => ReactNode` | No       | Render actions column                   |

### Column Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| key | `string` | Yes | Data property key |
| header | `string` | Yes | Column header text |
| sortable | `boolean` | No | Enable sorting |
| width | `string` | No | Column width |
| align | `"left" \| "center" \| "right"` | No | Text alignment |
| render | `(item: T, index: number) => ReactNode` | No | Custom cell renderer |
| className | `string` | No | Additional CSS class |

## Hooks

### useTableSort

Handles table sorting logic.

```tsx
const { sortedData, sortField, sortDirection, handleSort } = useTableSort({
  data: myData,
  defaultSortField: 'name',
  defaultSortDirection: 'asc',
  sortComparator: (a, b, field, direction) => {
    // Custom sort logic
  }
});
```

### useTableFilters

Handles table filtering logic.

```tsx
const { filteredData, filters, updateFilter, resetFilters, hasActiveFilters } = useTableFilters({
  data: myData,
  filterFn: (item, filters) => {
    // Custom filter logic
    return true; // or false
  }
});
```

## Migration from Existing Tables

To migrate existing tables to use BaseTable:

1. Define your columns configuration
2. Replace table JSX with BaseTable component
3. Use hooks for sorting and filtering
4. Move custom styles to column className or custom renderers
5. Extract row actions to the actions prop

## Customization

The BaseTable uses CSS classes that integrate with the existing table styles in `tables.css`. You can customize appearance by:

1. Adding custom className to the BaseTable
2. Using column className for specific columns
3. Overriding CSS variables for theming
4. Using custom render functions for complex cells