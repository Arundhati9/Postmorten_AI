// ...[imports remain unchanged]
import React, { useState, useEffect, useRef } from "react";
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
import FormattedReport from "./components/FormattedReport/FormattedReport";
import VideoPreview from "./components/VideoPreview/VideoPreview";
import StatsOverview from "./components/StatsOverview/StatsOverview";
import VideoCharts from "./components/VideoCharts/VideoCharts";

import "./App.css";

const API_BASE_URL = "http://localhost:8000";

const extractYouTubeVideoId = (url) => {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

function App() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState("");
  const [summary, setSummary] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("analysisHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState(true);
  const [activePopup, setActivePopup] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [showHistory, setShowHistory] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const loadingBar = useRef(null);
  const pollingTimeout = useRef(null);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    document.body.classList.toggle("light", !darkMode);
    return () => clearTimeout(pollingTimeout.current);
  }, [darkMode]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowHistory(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isValidYouTubeUrl = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    return regex.test(url);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    if (!isValidYouTubeUrl(url)) {
      toast.error("❌ Please enter a valid YouTube video URL.");
      return;
    }

    setLoading(true);
    setReport("");
    setSummary(null);
    setSentiment(null);
    loadingBar.current?.continuousStart();
    setStepMessage("🔍 Extracting video data...");

    try {
      await new Promise((res) => setTimeout(res, 500));
      setStepMessage("📡 Sending data to backend...");
      await new Promise((res) => setTimeout(res, 500));
      setStepMessage("🤖 Generating AI report...");

      const response = await axios.post(`${API_BASE_URL}/analyze`, { url });

      if (response.data.task_id) {
        pollForResult(response.data.task_id, url);
      } else if (response.data.report) {
        displayReport(
          response.data.report,
          response.data.summary,
          url,
          response.data.sentiment_summary
        );
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

  const pollForResult = async (taskId, analyzedUrl, pollCount = 0) => {
    setStepMessage("⏳ Waiting for AI analysis...");

    try {
      await new Promise((res) =>
        setTimeout(res, 1500 + Math.min(pollCount, 4) * 500)
      );

      const res = await axios.get(`${API_BASE_URL}/result/${taskId}`);

      if (res.data.status === "processing") {
        if (pollCount > 25) throw new Error("Analysis timed out. Please retry.");
        pollingTimeout.current = setTimeout(() => {
          pollForResult(taskId, analyzedUrl, pollCount + 1);
        }, 0);
      } else if (res.data.status === "done" && res.data.report) {
        displayReport(
          res.data.report,
          res.data.summary,
          analyzedUrl,
          res.data.sentiment_summary ||
            (res.data.summary ? res.data.summary.sentiment_summary : null)
        );
      } else if (res.data.status === "error" || res.data.error) {
        toast.error("❌ AI service error: " + (res.data.error || "Unknown error"));
        setReport("❌ Error analyzing video.");
        setLoading(false);
        setStepMessage("");
        loadingBar.current?.complete();
      } else {
        throw new Error("Unknown backend response format.");
      }
    } catch (err) {
      console.error("Polling error:", err);
      toast.error("❌ AI analysis failed or took too long.");
      setReport("❌ Error analyzing video.");
      setLoading(false);
      setStepMessage("");
      loadingBar.current?.complete();
    }
  };

  const displayReport = (generatedReport, videoSummary, urlToSave, sentiment_summary) => {
    const id = extractYouTubeVideoId(urlToSave);
    setVideoId(id);
    setReport(generatedReport);
    setSentiment(sentiment_summary || (videoSummary ? videoSummary.sentiment_summary : null));
    setSummary({
      ...videoSummary,
      retention_rate: Number(
        (((videoSummary?.avg_view_duration || 0) / (videoSummary?.duration || 1)) * 100).toFixed(2)
      ),
      engagement_rate: Number(
        ((((videoSummary?.likes || 0) + (videoSummary?.comments || 0)) / (videoSummary?.views || 1)) * 100).toFixed(2)
      ),
    });
    saveReport(urlToSave, generatedReport);
    setLoading(false);
    setStepMessage("");
    loadingBar.current?.complete();
    toast.success("✅ Analysis complete!");

    setTimeout(() => {
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const saveReport = (url, report) => {
    const newEntry = { url, report, date: new Date().toLocaleString() };
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem("analysisHistory", JSON.stringify(updatedHistory));
  };

  const deleteReport = (indexToDelete) => {
    const updatedHistory = history.filter((_, index) => index !== indexToDelete);
    setHistory(updatedHistory);
    localStorage.setItem("analysisHistory", JSON.stringify(updatedHistory));
  };

  const exportPDF = async () => {
    const input = document.getElementById("report");
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
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
      <LoadingBar color="#00c6ff" height={3} ref={loadingBar} />
      <ToastContainer position="top-center" autoClose={3000} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="main-section">
        {isMobile && (
          <button className="toggle-history-button" onClick={() => setShowHistory(!showHistory)}>
            ☰ History
          </button>
        )}

        <HistoryPanel
          history={history}
          onSelect={loadReport}
          onDelete={deleteReport}
          isMobile={isMobile}
          visible={showHistory}
        />

        <main>
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
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigator.clipboard.readText().then(text => {
                      if (text.trim()) {
                        setUrl(text);
                        toast.success("✅ Link pasted from clipboard!");
                      } else {
                        toast.warn("📋 Clipboard is empty.");
                      }
                    }).catch(() => {
                      toast.error("❌ Unable to read clipboard.");
                    });
                  }
                }}
                aria-label="Paste from clipboard"
              >
                📋
              </span>
            </div>
            <button onClick={handleAnalyze} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {loading && <Spinner message={stepMessage} />}

          {report && (
            <div id="report" className="report">
              <h2>📊 AI Analysis Report</h2>
              <VideoPreview videoId={videoId} />
              {summary && <StatsOverview summary={summary} />}
              {summary && (
                <VideoCharts
                  ctr={summary.ctr}
                  avgViewDuration={summary.avg_view_duration}
                  seoScore={summary.seo_score}
                />
              )}

              {sentiment && (
                <div className="sentiment-summary">
                  <h3>🧠 Comment Sentiment Summary</h3>
                  <ul>
                    <li>
                      <strong>Positive:</strong> {sentiment.positive_percent ?? 0}%
                    </li>
                    <li>
                      <strong>Negative:</strong> {sentiment.negative_percent ?? 0}%
                    </li>
                  </ul>
                </div>
              )}

              <FormattedReport rawReport={report} />
              <button onClick={exportPDF}>📄 Export as PDF</button>
            </div>
          )}
        </main>
      </div>

      {activePopup && <Popup entry={activePopup} onClose={() => setActivePopup(null)} />}
    </div>
  );
}

export default App;
