import { useAttacks } from "../App";

export default function StatCards() {
  const { stats, attacks } = useAttacks();

  const criticals = attacks.filter((a) => a.severity === "critical").length;
  const uniqueIPs = stats?.unique_ips ?? 0;
  const total = stats?.total ?? attacks.length;
  const topIntent = stats?.top_intents?.[0]?.[0] ?? "—";

  const cards = [
    { label: "Total attacks", value: total.toLocaleString(), accent: "#00ff99" },
    { label: "Unique IPs", value: uniqueIPs.toLocaleString(), accent: "#33aaff" },
    { label: "Critical events", value: criticals.toLocaleString(), accent: "#ff3333" },
    { label: "Top threat type", value: topIntent.replace("_", " "), accent: "#ffaa00" },
  ];

  return (
    <div className="stat-cards">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-label">{c.label}</div>
          <div className="stat-value" style={{ color: c.accent }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
