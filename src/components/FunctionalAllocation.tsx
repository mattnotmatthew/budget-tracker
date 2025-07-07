import React, { useState, useEffect, useRef } from 'react';
import { useBudget } from '../context/BudgetContext';
import { FunctionalAllocation as FunctionalAllocationType } from '../types';
import TableActionButtons from './shared/TableActionButtons';
import '../styles/components/functional-allocation.css';

const FunctionalAllocation: React.FC = () => {
  const { state, dispatch } = useBudget();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const tableRef = useRef<HTMLTableElement>(null);

  // Get unique teams from Resources
  const uniqueTeams = Array.from(new Set(state.teams?.map(team => team.teamName) || [])).sort();
  
  // Get unique cost centers from Resources
  const uniqueCostCenters = Array.from(new Set(state.teams?.map(team => team.currentCostCenter) || [])).sort();

  // Filter allocations for selected month and year
  const monthAllocations = state.functionalAllocations?.filter(
    allocation => allocation.month === selectedMonth && allocation.year === state.selectedYear
  ) || [];

  // Calculate total cost and validation status
  const totalCost = monthAllocations.reduce((sum, allocation) => sum + allocation.cost, 0);
  
  // Group allocations by team to check if each team's percentages sum to 100%
  const teamValidation = monthAllocations.reduce((acc, allocation) => {
    if (!acc[allocation.teamName]) {
      acc[allocation.teamName] = 0;
    }
    acc[allocation.teamName] += allocation.percentOfWork;
    return acc;
  }, {} as { [teamName: string]: number });

  const validationErrors = Object.entries(teamValidation)
    .filter(([_, percentage]) => Math.abs(percentage - 100) > 0.01)
    .map(([teamName, percentage]) => ({
      teamName,
      percentage: percentage.toFixed(2)
    }));

  const isValid = validationErrors.length === 0;

  // Month names for dropdown
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleAddAllocation = () => {
    const newAllocation: FunctionalAllocationType = {
      id: `fa-${Date.now()}`,
      year: state.selectedYear,
      month: selectedMonth,
      teamName: '',
      function: 'Development',
      currentCostCenter: '',
      product: '',
      cost: 0,
      percentOfWork: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    dispatch({
      type: 'ADD_FUNCTIONAL_ALLOCATION',
      payload: newAllocation
    });

    setEditingId(newAllocation.id);
  };

  const handleUpdateAllocation = (allocation: FunctionalAllocationType) => {
    dispatch({
      type: 'UPDATE_FUNCTIONAL_ALLOCATION',
      payload: {
        ...allocation,
        updatedAt: new Date()
      }
    });
  };

  const handleDeleteAllocation = (id: string) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      dispatch({
        type: 'DELETE_FUNCTIONAL_ALLOCATION',
        payload: id
      });
    }
  };

  const handleFieldChange = (id: string, field: keyof FunctionalAllocationType, value: any) => {
    const allocation = monthAllocations.find(a => a.id === id);
    if (!allocation) return;

    const updatedAllocation = { ...allocation, [field]: value };
    
    // Validate the field
    if (field === 'percentOfWork' && (value < 0 || value > 100)) {
      setErrors({ ...errors, [`${id}-${field}`]: 'Percentage must be between 0 and 100' });
      return;
    } else if (field === 'cost' && value < 0) {
      setErrors({ ...errors, [`${id}-${field}`]: 'Cost cannot be negative' });
      return;
    } else {
      const newErrors = { ...errors };
      delete newErrors[`${id}-${field}`];
      setErrors(newErrors);
    }

    handleUpdateAllocation(updatedAllocation);
  };

  const calculateCostPer = (allocation: FunctionalAllocationType): number => {
    return (allocation.percentOfWork / 100) * allocation.cost;
  };

  // Handle Excel paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    
    if (!text.trim()) return;
    
    const rows = text.split('\n').filter(row => row.trim());
    if (rows.length === 0) return;
    
    const newAllocations: FunctionalAllocationType[] = [];
    
    rows.forEach((row, index) => {
      const cells = row.split('\t');
      
      // Expected columns: Team, Function, Cost Center, Product, Cost, % of Work
      if (cells.length >= 6) {
        const teamName = cells[0].trim();
        const functionValue = cells[1].trim();
        const costCenter = cells[2].trim();
        const product = cells[3].trim();
        const cost = parseFloat(cells[4].replace(/[^0-9.-]/g, '')) || 0;
        const percentOfWork = parseFloat(cells[5].replace(/[^0-9.-]/g, '')) || 0;
        
        // Validate function value
        const validFunctions = ['Development', 'Infrastructure', 'Revenue', 'Support'];
        const normalizedFunction = validFunctions.find(f => 
          f.toLowerCase() === functionValue.toLowerCase()
        ) || 'Development';
        
        const newAllocation: FunctionalAllocationType = {
          id: `fa-${Date.now()}-${index}`,
          year: state.selectedYear,
          month: selectedMonth,
          teamName,
          function: normalizedFunction as 'Development' | 'Infrastructure' | 'Revenue' | 'Support',
          currentCostCenter: costCenter,
          product,
          cost,
          percentOfWork,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        newAllocations.push(newAllocation);
      }
    });
    
    if (newAllocations.length > 0) {
      // Add all new allocations
      newAllocations.forEach(allocation => {
        dispatch({
          type: 'ADD_FUNCTIONAL_ALLOCATION',
          payload: allocation
        });
      });
      
      alert(`Successfully pasted ${newAllocations.length} allocation(s)`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Team', 'Function', 'Current Cost Center', 'Product', 'Cost ($k)', '% of Work', 'Cost Per ($k)'];
    const rows = monthAllocations.map(allocation => [
      allocation.teamName,
      allocation.function,
      allocation.currentCostCenter,
      allocation.product,
      allocation.cost.toString(),
      allocation.percentOfWork.toString(),
      calculateCostPer(allocation).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-allocation-${monthNames[selectedMonth - 1]}-${state.selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="functional-allocation-container">
      <div className="functional-allocation-header">
        <h2>Product Allocation</h2>
        <div className="header-controls">
          <div className="month-selector">
            <label>Month:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="form-select"
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month} {state.selectedYear}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="functional-allocation-actions">
        <button onClick={handleAddAllocation} className="add-btn">
          Add Allocation
        </button>
        <button onClick={handleExportCSV} className="export-btn">
          Export to CSV
        </button>
      </div>

      <div className="table-container" onPaste={handlePaste}>
        <table ref={tableRef} className="functional-allocation-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Function</th>
              <th>Current Cost Center</th>
              <th>Product</th>
              <th>Cost ($k)</th>
              <th>% of Work</th>
              <th>Cost Per ($k)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {monthAllocations.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No allocations for {monthNames[selectedMonth - 1]} {state.selectedYear}
                </td>
              </tr>
            ) : (
              monthAllocations.map(allocation => (
                <tr key={allocation.id}>
                  <td>
                    {editingId === allocation.id ? (
                      <select
                        value={allocation.teamName}
                        onChange={(e) => handleFieldChange(allocation.id, 'teamName', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Select Team</option>
                        {uniqueTeams.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    ) : (
                      allocation.teamName || '-'
                    )}
                  </td>
                  <td>
                    {editingId === allocation.id ? (
                      <select
                        value={allocation.function}
                        onChange={(e) => handleFieldChange(allocation.id, 'function', e.target.value)}
                        className="form-select"
                      >
                        <option value="Development">Development</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Revenue">Revenue</option>
                        <option value="Support">Support</option>
                      </select>
                    ) : (
                      allocation.function
                    )}
                  </td>
                  <td>
                    {editingId === allocation.id ? (
                      <select
                        value={allocation.currentCostCenter}
                        onChange={(e) => handleFieldChange(allocation.id, 'currentCostCenter', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Select Cost Center</option>
                        {uniqueCostCenters.map(cc => (
                          <option key={cc} value={cc}>{cc}</option>
                        ))}
                      </select>
                    ) : (
                      allocation.currentCostCenter || '-'
                    )}
                  </td>
                  <td>
                    {editingId === allocation.id ? (
                      <input
                        type="text"
                        value={allocation.product}
                        onChange={(e) => handleFieldChange(allocation.id, 'product', e.target.value)}
                        className="form-input"
                      />
                    ) : (
                      allocation.product || '-'
                    )}
                  </td>
                  <td>
                    {editingId === allocation.id ? (
                      <input
                        type="number"
                        value={allocation.cost}
                        onChange={(e) => handleFieldChange(allocation.id, 'cost', Number(e.target.value))}
                        className={`form-input ${errors[`${allocation.id}-cost`] ? 'error' : ''}`}
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      `$${allocation.cost.toLocaleString()}`
                    )}
                  </td>
                  <td>
                    {editingId === allocation.id ? (
                      <div className="input-with-suffix">
                        <input
                          type="number"
                          value={allocation.percentOfWork}
                          onChange={(e) => handleFieldChange(allocation.id, 'percentOfWork', Number(e.target.value))}
                          className={`form-input ${errors[`${allocation.id}-percentOfWork`] ? 'error' : ''}`}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="suffix">%</span>
                      </div>
                    ) : (
                      `${allocation.percentOfWork}%`
                    )}
                  </td>
                  <td className="calculated-field">
                    ${calculateCostPer(allocation).toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </td>
                  <td>
                    <TableActionButtons
                      isEditing={editingId === allocation.id}
                      onEdit={() => setEditingId(editingId === allocation.id ? null : allocation.id)}
                      onDelete={() => handleDeleteAllocation(allocation.id)}
                      editTooltip="Edit allocation"
                      deleteTooltip="Delete allocation"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FunctionalAllocation;