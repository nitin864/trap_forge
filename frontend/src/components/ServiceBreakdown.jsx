import { useAttacks } from "../App";

const SVC_COLORS = { SSH:"#2d9cff", FTP:"#a855f7", HTTP:"#ffaa00", MySQL:"#ff3363", SMTP:"#00d4ff" };

export default function ServiceBreakdown() {
  const { stats } = useAttacks();
  const raw = stats?.by_service ?? {};
  const total = Object.values(raw).reduce((a,b)=>a+b,0)||1;
  const sorted = Object.entries(raw).sort((a,b)=>b[1]-a[1]);
  if (!sorted.length) return <div className="chart-empty">No data yet…</div>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {sorted.map(([svc,count])=>(
        <div key={svc} className="compare-row">
          <div className="compare-label">
            <span className="compare-label-name" style={{color:SVC_COLORS[svc]||"#aaa"}}>{svc}</span>
            <span className="compare-label-count">{count}</span>
          </div>
          <div className="compare-bar-track">
            <div className="compare-bar-fill" style={{width:`${(count/total)*100}%`,background:SVC_COLORS[svc]||"#555"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}
