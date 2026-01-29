// SentimentChart.js
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  Positive: "#4CAF50",
  Neutral: "#9E9E9E",
  Negative: "#F44336",
};

export default function SentimentChart({ tweets }) {
  if (!tweets || tweets.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#777" }}>
        No sentiment data available
      </div>
    );
  }

  // Robust calculation from sentiment score
  const positive = tweets.filter((t) => t.sentiment_score > 0.3).length;
  const neutral = tweets.filter(
    (t) => t.sentiment_score >= -0.3 && t.sentiment_score <= 0.3
  ).length;
  const negative = tweets.filter((t) => t.sentiment_score < -0.3).length;

  const data = [
    { name: "Positive", value: positive },
    { name: "Neutral", value: neutral },
    { name: "Negative", value: negative },
  ].filter((d) => d.value > 0);

  return (
    <div
      style={{
        flex: 1,
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
        minHeight: "320px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: "12px" }}>
        Sentiment Distribution
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            label
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "18px",
          marginTop: "8px",
          fontSize: "14px",
        }}
      >
        {data.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: COLORS[d.name],
                borderRadius: "50%",
                marginRight: "6px",
              }}
            />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}
