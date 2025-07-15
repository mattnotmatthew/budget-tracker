import React, { useState, useEffect } from "react";

interface ExecutiveCommentaryTabProps {
  intelligentSummary: string;
  year: number;
}

const ExecutiveCommentaryTab: React.FC<ExecutiveCommentaryTabProps> = ({
  intelligentSummary,
  year,
}) => {
  const [commentary, setCommentary] = useState(intelligentSummary);

  useEffect(() => {
    setCommentary(intelligentSummary);
  }, [intelligentSummary]);

  const handleCommentaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentary(e.target.value);
  };

  return (
    <div className="section-container">
      <h3>Executive Commentary - {year}</h3>
      <div className="executive-commentary-section">
        <div className="commentary-input">
          <textarea
            className="commentary-textarea"
            value={commentary}
            onChange={handleCommentaryChange}
            placeholder="Enter executive commentary..."
            rows={20}
          />
        </div>
        <div className="commentary-preview">
          <h4>Preview</h4>
          <div className="commentary-print-text">
            {commentary.split("\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="intelligent-summary-note">
        <p>
          <strong>Note:</strong> This commentary is automatically generated based
          on your budget data. You can edit it as needed before including it in
          reports.
        </p>
      </div>
    </div>
  );
};

export default React.memo(ExecutiveCommentaryTab);