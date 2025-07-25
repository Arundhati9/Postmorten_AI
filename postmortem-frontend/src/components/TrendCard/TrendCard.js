import React from "react";
import "./TrendCard.css";

const TrendCard = ({ trend }) => {
  return (
    <div className="trend-card">
      <h3>{trend.title}</h3>
      <p><strong>Platform:</strong> {trend.platform}</p>
      <p><strong>Niche:</strong> {trend.niche}</p>
      <p><strong>Views:</strong> {trend.views.toLocaleString()}</p>
      <p><strong>Engagement:</strong> {trend.engagement_rate}%</p>
      <p className="idea"><strong>Idea:</strong> {trend.video_idea}</p>
      <p className="script"><strong>Script:</strong> {trend.script_outline}</p>
    </div>
  );
};

export default TrendCard;
