// src/hooks/trendService.js
const BASE_URL = "http://localhost:8000/api"; // Update if deployed

// Fetch channel details from YouTube API
export async function fetchChannelDetails(channelName) {
  const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;

  console.log("YT API Key:", apiKey);
  
  if (!apiKey) {
    throw new Error("Missing YouTube API Key");
  }

  // Step 1: Search for the channel
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    channelName
  )}&type=channel&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.items || !searchData.items.length) {
    throw new Error("Channel not found");
  }

  const channelId = searchData.items[0].snippet.channelId;

  // Step 2: Fetch channel details
  const detailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  const info = detailsData.items?.[0];
  if (!info) throw new Error("Failed to retrieve channel details");

  const subscribers = parseInt(info.statistics.subscriberCount) || 0;

  // Very basic niche detection based on title/description keywords
  const nicheKeywords = {
    fitness: ["fitness", "gym", "workout", "bodybuilding", "health"],
    technology: ["tech", "gadget", "software", "coding", "programming"],
    fashion: ["fashion", "style", "clothes", "outfit"],
    gaming: ["gaming", "gameplay", "let's play", "fps", "stream"],
  };

  const title = info.snippet.title?.toLowerCase() || "";
  const description = info.snippet.description?.toLowerCase() || "";

  let detectedNiche = "general";
  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    if (keywords.some((kw) => title.includes(kw) || description.includes(kw))) {
      detectedNiche = niche;
      break;
    }
  }

  return {
    id: channelId,
    title: info.snippet.title,
    subscribers,
    niche: detectedNiche,
  };
}

// Fetch viral trends in a niche, filtered by subscriber range
export async function fetchYoutubeTrendsByNiche(niche, minSubs = 0, maxSubs = 1_000_000) {
  const url = `${BASE_URL}/trends?niche=${encodeURIComponent(
    niche
  )}&min_subs=${minSubs}&max_subs=${maxSubs}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const json = await res.json();
    if (!json.trends || !Array.isArray(json.trends)) {
      throw new Error("Invalid data format from backend");
    }

    return json.trends;
  } catch (error) {
    console.error("Trend fetch failed:", error);
    return []; // Safe fallback to empty array
  }
}


// export const fetchYoutubeTrendsByNiche = async (niche) => {
//   try {
//     const res = await fetch(`http://localhost:8000/api/trends?platform=youtube&niche=${niche}`);
//     if (!res.ok) throw new Error("Network response was not ok");
//     const data = await res.json();
//     return data.trends; // ✅ return only the trends array
//   } catch (err) {
//     console.error("Failed to fetch trends:", err);
//     throw err;
//   }
// };
