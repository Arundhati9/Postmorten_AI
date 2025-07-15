import React from "react";
import "./HistoryPanel.css";

const HistoryPanel = ({ history, onSelect }) => (
  <aside className="history-panel">
    <h3>Previous Analyses</h3>
    {history.map((entry, index) => (
      <div key={index} className="history-preview" onClick={() => onSelect(entry)}>
        <p><strong>{entry.date}</strong></p>
        <p>{entry.report.split("\n")[0]}</p>
      </div>
    ))}
  </aside>
);

export default HistoryPanel;
