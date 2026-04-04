import { useAttacks } from "../App";

export default function AlertToast() {
  const { alertQueue } = useAttacks();
  if (!alertQueue?.length) return null;
  return (
    <div className="toast-container">
      {alertQueue.map(a => (
        <div key={a.id} className={`toast-alert ${a.severity === "high" ? "sev-high" : ""}`}>
          <div className="toast-top">
            <span className={`sev-badge sev-${a.severity}`}>{a.severity}</span>
            <span className="toast-intent">{(a.intent||"").replace(/_/g," ")}</span>
            <span className="toast-ip">{a.ip}</span>
          </div>
          <div className="toast-cmd">{(a.command||"").slice(0,60)}</div>
          <div className="toast-meta">{a.country?.flag} {a.country?.country} · {a.service} · port {a.port}</div>
        </div>
      ))}
    </div>
  );
}
