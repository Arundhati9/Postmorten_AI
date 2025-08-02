import React from 'react';

const TrendCard = ({ trend }) => {
  return (
    <div className="border border-gray-300 rounded p-4 shadow-sm hover:shadow-md transition-all bg-white">
      <h3 className="text-lg font-semibold">{trend.title}</h3>
      <p className="text-sm text-gray-600 mb-1">Match Score: {trend.matchScore || 0}%</p>
      <p className="text-sm text-gray-500 mb-2">Keywords: {trend.keywords?.join(', ')}</p>
      <a
        href={`https://youtube.com/watch?v=${trend.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline text-sm"
      >
        Watch Original
      </a>
      <div className="mt-2">
        <h4 className="text-sm font-medium text-gray-700">🎬 Suggested Script:</h4>
        <p className="text-sm bg-gray-50 border border-gray-100 p-2 rounded">{trend.suggestedScript}</p>
      </div>
    </div>
  );
};

export default TrendCard;
