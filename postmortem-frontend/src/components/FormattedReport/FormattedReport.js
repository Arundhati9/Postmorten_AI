import React from "react";
import "./FormattedReport.css";

// Utility to strip Markdown-like symbols
function stripMarkdown(line) {
  return line
    .replace(/[*_]{1,3}(.+?)[*_]{1,3}/g, '$1') // Removes inline **bold**, *italic*, etc.
    .replace(/^[*_]+|[*_]+$/g, "")             // Removes leading/trailing markdown
    .replace(/\s{2,}/g, " ")                   // Collapses double spaces
    .trim();
}


const FormattedReport = ({ rawReport }) => {
  if (!rawReport) return null;

  // Cleaned up lines: remove empty, dash-only, or invalid lines
  const lines = rawReport
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        line !== "-" &&
        line !== "*" &&
        line !== "•" &&
        line.replace(/[-*•]/g, "").trim().length > 0
    );

  return (
    <section className="ai-report-content" aria-label="AI Out-of-Box Report">
      {lines.map((line, idx) => {
        // Headings like ## or ###
        if (/^#{2,3}\s*/.test(line)) {
          return (
            <h2 className="report-section-heading" key={idx}>
              {stripMarkdown(line.replace(/^#{2,3}\s*/, ""))}
            </h2>
          );
        }

        // Bullet points with real content
        const bulletMatch = line.match(/^(\d+\.\s+|[-*•]\s+)(.+)$/);
        if (bulletMatch && bulletMatch[2].trim().length > 1) {
          return (
            <h4 className="report-bullet-title" key={idx}>
              {stripMarkdown(bulletMatch[2])}
            </h4>
          );
        }

        // Regular paragraph
        return (
          <p className="report-body-text" key={idx}>
            {stripMarkdown(line)}
          </p>
        );
      })}
    </section>
  );
};

export default FormattedReport;
