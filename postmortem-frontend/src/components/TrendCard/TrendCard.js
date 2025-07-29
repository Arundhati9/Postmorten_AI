export default function TrendCard({ trend }) {
  return (
    <div className="border rounded-md p-4 bg-gray-50 shadow-sm">
      <h3 className="text-lg font-bold text-blue-700">{trend.title}</h3>

      <a
        href={`https://www.youtube.com/watch?v=${trend.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 underline"
      >
        Watch Video
      </a>

      <p className="mt-2 text-sm"><strong>Channel:</strong> {trend.channel}</p>
      <p className="text-sm"><strong>Views:</strong> {trend.views}</p>

      <div className="mt-2 text-sm">
        <p><strong>Keywords:</strong> {trend.keywords.join(", ")}</p>
        <p><strong>Hashtags:</strong> {trend.hashtags.join(" ")}</p>
      </div>

      <div className="mt-3">
        <p className="font-medium text-sm mb-1">💡 Content Ideas:</p>
        <ul className="list-disc list-inside text-sm text-gray-800">
          {trend.videoIdeas && trend.videoIdeas.length > 0 ? (
            trend.videoIdeas.map((idea, idx) => (
              <li key={idx}>{idea}</li>
            ))
          ) : (
            <li>No content ideas available</li>
          )}
        </ul>
      </div>
    </div>
  );
}
