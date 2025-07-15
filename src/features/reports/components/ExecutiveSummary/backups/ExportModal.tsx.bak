import React, { useState, useEffect } from 'react';
import { 
  expandAllSections, 
  restoreSectionStates, 
  extractAllTabsContentWithCharts,
  transformContentForSlides,
  getLayoutConfig,
  debugTabVisibility,
  debugContentExtraction,
  debugSectionStates 
} from '../utils/exportUtils';
// Import export generators
import { generatePDF } from '../utils/pdfGenerator';
import { generatePPTX } from '../utils/pptxGenerator';

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
  slides?: SlideData[];
  setExportMode?: (mode: boolean) => void;
  expandAllSections?: () => void;
  restoreSectionStates?: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, slides: initialSlides, setExportMode, expandAllSections: expandAllSectionsProp, restoreSectionStates: restoreSectionStatesProp }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [slideLayout, setSlideLayout] = useState('standard');
  const [slides, setSlides] = useState<SlideData[]>(initialSlides || []);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [originalSlides, setOriginalSlides] = useState<SlideData[]>([]);

  // Extract content when modal opens
  useEffect(() => {
    if (isOpen && slides.length === 0) {
      loadSlideContent();
    }
  }, [isOpen]);

  const loadSlideContent = async () => {
    setIsLoadingPreview(true);
    try {
      // Enable export mode in parent component to render all tabs
      if (setExportMode) {
        setExportMode(true);
      }
      
      // Wait for React to render all tabs
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Debug before expansion
      console.log('Before expansion:');
      debugTabVisibility();
      debugSectionStates();
      
      // Expand all sections using React state (preferred) or DOM manipulation
      if (expandAllSectionsProp) {
        console.log('Using React state to expand sections...');
        expandAllSectionsProp();
      } else {
        console.log('Using DOM manipulation to expand sections...');
        expandAllSections();
      }
      
      // Wait longer for React to re-render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Debug after expansion
      console.log('After expansion:');
      debugSectionStates();
      
      // Force a re-render by triggering a resize event
      window.dispatchEvent(new Event('resize'));
      
      // Wait a bit more
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Debug after expansion
      console.log('After all preparations:');
      debugTabVisibility();
      debugContentExtraction();
      
      // Extract content from all tabs
      const extractedSlides = await extractAllTabsContentWithCharts();
      console.log('Extracted slides:', extractedSlides);
      
      // Transform content for slides
      const transformedSlides = transformContentForSlides(extractedSlides);
      console.log('Transformed slides:', transformedSlides);
      
      setSlides(transformedSlides);
      setOriginalSlides(JSON.parse(JSON.stringify(transformedSlides))); // Deep copy
      
      // Restore original section states
      if (restoreSectionStatesProp) {
        console.log('Using React state to restore sections...');
        restoreSectionStatesProp();
      } else {
        console.log('Using DOM manipulation to restore sections...');
        restoreSectionStates();
      }
      
      // Disable export mode
      if (setExportMode) {
        setExportMode(false);
      }
      
    } catch (error) {
      console.error('Failed to load slide content:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      let result: ExportResult;
      
      if (exportFormat === 'pdf') {
        result = await generatePDF(slides, slideLayout);
      } else {
        result = await generatePPTX(slides, slideLayout);
      }
      
      if (result.success) {
        // Also call the parent onExport for any additional handling
        await onExport(exportFormat, slideLayout);
        
        // Show success message
        alert(`✅ ${exportFormat.toUpperCase()} exported successfully as ${result.filename}`);
        onClose(); // Close modal on success
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Content editing handlers
  const handleSlideContentChange = (slideIndex: number, field: string, value: string) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      if (field === 'title') {
        newSlides[slideIndex] = { ...newSlides[slideIndex], title: value };
      }
      return newSlides;
    });
  };

  const handleBulletChange = (slideIndex: number, bulletIndex: number, value: string) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const newContent = [...newSlides[slideIndex].content];
      newContent[bulletIndex] = value;
      newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent };
      return newSlides;
    });
  };

  const handleAddBullet = (slideIndex: number) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const newContent = [...newSlides[slideIndex].content, 'New bullet point'];
      newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent };
      return newSlides;
    });
  };

  const handleRemoveBullet = (slideIndex: number, bulletIndex: number) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const newContent = newSlides[slideIndex].content.filter((_, index) => index !== bulletIndex);
      newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent };
      return newSlides;
    });
  };

  const handleResetSlideContent = (slideIndex: number) => {
    if (originalSlides[slideIndex]) {
      setSlides(prevSlides => {
        const newSlides = [...prevSlides];
        newSlides[slideIndex] = JSON.parse(JSON.stringify(originalSlides[slideIndex]));
        return newSlides;
      });
    }
  };

  // Slide Preview Component
  const SlidePreview: React.FC<{ slide: SlideData; layout: string }> = ({ slide, layout }) => {
    const config = getLayoutConfig(layout);
    const aspectRatio = config.aspectRatio;
    
    return (
      <div 
        style={{
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          aspectRatio: aspectRatio,
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '0.75rem',
          lineHeight: '1.2'
        }}
      >
        {/* Slide Title */}
        <h3 style={{ 
          margin: '0 0 0.75rem 0', 
          fontSize: '1rem', 
          fontWeight: '600',
          color: '#1f2937',
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '0.25rem'
        }}>
          {slide.title}
        </h3>
        
        {/* Slide Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* KPI Cards Preview */}
          {slide.kpiCards && slide.kpiCards.length > 0 && (
            <div style={{ 
              backgroundColor: '#e3f2fd', 
              padding: '0.5rem', 
              borderRadius: '4px',
              marginBottom: '0.5rem',
              textAlign: 'center',
              fontSize: '0.6rem',
              color: '#1976d2'
            }}>
              💳 {slide.kpiCards.length} KPI Card{slide.kpiCards.length > 1 ? 's' : ''} (Visual)
            </div>
          )}
          
          {/* Styled Sections Preview */}
          {slide.styledSections && slide.styledSections.length > 0 && (
            <div style={{ 
              backgroundColor: '#f3e5f5', 
              padding: '0.5rem', 
              borderRadius: '4px',
              marginBottom: '0.5rem',
              textAlign: 'center',
              fontSize: '0.6rem',
              color: '#7b1fa2'
            }}>
              🎨 {slide.styledSections.length} Styled Section{slide.styledSections.length > 1 ? 's' : ''}
            </div>
          )}
          
          {/* Text Content */}
          {slide.content.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              {slide.content.slice(0, 6).map((text, index) => (
                <div key={index} style={{ 
                  marginBottom: '0.25rem',
                  fontSize: '0.7rem',
                  lineHeight: '1.1'
                }}>
                  {slide.id === 'executive-commentary' ? '' : '• '}{text.length > 60 ? text.substring(0, 57) + '...' : text}
                </div>
              ))}
            </div>
          )}
          
          {/* Charts */}
          {slide.charts && slide.charts.length > 0 && (
            <div style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '0.5rem', 
              borderRadius: '4px',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.6rem', color: '#6b7280' }}>
                📊 {slide.charts.length} Chart{slide.charts.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          {/* Tables */}
          {slide.tables && slide.tables.length > 0 && (
            <div style={{ fontSize: '0.6rem' }}>
              {slide.tables.slice(0, 1).map((table, index) => (
                <div key={index} style={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '0.25rem',
                  marginBottom: '0.25rem'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {table.caption}
                  </div>
                  {table.headers.length > 0 && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: `repeat(${Math.min(table.headers.length, 3)}, 1fr)`,
                      gap: '0.125rem',
                      fontSize: '0.5rem'
                    }}>
                      {table.headers.slice(0, 3).map((header, i) => (
                        <div key={i} style={{ fontWeight: '600', padding: '0.125rem' }}>
                          {header}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Slide Number */}
        <div style={{ 
          textAlign: 'right', 
          fontSize: '0.6rem', 
          color: '#9ca3af',
          marginTop: '0.5rem'
        }}>
          Slide {slides.indexOf(slide) + 1}
        </div>
      </div>
    );
  };

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
          {/* Export Options */}
          <div 
            className="export-options"
            style={{ marginBottom: '1.5rem' }}
          >
            <div 
              className="option-group"
              style={{ marginBottom: '1rem' }}
            >
              <label 
                className="option-label"
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}
              >Export Format</label>
              <div 
                className="format-buttons"
                style={{ display: 'flex', gap: '0.5rem' }}
              >
                <button
                  onClick={() => setExportFormat('pdf')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: `2px solid ${exportFormat === 'pdf' ? '#3b82f6' : '#d1d5db'}`,
                    backgroundColor: exportFormat === 'pdf' ? '#eff6ff' : 'white',
                    color: exportFormat === 'pdf' ? '#1d4ed8' : '#374151',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => setExportFormat('pptx')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: `2px solid ${exportFormat === 'pptx' ? '#3b82f6' : '#d1d5db'}`,
                    backgroundColor: exportFormat === 'pptx' ? '#eff6ff' : 'white',
                    color: exportFormat === 'pptx' ? '#1d4ed8' : '#374151',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  title="Exports as native PowerPoint (.pptx) file"
                >
                  📊 PowerPoint
                </button>
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.5rem',
                fontStyle: 'italic'
              }}>
                💡 PDF exports directly. PowerPoint exports as native .pptx files that open directly in PowerPoint.
              </div>
            </div>
            
            <div className="option-group">
              <label 
                className="option-label"
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}
              >Slide Layout</label>
              <select 
                value={slideLayout}
                onChange={(e) => setSlideLayout(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="standard">Standard (16:9)</option>
                <option value="widescreen">Widescreen (16:10)</option>
                <option value="traditional">Traditional (4:3)</option>
              </select>
            </div>
          </div>

          {/* Slide Previews */}
          {isLoadingPreview ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                ⏳ Generating slide previews...
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Extracting content from Executive Summary tabs
              </div>
            </div>
          ) : slides.length > 0 ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '0.875rem', 
                fontWeight: '600',
                color: '#374151'
              }}>Slide Previews ({slides.length} slides):</h3>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                {slides.map((slide, index) => (
                  <div 
                    key={slide.id}
                    onClick={() => setSelectedSlideIndex(index)}
                    style={{
                      cursor: 'pointer',
                      opacity: selectedSlideIndex === index ? 1 : 0.7,
                      transform: selectedSlideIndex === index ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <SlidePreview slide={slide} layout={slideLayout} />
                  </div>
                ))}
              </div>
              
              {selectedSlideIndex < slides.length && (
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <strong>Selected:</strong> {slides[selectedSlideIndex].title}
                  <div style={{ marginTop: '0.25rem', color: '#6b7280' }}>
                    {slides[selectedSlideIndex].content.length} bullet points, {' '}
                    {slides[selectedSlideIndex].charts?.length || 0} charts, {' '}
                    {slides[selectedSlideIndex].tables?.length || 0} tables
                  </div>
                </div>
              )}
              
              {/* Content Editor */}
              {selectedSlideIndex < slides.length && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Edit Slide Content
                    </h4>
                    <button
                      onClick={() => handleResetSlideContent(selectedSlideIndex)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* Title Editor */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Slide Title:
                    </label>
                    <input
                      type="text"
                      value={slides[selectedSlideIndex].title}
                      onChange={(e) => handleSlideContentChange(selectedSlideIndex, 'title', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  {/* Content Bullets Editor */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Bullet Points:
                    </label>
                    {slides[selectedSlideIndex].content.map((bullet, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        gap: '0.5rem'
                      }}>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => handleBulletChange(selectedSlideIndex, index, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.375rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem'
                          }}
                        />
                        <button
                          onClick={() => handleRemoveBullet(selectedSlideIndex, index)}
                          style={{
                            padding: '0.375rem',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: '#dc2626'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddBullet(selectedSlideIndex)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#1d4ed8'
                      }}
                    >
                      + Add Bullet Point
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              No content available for preview. Please ensure the Executive Summary has data.
            </div>
          )}

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
                🔄 Processing Export...
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {exportFormat === 'pdf' ? 'Generating PDF slides' : 'Creating PowerPoint presentation'}
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
              <>⏳ Processing...</>
            ) : (
              <>📁 Export as {exportFormat.toUpperCase()}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;