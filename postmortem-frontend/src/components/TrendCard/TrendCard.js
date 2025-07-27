// src/components/TrendCard/TrendCard.js
import React from "react";
import "./TrendCard.css";

const TrendCard = ({ trend }) => {
  if (!trend || typeof trend !== "object") return null;

  const {
    title = "Untitled Video",
    channel = "Unknown Channel",
    views = 0,
    keywords = [],
    hashtags = [],
  } = trend;

  const formattedViews =
    typeof views === "number" ? views.toLocaleString() : "N/A";

  const formattedKeywords =
    Array.isArray(keywords) && keywords.length > 0
      ? keywords.join(", ")
      : "None";

  const formattedHashtags =
    Array.isArray(hashtags) && hashtags.length > 0
      ? hashtags.join(", ")
      : "None";

  return (
    <div className="trend-card">
      <h2>{title}</h2>
      <p>
        <strong>Channel:</strong> {channel}
      </p>
      <p>
        <strong>Views:</strong> {formattedViews}
      </p>
      <p className="trend-keywords">
        <strong>Keywords:</strong> {formattedKeywords}
      </p>
      <p className="trend-hashtags">
        <strong>Hashtags:</strong> {formattedHashtags}
      </p>
    </div>
  );
};

export default TrendCard;



// import React from "react";
// import "./TrendCard.css"; 


// const TrendCard = ({ trend }) => {
//   return (
//     <div className="trend-card">
//       <h2>{trend.title}</h2>
//       <p >Channel: {trend.channel}</p>
//       <p >Views: {trend.views}</p>
//       <p className="trend-keywords">Keywords: {trend.keywords?.join(", ")}</p>
//       <p className="trend-hashtags">Hashtags: {trend.hashtags?.join(", ")}</p>
//     </div>
//   );
// };

// export default TrendCard;
