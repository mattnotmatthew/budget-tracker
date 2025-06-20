# Manual Testing Guide - Budget Planning Feature

## 🧪 Testing Overview

This guide provides step-by-step manual testing instructions to validate the planning feature implementation from Phases 1-4.1. Test as a real user would interact with the system.

---

## 📋 Prerequisites

### **Environment Setup:**

1. **Start the app with planning enabled**: `npm run start:planning`
2. **Verify planning is enabled**: Check that `REACT_APP_ENABLE_PLANNING=true` in your environment
3. **Have some 2025 budget data**: The planning feature analyzes historical data (create some sample entries if needed)

---

## 🔍 Test Phase 1: Feature Flag System

### **Test 1.1: Feature Flag Validation**

#### **Steps:**

1. Open browser developer console (F12)
2. In console, type: `localStorage.getItem('REACT_APP_ENABLE_PLANNING')`
3. Navigate to the app

#### **Expected Outcomes:**

- ✅ Console shows planning is enabled
- ✅ App loads without errors
- ✅ Planning-related navigation should be visible

#### **Test 1.2: Environment Switching**

#### **Steps:**

1. Stop the app (Ctrl+C)
2. Run: `npm start` (without planning)
3. Check if planning features are hidden
4. Stop and run: `npm run start:planning` again

#### **Expected Outcomes:**

- ✅ Without planning: No planning routes/navigation
- ✅ With planning: Planning features visible
- ✅ No errors during switching

---

## 🎯 Test Phase 2: Year Selector & Navigation

### **Test 2.1: Year Selector Functionality**

#### **Steps:**

1. Look for the year selector in the main interface
2. Click on the year dropdown
3. Look for planning year options (e.g., "2026 Planning")
4. Select a planning year

#### **Expected Outcomes:**

- ✅ Year dropdown includes planning years
- ✅ Planning years have visual indicators (different styling)
- ✅ Mode indicator shows "Planning Mode" when selected
- ✅ Interface updates to show planning context

### **Test 2.2: Planning Navigation**

#### **Steps:**

1. With planning mode active, look for planning navigation
2. Try to navigate to `/planning` URL directly
3. Look for planning dashboard or menu items

#### **Expected Outcomes:**

- ✅ Planning navigation is visible in planning mode
- ✅ `/planning` URL loads planning dashboard
- ✅ Navigation is hidden in tracking mode
- ✅ Smooth transitions between modes

---

## 🎯 Test Phase 3: Planning Components

### **Test 3.1: Planning Dashboard**

#### **Steps:**

1. Navigate to planning mode
2. Go to planning dashboard
3. Look for main planning interface
4. Check for setup wizard or getting started options

#### **Expected Outcomes:**

- ✅ Planning dashboard loads successfully
- ✅ Professional layout and styling
- ✅ Clear calls to action for setup
- ✅ No JavaScript errors in console

### **Test 3.2: Setup Wizard (CSS Fixed)**

#### **Steps:**

1. Look for "Setup Wizard" or "Create Planning Data" button
2. Click to launch the setup wizard
3. Navigate through wizard steps
4. Check visual styling and layout

#### **Expected Outcomes:**

- ✅ **Wizard header styling** applied correctly
- ✅ **Step indicators** show progress with proper colors
- ✅ **Method selection cards** have hover effects and selection styling
- ✅ **Professional appearance** with consistent design
- ✅ Navigation buttons (Next/Back) work properly

### **Test 3.3: Planning Method Selection**

#### **Steps:**

1. In setup wizard, go to method selection step
2. Click on different planning methods
3. Look for visual feedback and descriptions
4. Select each method type

#### **Expected Outcomes:**

- ✅ Method cards highlight when selected
- ✅ Clear descriptions for each method
- ✅ Visual icons and benefits display
- ✅ Selection state persists during navigation

### **Test 3.4: Global Assumptions (CSS FIXED ✅)**

#### **Steps:**

1. Navigate to assumptions step in wizard
2. Modify assumption values (inflation, growth, etc.)
3. Check input validation and formatting
4. Look for help text and previews
5. **Verify no overlapping elements**
6. **Test responsive design on different screen sizes**

#### **Expected Outcomes:**

- ✅ **No overlapping elements** - labels, inputs, and help text properly stacked
- ✅ **Card-based layout** - each assumption in its own bordered card
- ✅ **Input fields with suffixes** - percentage signs positioned correctly
- ✅ **Help text below inputs** - clear guidance without conflicts
- ✅ **Responsive grid layout** - works on mobile and desktop
- ✅ **Professional styling** - consistent with app design
- ✅ Input fields accept numeric values
- ✅ Percentage formatting works
- ✅ Preview shows impact of assumptions

### **Test 3.5: Scenario Creation**

#### **Steps:**

1. Go to scenario creation step
2. Enter a scenario name
3. Review scenario preview
4. Complete wizard to create planning data

#### **Expected Outcomes:**

- ✅ Scenario name input works
- ✅ Preview shows scenario details
- ✅ Creation process completes successfully
- ✅ Success message appears

### **Test 3.6: Scenario Management**

#### **Steps:**

1. After creating initial scenario, navigate to scenario management
2. Try to create additional scenarios
3. Switch between scenarios
4. Look for comparison features

#### **Expected Outcomes:**

- ✅ Multiple scenarios can be created
- ✅ Scenario switching works smoothly
- ✅ Active scenario is clearly indicated
- ✅ Scenario comparison tools function

---

## 🔬 Test Phase 4.1: Historical Analysis (Backend)

### **Test 4.1: Analysis Engine Integration**

#### **Steps:**

1. Open browser developer console
2. Import the test function:
   ```javascript
   // In console, if the module is loaded:
   // This tests the analysis engine with sample data
   ```
3. Check that historical analysis doesn't break existing functionality
4. Verify planning data creation uses analysis

#### **Expected Outcomes:**

- ✅ No errors in console related to analysis
- ✅ Planning wizard can access historical data
- ✅ Analysis results influence planning recommendations
- ✅ System handles missing historical data gracefully

### **Test 4.2: Planning Recommendations**

#### **Steps:**

1. Create planning data with different types of historical data
2. Look for system recommendations in wizard
3. Check if recommended planning method makes sense
4. Verify confidence scores and insights

#### **Expected Outcomes:**

- ✅ System suggests appropriate planning method
- ✅ Recommendations match data characteristics
- ✅ Confidence scores reflect data quality
- ✅ Historical insights are accurate

---

## 🎨 Test Phase: UI/UX & Styling

### **Test CSS: Visual Design**

#### **Steps:**

1. Navigate through all planning components
2. Check responsive design on different screen sizes
3. Test hover effects and interactions
4. Verify color scheme consistency

#### **Expected Outcomes:**

- ✅ **Wizard styling** properly applied (header, cards, buttons)
- ✅ **Step indicators** have correct colors and states
- ✅ **Method selection** cards have professional appearance
- ✅ **Responsive design** works on mobile/tablet
- ✅ **Consistent color scheme** with app design
- ✅ **Smooth animations** and transitions

---

## 🔧 Test Phase: Error Handling

### **Test Error Cases**

#### **Steps:**

1. Try to access planning without historical data
2. Enter invalid values in wizard forms
3. Navigate directly to planning URLs
4. Try to create scenarios with duplicate names

#### **Expected Outcomes:**

- ✅ **Graceful degradation** with missing data
- ✅ **Clear error messages** for invalid inputs
- ✅ **Proper navigation guards** for unauthorized access
- ✅ **User-friendly error handling** throughout

---

## 📊 Test Phase: Performance

### **Test Performance**

#### **Steps:**

1. Load planning dashboard with large datasets
2. Switch between planning modes rapidly
3. Create multiple scenarios quickly
4. Check browser performance metrics

#### **Expected Outcomes:**

- ✅ **Fast loading times** for planning components
- ✅ **Smooth transitions** between modes
- ✅ **No memory leaks** during extended use
- ✅ **Responsive interactions** throughout

---

## 📱 Test Phase: Cross-Browser

### **Test Browser Compatibility**

#### **Steps:**

1. Test in Chrome, Firefox, Edge, Safari
2. Check feature functionality in each browser
3. Verify styling consistency
4. Test keyboard navigation

#### **Expected Outcomes:**

- ✅ **Consistent functionality** across browsers
- ✅ **Visual consistency** in all browsers
- ✅ **Keyboard accessibility** works properly
- ✅ **No browser-specific errors**

---

## 📋 Test Results Checklist

### **Overall System Health:**

- [ ] **No console errors** during normal operation
- [ ] **Feature flags** work correctly
- [ ] **Navigation** between modes is smooth
- [ ] **Planning wizard** completes successfully
- [ ] **CSS styling** is properly applied
- [ ] **Scenario management** functions correctly
- [ ] **Historical analysis** integrates seamlessly
- [ ] **Error handling** is user-friendly
- [ ] **Performance** is acceptable
- [ ] **Cross-browser** compatibility confirmed

### **Critical Success Criteria:**

1. ✅ **Zero breaking changes** to existing functionality
2. ✅ **Planning features** only appear when enabled
3. ✅ **Professional UI/UX** throughout planning components
4. ✅ **Complete wizard workflow** from start to finish
5. ✅ **Historical analysis** provides meaningful insights

---

## 🚨 If Issues Found

### **Common Issues & Solutions:**

#### **CSS Not Applied:**

- Check if `App.css` has wizard styles
- Verify class names match between component and CSS
- Check browser developer tools for CSS conflicts

#### **Planning Routes Not Working:**

- Verify `REACT_APP_ENABLE_PLANNING=true`
- Check browser console for routing errors
- Ensure all planning components are properly imported

#### **Historical Analysis Errors:**

- Check if 2025 data exists with `actualAmount` values
- Verify no TypeScript compilation errors
- Look for data validation error messages

#### **Performance Issues:**

- Check for unnecessary re-renders in React DevTools
- Verify large datasets are being handled efficiently
- Look for memory leaks in browser performance tab

---

## 📞 Testing Support

When testing, pay attention to:

1. **User experience flow** - Does it feel natural?
2. **Visual polish** - Does it look professional?
3. **Error recovery** - What happens when things go wrong?
4. **Performance** - Is it responsive and fast?
5. **Accessibility** - Can you navigate with keyboard?

## 📝 Test Report Template

After testing, note:

- **What worked well**
- **Issues discovered**
- **Suggestions for improvement**
- **Overall assessment**

This will help prioritize any fixes needed before continuing to Phase 4.2!
