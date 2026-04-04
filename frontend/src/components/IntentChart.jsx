import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAttacks } from "../App";

const INTENT_COLORS = {
  recon:               "#33aaff",
  brute_force:         "#ffcc33",
  credential_theft:    "#ff9900",
  sql_injection:       "#ff3366",
  privilege_escalation:"#ff2222",
  malware_deploy:      "#cc00ff",
  data_exfil:          "#ff6600",
  xss:                 "#ffaacc",
  apt:                 "#aa0000",
  script_kiddie:       "#448844",
};

export default function IntentChart() {
  const { stats } = useAttacks();

  const data = Object.entries(stats?.by_intent ?? {})
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value, raw: name }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (!data.length) {
    return <div className="chart-empty">Waiting for attacks…</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={entry.raw}
              fill={INTENT_COLORS[entry.raw] || "#555"}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: 6,
            fontSize: 12,
          }}
          labelStyle={{ color: "#aaa" }}
          itemStyle={{ color: "#eee" }}
          formatter={(value, name) => [value, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: "#aaa" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
