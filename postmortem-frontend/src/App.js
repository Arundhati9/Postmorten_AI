// src/App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DOMPurify from "dompurify"; // <-- Add this line
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("analysisHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/analyze", { url });
      const generatedReport = response.data.report;
      setReport(generatedReport);
      saveReport(url, generatedReport);
      setTimeout(() => {
        document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (error) {
      setReport("Error analyzing video.");
    } finally {
      setLoading(false);
    }
  };

  const saveReport = (url, report) => {
    const newEntry = { url, report, date: new Date().toLocaleString() };
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("analysisHistory", JSON.stringify(updatedHistory));
  };

  const exportPDF = async () => {
    const input = document.getElementById("report");
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10);
    pdf.save("postmortem_report.pdf");
  };

  return (
    <div className="App">
      <header>
        <h1>🎥 PostMortem AI</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="toggle-btn">
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      <main>
        <input
          type="text"
          placeholder="Paste YouTube URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleAnalyze}>Analyze</button>

        {loading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Analyzing...</p>
          </div>
        )}

        {report && (
          <div id="report" className="ai-report">
            <h2>📊 AI Analysis Report</h2>
            {/* If your AI output is plain text, use <pre>{report}</pre> */}
            {/* If your AI output may contain HTML/Markdown, use the below: */}
            <div
              className="ai-report-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report) }}
            />
            <button onClick={exportPDF}>📄 Want PDF? Click Me</button>
          </div>
        )}

        {history.length > 0 && (
          <div className="history">
            <h3>Previous Analyses</h3>
            {history.map((entry, index) => (
              <div key={index} className="history-item">
                <p><strong>{entry.date}</strong></p>
                <a href={entry.url} target="_blank" rel="noreferrer">{entry.url}</a>
                {/* Support HTML in history as well */}
                <div
                  className="ai-report-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.report) }}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
