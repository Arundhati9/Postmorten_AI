// src/hooks/trendService.js

export const fetchYoutubeTrendsByNiche = async (niche) => {
  try {
    const res = await fetch(`http://localhost:8000/api/trends?platform=youtube&niche=${niche}`);
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    return data.trends; // ✅ return only the trends array
  } catch (err) {
    console.error("Failed to fetch trends:", err);
    throw err;
  }
};
