import React, { useState, useEffect } from "react";
import "./ExportCustomizer.css";

interface ExportTemplate {
  name: string;
  styles: {
    bodyFont: string;
    titleColor: string;
    titleSize: string;
    headingColor: string;
    headingSize: string;
    backgroundColor: string;
    slideBackground: string;
    borderColor: string;
    fontSize: string;
    lineHeight: string;
  };
  layout: {
    includeTitle: boolean;
    includeCommentary: boolean;
    includeKPIs: boolean;
    includeResourceAllocation: boolean;
    includeChart: boolean;
  };
}

const defaultTemplate: ExportTemplate = {
  name: "Default Professional",
  styles: {
    bodyFont: "Arial, sans-serif",
    titleColor: "#2563eb",
    titleSize: "36px",
    headingColor: "#2563eb",
    headingSize: "28px",
    backgroundColor: "#ffffff",
    slideBackground: "#ffffff",
    borderColor: "#2563eb",
    fontSize: "16px",
    lineHeight: "1.6",
  },
  layout: {
    includeTitle: true,
    includeCommentary: true,
    includeKPIs: true,
    includeResourceAllocation: true,
    includeChart: true,
  },
};

const predefinedTemplates: ExportTemplate[] = [
  defaultTemplate,
  {
    name: "Corporate Blue",
    styles: {
      bodyFont: "Segoe UI, sans-serif",
      titleColor: "#1e40af",
      titleSize: "42px",
      headingColor: "#1e40af",
      headingSize: "30px",
      backgroundColor: "#f8fafc",
      slideBackground: "#ffffff",
      borderColor: "#1e40af",
      fontSize: "18px",
      lineHeight: "1.7",
    },
    layout: {
      includeTitle: true,
      includeCommentary: true,
      includeKPIs: true,
      includeResourceAllocation: true,
      includeChart: true,
    },
  },
  {
    name: "Minimalist",
    styles: {
      bodyFont: "Helvetica, sans-serif",
      titleColor: "#374151",
      titleSize: "32px",
      headingColor: "#374151",
      headingSize: "24px",
      backgroundColor: "#ffffff",
      slideBackground: "#ffffff",
      borderColor: "#d1d5db",
      fontSize: "14px",
      lineHeight: "1.5",
    },
    layout: {
      includeTitle: true,
      includeCommentary: true,
      includeKPIs: true,
      includeResourceAllocation: true,
      includeChart: true,
    },
  },
  {
    name: "Executive Summary Only",
    styles: {
      bodyFont: "Times New Roman, serif",
      titleColor: "#991b1b",
      titleSize: "40px",
      headingColor: "#991b1b",
      headingSize: "26px",
      backgroundColor: "#ffffff",
      slideBackground: "#ffffff",
      borderColor: "#991b1b",
      fontSize: "16px",
      lineHeight: "1.8",
    },
    layout: {
      includeTitle: true,
      includeCommentary: true,
      includeKPIs: false,
      includeResourceAllocation: false,
      includeChart: true,
    },
  },
  {
    name: "Web Style PowerPoint",
    styles: {
      bodyFont: "Segoe UI, Arial, sans-serif",
      titleColor: "#2d3a4a",
      titleSize: "32px",
      headingColor: "#2d3a4a",
      headingSize: "24px",
      backgroundColor: "#ffffff",
      slideBackground: "#ffffff",
      borderColor: "#e1e8ed",
      fontSize: "16px",
      lineHeight: "1.6",
    },
    layout: {
      includeTitle: true,
      includeCommentary: true,
      includeKPIs: true,
      includeResourceAllocation: true,
      includeChart: true,
    },
  },
];

interface ExportCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: ExportTemplate) => void;
}

const ExportCustomizer: React.FC<ExportCustomizerProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const [currentTemplate, setCurrentTemplate] =
    useState<ExportTemplate>(defaultTemplate);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Load saved template from localStorage
    const savedTemplate = localStorage.getItem("exportCustomTemplate");
    if (savedTemplate) {
      try {
        setCurrentTemplate(JSON.parse(savedTemplate));
      } catch (e) {
        console.warn("Could not load saved template");
      }
    }
  }, []);

  const saveTemplate = () => {
    localStorage.setItem(
      "exportCustomTemplate",
      JSON.stringify(currentTemplate)
    );
    alert("Template saved successfully!");
  };

  const applyTemplate = () => {
    localStorage.setItem(
      "exportCustomTemplate",
      JSON.stringify(currentTemplate)
    );
    onApplyTemplate(currentTemplate);
    onClose();
  };

  const loadPredefinedTemplate = (template: ExportTemplate) => {
    setCurrentTemplate({ ...template });
  };

  const updateStyles = (key: string, value: string) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      styles: {
        ...prev.styles,
        [key]: value,
      },
    }));
  };

  const updateLayout = (key: string, value: boolean | number) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [key]: value,
      },
    }));
  };

  const generatePreviewCSS = () => {
    const { styles } = currentTemplate;
    return `
      body { font-family: ${styles.bodyFont}; background-color: ${styles.backgroundColor}; }
      .slide { background-color: ${styles.slideBackground}; }
      h1 { color: ${styles.titleColor}; font-size: ${styles.titleSize}; }
      h2 { color: ${styles.headingColor}; font-size: ${styles.headingSize}; }
      .kpi-list li { font-size: ${styles.fontSize}; }
      .commentary { font-size: ${styles.fontSize}; line-height: ${styles.lineHeight}; }
      .variance-item { border-left-color: ${styles.borderColor}; }
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="export-customizer-overlay">
      <div className="export-customizer-modal">
        <div className="export-customizer-header">
          <h2>Customize Export Template</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="export-customizer-content">
          <div className="customizer-tabs">
            <button
              className={!previewMode ? "tab active" : "tab"}
              onClick={() => setPreviewMode(false)}
            >
              ✏️ Edit Template
            </button>
            <button
              className={previewMode ? "tab active" : "tab"}
              onClick={() => setPreviewMode(true)}
            >
              👁️ Preview
            </button>
          </div>

          {!previewMode ? (
            <div className="customizer-editor">
              {/* Predefined Templates */}
              <div className="section">
                <h3>📋 Quick Templates</h3>
                <div className="template-grid">
                  {predefinedTemplates.map((template, index) => (
                    <button
                      key={index}
                      className="template-button"
                      onClick={() => loadPredefinedTemplate(template)}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Styling Options */}
              <div className="section">
                <h3>🎨 Styling</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Font Family:</label>
                    <select
                      value={currentTemplate.styles.bodyFont}
                      onChange={(e) => updateStyles("bodyFont", e.target.value)}
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Segoe UI, sans-serif">Segoe UI</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="Times New Roman, serif">
                        Times New Roman
                      </option>
                      <option value="Calibri, sans-serif">Calibri</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title Color:</label>
                    <input
                      type="color"
                      value={currentTemplate.styles.titleColor}
                      onChange={(e) =>
                        updateStyles("titleColor", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Title Size:</label>
                    <input
                      type="range"
                      min="24"
                      max="60"
                      value={parseInt(currentTemplate.styles.titleSize)}
                      onChange={(e) =>
                        updateStyles("titleSize", e.target.value + "px")
                      }
                    />
                    <span>{currentTemplate.styles.titleSize}</span>
                  </div>{" "}
                  <div className="form-group">
                    <label>Heading Color:</label>
                    <input
                      type="color"
                      value={currentTemplate.styles.headingColor}
                      onChange={(e) =>
                        updateStyles("headingColor", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Heading Size:</label>
                    <input
                      type="range"
                      min="18"
                      max="40"
                      value={parseInt(currentTemplate.styles.headingSize)}
                      onChange={(e) =>
                        updateStyles("headingSize", e.target.value + "px")
                      }
                    />
                    <span>{currentTemplate.styles.headingSize}</span>
                  </div>
                  <div className="form-group">
                    <label>Background Color:</label>
                    <input
                      type="color"
                      value={currentTemplate.styles.backgroundColor}
                      onChange={(e) =>
                        updateStyles("backgroundColor", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Border/Accent Color:</label>
                    <input
                      type="color"
                      value={currentTemplate.styles.borderColor}
                      onChange={(e) =>
                        updateStyles("borderColor", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Layout Options */}
              <div className="section">
                <h3>📑 Layout & Content</h3>
                <div className="form-grid">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentTemplate.layout.includeTitle}
                        onChange={(e) =>
                          updateLayout("includeTitle", e.target.checked)
                        }
                      />
                      Include Title Slide
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentTemplate.layout.includeCommentary}
                        onChange={(e) =>
                          updateLayout("includeCommentary", e.target.checked)
                        }
                      />
                      Include Executive Commentary
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentTemplate.layout.includeKPIs}
                        onChange={(e) =>
                          updateLayout("includeKPIs", e.target.checked)
                        }
                      />
                      Include KPIs
                    </label>
                  </div>{" "}
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          currentTemplate.layout.includeResourceAllocation
                        }
                        onChange={(e) =>
                          updateLayout(
                            "includeResourceAllocation",
                            e.target.checked
                          )
                        }
                      />
                      Include Resource Allocation & Hiring Capacity
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentTemplate.layout.includeChart}
                        onChange={(e) =>
                          updateLayout("includeChart", e.target.checked)
                        }
                      />
                      Include Trend Chart
                    </label>
                  </div>{" "}
                </div>
              </div>
            </div>
          ) : (
            <div className="customizer-preview">
              <h3>Preview</h3>
              <div className="preview-content">
                <style>{generatePreviewCSS()}</style>
                <div className="slide preview-slide">
                  <h1>Executive Summary Preview</h1>
                  <h2>Sample Section Header</h2>
                  <div className="kpi-list">
                    <div>• Sample KPI: $1,234,567</div>
                    <div>• Another Metric: 85.5%</div>
                  </div>
                  <div className="variance-item">
                    <h3>Sample Variance Item</h3>
                    <p>This shows how variance items will appear</p>
                  </div>
                  <div className="commentary">
                    Sample commentary text that demonstrates the font size and
                    line spacing settings.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="export-customizer-footer">
          <button className="secondary-button" onClick={saveTemplate}>
            💾 Save Template
          </button>{" "}
          <button className="primary-button" onClick={applyTemplate}>
            🖨️ Export & Print to PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportCustomizer;
