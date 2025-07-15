import React from "react";
import "./Header.css";

const Header = ({ darkMode, setDarkMode }) => {
  return (
    <header>
      <h1>🎥 PostMortem AI</h1>
      <button onClick={() => setDarkMode(!darkMode)} className="toggle-btn">
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>
    </header>
  );
};

export default Header;
