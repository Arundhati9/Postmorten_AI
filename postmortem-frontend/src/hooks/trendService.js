export const fetchTrends = async (platform, niche, period) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          title: `${platform} - Viral ${niche} Trend`,
          platform,
          niche,
          views: Math.floor(Math.random() * 500000),
          engagement_rate: (Math.random() * 100).toFixed(2),
          video_idea: `Create a ${niche.toLowerCase()} video with a twist!`,
          script_outline: "1. Hook\n2. Setup\n3. Twist\n4. CTA",
        },
        // Add more dummy trends if needed
      ]);
    }, 1000);
  });
};
