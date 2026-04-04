import { useAttacks } from "../App";

function project(lat, lon, w = 560, h = 280) {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x: Math.round(x), y: Math.round(y) };
}

const SEVERITY_DOT = {
  critical: "#ff2222",
  high:     "#ff9900",
  medium:   "#ffee33",
  low:      "#33ff99",
};

// Country polygons as lat/lon arrays — converted to SVG points via project()
const COUNTRIES = [
  // Russia
  { name:"Russia", pts:[[68,30],[72,60],[70,90],[65,110],[60,130],[55,140],[50,135],[52,110],[55,90],[60,60],[65,40],[68,30]] },
  // China
  { name:"China", pts:[[40,75],[45,80],[48,90],[45,100],[42,110],[35,120],[25,120],[22,110],[25,100],[30,90],[35,80],[40,75]] },
  // USA (continental)
  { name:"USA", pts:[[48,-125],[49,-95],[48,-85],[45,-83],[42,-82],[41,-70],[35,-75],[30,-80],[25,-80],[25,-97],[30,-97],[32,-117],[37,-122],[48,-125]] },
  // Canada
  { name:"Canada", pts:[[60,-140],[65,-120],[70,-100],[65,-80],[60,-75],[55,-70],[50,-60],[45,-63],[42,-82],[45,-83],[48,-85],[49,-95],[60,-110],[60,-140]] },
  // Brazil
  { name:"Brazil", pts:[[-5,-35],[-10,-37],[0,-50],[5,-60],[0,-73],[-10,-75],[-20,-70],[-30,-55],[-33,-53],[-28,-48],[-20,-40],[-10,-35],[-5,-35]] },
  // Australia
  { name:"Australia", pts:[[-15,130],[-12,136],[-14,142],[-18,146],[-28,154],[-37,150],[-38,146],[-35,138],[-32,132],[-25,113],[-20,114],[-15,130]] },
  // India
  { name:"India", pts:[[8,77],[10,80],[13,80],[20,87],[23,92],[28,97],[35,77],[28,72],[23,68],[18,73],[12,78],[8,77]] },
  // Europe (simplified block)
  { name:"Europe", pts:[[70,28],[60,30],[55,24],[53,14],[48,17],[43,28],[37,37],[36,28],[43,5],[47,2],[50,-5],[54,5],[58,8],[58,22],[65,26],[70,28]] },
  // Africa
  { name:"Africa", pts:[[37,10],[32,32],[22,37],[12,42],[5,40],[-5,40],[-12,37],[-25,33],[-34,26],[-35,19],[-22,17],[-5,12],[5,2],[5,-8],[10,-17],[15,-17],[20,-17],[25,-15],[30,-8],[37,10]] },
  // Mexico + Central America
  { name:"Mexico", pts:[[30,-117],[25,-110],[22,-106],[16,-92],[10,-84],[8,-77],[10,-75],[15,-83],[20,-87],[25,-90],[30,-97],[32,-117],[30,-117]] },
  // Argentina + Chile
  { name:"SouthAmerica South", pts:[[-33,-70],[-40,-63],[-52,-68],[-55,-65],[-52,-58],[-40,-55],[-33,-53],[-30,-55],[-33,-70]] },
  // UK + Ireland
  { name:"UK", pts:[[58,-5],[60,-2],[58,0],[53,2],[51,2],[50,0],[51,-5],[54,-5],[56,-6],[58,-5]] },
  // Japan
  { name:"Japan", pts:[[31,131],[33,132],[35,136],[37,137],[40,140],[43,141],[44,145],[42,143],[38,141],[35,137],[33,131],[31,131]] },
  // Southeast Asia
  { name:"SEAsia", pts:[[10,100],[15,100],[22,104],[25,100],[20,96],[18,96],[12,100],[5,100],[1,104],[5,103],[10,100]] },
  // Middle East
  { name:"MiddleEast", pts:[[37,36],[30,48],[22,55],[15,50],[12,43],[15,38],[22,38],[28,34],[33,36],[37,36]] },
  // Pakistan/Afghanistan
  { name:"CentralAsia", pts:[[37,60],[38,70],[36,74],[30,67],[25,62],[22,58],[28,50],[32,47],[35,47],[37,60]] },
  // Kazakhstan
  { name:"Kazakhstan", pts:[[52,52],[55,60],[52,70],[48,83],[43,76],[40,68],[40,55],[45,52],[52,52]] },
  // Greenland
  { name:"Greenland", pts:[[76,-70],[80,-55],[83,-40],[80,-25],[72,-22],[65,-38],[60,-45],[63,-52],[68,-55],[72,-62],[76,-70]] },
  // Indonesia
  { name:"Indonesia", pts:[[5,95],[0,105],[-5,108],[-8,115],[-8,125],[-5,135],[0,130],[2,120],[5,115],[5,105],[5,95]] },
  // Nigeria/West Africa
  { name:"WestAfrica", pts:[[15,-17],[10,-15],[5,-5],[5,5],[10,10],[15,14],[15,5],[15,-17]] },
  // East Africa
  { name:"EastAfrica", pts:[[15,38],[10,42],[0,42],[-5,40],[-10,37],[-5,33],[0,30],[5,35],[10,40],[15,38]] },
  // Southern Africa
  { name:"SouthernAfrica", pts:[[-15,30],[-22,32],[-28,32],[-34,26],[-28,20],[-22,17],[-15,22],[-15,30]] },
];

export default function AttackMap() {
  const { attacks } = useAttacks();

  const points = {};
  for (const a of attacks) {
    const c = a.country;
    if (!c?.lat) continue;
    const key = `${c.lat},${c.lon}`;
    if (!points[key] || isSeverer(a.severity, points[key].severity)) {
      points[key] = { ...c, severity: a.severity, count: (points[key]?.count ?? 0) + 1 };
    }
  }

  return (
    <div className="attack-map-wrap">
      <svg viewBox="0 0 560 280" className="world-svg" style={{ background: "#0a0e14", borderRadius: 6 }}>

        {/* Ocean background */}
        <rect x="0" y="0" width="560" height="280" fill="#0a0e14" />

        {/* Grid lines */}
        {[80,160,240,320,400,480].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="280" stroke="#0f1a28" strokeWidth="0.5" />
        ))}
        {[56,112,168,224].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="560" y2={y} stroke="#0f1a28" strokeWidth="0.5" />
        ))}

        {/* Equator line */}
        <line x1="0" y1="140" x2="560" y2="140" stroke="#1a2d1a" strokeWidth="0.8" strokeDasharray="4 4" />

        {/* Country shapes */}
        {COUNTRIES.map((country) => {
          const pts = country.pts
            .map(([lat, lon]) => {
              const p = project(lat, lon);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={country.name}
              points={pts}
              fill="#1a2d1a"
              stroke="#2a4a2a"
              strokeWidth="0.8"
              opacity="0.9"
            />
          );
        })}

        {/* Attack dots */}
        {Object.entries(points).map(([key, p]) => {
          const { x, y } = project(p.lat, p.lon);
          const r = Math.min(3 + Math.log2(p.count + 1) * 2, 10);
          const color = SEVERITY_DOT[p.severity] || "#33ff99";
          return (
            <g key={key}>
              {/* Outer glow */}
              <circle cx={x} cy={y} r={r + 6} fill={color} opacity={0.08} />
              {/* Mid ring */}
              <circle cx={x} cy={y} r={r + 3} fill={color} opacity={0.15} />
              {/* Core dot */}
              <circle cx={x} cy={y} r={r} fill={color} opacity={0.9} />
              {/* Bright centre */}
              <circle cx={x} cy={y} r={r * 0.4} fill="#ffffff" opacity={0.5} />
              <title>{p.country} ({p.city}) — {p.count} attacks — {p.severity}</title>
            </g>
          );
        })}
      </svg>

      <div className="map-legend">
        {Object.entries(SEVERITY_DOT).map(([sev, color]) => (
          <span key={sev} className="map-legend-item">
            <span style={{ background: color, width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 4 }} />
            {sev}
          </span>
        ))}
      </div>
    </div>
  );
}

function isSeverer(a, b) {
  const rank = { critical: 4, high: 3, medium: 2, low: 1 };
  return (rank[a] ?? 0) > (rank[b] ?? 0);
}
