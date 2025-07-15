import React from "react";
import "./Spinner.css";

const Spinner = ({ message }) => (
  <div className="spinner-container">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);

export default Spinner;
