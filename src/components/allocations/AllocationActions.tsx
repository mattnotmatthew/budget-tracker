import React from "react";

interface AllocationActionsProps {
  onExportCSV: () => void;
  onAddAllocation: () => void;
  onCopyToNextMonth?: () => void;
  pasteMessage: string | null;
  copyPasteMessage?: string | null;
  addButtonText?: string;
}

const AllocationActions: React.FC<AllocationActionsProps> = ({
  onExportCSV,
  onAddAllocation,
  onCopyToNextMonth,
  pasteMessage,
  copyPasteMessage,
  addButtonText = "Add Allocation",
}) => {
  return (
    <>
      <div className="functional-allocation-actions">
        <button onClick={onExportCSV} className="export-btn">
          Export to CSV
        </button>
        {(pasteMessage || copyPasteMessage) && (
          <span className="paste-message success">
            {pasteMessage || copyPasteMessage}
          </span>
        )}
      </div>

      <div className="table-section">
        <div className="button-container">
          <button onClick={onAddAllocation} className="add-btn">
            {addButtonText}
          </button>
          {onCopyToNextMonth && (
            <button
              onClick={onCopyToNextMonth}
              className="btn btn-info"
              style={{ marginLeft: "10px" }}
            >
              Copy to Next Month
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default AllocationActions;
