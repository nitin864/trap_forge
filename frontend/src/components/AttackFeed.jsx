import { useAttacks } from "../App";

const INTENT_ICONS = { recon:"◎",brute_force:"⚡",credential_theft:"⚿",sql_injection:"⛁",privilege_escalation:"▲",malware_deploy:"☣",data_exfil:"◈",xss:"✕",apt:"◉",script_kiddie:"◇" };

export default function AttackFeed({ limit=80 }) {
  const { attacks } = useAttacks();
  return (
    <div className="attack-table-wrap">
      <table className="attack-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>IP Address</th>
            <th>Service</th>
            <th>Intent</th>
            <th>Severity</th>
            <th>Conf</th>
            <th>Command</th>
          </tr>
        </thead>
        <tbody>
          {attacks.slice(0, limit).map((a, i) => (
            <tr key={a.id} className={i === 0 ? "row-new" : ""}>
              <td><span className="text-mono text-xs text-muted">{a.timestamp?.slice(11,19) || "--:--:--"}</span></td>
              <td><span className="ip-tag">{a.ip}</span></td>
              <td><span className={`svc-tag svc-${a.service}`}>{a.service}</span></td>
              <td>
                <div className="intent-cell">
                  <span className="intent-icon">{INTENT_ICONS[a.intent] || "·"}</span>
                  <span className="text-xs">{(a.intent||"").replace(/_/g," ")}</span>
                </div>
              </td>
              <td><span className={`sev-badge sev-${a.severity}`}>{a.severity}</span></td>
              <td>
                <div className="conf-bar-wrap">
                  <div className="conf-bar"><div className="conf-bar-fill" style={{width:`${(a.confidence||0)*100}%`}} /></div>
                  <span className="text-mono text-xs text-muted">{((a.confidence||0)*100).toFixed(0)}%</span>
                </div>
              </td>
              <td><span className="cmd-cell" title={a.command}>{(a.command||"").slice(0,40)}{(a.command||"").length>40?"…":""}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
