import React, { useState } from "react";
import TrendCard from "../components/TrendCard/TrendCard";
import useFetchTrends from "../hooks/useFetchTrends";
import "./Trend.css";

const TrendLab = () => {
  const [platform, setPlatform] = useState("YouTube");
  const [niche, setNiche] = useState("Technology");
  const [period, setPeriod] = useState("daily");

  const { trends, loading, error } = useFetchTrends(platform, niche, period);

  return (
    <div className="trend-lab">
      <div className="trend-lab-header">
        <h2>🔥 Trend Lab</h2>

        <div className="filters">
          <select onChange={(e) => setPlatform(e.target.value)} value={platform}>
            <option>YouTube</option>
            <option>TikTok</option>
            <option>Instagram</option>
          </select>

          <select onChange={(e) => setNiche(e.target.value)} value={niche}>
            <option>Technology</option>
            <option>Fashion</option>
            <option>Gaming</option>
            <option>Finance</option>
            <option>Education</option>
          </select>

          <button onClick={() => setPeriod("daily")} className={period === "daily" ? "active" : ""}>
            Daily
          </button>
          <button onClick={() => setPeriod("weekly")} className={period === "weekly" ? "active" : ""}>
            Weekly
          </button>
        </div>
      </div>

      <div className="trend-grid">
        {loading && <p>Loading trends...</p>}
        {error && <p>Error fetching trends</p>}
        {trends.map((trend, index) => (
          <TrendCard key={index} trend={trend} />
        ))}
      </div>
    </div>
  );
};

export default TrendLab;
