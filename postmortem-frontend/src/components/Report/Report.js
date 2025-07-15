import React from "react";
import DOMPurify from "dompurify";
import "./Report.css";

const Report = ({ report, onExport }) => (
  <div id="report" className="report">
    <h2>📊 AI Analysis Report</h2>
    <div
      className="ai-report-content"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report) }}
    />
    <button onClick={onExport}>📄 Export as PDF</button>
  </div>
);

export default Report;
