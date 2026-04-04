import { useAttacks } from "../App";

export default function StatCards() {
  const { stats, attacks } = useAttacks();
  const criticals = attacks.filter(a => a.severity === "critical").length;
  const highs = attacks.filter(a => a.severity === "high").length;
  const uniqueIPs = stats?.unique_ips ?? 0;
  const total = stats?.total ?? attacks.length;
  const topIntent = stats?.top_intents?.[0]?.[0] ?? "—";
  const byService = stats?.by_service || {};
  const topService = Object.entries(byService).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";

  const cards = [
    { label:"Total Events", value:total.toLocaleString(), sub:"All attack probes", icon:"⚡", accent:"var(--green)" },
    { label:"Unique IPs", value:uniqueIPs.toLocaleString(), sub:"Distinct attackers", icon:"🌐", accent:"var(--blue)" },
    { label:"Critical", value:criticals.toLocaleString(), sub:`${highs} high severity`, icon:"🚨", accent:"var(--red)" },
    { label:"Top Threat", value:topIntent.replace(/_/g," "), sub:`Via ${topService}`, icon:"◉", accent:"var(--amber)" },
  ];

  return (
    <div className="grid-4">
      {cards.map(c => (
        <div className="stat-card" key={c.label} style={{"--card-accent": c.accent}}>
          <div className="stat-card-icon">{c.icon}</div>
          <div className="stat-card-label">{c.label}</div>
          <div className="stat-card-value">{c.value}</div>
          <div className="stat-card-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
