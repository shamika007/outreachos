import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return { first, days };
}

export default function Calendar({ history, calendar, setCalendar }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const { first, days } = getCalendarDays(viewYear, viewMonth);

  function dateKey(d) { return `${viewYear}-${viewMonth + 1}-${d}`; }

  function assignPost(postId) {
    const key = dateKey(selectedDay);
    const existing = calendar[key] || [];
    if (!existing.includes(postId)) {
      setCalendar({ ...calendar, [key]: [...existing, postId] });
    }
    setShowPicker(false);
  }

  function removePost(day, postId) {
    const key = dateKey(day);
    setCalendar({ ...calendar, [key]: (calendar[key] || []).filter(id => id !== postId) });
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div>
      <h2 className="page-title">Content Calendar</h2>
      <p className="page-sub">Schedule your posts for the month. Click a day to assign a post.</p>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
        <button className="btn btn-secondary btn-sm" onClick={prevMonth}>← Prev</button>
        <span style={{ fontWeight: 600, fontSize: "15px", color: "#1a1a2e", minWidth: "160px", textAlign: "center" }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={nextMonth}>Next →</button>
      </div>

      <div className="calendar-grid">
        {DAYS.map(d => <div key={d} className="cal-header-cell">{d}</div>)}
        {cells.map((day, i) => {
          const key = day ? dateKey(day) : null;
          const assigned = key ? (calendar[key] || []) : [];
          const isToday = day && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
          return (
            <div
              key={i}
              className={`cal-cell ${!day ? "empty" : ""} ${isToday ? "today" : ""}`}
              onClick={() => { if (day) { setSelectedDay(day); setShowPicker(true); } }}
            >
              {day && <div className="cal-day">{day}</div>}
              {assigned.map(pid => {
                const post = history.find(p => p.id === pid);
                if (!post) return null;
                return (
                  <div key={pid} className="cal-post-dot" title={post.text}
                    onClick={e => { e.stopPropagation(); removePost(day, pid); }}>
                    ✕ {post.platform === "linkedin" ? "LI" : post.platform === "twitter" ? "X" : "Both"}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: "12px", color: "#bbb", marginTop: "8px" }}>Click a post dot to remove it from that day.</p>

      {showPicker && selectedDay && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Assign post to {MONTHS[viewMonth]} {selectedDay}</h3>
            {history.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#888" }}>No posts in history yet. Generate some in the Content Generator first.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                {[...history].reverse().map(post => (
                  <div key={post.id}
                    className="history-item"
                    style={{ cursor: "pointer", padding: "10px 12px" }}
                    onClick={() => assignPost(post.id)}
                  >
                    <div className="history-meta">
                      <span className="history-platform">{post.platform}</span>
                      <span className="history-tone">{post.tone}</span>
                    </div>
                    <div className="history-preview">{post.text}</div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary btn-sm" style={{ marginTop: "12px" }} onClick={() => setShowPicker(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
