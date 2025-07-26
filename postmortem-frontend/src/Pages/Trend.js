// src/Pages/Trend.js

import React, { useEffect, useState } from "react";
import { fetchYoutubeTrendsByNiche } from "../hooks/trendService";
import TrendCard from "../components/TrendCard/TrendCard";
import "./Trend.css"; 
import Footer from "../components/Footer/Footer"
const Trend = () => {
  const [selectedNiche, setSelectedNiche] = useState("fitness");
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const data = await fetchYoutubeTrendsByNiche(selectedNiche);
      setTrends(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [selectedNiche]);

  return (
    <div className="trend-page">
      <h1 className="trend-title">🔥 Trending YouTube Videos in "{selectedNiche}"</h1>

      <div className="trend-select-container">
        <select
          value={selectedNiche}
          onChange={(e) => setSelectedNiche(e.target.value)}
          className="trend-select"
        >
          <option value="fitness">Fitness</option>
          <option value="technology">Technology</option>
          <option value="gaming">Gaming</option>
          <option value="fashion">Fashion</option>
        </select>
      </div>

      {loading && <p className="trend-loading">⏳ Fetching the hottest trends...</p>}
      {error && <p className="trend-error">🚨 {error}</p>}

      <div className="trend-grid">
        {trends.map((trend, index) => (
          <TrendCard key={index} trend={trend} />
        ))}
      </div>
      <Footer/>
    </div>
    
  );
};

export default Trend;

