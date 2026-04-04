import { useAttacks } from "../App";

function project(lat, lon, w=620, h=310) {
  return { x: Math.round(((lon+180)/360)*w), y: Math.round(((90-lat)/180)*h) };
}
const SEVERITY_COLOR = { critical:"#ff3347", high:"#ffaa00", medium:"#ffe033", low:"#00e87a" };
const COUNTRIES = [
  {name:"Russia",pts:[[68,30],[72,60],[70,90],[65,110],[60,130],[55,140],[50,135],[52,110],[55,90],[60,60],[65,40],[68,30]]},
  {name:"China",pts:[[40,75],[45,80],[48,90],[45,100],[42,110],[35,120],[25,120],[22,110],[25,100],[30,90],[35,80],[40,75]]},
  {name:"USA",pts:[[48,-125],[49,-95],[48,-85],[45,-83],[42,-82],[41,-70],[35,-75],[30,-80],[25,-80],[25,-97],[30,-97],[32,-117],[37,-122],[48,-125]]},
  {name:"Canada",pts:[[60,-140],[65,-120],[70,-100],[65,-80],[60,-75],[55,-70],[50,-60],[45,-63],[42,-82],[45,-83],[48,-85],[49,-95],[60,-110],[60,-140]]},
  {name:"Brazil",pts:[[-5,-35],[-10,-37],[0,-50],[5,-60],[0,-73],[-10,-75],[-20,-70],[-30,-55],[-33,-53],[-28,-48],[-20,-40],[-10,-35],[-5,-35]]},
  {name:"Australia",pts:[[-15,130],[-12,136],[-14,142],[-18,146],[-28,154],[-37,150],[-38,146],[-35,138],[-32,132],[-25,113],[-20,114],[-15,130]]},
  {name:"India",pts:[[8,77],[10,80],[13,80],[20,87],[23,92],[28,97],[35,77],[28,72],[23,68],[18,73],[12,78],[8,77]]},
  {name:"Europe",pts:[[70,28],[60,30],[55,24],[53,14],[48,17],[43,28],[37,37],[36,28],[43,5],[47,2],[50,-5],[54,5],[58,8],[58,22],[65,26],[70,28]]},
  {name:"Africa",pts:[[37,10],[32,32],[22,37],[12,42],[5,40],[-5,40],[-12,37],[-25,33],[-34,26],[-35,19],[-22,17],[-5,12],[5,2],[5,-8],[10,-17],[15,-17],[20,-17],[25,-15],[30,-8],[37,10]]},
  {name:"MiddleEast",pts:[[37,36],[30,48],[22,55],[15,50],[12,43],[15,38],[22,38],[28,34],[33,36],[37,36]]},
  {name:"SEAsia",pts:[[10,100],[15,100],[22,104],[25,100],[20,96],[18,96],[12,100],[5,100],[1,104],[5,103],[10,100]]},
  {name:"Japan",pts:[[31,131],[33,132],[35,136],[37,137],[40,140],[43,141],[44,145],[42,143],[38,141],[35,137],[33,131],[31,131]]},
];
function isSeverer(a,b){const r={critical:4,high:3,medium:2,low:1};return(r[a]||0)>(r[b]||0);}

export default function AttackMap() {
  const { attacks } = useAttacks();
  const points = {};
  for (const a of attacks) {
    const c = a.country;
    if (!c?.lat) continue;
    const key = `${c.lat},${c.lon}`;
    if (!points[key]||isSeverer(a.severity,points[key].severity)) {
      points[key] = {...c, severity:a.severity, count:(points[key]?.count||0)+1};
    }
  }
  return (
    <div className="attack-map-wrap">
      <svg viewBox="0 0 620 310" className="world-svg" style={{background:"#050a0f",borderRadius:8}}>
        <rect x="0" y="0" width="620" height="310" fill="#050a0f"/>
        {[80,160,240,320,400,480,560].map(x=><line key={`v${x}`} x1={x} y1="0" x2={x} y2="310" stroke="#0d1a28" strokeWidth="0.5"/>)}
        {[62,124,186,248].map(y=><line key={`h${y}`} x1="0" y1={y} x2="620" y2={y} stroke="#0d1a28" strokeWidth="0.5"/>)}
        <line x1="0" y1="155" x2="620" y2="155" stroke="#0f2018" strokeWidth="0.8" strokeDasharray="4 4"/>
        {COUNTRIES.map(c=>{
          const pts=c.pts.map(([lat,lon])=>{const p=project(lat,lon);return`${p.x},${p.y}`;}).join(" ");
          return <polygon key={c.name} points={pts} fill="#0e1e18" stroke="#162a20" strokeWidth="0.8"/>;
        })}
        {Object.entries(points).map(([key,p])=>{
          const{x,y}=project(p.lat,p.lon);
          const r=Math.min(3+Math.log2(p.count+1)*2.5,12);
          const color=SEVERITY_COLOR[p.severity]||"#00e87a";
          return (
            <g key={key}>
              <circle cx={x} cy={y} r={r+9} fill={color} opacity={0.05}/>
              <circle cx={x} cy={y} r={r+5} fill={color} opacity={0.1}/>
              <circle cx={x} cy={y} r={r+2} fill={color} opacity={0.2}/>
              <circle cx={x} cy={y} r={r} fill={color} opacity={0.9}/>
              <circle cx={x} cy={y} r={r*0.35} fill="#fff" opacity={0.6}/>
              <title>{p.country} ({p.city}) — {p.count} attacks — {p.severity}</title>
            </g>
          );
        })}
      </svg>
      <div className="map-legend">
        {Object.entries(SEVERITY_COLOR).map(([sev,color])=>(
          <span key={sev} className="map-legend-item">
            <span style={{background:color,width:8,height:8,borderRadius:"50%",display:"inline-block"}}/>
            {sev}
          </span>
        ))}
      </div>
    </div>
  );
}
