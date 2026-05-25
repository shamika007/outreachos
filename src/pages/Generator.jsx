import { useState } from "react";
import { generatePost } from "../api";

const PLATFORMS = [
  { id: "linkedin", label: "💼 LinkedIn" },
  { id: "twitter", label: "𝕏 Twitter" },
  { id: "both", label: "⚡ Both" },
];
const TONES = ["Professional", "Founder story", "Beginner-friendly", "Bold & punchy", "Humble & honest"];

export default function Generator({ onSave }) {
  const [update, setUpdate] = useState("");
  const [platform, setPlatform] = useState("linkedin");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!update.trim()) return;
    setLoading(true); setError(null); setResult(null); setCopied(false);
    try {
      const post = await generatePost(update, platform, tone);
      setResult(post);
      onSave({ text: post, platform, tone, update, date: new Date().toISOString() });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h2 className="page-title">Content Generator</h2>
      <p className="page-sub">Turn your startup update into a ready-to-post LinkedIn or X post.</p>

      <div className="card">
        <label className="label">What's your update?</label>
        <textarea
          rows={4}
          placeholder="e.g. We just onboarded our first 10 paying customers. Our AI tool reduced their manual work by 60%."
          value={update}
          onChange={e => setUpdate(e.target.value)}
        />
      </div>

      <div className="card">
        <label className="label">Platform</label>
        <div className="tabs" style={{ marginBottom: "1rem" }}>
          {PLATFORMS.map(p => (
            <button key={p.id} className={`tab ${platform === p.id ? "active" : ""}`} onClick={() => setPlatform(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <label className="label">Tone</label>
        <div className="chips">
          {TONES.map(t => (
            <button key={t} className={`chip ${tone === t ? "active" : ""}`} onClick={() => setTone(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={handleGenerate} disabled={loading || !update.trim()}>
        {loading ? "✨ Writing your post..." : "✨ Generate content"}
      </button>

      {error && <div className="error-box">⚠️ {error}</div>}

      {result && (
        <div className="result-box">
          <div className="result-header">
            <span className="result-label">
              {platform === "linkedin" ? "💼 LinkedIn" : platform === "twitter" ? "𝕏 Twitter" : "⚡ Both"} Post
            </span>
            <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>
          <div className="result-text">{result}</div>
          <div className="result-stats">
            <span>{result.split(/\s+/).filter(Boolean).length} words</span>
            <span>{result.length} characters</span>
          </div>
        </div>
      )}
    </div>
  );
}
