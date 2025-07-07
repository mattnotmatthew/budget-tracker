import React from 'react';

interface TableActionButtonsProps {
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  editTooltip?: string;
  deleteTooltip?: string;
}

const TableActionButtons: React.FC<TableActionButtonsProps> = ({
  isEditing,
  onEdit,
  onDelete,
  editTooltip,
  deleteTooltip
}) => {
  return (
    <div className="action-buttons">
      <button
        onClick={onEdit}
        className="edit-row-btn"
        title={editTooltip || (isEditing ? "Save changes" : "Edit")}
      >
        {isEditing ? '✓' : '✏️'}
      </button>
      <button
        onClick={onDelete}
        className="remove-row-btn"
        title={deleteTooltip || "Delete"}
      >
        🗑️
      </button>
    </div>
  );
};

export default TableActionButtons;