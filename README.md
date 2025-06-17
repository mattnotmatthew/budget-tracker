# Budget vs Actual Tracker 2025

A sophisticated React TypeScript application for comprehensive budget management with intelligent variance analysis, quarterly/monthly tracking, and executive-level insights. Features advanced IOSToggle logic for Final/Forecast states, dynamic summaries, and automated budget performance monitoring.

## 🚀 Features

### **Advanced Budget Management**

- **IOSToggle Logic**: Dynamic Final/Forecast mode switching per month with intelligent variance calculation
- **Multi-Level Summaries**: Monthly, Quarterly, and Yearly dashboard views with automated aggregation
- **Budget Tracking**: Sophisticated budget performance monitoring with YTD calculations
- **Adjustments Integration**: Smart handling of budget adjustments that appear in correct columns based on month status

### **Intelligent Financial Analysis**

- **YTD Performance**: Real-time year-to-date actual vs budget with percentage performance metrics
- **Full Year Forecasting**: Automated projection combining actual (Final months) + forecast (remaining months)
- **Variance Detection**: Color-coded alerts for budget overages/underages with smart thresholds
- **Budget Runway**: Remaining budget calculations and spending pace analysis

### **Executive Dashboard Features**

- **Performance Cards**: YTD Actual, YTD vs Budget, Remaining Budget, Full Year Forecast
- **Smart Color Logic**: Green for under-budget performance, Red for over-budget (executive-friendly)
- **Quarterly Summaries**: Automated quarterly roll-ups with conditional Actual/Forecast display
- **Budget Utilization**: Track spending against annual targets with confidence indicators

### **Category Structure & Business Logic**

### **Category Structure & Business Logic**

**Cost of Sales Categories**:

- Recurring Software, One-Time Software, Recurring Service, One-time Service, Reclass from Opex, Other

**OpEx Categories**:

- Base Pay, Capitalized Salaries (negative), Commissions, Reclass to COGS, Bonus, Benefits, Payroll Taxes, Other Compensation, Travel & Entertainment, Employee Related, Facilities, Information Technology, Professional Services, Corporate, Marketing

### **Advanced Data Management**

- **File Integration**: Excel/CSV import with intelligent parsing and data validation
- **Auto-Save**: Smart persistence with file attachment capabilities
- **Copy-to-Quarter**: Bulk data operations for efficient budget planning
- **Currency Formatting**: Excel-style formatting with parentheses for negatives
- **Period Management**: Multi-year support (2024-2026) with seamless year switching

### **User Experience & Interface**

- **Collapsible Views**: Hierarchical display with expand/collapse functionality
- **Keyboard Navigation**: Full keyboard accessibility and shortcuts
- **Modal Input**: Intuitive data entry with validation and error handling
- **Responsive Design**: Mobile-friendly interface with touch optimization
- **Real-time Updates**: Live calculation updates without page refreshes

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript for type-safe development
- **State Management**: React Context + useReducer for complex state logic
- **Styling**: Modern CSS with CSS Grid/Flexbox for responsive layouts
- **Calculations**: Advanced utility functions for financial computations
- **File Handling**: Smart file management with auto-save capabilities
- **Currency Formatting**: Custom Excel-style number formatting

## 🏗️ Architecture Overview

### **Key Components**

- **Dashboard.tsx**: Main application shell with period selection and navigation
- **MonthlyView.tsx**: Detailed monthly budget entry with quarterly summaries
- **YearlyBudgetDashboard.tsx**: Executive-level performance metrics and forecasting
- **BudgetInput.tsx**: Modal-based data entry with validation
- **IOSToggle.tsx**: Final/Forecast mode switching component

### **Core Utilities**

- **budgetCalculations.ts**: YTD, variance, and budget tracking calculations
- **currencyFormatter.ts**: Excel-style currency and percentage formatting
- **fileManager.ts**: Smart auto-save and file persistence logic

### **Business Logic**

- **IOSToggle State Management**: Controls whether months show Actual or Forecast data
- **Variance Calculations**: Dynamic variance computation based on month status
- **Adjustments Logic**: Smart placement in Actual or Forecast columns
- **Budget Tracking**: Only shows values in appropriate columns (never both)

## 📁 Project Structure

```
budget-tracker/
├── src/
│   ├── components/              # React components
│   │   ├── Dashboard.tsx        # Main app shell with navigation
│   │   ├── MonthlyView.tsx      # Monthly budget entry + quarterly summaries
│   │   ├── YearlyBudgetDashboard.tsx  # Executive performance dashboard
│   │   ├── BudgetInput.tsx      # Modal data entry component
│   │   ├── IOSToggle.tsx        # Final/Forecast mode toggle
│   │   └── CategoryCard.tsx     # Individual category display
│   ├── context/                 # State management
│   │   └── BudgetContext.tsx    # Global app state with useReducer
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             # Budget, category, and component types
│   ├── utils/                   # Business logic utilities
│   │   ├── budgetCalculations.ts  # YTD, variance, forecasting calculations
│   │   ├── currencyFormatter.ts   # Excel-style number formatting
│   │   ├── fileManager.ts         # Auto-save and file persistence
│   │   └── categoryRules.ts       # Category validation and rules
│   └── styles/                  # CSS styling
│       └── App.css              # Main application styles
├── public/                      # Static assets
├── build/                       # Production build output
├── docs/                        # Comprehensive documentation (40+ files)
├── tests/                       # Test files and test data
└── Configuration files (package.json, tsconfig.json, etc.)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- Modern web browser with ES6+ support

### Installation

1. Clone the repository:

   ```bash
   git clone <your-repository-url>
   cd budget-tracker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

### Quick Start Guide

1. **Set Annual Budget**: Click "Edit" on the Annual Budget Target card
2. **Add Monthly Data**: Use the monthly view to enter budget/actual amounts
3. **Toggle Final/Forecast**: Switch months between Final (actual) and Forecast modes
4. **Review Performance**: Check the yearly dashboard for executive summary
5. **Save Your Work**: Attach an Excel file for auto-save functionality

## 💡 Key Business Logic

### **IOSToggle Behavior**

- **Final Mode**: Month shows Actual data, adjustments go to Actual column
- **Forecast Mode**: Month shows Forecast data, adjustments go to Forecast column
- **Budget Tracking**: Only appears in one column per month (never both)

### **Quarterly Summaries**

- **All Final**: Shows Actual + 0 Forecast (no forecast column data)
- **Mixed/All Forecast**: Shows Actual + Forecast appropriately
- **Aggregation**: Sums all underlying monthly data with IOSToggle logic

### **Executive Metrics**

- **YTD vs Budget**: Uses only Final months for both actual and budget amounts
- **Full Year Forecast**: Combines Actual (Final) + Forecast (remaining) intelligently
- **Color Logic**: Green = under budget (good), Red = over budget (bad)

## 📚 Documentation

Extensive documentation is available in the `docs/` folder with 40+ detailed guides:

### **Core Features**

- **[📋 Documentation Index](./docs/INDEX.md)** - Complete guide to all documentation
- **[🎯 Monthly Budget Tracking](./docs/MONTHLY_BUDGET_TRACKING_COMPLETE.md)** - Core tracking functionality
- **[📊 Quarterly Summaries](./docs/QUARTERLY_SUMMARY_FINAL_LOGIC_COMPLETE.md)** - Quarterly aggregation logic
- **[🎚️ IOSToggle Logic](./docs/BUDGET_TRACKING_IOSTOGGLE_LOGIC_COMPLETE.md)** - Final/Forecast mode behavior

### **Advanced Features**

- **[📈 YTD Budget Performance](./docs/YTD_BUDGET_PERFORMANCE_CARD_UPDATE.md)** - Executive dashboard metrics
- **[🔄 Copy to Quarter](./docs/COPY_TO_QUARTER_FEATURE.md)** - Bulk data operations
- **[� Excel Paste Feature](./docs/EXCEL_PASTE_FEATURE.md)** - Data import capabilities
- **[💾 Auto-Save System](./docs/ENHANCED_SAVE_FEATURE.md)** - File management

### **User Guides**

- **[⌨️ Keyboard Navigation](./docs/KEYBOARD_NAVIGATION_GUIDE.md)** - Accessibility features
- **[💰 Currency Formatting](./docs/PARENTHESES_FORMATTING_COMPLETE.md)** - Excel-style display
- **[🎨 UI Components](./docs/HELP_BUTTON_STYLING_FIX_COMPLETE.md)** - Interface design

_See the complete [docs folder](./docs/) for implementation details, testing guides, and technical specifications._

## 🎯 Use Cases

### **Monthly Budget Management**

- Enter budget vs actual amounts for Cost of Sales and OpEx categories
- Toggle between Final (completed) and Forecast (projected) modes
- Track variances with automatic color-coding and alerts

### **Quarterly Planning**

- Review quarterly summaries with intelligent Actual/Forecast aggregation
- Copy budget data between quarters for efficient planning
- Monitor quarterly performance against targets

### **Executive Reporting**

- YTD performance tracking with percentage metrics
- Full-year forecasting combining actuals and projections
- Budget runway analysis and spending pace monitoring

### **Financial Analysis**

- Variance analysis with smart threshold detection
- Budget tracking that respects Final/Forecast logic
- Currency formatting that matches Excel standards

## 🤝 Contributing

Contributions are welcome! This project follows standard React/TypeScript development practices.

### **Development Guidelines**

- Follow TypeScript strict mode requirements
- Maintain existing code style and component patterns
- Add documentation for new features in the `docs/` folder
- Test changes across different screen sizes and browsers

### **Key Areas for Contribution**

- Executive summary and automated insights
- Enhanced data visualization and charting
- Additional export formats and reporting
- Performance optimization and accessibility improvements

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

**Built with ❤️ for comprehensive budget management and financial planning**
