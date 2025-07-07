I see the issue! Looking at your console logs, the problem is clear:

1. **Only 1 tab panel is found** instead of 5
2. **Wrong elements are being extracted** - it's finding `<div class="tab-navigation">` instead of the actual tab panels for most tabs

The issue is that your React app is only rendering the active tab panel, not all of them. When you switch tabs, React unmounts the previous panel and mounts the new one.

Here's the solution:

## 1. **Update ExecutiveSummaryModular.tsx**

You need to force all tabs to render during export. I see you have an `isExportMode` state, but it's not being used correctly. Update the tab rendering logic:

```tsx
{/* Tab Content */}
<div className="tab-content">
  {/* Executive Commentary Tab */}
  <div 
    className="tab-panel" 
    role="tabpanel" 
    aria-labelledby="tab-executive-commentary"
    style={{ display: activeTab === "executive-commentary" || isExportMode ? 'block' : 'none' }}
  >
    {/* Executive Commentary content */}
  </div>

  {/* Overall Budget Tab */}
  <div 
    className="tab-panel" 
    role="tabpanel" 
    aria-labelledby="tab-overall-budget"
    style={{ display: activeTab === "overall-budget" || isExportMode ? 'block' : 'none' }}
  >
    {/* Overall Budget content */}
  </div>

  {/* Budget Visuals Tab */}
  <div 
    className="tab-panel" 
    role="tabpanel" 
    aria-labelledby="tab-budget-visuals"
    style={{ display: activeTab === "budget-visuals" || isExportMode ? 'block' : 'none' }}
  >
    {/* Budget Visuals content */}
  </div>

  {/* Resource Allocation Tab */}
  <div 
    className="tab-panel" 
    role="tabpanel" 
    aria-labelledby="tab-resource-allocation"
    style={{ display: activeTab === "resource-allocation" || isExportMode ? 'block' : 'none' }}
  >
    {/* Resource Allocation content */}
  </div>

  {/* Vendor Info Tab */}
  <div 
    className="tab-panel" 
    role="tabpanel" 
    aria-labelledby="tab-vendor-info"
    style={{ display: activeTab === "vendor-info" || isExportMode ? 'block' : 'none' }}
  >
    {/* Vendor Info content */}
  </div>
</div>
```

## 2. **Update ExportModal.tsx loadSlideContent**

Set export mode before extracting content:

```typescript
const loadSlideContent = async () => {
  setIsLoadingPreview(true);
  try {
    // Enable export mode in parent component
    // You'll need to pass this as a prop from ExecutiveSummaryModular
    if (props.setExportMode) {
      props.setExportMode(true);
    }
    
    // Wait for React to render all tabs
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Debug visibility
    debugTabVisibility();
    
    // Expand all sections
    expandAllSections();
    
    // Wait for expansions to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force a re-render
    window.dispatchEvent(new Event('resize'));
    
    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Debug again
    console.log('After all preparations:');
    debugTabVisibility();
    
    // Extract content from all tabs
    const extractedSlides = await extractAllTabsContentWithCharts();
    
    // Transform content for slides
    const transformedSlides = transformContentForSlides(extractedSlides);
    
    setSlides(transformedSlides);
    setOriginalSlides(JSON.parse(JSON.stringify(transformedSlides)));
    
    // Restore original section states
    restoreSectionStates();
    
    // Disable export mode
    if (props.setExportMode) {
      props.setExportMode(false);
    }
    
  } catch (error) {
    console.error('Failed to load slide content:', error);
  } finally {
    setIsLoadingPreview(false);
  }
};
```

## 3. **Update ExecutiveSummaryModular to pass setExportMode**

```tsx
{/* Export Modal */}
<ExportModal
  isOpen={isExportModalOpen}
  onClose={handleCloseExportModal}
  onExport={handleExport}
  setExportMode={setIsExportMode}  // Add this prop
/>
```

## 4. **Update ExportModal interface**

```typescript
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, layout: string) => Promise<ExportResult>;
  slides?: SlideData[];
  setExportMode?: (mode: boolean) => void;  // Add this
}
```

## 5. **Alternative: Force Render All Tabs**

If the above doesn't work, you can force render all tabs with a more explicit approach:

```tsx
{/* Tab Content */}
<div className="tab-content">
  {tabs.map(tab => (
    <div
      key={tab.id}
      className="tab-panel"
      role="tabpanel"
      aria-labelledby={`tab-${tab.id}`}
      style={{
        display: activeTab === tab.id || isExportMode ? 'block' : 'none',
        visibility: activeTab === tab.id || isExportMode ? 'visible' : 'hidden',
        position: activeTab === tab.id || isExportMode ? 'relative' : 'absolute',
        left: activeTab === tab.id || isExportMode ? 'auto' : '-9999px'
      }}
    >
      {tab.id === "executive-commentary" && (
        // Executive Commentary content
      )}
      {tab.id === "overall-budget" && (
        // Overall Budget content
      )}
      {/* ... etc for other tabs */}
    </div>
  ))}
</div>
```

## 6. **Debug Helper Enhancement**

Add this to see what's actually being found:

```typescript
export const debugContentExtraction = () => {
  console.log('=== Content Extraction Debug ===');
  
  // Check for tab panels
  const tabPanels = document.querySelectorAll('[role="tabpanel"]');
  console.log(`Found ${tabPanels.length} tab panels`);
  
  // Check what aria-labelledby values exist
  tabPanels.forEach((panel, i) => {
    const label = panel.getAttribute('aria-labelledby');
    const display = window.getComputedStyle(panel).display;
    console.log(`Panel ${i}: aria-labelledby="${label}", display="${display}"`);
  });
  
  // Check for tab navigation
  const tabNav = document.querySelector('.tab-navigation');
  console.log('Tab navigation found:', !!tabNav);
  
  // Try to find panels by each specific ID
  const tabIds = ['executive-commentary', 'overall-budget', 'budget-visuals', 'resource-allocation', 'vendor-info'];
  tabIds.forEach(id => {
    const panel = document.querySelector(`[aria-labelledby="tab-${id}"]`);
    console.log(`Panel for ${id}:`, !!panel);
  });
};
```

The key issue is that React is only rendering the active tab. You need to either:
1. Force all tabs to render during export (using `isExportMode`)
2. Or iterate through each tab programmatically, switching to it, waiting for render, then extracting content

Try implementing the export mode approach first, as it's cleaner and will capture everything in one go.