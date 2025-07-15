/**
 * Example: Migrating VendorManagement to use DataExportService
 * This shows how to replace the old export functions with the new unified service
 */

import React from 'react';
import { dataExportService } from './DataExportService';
// Or use adapters for easier migration:
import { exportVendorBudgetCSV, exportToExcel } from './exportAdapters';

// Example component showing the migration
const VendorManagementExample: React.FC = () => {
  // Sample vendor data
  const vendorData = [
    {
      id: '1',
      vendorName: 'Acme Corp',
      vendorCategory: 'Software',
      vendorTeam: 'Engineering',
      budget: 50000,
      status: 'Active',
      contractStart: '2024-01-01',
      contractEnd: '2024-12-31',
      paymentTerms: 'Net 30'
    }
    // ... more vendors
  ];

  // ============================================
  // OPTION 1: Direct DataExportService Usage
  // ============================================
  
  const handleExportCSVDirect = async () => {
    // Transform your data to the export format
    const exportData = {
      title: 'Vendor Budget Report',
      tables: [{
        headers: [
          'Vendor Name',
          'Category', 
          'Team',
          'Budget',
          'Status',
          'Contract Start',
          'Contract End',
          'Payment Terms'
        ],
        rows: vendorData.map(vendor => [
          vendor.vendorName,
          vendor.vendorCategory,
          vendor.vendorTeam,
          vendor.budget,
          vendor.status,
          vendor.contractStart,
          vendor.contractEnd,
          vendor.paymentTerms
        ])
      }]
    };

    // Export using the service
    await dataExportService.export(exportData, {
      format: 'csv',
      filename: 'vendor-budget',
      includeTimestamp: true
    });
  };

  // ============================================
  // OPTION 2: Using Adapters (Easier Migration)
  // ============================================
  
  const handleExportCSVAdapter = async () => {
    // Use the adapter which maintains the original function signature
    await exportVendorBudgetCSV(
      vendorData,
      {}, // filters
      'vendorName', // sortField
      'asc' // sortDirection
    );
  };

  // ============================================
  // NEW FEATURE: Excel Export
  // ============================================
  
  const handleExportExcel = async () => {
    await exportToExcel({
      title: 'Vendor Budget Report',
      tables: [{
        headers: ['Vendor Name', 'Category', 'Budget', 'Status'],
        rows: vendorData.map(v => [
          v.vendorName,
          v.vendorCategory,
          v.budget,
          v.status
        ])
      }]
    }, 'vendor-budget');
  };

  // ============================================
  // ADVANCED: Multi-format Export Menu
  // ============================================
  
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = {
      title: `Vendor Report - ${new Date().getFullYear()}`,
      content: [
        `Total Vendors: ${vendorData.length}`,
        `Total Budget: $${vendorData.reduce((sum, v) => sum + v.budget, 0).toLocaleString()}`,
        `Active Vendors: ${vendorData.filter(v => v.status === 'Active').length}`
      ],
      tables: [{
        headers: ['Vendor Name', 'Category', 'Budget', 'Status'],
        rows: vendorData.map(v => [
          v.vendorName,
          v.vendorCategory,
          v.budget,
          v.status
        ])
      }]
    };

    await dataExportService.export(exportData, {
      format,
      filename: 'vendor-report',
      includeTimestamp: true
    });
  };

  // ============================================
  // UI Example
  // ============================================
  
  return (
    <div className="vendor-management">
      <h2>Vendor Management</h2>
      
      {/* Old export button - single format */}
      <button onClick={handleExportCSVAdapter}>
        📊 Export to CSV (Legacy)
      </button>

      {/* New export menu - multiple formats */}
      <div className="export-menu">
        <button onClick={() => handleExport('csv')}>
          📊 Export CSV
        </button>
        <button onClick={() => handleExport('excel')}>
          📊 Export Excel
        </button>
        <button onClick={() => handleExport('pdf')}>
          📊 Export PDF
        </button>
      </div>

      {/* Your existing table component */}
      <table className="vendor-table">
        {/* ... */}
      </table>
    </div>
  );
};

// ============================================
// Migration Checklist for VendorManagement
// ============================================

/*
1. ✅ Import the new service or adapters
2. ✅ Replace exportBudgetToCSV with new implementation
3. ✅ Replace exportMonthlyToCSV with new implementation  
4. ✅ Remove escapeCSVField function (now in service)
5. ✅ Remove downloadCSV function (now in service)
6. ✅ Add Excel export feature (bonus!)
7. ✅ Test all export formats
8. ✅ Remove old export code
*/

export default VendorManagementExample;