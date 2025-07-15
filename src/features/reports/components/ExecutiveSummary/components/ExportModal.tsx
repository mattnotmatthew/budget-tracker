import React, { useState, useEffect } from 'react';
import { 
  expandAllSections, 
  restoreSectionStates, 
  extractAllTabsContentWithCharts,
  transformContentForSlides
} from '../utils/exportUtilsNew';
// Import export generator
import { generatePPTX } from '../utils/pptxGeneratorNew';

// TypeScript interfaces for export functionality
export interface SlideData {
  id: string;
  title: string;
  content: string[];
  charts?: string[]; // Base64 encoded chart images
  kpiCards?: string[]; // KPI card images
  kpiLayout?: 'full' | 'half' | 'third' | 'quarter';
  styledSections?: { type: string, image: string }[]; // Other styled sections
  tables?: TableData[];
  metadata?: {
    tabId: string;
    tabLabel: string;
    extractedAt: string;
  };
}

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'pptx';
  layout: 'standard' | 'widescreen' | 'traditional';
  aspectRatio: '16:9' | '16:10' | '4:3';
  includeCharts: boolean;
  simplifyTables: boolean;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  downloadUrl?: string;
}

// ExportModal component following how-to guide pattern
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, layout: string) => Promise<ExportResult>;
  setExportMode?: (mode: boolean) => void;
  expandAllSections?: () => void;
  restoreSectionStates?: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, setExportMode, expandAllSections: expandAllSectionsProp, restoreSectionStates: restoreSectionStatesProp }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const slideLayout = 'standard'; // Fixed to 16:9
  // Removed slides state - content extracted on export

  // Removed pre-loading - content will be extracted when export is triggered

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      // Enable export mode to render all tabs
      if (setExportMode) {
        setExportMode(true);
      }
      
      // Wait for React to render all tabs
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Expand all sections
      if (expandAllSectionsProp) {
        expandAllSectionsProp();
      } else {
        expandAllSections();
      }
      
      // Wait for sections to expand
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Extract content from all tabs
      const extractedSlides = await extractAllTabsContentWithCharts();
      console.log('Extracted slides:', extractedSlides);
      
      // Transform content for slides
      const transformedSlides = transformContentForSlides(extractedSlides);
      console.log('Transformed slides:', transformedSlides);
      
      // Generate PowerPoint
      const result = await generatePPTX(transformedSlides, slideLayout);
      
      // Restore original section states
      if (restoreSectionStatesProp) {
        restoreSectionStatesProp();
      } else {
        restoreSectionStates();
      }
      
      // Disable export mode
      if (setExportMode) {
        setExportMode(false);
      }
      
      if (result.success) {
        // Show success message
        alert(`✅ PowerPoint exported successfully as ${result.filename}`);
        onClose(); // Close modal on success
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Make sure to restore UI state on error
      if (setExportMode) {
        setExportMode(false);
      }
      if (restoreSectionStatesProp) {
        restoreSectionStatesProp();
      } else {
        restoreSectionStates();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed content editing handlers and slide preview - direct export only

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen && setExportMode) {
      setExportMode(false);
    }
  }, [isOpen, setExportMode]);

  if (!isOpen) return null;

  return (
    <div 
      className="export-modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        className="export-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div 
          className="export-modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '1rem'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Export to Slides</h2>
          <button 
            onClick={onClose} 
            className="export-modal-close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              color: '#6b7280'
            }}
          >×</button>
        </div>

        <div className="export-modal-body">
          {/* Export Options - Simplified */}
          <div 
            className="export-info"
            style={{ 
              marginBottom: '1.5rem',
              backgroundColor: '#f0f9ff',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #bae6fd'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              <h3 style={{ 
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#0369a1'
              }}>
                PowerPoint Export
              </h3>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#0c4a6e'
            }}>
              Export your Executive Summary as a professional PowerPoint presentation with all charts and visuals included.
            </p>
          </div>

          {/* What will be exported */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              margin: '0 0 0.75rem 0', 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: '#374151'
            }}>What will be exported:</h3>
            
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              fontSize: '0.75rem',
              color: '#4b5563',
              lineHeight: '1.6'
            }}>
              <li>Executive Commentary - Your strategic analysis and insights</li>
              <li>Overall Budget - KPI cards showing key metrics</li>
              <li>Budget Visuals - Charts and trend analyses</li>
              <li>Resource Spend - Department and team allocations</li>
              <li>Vendor Info - Vendor spending and portfolio metrics</li>
              <li>Resource Allocation - Headcount and efficiency metrics</li>
            </ul>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#1d4ed8', marginBottom: '0.5rem' }}>
                🔄 Generating PowerPoint Presentation
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                <div>✓ Extracting content from all tabs</div>
                <div>✓ Capturing KPI cards and charts as images</div>
                <div>→ Creating professional slides...</div>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                marginTop: '0.5rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '60%',
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px',
                  animation: 'pulse 2s infinite'
                }} />
              </div>
            </div>
          )}

          {/* Content Transformation Tips */}
          <div 
            className="transformation-tips"
            style={{
              backgroundColor: '#f0f9ff',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: '#0369a1'
            }}>Content will be optimized for slides:</h3>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1rem',
              fontSize: '0.75rem',
              color: '#0c4a6e'
            }}>
              <li>✓ Long paragraphs → Bullet points</li>
              <li>✓ Dense tables → Simplified charts</li>
              <li>✓ Multiple columns → Single focus</li>
              <li>✓ Small text → Larger, readable fonts</li>
            </ul>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              backgroundColor: isProcessing ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isProcessing ? (
              <>⏳ Generating PowerPoint...</>
            ) : (
              <>📊 Export to PowerPoint</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;