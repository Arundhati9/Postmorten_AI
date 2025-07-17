import React, { forwardRef } from "react";
import "./HistoryPanel.css";

const HistoryPanel = forwardRef(({ history, onSelect, onDelete }, ref) => (
  <aside className="history-panel" ref={ref}>
    <h3>Previous Analyses</h3>
    {history.length === 0 && <p className="empty-history">No history yet.</p>}
    {history.map((entry, index) => (
      <div key={index} className="history-preview">
        <p><strong>{entry.date}</strong></p>
        <p>{entry.title}</p>
        <div className="history-actions">
          <button onClick={() => onSelect(entry)}>View</button>
          <button onClick={() => {
            if (window.confirm("Are you sure you want to delete this report?")) {
              onDelete(index);
            }
          }}>🗑 Delete</button>
        </div>
      </div>
    ))}
  </aside>
));

export default HistoryPanel;
