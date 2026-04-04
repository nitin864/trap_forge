import { useAttacks } from "../App";
import SeverityBadge from "./SeverityBadge";

const INTENT_ICONS = {
  recon: "◎",
  brute_force: "⚡",
  credential_theft: "⚿",
  sql_injection: "⛁",
  privilege_escalation: "▲",
  malware_deploy: "☣",
  data_exfil: "◈",
  xss: "✕",
  apt: "◉",
  script_kiddie: "◇",
};

const SERVICE_COLORS = {
  SSH:   "#33aaff",
  FTP:   "#aa88ff",
  HTTP:  "#ffcc33",
  MySQL: "#ff6699",
  SMTP:  "#33ffcc",
};

export default function AttackFeed() {
  const { attacks } = useAttacks();

  return (
    <div className="attack-feed">
      <div className="feed-header-row">
        <span>Time</span>
        <span>IP</span>
        <span>Svc</span>
        <span>Intent</span>
        <span>Command</span>
        <span>Conf.</span>
        <span>Sev.</span>
      </div>
      <div className="feed-rows">
        {attacks.slice(0, 80).map((a, i) => (
          <div
            key={a.id}
            className={`feed-row ${i === 0 ? "feed-row-new" : ""}`}
          >
            <span className="feed-time">
              {a.timestamp ? a.timestamp.slice(11, 19) : "--:--:--"}
            </span>
            <span className="feed-ip">{a.ip}</span>
            <span
              className="feed-svc"
              style={{ color: SERVICE_COLORS[a.service] || "#aaa" }}
            >
              {a.service}
            </span>
            <span className="feed-intent">
              <span className="intent-icon">{INTENT_ICONS[a.intent] || "·"}</span>
              {a.intent?.replace(/_/g, " ")}
            </span>
            <span className="feed-cmd" title={a.command}>
              {a.command?.slice(0, 32)}{a.command?.length > 32 ? "…" : ""}
            </span>
            <span className="feed-conf">
              {(a.confidence * 100).toFixed(0)}%
            </span>
            <span>
              <SeverityBadge level={a.severity} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
