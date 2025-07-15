import React from "react";
import DOMPurify from "dompurify";
import "./Popup.css";

const Popup = ({ entry, onClose }) => (
  <div className="popup-overlay" onClick={onClose}>
    <div className="popup" onClick={(e) => e.stopPropagation()}>
      <h2>📜 Report from {entry.date}</h2>
      <div
        className="ai-report-content"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.report) }}
      />
      <button onClick={onClose}>Close</button>
    </div>
  </div>
);

export default Popup;
