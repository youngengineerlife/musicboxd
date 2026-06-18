"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(
      `https://musicbrainz.org/ws/2/release?query=release:${encodeURIComponent(query)}&fmt=json&limit=10`,
      { headers: { "User-Agent": "musicboxd/1.0 (anonymoususer2000710@gmail.com)" } }
    );
    const data = await res.json();
    const releases = data.releases ?? [];
    const withArt = releases.map((r) => ({
      mbid: r.id,
      title: r.title,
      artist: r["artist-credit"]?.[0]?.name ?? "Unknown",
      coverUrl: `https://coverartarchive.org/release/${r.id}/front-250`,
    }));
    setResults(withArt);
    setLoading(false);
  }

  function toggleSelect(album) {
    const already = selections.find((s) => s.mbid === album.mbid);
    if (already) {
      setSelections(selections.filter((s) => s.mbid !== album.mbid));
    } else {
      if (selections.length >= 4) return;
      setSelections([...selections, album]);
    }
  }

  async function saveGrid() {
    if (selections.length !== 4) return alert("Pick exactly 4 albums");
    const { data, error } = await supabase
      .from("album_grids")
      .insert({
        album1_url: selections[0].coverUrl,
        album2_url: selections[1].coverUrl,
        album3_url: selections[2].coverUrl,
        album4_url: selections[3].coverUrl,
      })
      .select("id")
      .single();
    if (error) return alert("Error saving: " + error.message);
    setSavedId(data.id);
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>musicboxd</h1>
      <p>Search and pick 4 albums for your widget.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search albums..."
          style={{ flex: 1, padding: 8, fontSize: 16 }}
        />
        <button onClick={search} style={{ padding: "8px 16px" }}>
          Search
        </button>
      </div>

      {loading && <p>Searching...</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24 }}>
        {selections.map((s) => (
          <img
            key={s.mbid}
            src={s.coverUrl}
            alt={s.title}
            style={{ width: "100%", aspectRatio: "1", objectFit: "cover", cursor: "pointer", outline: "3px solid purple" }}
            onClick={() => toggleSelect(s)}
          />
        ))}
        {Array.from({ length: 4 - selections.length }).map((_, i) => (
          <div key={i} style={{ aspectRatio: "1", background: "#eee" }} />
        ))}
      </div>

      <button
        onClick={saveGrid}
        disabled={selections.length !== 4}
        style={{ padding: "10px 24px", fontSize: 16, marginBottom: 24 }}
      >
        Save my grid ({selections.length}/4)
      </button>

      {savedId && (
        <div style={{ background: "#f0f0f0", padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <p>Your widget ID:</p>
          <code style={{ fontSize: 14, wordBreak: "break-all" }}>{savedId}</code>
          <p style={{ marginTop: 8, fontSize: 13 }}>Copy this — you'll paste it into Scriptable.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {results.map((album) => {
          const selected = selections.find((s) => s.mbid === album.mbid);
          return (
            <div
              key={album.mbid}
              onClick={() => toggleSelect(album)}
              style={{ cursor: "pointer", outline: selected ? "3px solid purple" : "none" }}
            >
              <img
                src={album.coverUrl}
                alt={album.title}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                onError={(e) => (e.target.style.display = "none")}
              />
              <p style={{ fontSize: 12, margin: "4px 0 0" }}>{album.title}</p>
              <p style={{ fontSize: 11, color: "#666", margin: 0 }}>{album.artist}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
