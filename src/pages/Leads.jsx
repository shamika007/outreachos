import { useState } from "react";
import { generateOutreachMessage } from "../api";

const STATUSES = ["New", "Contacted", "Replied", "Closed"];
const STATUS_CLASS = { New: "status-new", Contacted: "status-contacted", Replied: "status-replied", Closed: "status-closed" };
const GRADE_COLOR = { Hot: "#dc2626", Warm: "#d97706", Cold: "#6b7280" };
const GRADE_BG = { Hot: "#fef2f2", Warm: "#fef9c3", Cold: "#f3f4f6" };

function ScoreBadge({ score, grade }) {
  if (!score) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: GRADE_BG[grade] || "#f3f4f6",
      color: GRADE_COLOR[grade] || "#666"
    }}>
      {grade === "Hot" ? "🔥" : grade === "Warm" ? "⚡" : "🧊"} {score}/10 {grade}
    </span>
  );
}

async function scoreLeadWithGroq(lead) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("No Groq API key found.");

  const prompt = `You are a B2B sales analyst for an AI automation startup.

Score this lead for outreach potential based on their profile:
Name: ${lead.name}
Company: ${lead.company}
LinkedIn: ${lead.linkedin || "not provided"}
Notes: ${lead.notes || "none"}

Scoring criteria:
- Seniority and decision-making power
- Company relevance to AI/automation tools
- Potential pain points that AI can solve
- Overall fit

Return ONLY a valid JSON object, nothing else:
{
  "score": <number 1-10>,
  "grade": "<Hot or Warm or Cold>",
  "reason": "<1-2 sentences explaining the score>",
  "best_angle": "<one specific outreach angle to use>"
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.5,
    }),
  });

  if (!response.ok) throw new Error("Scoring API error");
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead || { name: "", company: "", linkedin: "", notes: "", status: "New" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{lead ? "Edit Lead" : "Add New Lead"}</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Priya Sharma" />
          </div>
          <div className="form-group">
            <label className="label">Company *</label>
            <input value={form.company} onChange={e => set("company", e.target.value)} placeholder="TechCorp" />
          </div>
        </div>
        <div className="form-group">
          <label className="label">LinkedIn URL</label>
          <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="What do you know about them?" />
        </div>
        <div className="form-group">
          <label className="label">Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (form.name && form.company) onSave(form); }}>Save Lead</button>
        </div>
      </div>
    </div>
  );
}

function OutreachModal({ lead, onClose }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setLoading(true); setError(null);
    try { setMessage(await generateOutreachMessage(lead)); }
    catch (err) { setError(err.message); }
    setLoading(false);
  }

  function copy() { navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">✉️ Outreach for {lead.name} @ {lead.company}</h3>
        {lead.score && (
          <div style={{ marginBottom: 10 }}>
            <ScoreBadge score={lead.score} grade={lead.grade} />
            {lead.best_angle && <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>💡 Best angle: {lead.best_angle}</div>}
          </div>
        )}
        {!message && !loading && <button className="btn btn-primary btn-full" onClick={generate}>✨ Generate personalized message</button>}
        {loading && <p style={{ color: "#888", fontSize: 14, textAlign: "center", padding: "1rem" }}>✨ Writing personalized message...</p>}
        {error && <div className="error-box">⚠️ {error}</div>}
        {message && (
          <>
            <div className="outreach-result">{message}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copy}>{copied ? "✓ Copied!" : "Copy message"}</button>
              <button className="btn btn-secondary btn-sm" onClick={generate}>Regenerate</button>
            </div>
          </>
        )}
        <div style={{ marginTop: 12 }}><button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

function ScoreModal({ lead, onClose, onScored }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleScore() {
    setLoading(true); setError(null);
    try {
      const res = await scoreLeadWithGroq(lead);
      setResult(res);
      onScored(res);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">🎯 Score Lead — {lead.name}</h3>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>AI will analyze this lead and rate their outreach potential from 1-10.</p>

        {!result && !loading && <button className="btn btn-primary btn-full" onClick={handleScore}>🎯 Score this lead</button>}
        {loading && <p style={{ color: "#888", fontSize: 14, textAlign: "center", padding: "1rem" }}>🎯 Analyzing lead...</p>}
        {error && <div className="error-box">⚠️ {error}</div>}

        {result && (
          <div>
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: GRADE_COLOR[result.grade] }}>{result.score}</div>
              <div style={{ fontSize: 13, color: "#888" }}>out of 10</div>
              <div style={{ marginTop: 8 }}><ScoreBadge score={result.score} grade={result.grade} /></div>
            </div>
            <div style={{ background: "#f5f4f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 10 }}>
              {result.reason}
            </div>
            {result.best_angle && (
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#0369a1", lineHeight: 1.6 }}>
                💡 <strong>Best angle:</strong> {result.best_angle}
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 12 }}><button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function Leads({ leads, setLeads }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [outreachLead, setOutreachLead] = useState(null);
  const [scoreLead, setScoreLead] = useState(null);
  const [sortBy, setSortBy] = useState("date");

  function saveLead(form) {
    if (editLead) {
      setLeads(leads.map(l => l.id === editLead.id ? { ...form, id: editLead.id } : l));
      setEditLead(null);
    } else {
      setLeads([...leads, { ...form, id: Date.now() }]);
      setShowAdd(false);
    }
  }

  function deleteLead(id) { if (confirm("Delete this lead?")) setLeads(leads.filter(l => l.id !== id)); }
  function updateStatus(id, status) { setLeads(leads.map(l => l.id === id ? { ...l, status } : l)); }
  function handleScored(lead, result) {
    setLeads(leads.map(l => l.id === lead.id ? { ...l, score: result.score, grade: result.grade, score_reason: result.reason, best_angle: result.best_angle } : l));
  }

  const sorted = [...leads].sort((a, b) => {
    if (sortBy === "score") return (b.score || 0) - (a.score || 0);
    return b.id - a.id;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="page-title">Lead Tracker</h2>
          <p className="page-sub">Track leads, score them with AI, generate outreach.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ width: "auto", padding: "6px 10px", fontSize: 12, border: "1px solid #e5e3de", borderRadius: 8, background: "#fff" }}>
            <option value="date">Sort: Recent</option>
            <option value="score">Sort: Score 🔥</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Lead</button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-text">No leads yet. Add your first one.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="leads-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>AI Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{lead.name}</div>
                    {lead.linkedin && <a className="lead-linkedin" href={lead.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
                  </td>
                  <td style={{ fontSize: 14, color: "#555" }}>{lead.company}</td>
                  <td>
                    {lead.score ? (
                      <div>
                        <ScoreBadge score={lead.score} grade={lead.grade} />
                        {lead.score_reason && <div style={{ fontSize: 10, color: "#888", marginTop: 3, maxWidth: 150, lineHeight: 1.4 }}>{lead.score_reason}</div>}
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => setScoreLead(lead)}>🎯 Score</button>
                    )}
                  </td>
                  <td>
                    <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                      style={{ width: "auto", padding: "4px 6px", fontSize: 12, border: "none", background: "transparent", cursor: "pointer", marginBottom: 4 }}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <div><span className={`status-badge ${STATUS_CLASS[lead.status]}`}>{lead.status}</span></div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setOutreachLead(lead)}>✉️ Message</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditLead(lead)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteLead(lead.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showAdd || editLead) && (
        <LeadModal lead={editLead} onClose={() => { setShowAdd(false); setEditLead(null); }} onSave={saveLead} />
      )}
      {outreachLead && <OutreachModal lead={outreachLead} onClose={() => setOutreachLead(null)} />}
      {scoreLead && (
        <ScoreModal
          lead={scoreLead}
          onClose={() => setScoreLead(null)}
          onScored={(result) => { handleScored(scoreLead, result); }}
        />
      )}
    </div>
  );
}
