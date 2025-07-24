import React, { useState, useEffect, useRef } from "react";
import "./Header.css";
import Theme from "../Theme/Theme";
import HistoryPanel from "../HistoryPanel/HistoryPanel";

const Header = ({ darkMode, setDarkMode, history, onSelect, onDelete }) => {
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef(null);

  const handleClickOutside = (event) => {
    if (
      historyRef.current &&
      !historyRef.current.contains(event.target) &&
      !event.target.classList.contains("history-toggle-btn")
    ) {
      setShowHistory(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMobile = window.innerWidth <= 768;

  return (
     <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-text">
            <h1 className="logo">🎥 Algosnitch.ai</h1>
            <p className="logo-subtitle">Your Video Analyst</p>
            </div>
        </div>
        {isMobile && (
          <button
            className="history-toggle-btn"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            ☰
          </button>
        )}

        {isMobile && showHistory && (
          <div ref={historyRef}>
            <HistoryPanel
              history={history}
              onSelect={onSelect}
              onDelete={onDelete}
              isMobile={true}
              visible={showHistory}
            />
          </div>
        )}

        {/* <div className="theme-toggle">
          <Theme darkMode={darkMode} setDarkMode={setDarkMode} />
        </div> */}
      </div>
    </header>
  );
};

export default Header;
