import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} Algosnitch.ai</p>
        <p> All rights reserved.</p>
        <p>Built with ❤️ by A²</p>
      </div>
    </footer>
  );
};

export default Footer;
