import React from "react";
import "./Theme.css"; 

const Theme = ({ darkMode, setDarkMode }) => {
  return (
    <button className="theme" onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? "🌙" : "☀️"}
    </button>
  );
};

export default Theme;
