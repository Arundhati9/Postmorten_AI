// components/ChannelInput.js
import React, { useState } from "react";

const ChannelInput = ({ onSubmit }) => {
  const [channelName, setChannelName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (channelName.trim() === "") return;
    onSubmit(channelName);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        type="text"
        placeholder="Enter YouTube Channel Name"
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}
        className="px-3 py-2 rounded border border-gray-300 w-full"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Analyze
      </button>
    </form>
  );
};

export default ChannelInput;
