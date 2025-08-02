// hooks/useFetchTrends.js
import { useEffect, useState } from 'react';

const useFetchTrends = (platform, niche, frequency) => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/trends?platform=${platform}&niche=${niche}&frequency=${frequency}`
        );
        const data = await response.json();
        setTrends(data.trends || []);
      } catch (err) {
        console.error('Failed to fetch trends:', err);
        setTrends([]);
      }
      setLoading(false);
    };

    fetchTrends();
  }, [platform, niche, frequency]);

  return { trends, loading };
};

export default useFetchTrends;
