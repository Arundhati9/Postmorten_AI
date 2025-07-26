// src/Pages/Trend.js

import React, { useEffect, useState } from "react";
import { fetchYoutubeTrendsByNiche } from "../hooks/trendService";
import TrendCard from "../components/TrendCard/TrendCard"; // ✅ correct import

const Trend = () => {
  const [selectedNiche, setSelectedNiche] = useState("fitness");
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const data = await fetchYoutubeTrendsByNiche(selectedNiche);
      setTrends(data); // ✅ only set the trends array
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Trending YouTube Videos in "{selectedNiche}"</h1>

      <select
        value={selectedNiche}
        onChange={(e) => setSelectedNiche(e.target.value)}
        className="mb-4 p-2 border rounded"
      >
        <option value="fitness">Fitness</option>
        <option value="technology">Technology</option>
        <option value="gaming">Gaming</option>
        <option value="fashion">Fashion</option>
      </select>

      {loading && <p>Loading trends...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((trend, index) => (
          <TrendCard key={index} trend={trend} />
        ))}
      </div>
    </div>
  );
};

export default Trend;
