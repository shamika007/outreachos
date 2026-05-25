import { useState } from "react";
import { generateOutreachMessage } from "../api";

const STATUSES = ["New", "Contacted", "Replied", "Closed"];
const STATUS_CLASS = { New: "status-new", Contacted: "status-contacted", Replied: "status-replied", Closed: "status-closed" };

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
          <button className="btn btn-primary" onClick={() => { if (form.name && form.company) onSave(form); }}>
            Save Lead
          </button>
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
    try {
      const msg = await generateOutreachMessage(lead);
      setMessage(msg);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function copy() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">✉️ Outreach for {lead.name} @ {lead.company}</h3>
        {!message && !loading && (
          <button className="btn btn-primary btn-full" onClick={generate}>Generate message with AI</button>
        )}
        {loading && <p style={{ color: "#888", fontSize: "14px", textAlign: "center", padding: "1rem" }}>✨ Writing your message...</p>}
        {error && <div className="error-box">⚠️ {error}</div>}
        {message && (
          <>
            <div className="outreach-result">{message}</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copy}>{copied ? "✓ Copied!" : "Copy message"}</button>
              <button className="btn btn-secondary btn-sm" onClick={generate}>Regenerate</button>
            </div>
          </>
        )}
        <div style={{ marginTop: "12px" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Leads({ leads, setLeads }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [outreachLead, setOutreachLead] = useState(null);

  function saveLead(form) {
    if (editLead) {
      setLeads(leads.map(l => l.id === editLead.id ? { ...form, id: editLead.id } : l));
      setEditLead(null);
    } else {
      setLeads([...leads, { ...form, id: Date.now() }]);
      setShowAdd(false);
    }
  }

  function deleteLead(id) {
    if (confirm("Delete this lead?")) setLeads(leads.filter(l => l.id !== id));
  }

  function updateStatus(id, status) {
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="page-title">Lead Tracker</h2>
          <p className="page-sub">Track leads and generate AI outreach messages.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Lead</button>
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: "14px" }}>{lead.name}</div>
                    {lead.linkedin && <a className="lead-linkedin" href={lead.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
                  </td>
                  <td style={{ fontSize: "14px", color: "#555" }}>{lead.company}</td>
                  <td>
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      style={{ width: "auto", padding: "4px 8px", fontSize: "12px", border: "none", background: "transparent", cursor: "pointer" }}
                    >
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <span className={`status-badge ${STATUS_CLASS[lead.status]}`}>{lead.status}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
        <LeadModal
          lead={editLead}
          onClose={() => { setShowAdd(false); setEditLead(null); }}
          onSave={saveLead}
        />
      )}
      {outreachLead && <OutreachModal lead={outreachLead} onClose={() => setOutreachLead(null)} />}
    </div>
  );
}
