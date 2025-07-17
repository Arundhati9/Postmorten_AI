// SentimentSummary.jsx
import React from "react";
import "./SentimentSummary.css";

const SentimentSummary = ({ sentiment }) => {
  if (!sentiment) return null;

  const { positive_percent = 0, negative_percent = 0 } = sentiment;

  return (
    <div className="sentiment-summary">
      <h3>🧠 Comment Sentiment Summary</h3>
      <ul>
        <li>
          <strong>Positive:</strong> {positive_percent}%
        </li>
        <li>
          <strong>Negative:</strong> {negative_percent}%
        </li>
      </ul>
    </div>
  );
};

export default SentimentSummary;
