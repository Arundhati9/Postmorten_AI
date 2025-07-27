import React, { useState } from "react";
import ChannelInput from "../components/ChannelInput/ChannelInput";
import TrendCard from "../components/TrendCard/TrendCard";
import { fetchChannelDetails, fetchYoutubeTrendsByNiche } from "../hooks/trendService";

const Trend = () => {
  const [trends, setTrends] = useState([]);
  const [error, setError] = useState("");
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChannelSubmit = async (channelName) => {
    try {
      setLoading(true);
      setError("");
      setTrends([]);
      setChannelInfo(null);

      const info = await fetchChannelDetails(channelName);
      setChannelInfo(info);

      const minSubs = Math.floor(info.subscribers * 0.5);
      const maxSubs = Math.ceil(info.subscribers * 5);

      const trends = await fetchYoutubeTrendsByNiche(info.niche, minSubs, maxSubs);
      setTrends(trends);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">YouTube Channel Trend Explorer</h1>

      <ChannelInput onSubmit={handleChannelSubmit} />

      {loading && <p className="text-gray-600">Analyzing...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {channelInfo && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{channelInfo.title}</h2>
          <p>Subscribers: {channelInfo.subscribers.toLocaleString()}</p>
          <p>Detected Niche: <span className="font-medium">{channelInfo.niche}</span></p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trends.map((trend, index) => (
          <TrendCard key={index} trend={trend} />
        ))}
      </div>
    </div>
  );
};

export default Trend;
