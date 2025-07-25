import { useState, useEffect } from "react";
import { fetchTrends } from "./trendService";

const useFetchTrends = (platform, niche, period) => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchTrends(platform, niche, period)
      .then((data) => {
        setTrends(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Error loading trends");
        setLoading(false);
      });
  }, [platform, niche, period]);

  return { trends, loading, error };
};

export default useFetchTrends;
