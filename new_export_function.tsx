// Updated handlePowerPointExport function for ExecutiveSummary.tsx
// This function should replace the existing handlePowerPointExport function

const handlePowerPointExport = async (customTemplate?: any) => {
  try {
    // Get template from parameter, localStorage, or use default
    const template = customTemplate ||
      currentExportTemplate ||
      JSON.parse(localStorage.getItem("exportCustomTemplate") || "null") || {
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
          includeVariances: true,
          includeChart: true,
          varianceLimit: 6,
        },
      };

    // Create HTML content for PowerPoint import using the template
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Executive Summary - ${state.selectedYear}</title>
    <style>
        body { 
          font-family: ${template.styles.bodyFont}; 
          margin: 20px; 
          background-color: ${template.styles.backgroundColor};
        }
        .slide { 
          page-break-after: always; 
          margin-bottom: 40px; 
          padding: 20px; 
          background-color: ${template.styles.slideBackground};
        }
        .slide:last-child { page-break-after: auto; }
        h1 { 
          color: ${template.styles.titleColor}; 
          font-size: ${template.styles.titleSize}; 
          text-align: center; 
          margin-bottom: 30px; 
        }
        h2 { 
          color: ${template.styles.headingColor}; 
          font-size: ${template.styles.headingSize}; 
          margin-bottom: 20px; 
        }
        h3 { color: #333; font-size: 20px; margin-bottom: 15px; }
        .kpi-list { list-style: none; padding: 0; }
        .kpi-list li { 
          margin: 10px 0; 
          font-size: ${template.styles.fontSize}; 
        }
        .variance-item { 
          margin: 15px 0; 
          padding: 10px; 
          background: #f8f9fa; 
          border-left: 4px solid ${template.styles.borderColor}; 
        }
        .commentary { 
          font-size: ${template.styles.fontSize}; 
          line-height: ${template.styles.lineHeight}; 
          white-space: pre-wrap; 
        }
        .date { color: #666; font-size: 16px; text-align: center; }
    </style>
</head>
<body>`;

    // Slide 1: Title (conditional)
    if (template.layout.includeTitle) {
      htmlContent += `
    <!-- Slide 1: Title -->
    <div class="slide">
        <h1>Executive Summary</h1>
        <p class="date">${state.selectedYear}${
        state.selectedQuarter ? ` Q${state.selectedQuarter}` : ""
      }</p>
        <p class="date">${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}</p>
    </div>
`;
    }

    // Slide 2: Executive Commentary (conditional)
    if (template.layout.includeCommentary && userNotes.trim()) {
      htmlContent += `
    <!-- Slide 2: Executive Commentary -->
    <div class="slide">
        <h2>Executive Commentary</h2>
        <div class="commentary">${userNotes}</div>
    </div>
`;
    }

    // Slide 3: Key Performance Indicators (conditional)
    if (template.layout.includeKPIs) {
      htmlContent += `
    <!-- Slide 3: Key Performance Indicators -->
    <div class="slide">
        <h2>Key Performance Indicators</h2>
        <ul class="kpi-list">
            <li><strong>YTD Actual:</strong> ${formatCurrencyFull(
              kpis.ytdActual
            )}</li>
            <li><strong>YTD Budget:</strong> ${formatCurrencyFull(
              kpis.ytdBudget
            )}</li>
            <li><strong>YTD Variance:</strong> ${formatCurrencyFull(
              kpis.variance
            )} (${kpis.variancePct >= 0 ? "+" : ""}${kpis.variancePct.toFixed(
        1
      )}%)</li>
            <li><strong>Annual Budget Target:</strong> ${formatCurrencyFull(
              kpis.annualBudgetTarget
            )}</li>
            <li><strong>Budget Utilization:</strong> ${kpis.budgetUtilization.toFixed(
              1
            )}%</li>
            <li><strong>Full-Year Forecast:</strong> ${formatCurrencyFull(
              kpis.fullYearForecast
            )}</li>
            <li><strong>Monthly Burn Rate:</strong> ${formatCurrencyFull(
              kpis.burnRate
            )}</li>
            <li><strong>Months Remaining:</strong> ${kpis.monthsRemaining.toFixed(
              1
            )} months</li>
            <li><strong>Variance Trend:</strong> ${kpis.varianceTrend}</li>
        </ul>
    </div>
`;
    }

    // Slide 4: Top Variances (conditional)
    if (
      template.layout.includeVariances &&
      topVariance &&
      topVariance.length > 0
    ) {
      htmlContent += `
    <!-- Slide 4: Top Budget Variances -->
    <div class="slide">
        <h2>Top Budget Variances</h2>
`;
      topVariance
        .slice(0, template.layout.varianceLimit)
        .forEach((variance: any, index: number) => {
          const percentVariance =
            variance.budget !== 0
              ? ((variance.variance / variance.budget) * 100).toFixed(1)
              : "0.0";
          htmlContent += `
        <div class="variance-item">
            <h3>${index + 1}. ${variance.name}</h3>
            <p><strong>Budget:</strong> ${formatCurrencyFull(
              variance.budget
            )}</p>
            <p><strong>Actual:</strong> ${formatCurrencyFull(
              variance.actual
            )}</p>
            <p><strong>Variance:</strong> ${formatCurrencyFull(
              variance.variance
            )} (${percentVariance}%)</p>
        </div>
`;
        });
      htmlContent += `    </div>`;
    }

    // Try to capture and include the chart (conditional)
    if (template.layout.includeChart) {
      try {
        const chartElement = document.querySelector(
          ".trend-chart-section .recharts-wrapper"
        );
        if (chartElement) {
          const canvas = await html2canvas(chartElement as HTMLElement, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
          });

          const chartImage = canvas.toDataURL("image/png");

          htmlContent += `
    <!-- Slide 5: Budget vs Actual Chart -->
    <div class="slide">
        <h2>Budget vs Actual Trend</h2>
        <img src="${chartImage}" style="width: 100%; max-width: 800px; height: auto;" alt="Budget vs Actual Trend Chart"/>
    </div>
`;
        }
      } catch (chartError) {
        console.warn("Could not capture chart for export:", chartError);
        htmlContent += `
    <!-- Slide 5: Budget vs Actual Chart -->
    <div class="slide">
        <h2>Budget vs Actual Trend</h2>
        <p>Chart could not be captured. Please refer to the dashboard for the latest trend visualization.</p>
    </div>
`;
      }
    }

    htmlContent += `
</body>
</html>`;

    // Create and download the HTML file
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const fileName = `Executive_Summary_${state.selectedYear}${
      state.selectedQuarter ? `_Q${state.selectedQuarter}` : ""
    }_${new Date().toISOString().split("T")[0]}.html`;

    saveAs(blob, fileName);
    console.log("HTML export completed successfully");
  } catch (error) {
    console.error("Error exporting to HTML:", error);
    alert("Export failed. Please try again.");
  }
};

// Function to handle opening the export customizer
const handleCustomizeExport = () => {
  setShowExportCustomizer(true);
};

// Function to handle applying a template and exporting
const handleApplyTemplateAndExport = (template: any) => {
  setCurrentExportTemplate(template);
  handlePowerPointExport(template);
};
