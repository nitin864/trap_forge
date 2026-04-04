import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAttacks } from "../App";

export default function TimelineChart() {
  const { stats } = useAttacks();
  const data = stats?.timeline ?? [];
  if (!data.length) return <div className="chart-empty">Collecting data…</div>;
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{top:4,right:4,bottom:0,left:-20}}>
        <defs>
          <linearGradient id="attackGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e87a" stopOpacity={0.3}/>
            <stop offset="100%" stopColor="#00e87a" stopOpacity={0.02}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false}/>
        <XAxis dataKey="time" tick={{fontSize:9,fill:"#3a5068"}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
        <YAxis tick={{fontSize:9,fill:"#3a5068"}} axisLine={false} tickLine={false}/>
        <Tooltip contentStyle={{background:"#0f1826",border:"1px solid #1a2d42",borderRadius:6,fontSize:11}} itemStyle={{color:"#00e87a"}} labelStyle={{color:"#7a8fa5"}} formatter={v=>[v,"attacks"]}/>
        <Area type="monotone" dataKey="count" stroke="#00e87a" strokeWidth={2} fill="url(#attackGrad)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}
