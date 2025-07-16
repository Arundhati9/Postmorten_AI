// src/components/VideoPreview/VideoPreview.js
import React from "react";
import "./VideoPreview.css";

const VideoPreview = ({ videoId }) => {
  if (!videoId) return null;

  return (
    <div className="video-preview">
      <iframe
        width="100%"
        height="400"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoPreview;
