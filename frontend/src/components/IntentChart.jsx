import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAttacks } from "../App";

const INTENT_COLORS = {
  recon:"#2d9cff", brute_force:"#ffcc33", credential_theft:"#ff9900",
  sql_injection:"#ff3366", privilege_escalation:"#ff2222",
  malware_deploy:"#cc00ff", data_exfil:"#ff6600",
  xss:"#ffaacc", apt:"#aa0000", script_kiddie:"#33aa55",
};

export default function IntentChart() {
  const { stats } = useAttacks();
  const data = Object.entries(stats?.by_intent ?? {})
    .map(([name, value]) => ({ name: name.replace(/_/g," "), value, raw:name }))
    .sort((a,b)=>b.value-a.value).slice(0,8);

  if (!data.length) return <div className="chart-empty">Awaiting attacks…</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
          {data.map(entry=>(
            <Cell key={entry.raw} fill={INTENT_COLORS[entry.raw]||"#444"} stroke="transparent"/>
          ))}
        </Pie>
        <Tooltip contentStyle={{background:"#0f1826",border:"1px solid #1a2d42",borderRadius:6,fontSize:11}} itemStyle={{color:"#c8d6e5"}} labelStyle={{color:"#7a8fa5"}} formatter={(v,n)=>[v,n]}/>
        <Legend iconType="circle" iconSize={7} formatter={v=><span style={{fontSize:10,color:"#7a8fa5"}}>{v}</span>}/>
      </PieChart>
    </ResponsiveContainer>
  );
}
