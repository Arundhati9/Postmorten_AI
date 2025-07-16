import React from "react";
import "./StatsOverview.css";

const formatNumber = (num) => {
  if (isNaN(num)) return "N/A";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num;
};

const formatPercentage = (num) => {
  const val = parseFloat(num);
  return isNaN(val) ? "N/A" : val.toFixed(2) + "%";
};

const StatBox = ({ label, value, icon, color }) => (
  <div className="stat-box" style={{ borderColor: color }}>
    <div className="stat-header">
      {icon && <span className="icon">{icon}</span>}
      <span className="label">{label}</span>
    </div>
    <div className="value">{value}</div>
  </div>
);

const StatsOverview = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="stats-overview">
      <div className="stat-grid">
        <StatBox label="Views" value={formatNumber(summary.views)} icon="👁️" color="#00c6ff" />
        <StatBox label="Likes" value={formatNumber(summary.likes)} icon="❤️" color="#ff4f81" />
        <StatBox label="Comments" value={formatNumber(summary.comments)} icon="💬" color="#ffa500" />
        <StatBox label="Retention Rate" value={formatPercentage(summary.retention_rate)} icon="⏳" color="#8a2be2" />
        <StatBox label="Engagement Rate" value={formatPercentage(summary.interaction_rate)} icon="📈" color="#28a745" />
        <StatBox label="Duration" value={Math.floor(summary.duration / 60) + "m " + (summary.duration % 60) + "s"} icon="⏱️" color="#0072ff" />
        <StatBox label="Subscribers" value={formatNumber(summary.subscriber_count)} icon="📢" color="#f54291" />
        <StatBox label="Upload Date" value={summary.upload_date || "N/A"} icon="📅" color="#009688" />
      </div>
    </div>
  );
};

export default StatsOverview;
