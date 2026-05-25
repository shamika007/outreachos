import { useMemo } from "react";

const PLATFORM_COLORS = { linkedin: "#0077b5", twitter: "#1a1a2e", both: "#7c3aed" };
const TONE_COLORS = ["#1a1a2e", "#0077b5", "#16a34a", "#d97706", "#dc2626"];
const STATUS_COLORS = { New: "#0369a1", Contacted: "#854d0e", Replied: "#16a34a", Closed: "#6b7280" };

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e3de", borderRadius: 12, padding: "1.25rem", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", letterSpacing: "-1px" }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: "#f0ede8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#bbb" }}>No data</div>;

  let cumulative = 0;
  const segments = data.map(d => {
    const pct = (d.value / total) * 100;
    const seg = { ...d, pct, offset: cumulative };
    cumulative += pct;
    return seg;
  });

  const r = 45, cx = 60, cy = 60, circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0ede8" strokeWidth={18} />
      {segments.map((seg, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth={18}
          strokeDasharray={`${(seg.pct / 100) * circumference} ${circumference}`}
          strokeDashoffset={-((seg.offset / 100) * circumference)}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1a1a2e">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#999">total</text>
    </svg>
  );
}

function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>{d.value}</div>
          <div style={{ width: "100%", height: `${Math.max((d.value / max) * 80, d.value > 0 ? 6 : 0)}px`, background: d.color || "#1a1a2e", borderRadius: "4px 4px 0 0", transition: "height 0.3s ease", minHeight: d.value > 0 ? 6 : 0 }} />
          <div style={{ fontSize: 10, color: "#999", textAlign: "center", lineHeight: 1.3 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
          {item.label} <span style={{ color: "#aaa" }}>({item.value})</span>
        </div>
      ))}
    </div>
  );
}

function WeeklyChart({ history }) {
  const weeks = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      const count = history.filter(p => p.date && p.date.startsWith(key)).length;
      result.push({ label, value: count, color: "#1a1a2e" });
    }
    return result;
  }, [history]);

  return <BarChart data={weeks} />;
}

export default function Analytics({ leads, history }) {
  // Lead stats
  const totalLeads = leads.length;
  const byStatus = ["New", "Contacted", "Replied", "Closed"].map(s => ({
    label: s, value: leads.filter(l => l.status === s).length, color: STATUS_COLORS[s]
  }));
  const replyRate = totalLeads > 0 ? Math.round((leads.filter(l => l.status === "Replied" || l.status === "Closed").length / totalLeads) * 100) : 0;
  const withMessages = leads.filter(l => l.generatedMessage).length;

  // Post stats
  const totalPosts = history.length;
  const byPlatform = ["linkedin", "twitter", "both"].map(p => ({
    label: p === "linkedin" ? "LinkedIn" : p === "twitter" ? "X" : "Both",
    value: history.filter(h => h.platform === p).length,
    color: PLATFORM_COLORS[p]
  }));
  const tones = [...new Set(history.map(h => h.tone))];
  const byTone = tones.map((t, i) => ({
    label: t, value: history.filter(h => h.tone === t).length, color: TONE_COLORS[i % TONE_COLORS.length]
  }));

  return (
    <div>
      <h2 className="page-title">Analytics Dashboard</h2>
      <p className="page-sub">Your outreach and content performance at a glance.</p>

      {/* Top stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <StatCard icon="👥" label="Total Leads" value={totalLeads} sub={`${replyRate}% reply rate`} />
        <StatCard icon="✉️" label="Replied" value={leads.filter(l => l.status === "Replied").length} sub="leads replied" />
        <StatCard icon="✨" label="Posts Generated" value={totalPosts} sub="across all platforms" />
        <StatCard icon="📈" label="Reply Rate" value={`${replyRate}%`} sub="replied + closed" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        {/* Lead status donut */}
        <div className="card">
          <div className="label">Leads by Status</div>
          {totalLeads === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem 0" }}>
              <div className="empty-state-icon" style={{ fontSize: 24 }}>👥</div>
              <div className="empty-state-text">No leads yet</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <DonutChart data={byStatus} />
                <Legend items={byStatus} />
              </div>
            </>
          )}
        </div>

        {/* Posts by platform donut */}
        <div className="card">
          <div className="label">Posts by Platform</div>
          {totalPosts === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem 0" }}>
              <div className="empty-state-icon" style={{ fontSize: 24 }}>✨</div>
              <div className="empty-state-text">No posts yet</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <DonutChart data={byPlatform} />
                <Legend items={byPlatform} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly post activity */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="label">Posts This Week (last 7 days)</div>
        <WeeklyChart history={history} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Posts by tone */}
        <div className="card">
          <div className="label">Posts by Tone</div>
          {byTone.length === 0 ? (
            <div style={{ fontSize: 13, color: "#bbb", padding: "1rem 0" }}>No posts yet</div>
          ) : (
            <>
              <BarChart data={byTone} />
              <Legend items={byTone} />
            </>
          )}
        </div>

        {/* Lead pipeline */}
        <div className="card">
          <div className="label">Lead Pipeline</div>
          {totalLeads === 0 ? (
            <div style={{ fontSize: 13, color: "#bbb", padding: "1rem 0" }}>No leads yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {byStatus.map(s => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#555", fontWeight: 500 }}>{s.label}</span>
                    <span style={{ color: "#888" }}>{s.value} / {totalLeads}</span>
                  </div>
                  <div style={{ height: 6, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${totalLeads > 0 ? (s.value / totalLeads) * 100 : 0}%`, background: s.color, borderRadius: 3, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
