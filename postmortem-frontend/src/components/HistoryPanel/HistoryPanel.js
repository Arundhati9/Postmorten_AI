import React from "react";
import "./HistoryPanel.css";

function HistoryPanel({ history, onSelect, onDelete, isMobile, visible }) {
  return (
    <aside className={`history-panel ${isMobile ? (visible ? "show" : "hide") : ""}`}>
      <h3>History</h3>
      {history.length === 0 && <p className="empty-history">No history yet.</p>}
      {history.map((entry, index) => (
        <div
          key={index}
          className="history-preview"
          onClick={() => onSelect(entry)}  // 👈 Clicking anywhere triggers view
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelect(entry)} // Keyboard accessibility
        >
          <p><strong>{entry.title || entry.date}</strong></p>
          <div className="history-actions">
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent opening when deleting
                if (window.confirm("Are you sure you want to delete this report?")) {
                  onDelete(index);
                }
              }}
            >
              🗑 Delete
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}

export default HistoryPanel;




// import React from "react";
// import "./HistoryPanel.css";

// function HistoryPanel({ history, onSelect, onDelete, isMobile, visible }) {
//   return (
//     <aside className={`history-panel ${isMobile ? (visible ? "show" : "hide") : ""}`}>
//       <h3>History</h3>
//       {history.length === 0 && <p className="empty-history">No history yet.</p>}
//       {history.map((entry, index) => (
//         <div key={index} className="history-preview">
//           <p><strong>{entry.title || entry.date}</strong></p>
//           <div className="history-actions">
//             <button onClick={() => onSelect(entry)}>View</button>
//             <button
//               onClick={() => {
//                 if (window.confirm("Are you sure you want to delete this report?")) {
//                   onDelete(index);
//                 }
//               }}
//             >
//               🗑 Delete
//             </button>
//           </div>
//         </div>
//       ))}
//     </aside>
//   );
// }

// export default HistoryPanel;
