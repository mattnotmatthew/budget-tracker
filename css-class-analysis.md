# CSS Class Usage Analysis Report

## Summary

- **Total unique CSS classes used in React components**: 614
- **Total CSS classes defined in stylesheets**: 486
- **Unused CSS classes (defined but not referenced)**: 220
- **Potentially missing CSS classes (used but not defined)**: 348

## Most Common CSS Class Patterns

### 1. Most Frequently Used Classes (Top 20)
1. `sort-indicator` (36 occurrences)
2. `sort-header` (31 occurrences)
3. `compact-metric` (30 occurrences)
4. `filter-group` (25 occurrences)
5. `vendor-label monthly-amount` (24 occurrences)
6. `vendor-col-month` (24 occurrences)
7. `sortable-header` (17 occurrences)
8. `form-group` (17 occurrences)
9. `assumption-item` (17 occurrences)
10. `vendor-label` (15 occurrences)
11. `vendor-input currency-input` (13 occurrences)
12. `expand-icon` (13 occurrences)
13. `assumption-value` (13 occurrences)
14. `assumption-label` (13 occurrences)
15. `totals-label` (12 occurrences)
16. `section-header` (12 occurrences)
17. `reforecast-amount` (12 occurrences)
18. `budget-amount` (12 occurrences)
19. `actual-amount` (12 occurrences)
20. `vendor-input` (11 occurrences)

### 2. Dynamic className Generation Patterns

The application uses several patterns for dynamic class generation:

1. **Conditional Classes**: 
   - `className={activeTab === "list" ? "active" : ""}`
   - `className={isOn ? "on" : "off"}`

2. **Template Literals with Conditions**:
   - `className={\`view-btn \${currentView === "budget" ? "active" : ""}\`}`
   - `className={\`ios-toggle \${isOn ? "on" : "off"}\`}`

3. **Utility Functions**:
   - `getVarianceClass()` - Used 18 times for variance styling
   - `getPerformanceClass()` - Used 21 times for performance indicators
   - `getAlertClass()` - Used 2 times for alert styling

### 3. Key CSS Class Categories

1. **Layout & Structure**:
   - dashboard, section-container, form-group, modal-overlay
   - header, content, footer patterns

2. **Tables & Data Display**:
   - vendor-table, budget-table, monthly-table
   - sort-header, sortable-header, sort-indicator
   - totals-row, grand-total, sub-total

3. **Forms & Inputs**:
   - form-input, vendor-input, budget-input
   - currency-input, amount-input, notes-input
   - filter-group, filter-input

4. **State & Feedback**:
   - active, editing, read-only, disabled
   - positive, negative, neutral
   - success, warning, danger, info

5. **Component-Specific**:
   - vendor-* (vendor management)
   - budget-* (budget tracking)
   - allocation-* (allocation features)
   - kpi-* (KPI cards and metrics)

### 4. Potentially Unused CSS Classes (Sample)

These classes are defined in CSS but not found in components:
- adj-ebitda
- bg-beige, bg-grey, bg-white
- btn variants: btn-dark, btn-disabled, btn-light, btn-large
- Various column classes: budget-col-category, budget-col-description

### 5. Potentially Missing CSS Definitions (Sample)

These classes are used in components but not found in CSS files:
- action-card, active-badge, active-indicator
- Multiple compound classes: "alert alert-success", "btn btn-primary"
- Feature-specific: billing-distribution, billing-overview
- UI components: breadcrumb-current, breadcrumb-link

## Recommendations

1. **Clean Up Unused Classes**: Remove the 220 unused CSS classes to reduce stylesheet size
2. **Define Missing Classes**: Add CSS definitions for the 348 classes used but not defined
3. **Consolidate Dynamic Patterns**: Consider using a CSS-in-JS solution or utility classes for dynamic styling
4. **Component Scoping**: Consider CSS Modules or styled-components for better component isolation
5. **Naming Convention**: Standardize on BEM or another naming convention for consistency