import axios from "axios";
import { toast } from "react-toastify";

export const useSSE = ({
  API_BASE_URL,
  loadingBar,
  setStepMessage,
  fetchFinalResult,
  pollForResult,
}) => {
  const listenToSSE = (taskId, analyzedUrl) => {
    const source = new EventSource(`${API_BASE_URL}/events/${taskId}`);

    setStepMessage("📡 Waiting for real-time updates...");

    source.onmessage = (event) => {
      const msg = event.data;
      console.log("SSE:", msg);

      if (msg === "done" || msg === "error") {
        source.close();
        fetchFinalResult(taskId, analyzedUrl);
      } else {
        setStepMessage(msg);
      }
    };

    source.onerror = (err) => {
      console.error("SSE error:", err);
      source.close();
      pollForResult(taskId, analyzedUrl);
    };
  };

  return { listenToSSE };
};
