# CSV Export Feature Documentation

## Overview

The CSV export feature allows users to export their vendor data from both the Budget Management and Monthly Breakdown tabs in the Vendor Management component. The exported CSV files reflect the current state of the table, including any applied filters, sorts, and groupings.

## Features

### Budget Management Export

- **Location**: Budget Management tab, next to "Edit All" button
- **Button**: "📊 Export to CSV"
- **Exports**: Current filtered and sorted vendor data
- **File Name Format**: `budget-management-{year}-{timestamp}.csv`

#### CSV Structure

```
Vendor/Item Name,Category,Finance Mapped Category,Billing Type,Budget Amount (in thousands),Month,In Budget,Description,Notes
```

### Monthly Breakdown Export

- **Location**: Monthly Breakdown tab, in the Group By controls section
- **Button**: "📊 Export to CSV"
- **Exports**: Current filtered, sorted, and grouped monthly data
- **File Name Format**: `monthly-breakdown-{view-type}-{year}-{timestamp}.csv`

#### CSV Structure (Flat View)

```
Vendor/Item Name,Finance Mapped Category,Category,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Total
```

#### CSV Structure (Grouped View)

```
Group Type,Group Name,Vendor/Item Name,Finance Mapped Category,Category,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Total
```

## Technical Implementation

### CSV Field Escaping

The export function properly handles CSV field escaping:

- Fields containing commas, quotes, or newlines are wrapped in double quotes
- Internal double quotes are escaped by doubling them
- Null and undefined values are converted to empty strings
- Numbers are converted to strings

### Export Process

1. User clicks "Export to CSV" button
2. Current table data is gathered (respecting filters, sorts, and groupings)
3. Data is formatted into CSV structure
4. CSV content is generated with proper escaping
5. File is automatically downloaded with descriptive filename

### File Naming Convention

- Budget Management: `budget-management-2024-2024-06-26T14-30-15.csv`
- Monthly Flat View: `monthly-breakdown-flat-2024-2024-06-26T14-30-15.csv`
- Monthly Grouped: `monthly-breakdown-grouped-by-finance-2024-2024-06-26T14-30-15.csv`

## User Guide

### Exporting Budget Management Data

1. Navigate to the Budget Management tab
2. Apply any desired filters or sorting
3. Click the "📊 Export to CSV" button
4. The CSV file will automatically download

### Exporting Monthly Breakdown Data

1. Navigate to the Monthly Breakdown tab
2. Configure your view:
   - Apply filters for vendor name, finance category, or category
   - Choose between individual view or grouped view
   - If grouped, select "Group By Finance Category" or "Group By Category"
   - Expand/collapse groups as desired
3. Click the "📊 Export to CSV" button
4. The CSV file will automatically download with current view settings

## Features Exported

### Budget Management

- All vendor information including names, categories, billing types
- Budget amounts (in thousands)
- In Budget status (Yes/No)
- Descriptions and notes
- Respects current filters and sort order

### Monthly Breakdown

- **Flat View**: Individual vendors with monthly distribution
- **Grouped View**:
  - Group headers with category totals
  - Individual vendors nested under groups
  - Grand totals at the bottom
- Monthly amount calculations based on billing type
- Totals row showing monthly and annual totals

## Error Handling

- Export buttons are disabled when no vendor data exists
- CSV generation handles edge cases like empty fields, special characters
- File download uses browser's native download mechanism

## Browser Compatibility

- Works in all modern browsers that support:
  - Blob API for file generation
  - Document.createElement for download links
  - URL.createObjectURL for file URLs

## File Size Considerations

- Large datasets (1000+ vendors) will generate correspondingly large CSV files
- Monthly breakdown exports are typically larger due to 12 monthly columns
- Grouped views include additional metadata rows
