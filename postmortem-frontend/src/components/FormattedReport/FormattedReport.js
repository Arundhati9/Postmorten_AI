import React from "react";
import DOMPurify from "dompurify";
import "./FormattedReport.css";

const formatReport = (text) => {
  const lines = text.split("\n").filter((line) => line.trim() !== "");

  const formatted = lines.map((line, index) => {
    if (/^(\d+\.|[-*•])\s*/.test(line) || /[:：]$/.test(line.trim())) {
      return `<h3 class="report-heading" key=${index}>${line.trim()}</h3>`;
    } else {
      return `<p class="report-paragraph" key=${index}>${line.trim()}</p>`;
    }
  });

  return formatted.join("");
};

const FormattedReport = ({ rawReport }) => {
  const formattedHtml = formatReport(rawReport);

  return (
    <div
      className="ai-report-content"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(formattedHtml),
      }}
    />
  );
};

export default FormattedReport;
