import { useState } from "react";
import TrendCard from "../components/TrendCard/TrendCard";

export default function TrendPage() {
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trends, setTrends] = useState(null);

  const handleFetchTrends = async () => {
    if (!channelName) return;

    setLoading(true);
    setError("");
    setTrends(null);

    try {
      const res = await fetch(`/api/trends?channel_name=${encodeURIComponent(channelName)}`);
      if (!res.ok) throw new Error("Could not fetch trends. Please check the channel name.");

      const data = await res.json();
      setTrends(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🎯 YouTube Trend Explorer</h1>

        <div className="flex items-center space-x-4 mb-6">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-md"
            placeholder="Enter YouTube Channel Name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />
          <button
            onClick={handleFetchTrends}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Analyzing..." : "Fetch Trends"}
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        {trends && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="text-sm text-gray-700">
              <p><strong>Niche:</strong> {trends.niche}</p>
              <p><strong>Subscriber Count:</strong> {trends.subscriberCount}</p>
            </div>

            <h2 className="text-xl font-semibold mt-4">🔥 Top Trending Videos</h2>

            <div className="space-y-4">
              {trends.trends.map((trend, index) => (
                <TrendCard key={index} trend={trend} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
