import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} PostMortem AI. All rights reserved.</p>
        <p>Built with ❤️ by Arundhati and Archisman</p>
      </div>
    </footer>
  );
};

export default Footer;
