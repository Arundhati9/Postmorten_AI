// src/components/TrendCard.js
import React from "react";
import "./TrendCard.css"; 


const TrendCard = ({ trend }) => {
  return (
    <div className="trend-card">
      <h2>{trend.title}</h2>
      <p >Channel: {trend.channel}</p>
      <p >Views: {trend.views}</p>
      <p className="trend-keywords">Keywords: {trend.keywords?.join(", ")}</p>
      <p className="trend-hashtags">Hashtags: {trend.hashtags?.join(", ")}</p>
    </div>
  );
};

export default TrendCard;
