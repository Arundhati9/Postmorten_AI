export async function fetchTrendsByChannel(channelName) {
  try {
    const response = await fetch(`/api/trends?channel_name=${encodeURIComponent(channelName)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch trends");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching trends:", error);
    throw error;
  }
}
