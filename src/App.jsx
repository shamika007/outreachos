import { useState, useEffect } from "react";
import Generator from "./pages/Generator";
import Leads from "./pages/Leads";
import History from "./pages/History";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

const NAV = [
  { id: "generator", label: "Content Generator", icon: "✨" },
  { id: "leads", label: "Lead Tracker", icon: "👥" },
  { id: "history", label: "Post History", icon: "📋" },
  { id: "calendar", label: "Content Calendar", icon: "📅" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

export default function App() {
  const [page, setPage] = useState("generator");
  const [history, setHistoryRaw] = useState(() => load("oros_history", []));
  const [leads, setLeadsRaw] = useState(() => load("oros_leads", []));
  const [calendar, setCalendarRaw] = useState(() => load("oros_calendar", {}));
  const [toast, setToast] = useState(null);

  function setHistory(v) { const next = typeof v === "function" ? v(history) : v; setHistoryRaw(next); save("oros_history", next); }
  function setLeads(v) { const next = typeof v === "function" ? v(leads) : v; setLeadsRaw(next); save("oros_leads", next); }
  function setCalendar(v) { const next = typeof v === "function" ? v(calendar) : v; setCalendarRaw(next); save("oros_calendar", next); }
  function savePost(post) { setHistory(h => [...h, { ...post, id: Date.now() }]); }

  const settings = load("oros_settings", {});
  const hasGeminiKey = !!settings.geminiKey;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importLead = params.get("import_lead");
    if (importLead === "1") {
      const lead = {
        name: params.get("name") || "",
        company: params.get("company") || "",
        linkedin: params.get("linkedin") || "",
        notes: params.get("notes") || "",
        status: params.get("status") || "New",
      };
      if (lead.name && lead.company) {
        setLeadsRaw(existing => {
          const exists = existing.some(l => l.linkedin === lead.linkedin && l.name === lead.name);
          if (!exists) {
            const updated = [...existing, { ...lead, id: Date.now() }];
            save("oros_leads", updated);
            setToast(`✅ ${lead.name} from ${lead.company} added!`);
            setTimeout(() => setToast(null), 3000);
            return updated;
          }
          return existing;
        });
        setPage("leads");
        window.history.replaceState({}, "", "/");
      }
    }
  }, []);

  return (
    <div className="layout">
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999, background: "#1a1a2e", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🚀</span>
          <div>
            <div className="sidebar-logo-text">OutreachOS</div>
            <div className="sidebar-logo-badge">v2.5 — Gemini powered</div>
          </div>
        </div>

        {NAV.map(n => (
          <button key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
            {n.id === "settings" && !hasGeminiKey && (
              <span style={{ marginLeft: "auto", background: "#dc2626", borderRadius: "50%", width: 7, height: 7, display: "inline-block" }} />
            )}
          </button>
        ))}

        <div style={{ marginTop: "auto", padding: "1rem 0 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
            {hasGeminiKey ? "✅ Gemini connected" : "⚠️ Add Gemini key in Settings"}<br />
            {leads.length} leads · {history.length} posts
          </div>
        </div>
      </aside>

      <main className="content">
        {!hasGeminiKey && page !== "settings" && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", fontSize: 13, color: "#854d0e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            ⚠️ Add your free Gemini API key to enable AI scraping and scoring.
            <button className="btn btn-secondary btn-sm" onClick={() => setPage("settings")}>Go to Settings →</button>
          </div>
        )}
        {page === "generator" && <Generator onSave={savePost} />}
        {page === "leads" && <Leads leads={leads} setLeads={setLeads} />}
        {page === "history" && <History history={history} setHistory={setHistory} />}
        {page === "calendar" && <Calendar history={history} calendar={calendar} setCalendar={setCalendar} />}
        {page === "analytics" && <Analytics leads={leads} history={history} />}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}
