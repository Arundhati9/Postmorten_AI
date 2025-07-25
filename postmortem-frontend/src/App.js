import React, { useState, useRef } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";

import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import LoadingBar from "react-top-loading-bar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "./components/Header/Header";
import HistoryPanel from "./components/HistoryPanel/HistoryPanel";
import Spinner from "./components/Spinner/Spinner";
import Popup from "./components/Popup/Popup";
import Report from "./components/Report/Report";

import { useResponsive } from "./hooks/useResponsive";
import { extractYouTubeVideoId, isValidYouTubeUrl } from "./hooks/useYouTubeHelpers";
import { useHistory } from "./hooks/useHistory";
import { useSSE } from "./hooks/useSSE";

import "./App.css";

import { Routes, Route } from "react-router-dom";
import Trend from "./Pages/Trend";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [activePopup, setActivePopup] = useState(null);
  const [videoId, setVideoId] = useState(null);

  const loadingBar = useRef(null);

  const { isMobile, showHistory, setShowHistory } = useResponsive();
  const { history, saveReport, deleteReport, setHistory } = useHistory();

  const pollForResult = async (taskId, analyzedUrl, retries = 30, interval = 3000) => {
    setStepMessage("🔁 Polling backend for result...");
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await axios.get(`${API_BASE_URL}/result/${taskId}`);
        if (res.data.status === "done" && res.data.report) {
          displayReport(res.data.report, res.data.summary, analyzedUrl, res.data.video_title);
          return;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    toast.error("❌ Analysis timeout. Please try again.");
    setLoading(false);
    setStepMessage("");
    loadingBar.current?.complete();
  };

  const fetchFinalResult = async (taskId, analyzedUrl) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/result/${taskId}`);
      if (res.data.status === "done" && res.data.report) {
        displayReport(res.data.report, res.data.summary, analyzedUrl, res.data.video_title);
      } else {
        toast.error("❌ Failed to fetch analysis result.");
        setLoading(false);
        setStepMessage("");
        loadingBar.current?.complete();
      }
    } catch (err) {
      console.error("Fetch result error:", err);
      toast.error("❌ Error analyzing video.");
      setLoading(false);
      setStepMessage("");
      loadingBar.current?.complete();
    }
  };

  const { listenToSSE } = useSSE({
    API_BASE_URL,
    loadingBar,
    setStepMessage,
    fetchFinalResult,
    pollForResult,
  });

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    if (!isValidYouTubeUrl(url)) {
      toast.error("❌ Please enter a valid YouTube video URL.");
      return;
    }

    setLoading(true);
    setReport("");
    setSummary(null);
    loadingBar.current?.continuousStart();
    setStepMessage("🔍 Extracting video data...");

    try {
      await new Promise((res) => setTimeout(res, 500));
      setStepMessage("📡 Sending data to backend...");
      await new Promise((res) => setTimeout(res, 500));
      setStepMessage("🤖 Generating AI report...");

      const response = await axios.post(`${API_BASE_URL}/analyze`, { url });

      if (response.data.task_id) {
        listenToSSE(response.data.task_id, url);
      } else if (response.data.report) {
        displayReport(response.data.report, response.data.summary, url, response.data.video_title);
      } else {
        throw new Error("Unexpected backend response");
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      toast.error("❌ Error analyzing video.");
      setReport("❌ Error analyzing video.");
      setLoading(false);
      loadingBar.current?.complete();
      setStepMessage("");
    }
  };

  const displayReport = (generatedReport, videoSummary, urlToSave, videoTitle) => {
    const id = extractYouTubeVideoId(urlToSave);
    setVideoId(id);
    setReport(generatedReport);
    setSummary({
      ...videoSummary,
      retention_rate: Number(
        (((videoSummary?.avg_view_duration || 0) / (videoSummary?.duration || 1)) * 100).toFixed(2)
      ),
      engagement_rate: Number(
        ((((videoSummary?.likes || 0) + (videoSummary?.comments || 0)) / (videoSummary?.views || 1)) * 100).toFixed(2)
      ),
    });

    const title = videoTitle || videoSummary?.title || "Untitled Video";
    saveReport(urlToSave, generatedReport, title);

    setLoading(false);
    setStepMessage("");
    loadingBar.current?.complete();
    toast.success("✅ Analysis complete!");

    setTimeout(() => {
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const exportPDF = async () => {
    const input = document.getElementById("report");
    if (!input) {
      console.error("Element with ID 'report' not found.");
      return;
    }

    await document.fonts.ready;

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      scrollY: -window.scrollY,
      logging: false,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;

    while (position < imgHeight) {
      pdf.addImage(imgData, "PNG", 0, -position, imgWidth, imgHeight);
      position += pageHeight;
      if (position < imgHeight) pdf.addPage();
    }

    pdf.save(`postmortem_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const loadReport = (entry) => {
    setUrl(entry.url);
    setReport(entry.report);
    const id = extractYouTubeVideoId(entry.url);
    setVideoId(id);
    setTimeout(() => {
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <div className="App">
      <LoadingBar color="#567afaff" height={3} ref={loadingBar} />
      <ToastContainer position="top-center" autoClose={3000} />
      <Header history={history} onSelect={loadReport} onDelete={deleteReport} />

      <div className="main-section">
        <HistoryPanel
          history={history}
          onSelect={loadReport}
          onDelete={deleteReport}
          isMobile={isMobile}
          visible={showHistory}
        />

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <div className="search-bar-with-icon">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        placeholder="Paste YouTube URL..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                      <span
                        className="paste-icon"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text.trim()) {
                              setUrl(text);
                              toast.success("✅ Link pasted from clipboard!");
                            } else {
                              toast.warn("📋 Clipboard is empty.");
                            }
                          } catch (err) {
                            console.error("Clipboard error:", err);
                            toast.error("❌ Unable to read clipboard.");
                          }
                        }}
                      >
                        📋
                      </span>
                    </div>

                    <button onClick={handleAnalyze} disabled={loading} className="analyse">
                      {loading ? "Analyzing..." : "Analyze"}
                    </button>
                  </div>

                  {loading && <Spinner message={stepMessage} />}

                  {report && (
                    <Report
                      report={report}
                      summary={summary}
                      videoId={videoId}
                      exportPDF={exportPDF}
                    />
                  )}
                </>
              }
            />
            <Route path="/trend" element={<Trend />} />
          </Routes>
        </main>
      </div>

      {activePopup && <Popup entry={activePopup} onClose={() => setActivePopup(null)} />}
    </div>
  );
}

export default App;
