import React from "react";
import "./FormattedReport.css";

const FormattedReport = ({ rawReport }) => {
  if (!rawReport) return null;

  const lines = rawReport
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  return (
    <section className="ai-report-content" aria-label="AI Generated Report">
      {lines.map((line, index) => {
        // Main headings (### Title)
        if (/^#{2,3}\s*/.test(line)) {
          return (
            <h2 className="report-section-heading" key={index}>
              {line.replace(/^#+\s*/, "")}
            </h2>
          );
        }

        // Numbered or bullet subheadings (e.g., "1. Something")
        if (/^(\d+\.\s+|[-*•]\s+)/.test(line)) {
          return (
            <h4 className="report-bullet-title" key={index}>
              {line}
            </h4>
          );
        }

        // Paragraph text
        return (
          <p className="report-body-text" key={index}>
            {line}
          </p>
        );
      })}
    </section>
  );
};

export default FormattedReport;
