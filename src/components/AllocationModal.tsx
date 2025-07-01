import React, { useState, useEffect } from "react";
import { useBudget } from "../context/BudgetContext";
import { CategorySummary, BudgetEntry, CategoryAllocation } from "../types";
import { Modal } from "./shared";
import { formatCurrencyExcelStyle } from "../utils/currencyFormatter";

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
  categoryId?: string;
  categoryName?: string;
}

interface AllocationData {
  supportAmount: string;
  rdAmount: string;
  totalAmount: number;
}

const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  onClose,
  month,
  year,
  categoryId,
  categoryName,
}) => {
  const { state, dispatch } = useBudget();
  const [allocationData, setAllocationData] = useState<AllocationData>({
    supportAmount: "",
    rdAmount: "",
    totalAmount: 0,
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Get month name for display
  const getMonthName = (month: number): string => {
    return new Date(2025, month - 1, 1).toLocaleString("default", {
      month: "long",
    });
  };

  // Get current allocation amounts for the category
  useEffect(() => {
    if (isOpen && categoryId) {
      const allocation = state.allocations.find(
        (alloc) =>
          alloc.categoryId === categoryId &&
          alloc.month === month &&
          alloc.year === year
      );

      const supportAmount = allocation?.supportAmount || 0;
      const rdAmount = allocation?.rdAmount || 0;
      const totalAmount = supportAmount + rdAmount;

      setAllocationData({
        supportAmount: supportAmount.toString(),
        rdAmount: rdAmount.toString(),
        totalAmount,
      });
    }
  }, [isOpen, month, year, categoryId, state.allocations]);

  // Handle input changes
  const handleInputChange = (field: "supportAmount" | "rdAmount", value: string) => {
    const cleanedValue = value.replace(/[^0-9.-]/g, "");
    const newData = { ...allocationData, [field]: cleanedValue };
    
    // Calculate total
    const supportNum = parseFloat(newData.supportAmount) || 0;
    const rdNum = parseFloat(newData.rdAmount) || 0;
    newData.totalAmount = supportNum + rdNum;

    setAllocationData(newData);
  };

  // Handle save
  const handleSave = () => {
    if (!categoryId) return;
    
    const supportAmount = parseFloat(allocationData.supportAmount) || 0;
    const rdAmount = parseFloat(allocationData.rdAmount) || 0;

    // Create or update allocation
    const allocationId = `allocation-${categoryId}-${year}-${month}`;
    const allocation: CategoryAllocation = {
      id: allocationId,
      categoryId,
      year,
      month,
      supportAmount,
      rdAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if allocation already exists
    const existingAllocation = state.allocations.find(
      (alloc) =>
        alloc.categoryId === categoryId &&
        alloc.month === month &&
        alloc.year === year
    );

    if (existingAllocation) {
      dispatch({
        type: "UPDATE_ALLOCATION",
        payload: { ...allocation, id: existingAllocation.id },
      });
    } else {
      dispatch({ type: "ADD_ALLOCATION", payload: allocation });
    }

    // Show success message
    setSaveMessage("✅ Allocation saved successfully!");
    setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 1500);
  };

  // Handle cancel
  const handleCancel = () => {
    setSaveMessage(null);
    onClose();
  };

  const footer = (
    <div className="modal-footer">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleCancel}
      >
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSave}
      >
        Save Allocation
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Allocate ${categoryName || 'Category'} - ${getMonthName(month)} ${year}`}
      size="medium"
      footer={footer}
    >
      <div className="allocation-modal-content">
        {saveMessage && (
          <div className="alert alert-success mb-3">{saveMessage}</div>
        )}
        
        <div className="allocation-form">
          <div className="form-group mb-3">
            <label htmlFor="supportAmount" className="form-label">
              Support Budget Amount
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="text"
                id="supportAmount"
                className="form-control"
                value={allocationData.supportAmount}
                onChange={(e) => handleInputChange("supportAmount", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="rdAmount" className="form-label">
              R&D Budget Amount
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="text"
                id="rdAmount"
                className="form-control"
                value={allocationData.rdAmount}
                onChange={(e) => handleInputChange("rdAmount", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="allocation-summary">
            <div className="row">
              <div className="col-6">
                <strong>Support:</strong>
              </div>
              <div className="col-6 text-end">
                {formatCurrencyExcelStyle(parseFloat(allocationData.supportAmount) || 0)}
              </div>
            </div>
            <div className="row">
              <div className="col-6">
                <strong>R&D:</strong>
              </div>
              <div className="col-6 text-end">
                {formatCurrencyExcelStyle(parseFloat(allocationData.rdAmount) || 0)}
              </div>
            </div>
            <hr />
            <div className="row">
              <div className="col-6">
                <strong>Total Allocation:</strong>
              </div>
              <div className="col-6 text-end">
                <strong>{formatCurrencyExcelStyle(allocationData.totalAmount)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AllocationModal;