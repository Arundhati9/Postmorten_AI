import React from "react";
import "./StatsOverview.css";

// === Utility Functions ===
const formatNumber = (num) => {
  const n = parseFloat(num);
  if (isNaN(n)) return "N/A";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toLocaleString();
};

const formatPercentage = (num) => {
  const n = parseFloat(num);
  return isNaN(n) ? "N/A" : `${n.toFixed(2)}%`;
};

const formatDuration = (seconds) => {
  const s = parseInt(seconds, 10);
  if (isNaN(s)) return "N/A";
  const minutes = Math.floor(s / 60);
  const remainingSeconds = s % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// === Reusable Stat Box ===
const StatBox = ({ label, value, icon, color }) => (
  <div className="stat-box" style={{ borderColor: color }}>
    <div className="stat-header">
      {icon && <span className="stat-icon" aria-hidden="true">{icon}</span>}
      <span className="stat-label">{label}</span>
    </div>
    <div className="stat-value" title={`${label}: ${value}`}>{value}</div>
  </div>
);

// === Main Component ===
const StatsOverview = ({ summary }) => {
  if (!summary) return null;

  const stats = [
    { label: "Views", value: formatNumber(summary.views), icon: "👁️", color: "#00c6ff" },
    { label: "Likes", value: formatNumber(summary.likes), icon: "❤️", color: "#ff4f81" },
    { label: "Comments", value: formatNumber(summary.comments), icon: "💬", color: "#ffa500" },
    { label: "Duration", value: formatDuration(summary.duration), icon: "⏱️", color: "#0072ff" },
    { label: "Subscribers", value: formatNumber(summary.subscriber_count), icon: "📢", color: "#f54291" },
    { label: "Upload Date", value: summary.upload_date || "N/A", icon: "📅", color: "#009688" },
    { label: "Retention Rate", value: formatPercentage(summary.retention_rate), icon: "⏳", color: "#8a2be2" },
    { label: "Engagement Rate", value: formatPercentage(summary.interaction_rate), icon: "📈", color: "#28a745" },
  ];

  return (
    <section className="stats-overview" role="region" aria-label="Video statistics overview">
      <div className="stat-grid">
        {stats.map(({ label, value, icon, color }) => (
          <StatBox key={label} label={label} value={value} icon={icon} color={color} />
        ))}
      </div>
    </section>
  );
};

export default StatsOverview;
