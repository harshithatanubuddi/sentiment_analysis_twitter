import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // prevent page reload
    const trimmed = query.trim();
    if (trimmed.length < 2) return; // avoid junk searches
    onSearch(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        flexWrap: "wrap",
      }}
    >
      <input
        type="text"
        placeholder="Search keyword (e.g. Apple, Flood, Election)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "12px 14px",
          width: "260px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "14px",
          outline: "none",
        }}
      />

      <button
        type="submit"
        style={{
          padding: "12px 18px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          background: "#222",
          color: "#fff",
          fontSize: "14px",
        }}
      >
        Analyze
      </button>
    </form>
  );
}