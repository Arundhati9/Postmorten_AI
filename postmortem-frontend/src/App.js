// import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DOMPurify from "dompurify";
import LoadingBar from "react-top-loading-bar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header/Header";
import HistoryPanel from "./components/HistoryPanel/HistoryPanel";
import Spinner from "./components/Spinner/Spinner";
import Report from "./components/Report/Report";
import Popup from "./components/Popup/Popup";

import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("analysisHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState(true);
  const [activePopup, setActivePopup] = useState(null);

  const loadingBar = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
    return () => clearTimeout(pollingRef.current);
  }, [darkMode]);

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
    loadingBar.current?.continuousStart();
    setStepMessage("🔍 Extracting video data...");

    try {
      await new Promise((res) => setTimeout(res, 500));
      setStepMessage("📡 Sending data to backend...");

      await new Promise((res) => setTimeout(res, 500));
      setStepMessage("🤖 Generating AI report...");

      const response = await axios.post("http://localhost:8000/analyze", { url });

      if (response.data.task_id) {
        pollForResult(response.data.task_id, url);
      } else if (response.data.report) {
        displayReport(response.data.report, url);
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
      await new Promise((res) => setTimeout(res, 1500 + Math.min(pollCount, 4) * 500));

      const res = await axios.get(`http://localhost:8000/result/${taskId}`);
      if (res.data.status === "processing") {
        if (pollCount > 25) throw new Error("Analysis timed out. Please retry.");
        pollingRef.current = setTimeout(() => pollForResult(taskId, analyzedUrl, pollCount + 1), 0);
      } else if (res.data.status === "done" && res.data.report) {
        displayReport(res.data.report, analyzedUrl);
      } else if (res.data.status === "error" || res.data.error) {
        toast.error("❌ AI service error: " + (res.data.error || "Unknown error"));
        setReport("❌ Error analyzing video.");
        setLoading(false);
        setStepMessage("");
        loadingBar.current?.complete();
      } else {
        if (res.data.report) {
          displayReport(res.data.report, analyzedUrl);
        } else {
          throw new Error("Unknown backend response format.");
        }
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

  const displayReport = (generatedReport, urlToSave) => {
    setReport(generatedReport);
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
    const updatedHistory = [newEntry, ...history];
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
    pdf.save("postmortem_report.pdf");
  };

  return (
    <div className="App">
      <LoadingBar color="#00c6ff" height={3} ref={loadingBar} />
      <ToastContainer position="top-center" autoClose={3000} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="main-section">
        <HistoryPanel history={history} onSelect={setActivePopup} />

        <main>
          <input
            type="text"
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {loading && <Spinner message={stepMessage} />}

          {report && <Report report={report} onExport={exportPDF} />}
        </main>
      </div>

      {activePopup && <Popup entry={activePopup} onClose={() => setActivePopup(null)} />}
    </div>
  );
}

export default App;
