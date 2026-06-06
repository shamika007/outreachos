import { useState } from "react";
import { generateOutreachMessage } from "../api";

const STATUSES = ["New", "Contacted", "Replied", "Closed"];
const STATUS_CLASS = { New: "status-new", Contacted: "status-contacted", Replied: "status-replied", Closed: "status-closed" };
const GRADE_COLOR = { Hot: "#dc2626", Warm: "#d97706", Cold: "#6b7280" };
const GRADE_BG = { Hot: "#fef2f2", Warm: "#fef9c3", Cold: "#f3f4f6" };

// ── Groq API helpers ────────────────────────────────────
async function callGroq(prompt) {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error("No Groq API key found in .env file.");

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.4,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error?.message || "Groq API error");
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function scrapeProfileWithGroq(linkedinUrl) {
  // Extract username from URL for context
  const username = linkedinUrl.replace(/\/$/, "").split("/").pop() || "";
  const readableName = username.replace(/-/g, " ").replace(/\d+/g, "").trim();

  const prompt = `You are a LinkedIn profile analyst. Based on this LinkedIn profile URL and username, generate a realistic and detailed professional profile for outreach purposes.

LinkedIn URL: ${linkedinUrl}
Username/handle: ${username}
Inferred name hint: ${readableName}

Generate a realistic profile. Return ONLY valid JSON, no markdown, no backticks:
{
  "name": "inferred full name from username",
  "title": "likely current job title based on their handle",
  "company": "likely company name if inferable, else empty string",
  "seniority": "one of: Junior, Mid, Senior, Manager, Director, VP, C-Suite, Founder",
  "company_size": "one of: 1-10, 10-50, 50-200, 200-1000, 1000+",
  "location": "likely location if inferable, else empty string",
  "about": "2-3 sentence professional summary",
  "recent_activity": "",
  "skills": ["skill1", "skill2", "skill3"]
}`;

  const result = await callGroq(prompt);
  const clean = result.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function scoreLeadWithGroq(lead) {
  const prompt = `You are a strict B2B sales analyst for an AI automation startup that helps businesses save time on manual outreach and content creation.

Score this lead for outreach potential based on their profile data:
Name: ${lead.name}
Title: ${lead.title || "unknown"}
Company: ${lead.company || "unknown"}
Seniority: ${lead.seniority || "unknown"}
Company Size: ${lead.company_size || "unknown"}
Location: ${lead.location || "unknown"}
About: ${lead.about || "none"}
Recent Activity: ${lead.recent_activity || "none"}
Skills: ${Array.isArray(lead.skills) ? lead.skills.join(", ") : "none"}
Notes: ${lead.notes || "none"}

Scoring rules (be realistic and strict):
- C-Suite, Founder, VP at small/mid company = 7-9
- Manager/Director at relevant company = 5-7
- Junior or unknown seniority = 2-4
- No data available = 3
- Only give 9-10 if they are clearly a decision maker at a company that needs AI automation

Return ONLY valid JSON, no markdown:
{
  "score": <number 1-10>,
  "grade": "<Hot or Warm or Cold>",
  "reason": "<2 specific sentences using their actual data to justify the score>",
  "best_angle": "<one specific personalized outreach angle based on their role and company>"
}`;

  const result = await callGroq(prompt);
  const clean = result.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Components ────────────────────────────────────────────
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

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead || { name: "", company: "", linkedin: "", notes: "", status: "New", title: "", seniority: "", company_size: "", about: "", location: "" });
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleScrape() {
    if (!form.linkedin) { setScrapeError("Enter a LinkedIn URL first."); return; }
    setScraping(true); setScrapeError(null);
    try {
      const data = await scrapeProfileWithGroq(form.linkedin);
      setForm(f => ({
        ...f,
        name: data.name || f.name,
        company: data.company || f.company,
        title: data.title || f.title,
        seniority: data.seniority || f.seniority,
        company_size: data.company_size || f.company_size,
        location: data.location || f.location,
        about: data.about || f.about,
        recent_activity: data.recent_activity || f.recent_activity,
        skills: data.skills || f.skills,
      }));
    } catch (err) { setScrapeError(err.message); }
    setScraping(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{lead ? "Edit Lead" : "Add New Lead"}</h3>

        <div className="form-group">
          <label className="label">LinkedIn URL</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={form.linkedin || ""} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." style={{ flex: 1 }} />
            <button className="btn btn-secondary btn-sm" onClick={handleScrape} disabled={scraping}>
              {scraping ? "⏳ Reading..." : "✨ Auto-fill"}
            </button>
          </div>
          {scrapeError && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>⚠️ {scrapeError}</div>}
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Paste LinkedIn URL → Auto-fill → AI infers profile details</div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Name *</label>
            <input value={form.name || ""} onChange={e => set("name", e.target.value)} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="label">Company *</label>
            <input value={form.company || ""} onChange={e => set("company", e.target.value)} placeholder="Company" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Job Title</label>
            <input value={form.title || ""} onChange={e => set("title", e.target.value)} placeholder="CEO, Founder..." />
          </div>
          <div className="form-group">
            <label className="label">Seniority</label>
            <select value={form.seniority || ""} onChange={e => set("seniority", e.target.value)}>
              <option value="">Select...</option>
              {["Junior","Mid","Senior","Manager","Director","VP","C-Suite","Founder"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Company Size</label>
            <select value={form.company_size || ""} onChange={e => set("company_size", e.target.value)}>
              <option value="">Select...</option>
              {["1-10","10-50","50-200","200-1000","1000+"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Location</label>
            <input value={form.location || ""} onChange={e => set("location", e.target.value)} placeholder="City, Country" />
          </div>
        </div>

        <div className="form-group">
          <label className="label">About / Bio</label>
          <textarea rows={2} value={form.about || ""} onChange={e => set("about", e.target.value)} placeholder="Auto-filled or type manually..." />
        </div>

        <div className="form-group">
          <label className="label">Notes</label>
          <textarea rows={2} value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Anything extra you know..." />
        </div>

        <div className="form-group">
          <label className="label">Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
        {loading && <p style={{ color: "#888", fontSize: 14, textAlign: "center", padding: "1rem" }}>✨ Writing...</p>}
        {error && <div className="error-box">⚠️ {error}</div>}
        {message && (
          <>
            <div className="outreach-result">{message}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copy}>{copied ? "✓ Copied!" : "Copy"}</button>
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
    try { const res = await scoreLeadWithGroq(lead); setResult(res); onScored(res); }
    catch (err) { setError(err.message); }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">🎯 Score Lead — {lead.name}</h3>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
          AI analyzes profile data and gives a realistic score.
          {!lead.title && !lead.about && <span style={{ color: "#d97706" }}> ⚠️ Use Auto-fill first for best results.</span>}
        </p>
        {!result && !loading && <button className="btn btn-primary btn-full" onClick={handleScore}>🎯 Score this lead</button>}
        {loading && <p style={{ color: "#888", fontSize: 14, textAlign: "center", padding: "1rem" }}>🎯 Analyzing lead...</p>}
        {error && <div className="error-box">⚠️ {error}</div>}
        {result && (
          <div>
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: 52, fontWeight: 700, color: GRADE_COLOR[result.grade] }}>{result.score}</div>
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
  const [scoreLeadModal, setScoreLeadModal] = useState(null);
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
          <p className="page-sub">AI-powered scoring and outreach — free with Groq.</p>
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
              <tr><th>Name</th><th>Company</th><th>AI Score</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {sorted.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{lead.name}</div>
                    {lead.title && <div style={{ fontSize: 11, color: "#888" }}>{lead.title}</div>}
                    {lead.linkedin && <a className="lead-linkedin" href={lead.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
                  </td>
                  <td>
                    <div style={{ fontSize: 14, color: "#555" }}>{lead.company}</div>
                    {lead.company_size && <div style={{ fontSize: 11, color: "#aaa" }}>{lead.company_size} employees</div>}
                    {lead.location && <div style={{ fontSize: 11, color: "#aaa" }}>{lead.location}</div>}
                  </td>
                  <td>
                    {lead.score ? (
                      <div>
                        <ScoreBadge score={lead.score} grade={lead.grade} />
                        {lead.score_reason && <div style={{ fontSize: 10, color: "#888", marginTop: 3, maxWidth: 150, lineHeight: 1.4 }}>{lead.score_reason}</div>}
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => setScoreLeadModal(lead)}>🎯 Score</button>
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
                      <button className="btn btn-secondary btn-sm" onClick={() => setOutreachLead(lead)}>✉️</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditLead(lead)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteLead(lead.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showAdd || editLead) && <LeadModal lead={editLead} onClose={() => { setShowAdd(false); setEditLead(null); }} onSave={saveLead} />}
      {outreachLead && <OutreachModal lead={outreachLead} onClose={() => setOutreachLead(null)} />}
      {scoreLeadModal && <ScoreModal lead={scoreLeadModal} onClose={() => setScoreLeadModal(null)} onScored={(result) => handleScored(scoreLeadModal, result)} />}
    </div>
  );
}
