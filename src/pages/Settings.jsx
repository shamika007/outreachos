import { useState } from "react";

export default function Settings() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("oros_settings") || "{}"); } catch { return {}; }
  });
  const [geminiKey, setGeminiKey] = useState(saved.geminiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [toast, setToast] = useState(null);

  function save() {
    const settings = { ...saved, geminiKey };
    localStorage.setItem("oros_settings", JSON.stringify(settings));
    setSaved(settings);
    setToast("✅ Saved!");
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div>
      <h2 className="page-title">⚙️ Settings</h2>
      <p className="page-sub">Add your free Gemini API key to enable AI scraping and scoring.</p>

      {toast && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a", marginBottom: 12 }}>
          {toast}
        </div>
      )}

      <div className="card">
        <label className="label">Google Gemini API Key (Free)</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            type={showKey ? "text" : "password"}
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            placeholder="Paste your Gemini API key here"
            style={{ flex: 1 }}
          />
          <button className="btn btn-secondary btn-sm" onClick={() => setShowKey(!showKey)}>
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
          Get your free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: "#1a1a2e" }}>aistudio.google.com</a> → Get API Key → Free, no billing needed.
        </p>
        <p style={{ fontSize: 11, color: "#aaa" }}>
          🔒 Stored only in your browser. Never shared with anyone.
        </p>
      </div>

      <button className="btn btn-primary btn-full" onClick={save}>Save Settings</button>

      <div className="card" style={{ marginTop: "1rem" }}>
        <label className="label">Status</label>
        <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#555" }}>Gemini API Key</span>
          <span style={{ fontWeight: 500, color: saved.geminiKey ? "#16a34a" : "#dc2626" }}>
            {saved.geminiKey ? "✅ Connected — scraping & scoring enabled" : "❌ Not set"}
          </span>
        </div>
      </div>
    </div>
  );
}
