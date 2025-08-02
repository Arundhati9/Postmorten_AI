import React, { useState } from 'react';
import TrendCard from '../components/TrendCard/TrendCard';

const TrendPage = () => {
  const [channelName, setChannelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const fetchTrends = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await fetch(`/api/user-trends?channel_handle=${channelName}`);
      if (!res.ok) throw new Error('Channel not found or API error');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">📈 Personalized Trend Insights</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter YouTube channel name"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full"
        />
        <button onClick={fetchTrends} className="bg-blue-600 text-white px-4 py-2 rounded">
          Fetch Trends
        </button>
      </div>

      {loading && <p>🔄 Analyzing channel...</p>}
      {error && <p className="text-red-500">❌ {error}</p>}

      {results && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Channel: {results.channel}</h2>
            <p className="text-sm text-gray-600">Niche: {results.niche}</p>
            <p className="text-sm">Subscribers: {results.performance.subscriberCount}</p>
          </div>

          <div className="grid gap-4">
            {results.recommendations.map((trend, i) => (
              <TrendCard key={i} trend={trend} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TrendPage;
