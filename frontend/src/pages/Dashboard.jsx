import { useAttacks } from "../App";
import StatCards from "../components/StatCards";
import AttackFeed from "../components/AttackFeed";
import IntentChart from "../components/IntentChart";
import AttackMap from "../components/AttackMap";
import ServiceBreakdown from "../components/ServiceBreakdown";
import TimelineChart from "../components/TimelineChart";
import AlertToast from "../components/AlertToast";
import SeverityBadge from "../components/SeverityBadge";

export default function Dashboard() {
  const { connected, attacks } = useAttacks();

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-hex">⬡</span>
            <span className="logo-text">TrapForge</span>
          </div>
          <span className="logo-sub">AI Adaptive Honeypot · Forge the perfect trap</span>
        </div>
        <div className="header-right">
          <div className={`ws-indicator ${connected ? "live" : "offline"}`}>
            <span className="ws-dot" />
            {connected ? "LIVE" : "RECONNECTING..."}
          </div>
          <div className="attack-counter">
            {attacks.length.toLocaleString()} events captured
          </div>
        </div>
      </header>

      {/* Alert toasts */}
      <AlertToast />

      {/* Stat cards row */}
      <section className="section">
        <StatCards />
      </section>

      {/* Main grid */}
      <div className="main-grid">
        {/* Left column */}
        <div className="col-left">
          <div className="panel">
            <div className="panel-title">Live attack timeline</div>
            <TimelineChart />
          </div>
          <div className="panel">
            <div className="panel-title">Attack origin map</div>
            <AttackMap />
          </div>
        </div>

        {/* Center column — feed */}
        <div className="col-center">
          <div className="panel feed-panel">
            <div className="panel-title">
              Live attack feed
              <span className="feed-count">{attacks.length} events</span>
            </div>
            <AttackFeed />
          </div>
        </div>

        {/* Right column */}
        <div className="col-right">
          <div className="panel">
            <div className="panel-title">Intent breakdown</div>
            <IntentChart />
          </div>
          <div className="panel">
            <div className="panel-title">Services targeted</div>
            <ServiceBreakdown />
          </div>
        </div>
      </div>
    </div>
  );
}
