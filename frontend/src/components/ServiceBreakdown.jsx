import { useAttacks } from "../App";

const SVC_COLORS = {
  SSH:   "#33aaff",
  FTP:   "#aa88ff",
  HTTP:  "#ffcc33",
  MySQL: "#ff6699",
  SMTP:  "#33ffcc",
};

export default function ServiceBreakdown() {
  const { stats } = useAttacks();
  const raw = stats?.by_service ?? {};
  const total = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(raw).sort((a, b) => b[1] - a[1]);

  if (!sorted.length) return <div className="chart-empty">No data yet…</div>;

  return (
    <div className="service-bars">
      {sorted.map(([svc, count]) => (
        <div key={svc} className="svc-row">
          <span className="svc-name" style={{ color: SVC_COLORS[svc] || "#aaa" }}>
            {svc}
          </span>
          <div className="svc-bar-track">
            <div
              className="svc-bar-fill"
              style={{
                width: `${(count / total) * 100}%`,
                background: SVC_COLORS[svc] || "#555",
              }}
            />
          </div>
          <span className="svc-count">{count}</span>
        </div>
      ))}
    </div>
  );
}
