import React from "react";
import ReactECharts from "echarts-for-react";
import "./VideoCharts.css";

const RadialGauge = ({ label, value, color }) => {
  const option = {
    series: [
      {
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        radius: "100%",
        progress: {
          show: true,
          width: 16,
          itemStyle: { color },
        },
        axisLine: {
          lineStyle: {
            width: 16,
            color: [[1, "#eee"]],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          formatter: `{value}`,
          fontSize: 18,
          color: "#fff",
        },
        data: [{ value }],
      },
    ],
  };

  return (
    <div className="chart-box">
      <h4 className="chart-label">{label}</h4>
      <ReactECharts option={option} style={{ height: 160 }} />
    </div>
  );
};

const VideoCharts = ({ ctr, avgViewDuration, seoScore }) => {
  return (
    <div className="video-charts">
      <h3 className="section-title">📊 Key Performance Metrics</h3>
      <div className="video-charts-grid">
        <RadialGauge label="CTR (%)" value={ctr} color="#00c6ff" />
        <RadialGauge label="Avg View Duration (s)" value={avgViewDuration} color="#ff4f81" />
        <RadialGauge label="SEO Score" value={seoScore} color="#28a745" />
      </div>
    </div>
  );
};

export default VideoCharts;
