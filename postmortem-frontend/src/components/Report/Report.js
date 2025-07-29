import React from "react";
import VideoPreview from "../VideoPreview/VideoPreview";
import StatsOverview from "../StatsOverview/StatsOverview";
import VideoCharts from "../VideoCharts/VideoCharts";
import FormattedReport from "../FormattedReport/FormattedReport";
import Footer from "../Footer/Footer";
import "./Report.css";


const Report = ({ report, summary, videoId, exportPDF }) => {
  return (
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
      <FormattedReport rawReport={report} />
      {/* <button onClick={exportPDF} className="analyse">📄 Export as PDF</button> */}
      <Footer />
    </div>
  );
};

export default Report;
