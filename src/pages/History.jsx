import { useState } from "react";

const PLATFORM_LABEL = { linkedin: "💼 LinkedIn", twitter: "𝕏 Twitter", both: "⚡ Both" };

export default function History({ history, setHistory }) {
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);

  function copy(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function deletePost(id) {
    if (confirm("Delete this post from history?")) setHistory(h => h.filter(p => p.id !== id));
  }

  if (history.length === 0) {
    return (
      <div>
        <h2 className="page-title">Post History</h2>
        <p className="page-sub">Every post you generate is saved here automatically.</p>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No posts yet. Generate your first one in the Content Generator.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="page-title">Post History</h2>
          <p className="page-sub">{history.length} post{history.length !== 1 ? "s" : ""} saved.</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Clear all history?")) setHistory([]); }}>
          Clear all
        </button>
      </div>

      {[...history].reverse().map(post => (
        <div key={post.id} className="history-item">
          <div className="history-meta">
            <span className="history-platform">{PLATFORM_LABEL[post.platform] || post.platform}</span>
            <span className="history-tone">{post.tone}</span>
            <span className="history-date">{new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <div className="history-preview" style={expanded === post.id ? { WebkitLineClamp: "unset", overflow: "visible" } : {}}>
            {post.text}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(expanded === post.id ? null : post.id)}>
              {expanded === post.id ? "Collapse" : "Expand"}
            </button>
            <button className={`copy-btn ${copied === post.id ? "copied" : ""}`} onClick={() => copy(post.text, post.id)}>
              {copied === post.id ? "✓ Copied!" : "Copy"}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => deletePost(post.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
