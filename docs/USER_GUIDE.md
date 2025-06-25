# Budget Tracker User Guide

A comprehensive guide to using the Budget vs Actual Tracker 2025 application for effective financial planning and budget management.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Main Dashboard Overview](#main-dashboard-overview)
3. [Core Features](#core-features)
4. [Monthly Budget Management](#monthly-budget-management)
5. [Quarterly Planning & Analysis](#quarterly-planning--analysis)
6. [Executive Dashboard](#executive-dashboard)
7. [Vendor Management](#vendor-management)
8. [File Management](#file-management)
9. [Advanced Features](#advanced-features)
10. [Tips & Best Practices](#tips--best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Setup

When you first open the Budget Tracker, you'll be guided through a quick setup:

1. **Year Selection**: Choose your budget year (2024, 2025, or 2026)
2. **Budget Target**: Set your annual budget target for the year
3. **Data Entry**: Begin entering your budget and actual amounts

### Navigation Basics

- **Top Navigation**: Year selector and view mode switcher
- **Left Panel**: Main feature navigation (Monthly, Quarterly, Executive, Vendor)
- **Main Content**: Dynamic content based on your selected view
- **Action Buttons**: Save, export, and help options in the top-right

### Keyboard Shortcuts

- `Ctrl + 1`: Switch to 2024 view
- `Ctrl + 2`: Switch to 2025 view
- `Ctrl + 3`: Switch to 2026 view
- `Ctrl + S`: Save current data
- `Escape`: Close modals/dialogs

---

## Main Dashboard Overview

### Dashboard Components

**Performance Cards** (Top Row):

- **YTD Actual**: Total year-to-date spending
- **YTD vs Budget**: Performance against budget with color coding
- **Remaining Budget**: Available budget for rest of year
- **Full Year Forecast**: Projected total spending

**Main View Options**:

- **Monthly View**: Detailed monthly budget entry and tracking
- **Quarterly View**: Summarized quarterly performance
- **Executive Dashboard**: High-level metrics and insights
- **Vendor Management**: Track vendor spending and contracts

### Color Coding System

- 🟢 **Green**: Under budget (good performance)
- 🔴 **Red**: Over budget (requires attention)
- 🟡 **Yellow**: Within tolerance but approaching limits
- ⚪ **Gray**: No data or neutral status

---

## Core Features

### IOSToggle Logic

Each month can be in one of two modes:

**Final Mode** 📊:

- Month is completed with actual data
- Shows actual spending vs budget
- Adjustments appear in the "Actual" column
- Variance calculated using actual amounts

**Forecast Mode** 📈:

- Month shows projected/forecasted data
- Shows forecast vs budget
- Adjustments appear in the "Forecast" column
- Variance calculated using forecast amounts

**How to Switch Modes**:

1. Click the toggle switch next to any month
2. Green = Final (actual data)
3. Gray = Forecast (projected data)

### Budget Categories

**Cost of Sales**:

- Recurring Software
- One-Time Software
- Recurring Service
- One-time Service
- Reclass from Opex
- Other

**Operating Expenses (OpEx)**:

- **Compensation**: Base Pay, Bonuses, Benefits, Payroll Taxes
- **Operations**: Travel, Facilities, IT, Professional Services
- **Other**: Marketing, Corporate expenses

---

## Monthly Budget Management

### Adding Budget Data

1. **Navigate to Monthly View**
2. **Select Quarter**: Choose Q1, Q2, Q3, or Q4
3. **Click "Add Entry"**: Opens the budget input modal
4. **Fill Required Fields**:
   - Category (dropdown selection)
   - Budget Amount (in dollars)
   - Actual Amount (if month is complete)
   - Forecast Amount (for future planning)
   - Adjustments (if any corrections needed)
   - Notes (optional description)

### Monthly Workflow

**For Completed Months**:

1. Set month to "Final" mode
2. Enter actual spending amounts
3. Add any necessary adjustments
4. Review variance calculations

**For Future Months**:

1. Keep month in "Forecast" mode
2. Enter projected spending amounts
3. Update forecasts as needed
4. Monitor against budget targets

### Understanding Variances

- **Positive Variance**: Spending less than budgeted (good)
- **Negative Variance**: Spending more than budgeted (needs attention)
- **Color Coding**: Automatically applied based on variance thresholds

---

## Quarterly Planning & Analysis

### Quarterly Summary View

The quarterly view automatically aggregates monthly data:

- **All Final Months**: Shows Actual totals only
- **Mixed Final/Forecast**: Shows Actual + Forecast breakdown
- **All Forecast Months**: Shows Forecast totals only

### Quarter-to-Quarter Comparison

1. **Select Different Quarters**: Use Q1/Q2/Q3/Q4 tabs
2. **Compare Performance**: Review variance trends
3. **Identify Patterns**: Look for seasonal variations

### Copy to Quarter Feature

Efficiently copy budget data between quarters:

1. **Select Source Quarter**: Choose the quarter to copy from
2. **Select Target Quarter**: Choose destination quarter
3. **Choose Categories**: Select which categories to copy
4. **Confirm Copy**: Review and confirm the operation

---

## Executive Dashboard

### Key Performance Metrics

**YTD Performance Card**:

- Total actual spending year-to-date
- Percentage of annual budget used
- Days remaining in fiscal year

**Budget Performance Card**:

- Actual vs Budget variance
- Performance percentage
- Trend indicators

**Remaining Budget Card**:

- Available budget remaining
- Daily spending rate
- Projected runway

**Full Year Forecast Card**:

- Projected total year spending
- Confidence level indicators
- Variance from annual target

### Executive Insights

The dashboard automatically generates insights:

- **Spending Pace**: Whether you're ahead/behind budget timeline
- **Category Hotspots**: Categories with largest variances
- **Trend Analysis**: Month-over-month performance changes
- **Risk Indicators**: Areas requiring management attention

---

## Vendor Management

### Adding Vendors

1. **Navigate to Vendor Management**
2. **Fill Vendor Information**:

   - Vendor Name
   - Billing Type (Monthly, Quarterly, Annual, etc.)
   - Budget Amount
   - Notes

3. **Save Entry**: Vendor becomes read-only when complete

### Managing Vendor Data

**Editing Vendors**:

- Click the edit icon (📝) next to any vendor
- Update information as needed
- Click save to confirm changes

**Vendor Categories**:

- Group vendors by billing frequency
- Track contract renewals
- Monitor vendor spend against budgets

### Vendor Reports

- **Total Vendor Spend**: Sum of all vendor budgets
- **Billing Distribution**: Breakdown by payment frequency
- **Vendor Count**: Total number of active vendors

---

## File Management

### Saving Your Data

**Auto-Save**:

- Automatically saves changes every 5 minutes
- Saves when switching views or periods
- No manual action required

**Manual Save**:

- Click "Save" button or press Ctrl+S
- Choose save location and filename
- Creates JSON file with all budget data

### Loading Data

1. **Click "Load"** button
2. **Select File**: Choose previously saved budget file
3. **Confirm Load**: Data will replace current session
4. **Verify Data**: Review loaded information

### File Formats

**Supported Formats**:

- `.json`: Native budget tracker format
- `.csv`: Import from Excel or other tools
- `.xlsx`: Direct Excel import (coming soon)

---

## Advanced Features

### Excel Integration

**Excel-Style Formatting**:

- Currency displays with $ symbols
- Negative numbers in parentheses
- Proper number formatting and alignment

**Paste from Excel**:

- Copy data from Excel spreadsheets
- Paste directly into budget categories
- Automatic data validation and formatting

### Export Options

**HTML Export**:

- Generate formatted reports
- Customizable layout and styling
- Print-friendly formatting

**PDF Export**:

- Professional report formatting
- Executive summary included
- Ready for sharing/presentation

### Keyboard Navigation

- **Tab Navigation**: Move between form fields
- **Enter**: Submit forms or confirm actions
- **Escape**: Cancel operations or close dialogs
- **Arrow Keys**: Navigate between data cells

---

## Tips & Best Practices

### Monthly Workflow

1. **Start of Month**: Set forecast amounts for the month
2. **Mid-Month**: Update actuals as data becomes available
3. **End of Month**: Finalize all actuals and switch to Final mode
4. **Month Close**: Review variances and add explanatory notes

### Data Accuracy

- **Regular Updates**: Update actuals weekly or bi-weekly
- **Adjustment Tracking**: Document all budget adjustments
- **Variance Analysis**: Investigate significant variances promptly
- **Forecast Calibration**: Regularly update forecasts based on trends

### Performance Monitoring

- **Set Alerts**: Monitor budget variance thresholds
- **Trend Analysis**: Look for patterns across quarters
- **Category Focus**: Pay attention to high-variance categories
- **Executive Reporting**: Prepare summaries for leadership

### File Management

- **Regular Backups**: Save files frequently and keep backups
- **Naming Convention**: Use consistent file naming (e.g., Budget_2025_Q1)
- **Version Control**: Save different versions for major updates
- **Shared Access**: Consider cloud storage for team collaboration

---

## Troubleshooting

### Common Issues

**Data Not Saving**:

- Check browser permissions for file downloads
- Ensure sufficient disk space
- Try manual save with Ctrl+S

**Import Errors**:

- Verify file format is supported
- Check data structure matches expected format
- Remove special characters from data

**Performance Issues**:

- Clear browser cache and reload
- Close other browser tabs
- Check for large data files

**Calculation Errors**:

- Verify IOSToggle states are correct
- Check for missing budget amounts
- Ensure adjustments are properly categorized

### Getting Help

1. **Built-in Help**: Click the "?" icon for context-sensitive help
2. **Keyboard Shortcuts**: Press F1 for shortcut reference
3. **User Manual**: This document for comprehensive guidance
4. **Technical Support**: Contact your IT administrator for technical issues

### Error Messages

**"Validation Error"**: Check required fields are completed
**"Import Failed"**: Verify file format and data structure
**"Save Error"**: Check file permissions and disk space
**"Calculation Error"**: Review data entries for accuracy

---

## Conclusion

The Budget Tracker is designed to simplify financial planning and budget management while providing powerful analysis capabilities. Regular use of the application with consistent data entry will provide valuable insights into spending patterns and budget performance.

For advanced features or technical questions, refer to the [Technical Documentation](./TECHNICAL_GUIDE.md) or contact your system administrator.

---

**Last Updated**: January 2025  
**Version**: 2025.1  
**Support**: See technical documentation for developer resources
