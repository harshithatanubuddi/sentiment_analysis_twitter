import { useState, useEffect, useRef } from "react";
import axios from "axios";

import SearchBar from "../components/searchBar";
import SentimentChart from "../components/SentimentChart";
import Timeline from "../components/Timeline";

/* ---------- EMOJI SYSTEM ---------- */
const emotionEmojiMap = {
  joy: "😄",
  anger: "😠",
  sadness: "😢",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
  neutral: "😐",
  toxic: "☠️",
  positive: "😊",
  negative: "😞",
};

const getEmoji = (tweet) => {
  if (tweet.toxic) return emotionEmojiMap.toxic;
  if (tweet.sentiment_score > 0.6) return emotionEmojiMap.positive;
  if (tweet.sentiment_score < -0.6) return emotionEmojiMap.negative;
  return emotionEmojiMap[tweet.emotion] || "🙂";
};

/* ---------- SHARED STYLES ---------- */
const kpiCard = (color) => ({
  flex: 1,
  minWidth: "160px",
  padding: "20px",
  borderRadius: "16px",
  background: "#fff",
  borderLeft: `6px solid ${color}`,
  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  textAlign: "center",
});

/* ---------- BACKEND URL ---------- */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("positive");
  const [visibleCount, setVisibleCount] = useState(6);

  const controllerRef = useRef(null);

  /* ---------- ANALYZE ---------- */
  const analyze = async (query) => {
    if (!query || query.trim().length < 2) return;

    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    setData(null);

    try {
      const res = await axios.get(`${API_BASE_URL}/analyze`, {
        params: { query, _t: Date.now() },
        signal: controllerRef.current.signal,
        timeout: 60000,
      });
      setData(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setData({
          tweets: [],
          timeline: [],
          message: "Analysis failed or timed out. Try a narrower query.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab]);

  /* ---------- DERIVED DATA ---------- */
  const tweets = data?.tweets || [];

  const positive = tweets.filter((t) => t.sentiment_score > 0.3);
  const neutral = tweets.filter(
    (t) => t.sentiment_score >= -0.3 && t.sentiment_score <= 0.3
  );
  const negative = tweets.filter((t) => t.sentiment_score < -0.3);
  const toxic = tweets.filter((t) => t.toxic);

  const avgSentiment =
    tweets.length > 0
      ? tweets.reduce((s, t) => s + t.sentiment_score, 0) / tweets.length
      : 0;

  const toxicRate =
    tweets.length > 0 ? (toxic.length / tweets.length) * 100 : 0;

  const tabData = { positive, neutral, negative, toxic };
  const activeTweets = tabData[activeTab] || [];

  /* ---------- TWEET CARD ---------- */
  const TweetCard = ({ tweet }) => (
    <div
      style={{
        background: "#fff",
        padding: "14px",
        borderRadius: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        display: "flex",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "10px",
          background: "#f1f1f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "26px",
        }}
      >
        {getEmoji(tweet)}
      </div>

      <div>
        <p style={{ margin: 0, lineHeight: 1.4 }}>{tweet.tweet}</p>
        <small style={{ color: "#555" }}>
          Sentiment: {tweet.sentiment_score.toFixed(2)}
          {tweet.confidence === "low" && " ⚠ mixed"}
        </small>
        <div style={{ fontSize: "12px", color: "#777" }}>
          🕒 {tweet.timestamp}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "28px", background: "#f4f6f8" }}>
      <h1 style={{ marginBottom: "16px" }}>Twitter Sentiment Dashboard</h1>

      <SearchBar onSearch={analyze} />

      {loading && <p>Analyzing tweets…</p>}

      {data?.message && (
        <p style={{ marginTop: "12px", color: "#b91c1c" }}>
          {data.message}
        </p>
      )}

      {/* ---------- KPI SECTION ---------- */}
      <div style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
        <div style={kpiCard("green")}><h4>Positive</h4><h2>{positive.length}</h2></div>
        <div style={kpiCard("gray")}><h4>Neutral</h4><h2>{neutral.length}</h2></div>
        <div style={kpiCard("red")}><h4>Negative</h4><h2>{negative.length}</h2></div>
        <div style={kpiCard("darkred")}><h4>Toxic</h4><h2>{toxic.length}</h2></div>
      </div>

      {/* ---------- METRICS ---------- */}
      <div style={{ marginTop: "16px", fontSize: "14px" }}>
        <p><strong>Average Sentiment:</strong> {avgSentiment.toFixed(2)}</p>
        <p><strong>Toxic Rate:</strong> {toxicRate.toFixed(1)}%</p>
        <p><strong>Total Tweets:</strong> {tweets.length}</p>
      </div>

      {/* ---------- INSIGHTS ---------- */}
      <div
        style={{
          marginTop: "32px",
          padding: "24px",
          background: "#fff",
          borderRadius: "18px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>Sentiment Insights</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
          }}
        >
          <SentimentChart tweets={tweets} />
          <Timeline timeline={data?.timeline || []} />
        </div>
      </div>

      {/* ---------- FILTER TABS ---------- */}
      <div style={{ marginTop: "32px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {Object.keys(tabData).map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background: activeTab === key ? "#111" : "#e0e0e0",
              color: activeTab === key ? "#fff" : "#333",
            }}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ---------- TWEETS GRID ---------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginTop: "24px",
        }}
      >
        {activeTweets.slice(0, visibleCount).map((t, i) => (
          <TweetCard key={i} tweet={t} />
        ))}
      </div>

      {activeTweets.length > visibleCount && (
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            onClick={() => setVisibleCount((v) => v + 6)}
            style={{
              padding: "10px 20px",
              borderRadius: "24px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Show more ({activeTweets.length - visibleCount} more)
          </button>
        </div>
      )}
    </div>
  );
}