import React from "react";

interface AllocationActionsProps {
  onExportCSV: () => void;
  onAddAllocation: () => void;
  pasteMessage: string | null;
  addButtonText?: string;
}

const AllocationActions: React.FC<AllocationActionsProps> = ({
  onExportCSV,
  onAddAllocation,
  pasteMessage,
  addButtonText = "Add Allocation",
}) => {
  return (
    <>
      <div className="functional-allocation-actions">
        <button onClick={onExportCSV} className="export-btn">
          Export to CSV
        </button>
        {pasteMessage && (
          <span className="paste-message success">{pasteMessage}</span>
        )}
      </div>

      <div className="table-section">
        <div className="button-container">
          <button onClick={onAddAllocation} className="add-btn">
            {addButtonText}
          </button>
        </div>
      </div>
    </>
  );
};

export default AllocationActions;
