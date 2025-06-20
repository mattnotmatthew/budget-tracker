# Global Assumptions CSS Layout Fix

## 🐛 Issue Identified

The Global Assumptions section in the Planning Setup Wizard had overlapping elements where:

- Labels, input fields with suffixes, and help text were appearing on the same line
- Elements were overlapping each other instead of displaying in a proper vertical layout
- Duplicate and conflicting CSS definitions were causing layout issues

## 🔍 Root Cause Analysis

### **Duplicate CSS Definitions:**

1. **First Definition (Line 3223)**: Used horizontal layout with `justify-content: space-between`
2. **Second Definition (Line 3754)**: Used vertical layout with `flex-direction: column`
3. **Mobile Definition (Line 4119)**: Responsive design for mobile screens

### **Conflicting Styles:**

- `.assumptions-grid` had multiple definitions with different grid layouts
- `.assumption-item` had conflicting flex directions (horizontal vs. vertical)
- Orphaned CSS properties after removal causing syntax errors

## ✅ Solution Implemented

### **1. Removed Duplicate Definitions**

- Eliminated the first horizontal layout definition that was causing conflicts
- Cleaned up orphaned CSS properties to prevent syntax errors

### **2. Enhanced Layout Structure**

```css
.assumptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
  padding: 0;
}

.assumption-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### **3. Improved Input Layout**

```css
.input-with-suffix {
  position: relative;
  display: block;
  width: 100%;
  margin: 0.25rem 0;
}

.input-with-suffix input {
  width: 100%;
  padding: 0.75rem;
  padding-right: 3rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  background-color: #ffffff;
}
```

### **4. Enhanced Help Text Display**

```css
.assumption-help {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
  margin-bottom: 0;
  font-style: italic;
  line-height: 1.4;
  display: block;
  clear: both;
}
```

## 🎯 Expected Layout Result

### **Component Structure:**

```tsx
<div className="assumptions-grid">
  <div className="assumption-item">
    <label>Inflation Rate</label>
    <div className="input-with-suffix">
      <input type="number" />
      <span className="input-suffix">%</span>
    </div>
    <div className="assumption-help">
      Expected inflation rate for goods and services
    </div>
  </div>
  <!-- More assumption items... -->
</div>
```

### **Visual Layout:**

- **Grid Layout**: Responsive cards that stack appropriately
- **Card Design**: Each assumption in its own bordered card with padding
- **Vertical Flow**: Label → Input with suffix → Help text (stacked vertically)
- **Responsive**: Single column on mobile, multiple columns on desktop
- **Professional Styling**: Subtle shadows, consistent spacing, clear typography

## 🧪 Testing Instructions

1. **Start the planning app**: `npm run start:planning`
2. **Navigate to Planning Setup Wizard**
3. **Go to Global Assumptions step**
4. **Verify layout**:
   - ✅ Each assumption appears in its own card
   - ✅ Labels are above input fields
   - ✅ Input fields have percentage suffixes positioned correctly
   - ✅ Help text appears below inputs
   - ✅ No overlapping elements
   - ✅ Responsive design works on different screen sizes

## 📊 Layout Validation Checklist

- [ ] **No overlapping elements** in Global Assumptions section
- [ ] **Proper vertical stacking** within each assumption card
- [ ] **Input suffixes positioned correctly** (% sign at right edge)
- [ ] **Help text displays below inputs** without conflicts
- [ ] **Responsive grid layout** works on mobile and desktop
- [ ] **Professional card design** with proper spacing and borders
- [ ] **CSS syntax errors resolved** (no compilation issues)

## 🎨 Design System Consistency

The fixes maintain consistency with the existing app design:

- **Color Scheme**: Uses existing app colors (#f8f9fa, #6c757d, etc.)
- **Border Radius**: Consistent 8px for cards, 4px for inputs
- **Typography**: Matches existing font sizes and weights
- **Spacing**: Uses consistent rem-based spacing units

## 🔧 Technical Notes

- **Grid System**: Uses CSS Grid with `auto-fit` and `minmax()` for responsive design
- **Flexbox**: Uses column direction for vertical stacking within cards
- **Box Model**: Ensures `box-sizing: border-box` for predictable sizing
- **Z-Index**: Suffix positioning uses `absolute` positioning within `relative` containers

This fix resolves the overlapping issue while maintaining a professional, responsive design that integrates seamlessly with the existing app styling.
