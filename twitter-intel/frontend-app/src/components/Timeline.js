import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Timeline({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return <p>No timeline data</p>;
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3>Sentiment Over Time</h3>

      <ResponsiveContainer>
        <LineChart data={timeline}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis domain={[-1, 1]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="sentiment_score"
            stroke="#1976d2"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}