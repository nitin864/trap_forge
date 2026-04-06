import { useAttacks } from "../App";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { id: "dashboard", icon: "⬡", label: "Dashboard", badge: null },
  { id: "attacks", icon: "⚡", label: "Live Attacks", badge: "live" },
  { id: "analytics", icon: "◈", label: "Analytics", badge: null },
  { id: "threatintel", icon: "◉", label: "Threat Intel", badge: null },
  { id: "reports", icon: "📄", label: "Reports", badge: "reports" },
];

export default function Sidebar({ activePage, setActivePage }) {
  const { connected, attacks, reportGenerating, reports, aiSuggestions } = useAttacks();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }
  const critCount = attacks.filter(a => a.severity === "critical").length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⬡</div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">TrapForge</div>
          <div className="sidebar-logo-sub">AI Honeypot</div>
        </div>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          let badgeContent = null;
          let badgeClass = "";
          if (item.badge === "live" && critCount > 0) {
            badgeContent = critCount; badgeClass = "";
          } else if (item.badge === "reports" && reports.length > 0) {
            badgeContent = reports.length; badgeClass = "green";
          }

          return (
            <div
              key={item.id}
              className={`nav-item${activePage === item.id ? " active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {badgeContent !== null && (
                <span className={`nav-badge ${badgeClass}`}>{badgeContent}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* AI Suggestion Indicator */}
      {aiSuggestions.length > 0 && (
        <>
          <div className="sidebar-section-label" style={{ paddingTop: 8 }}>AI Alerts</div>
          <div style={{ padding: "0 10px 8px" }}>
            {aiSuggestions.slice(0, 2).map(s => (
              <div
                key={s.id}
                style={{
                  padding: "7px 10px", borderRadius: 6, marginBottom: 4, cursor: "pointer",
                  background: s.priority === "CRITICAL" ? "rgba(255,51,71,0.08)" : s.priority === "HIGH" ? "rgba(255,170,0,0.07)" : "rgba(0,232,122,0.07)",
                  border: `1px solid ${s.priority === "CRITICAL" ? "rgba(255,51,71,0.25)" : s.priority === "HIGH" ? "rgba(255,170,0,0.2)" : "rgba(0,232,122,0.15)"}`,
                  display: "flex", alignItems: "flex-start", gap: 7,
                }}
                onClick={() => setActivePage("dashboard")}
              >
                <span style={{ fontSize: 13, marginTop: 1 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.priority}</div>
                  <div style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.3 }}>{s.title}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Status footer */}
      <div className="sidebar-status">
        <div className="status-row">
          <span className="status-label">WebSocket</span>
          <div className="status-indicator">
            <div className={`status-dot ${connected ? "live" : "offline"}`} />
            <span style={{ color: connected ? "var(--green)" : "var(--red)" }}>
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>
        <div className="status-row">
          <span className="status-label">Events</span>
          <span className="status-indicator" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>
            {attacks.length.toLocaleString()}
          </span>
        </div>
        {reportGenerating && (
          <div className="report-gen-badge">
            <div className="spinner" />
            <span>Generating report…</span>
          </div>
        )}

        {/* Logout button */}
        <button
          id="tf-logout-btn"
          onClick={handleLogout}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "8px 0",
            background: "transparent",
            border: "1px solid rgba(255,51,51,0.25)",
            borderRadius: 4,
            color: "rgba(255,80,80,0.75)",
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.05em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background 0.15s, border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,51,51,0.07)";
            e.currentTarget.style.borderColor = "rgba(255,51,51,0.5)";
            e.currentTarget.style.color = "#ff5050";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,51,51,0.25)";
            e.currentTarget.style.color = "rgba(255,80,80,0.75)";
          }}
        >
          <span>⏻</span> LOGOUT
        </button>
      </div>
    </aside>
  );
}
