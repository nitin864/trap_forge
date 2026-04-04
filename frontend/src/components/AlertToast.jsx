import { useAttacks } from "../App";
import SeverityBadge from "./SeverityBadge";

export default function AlertToast() {
  const { alertQueue } = useAttacks();
  if (!alertQueue?.length) return null;

  return (
    <div className="toast-container">
      {alertQueue.map((a) => (
        <div key={a.id} className="toast-alert">
          <div className="toast-top">
            <SeverityBadge level={a.severity} />
            <span className="toast-intent">{a.intent?.replace(/_/g, " ")}</span>
            <span className="toast-ip">{a.ip}</span>
          </div>
          <div className="toast-cmd">{a.command?.slice(0, 60)}</div>
          <div className="toast-mitre">{a.country?.flag} {a.country?.country} · {a.service}</div>
        </div>
      ))}
    </div>
  );
}
