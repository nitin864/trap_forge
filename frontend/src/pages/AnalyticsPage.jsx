import { useState } from "react";
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Cell,LineChart,Line,Legend,RadarChart,PolarGrid,PolarAngleAxis,Radar } from "recharts";
import { useAttacks } from "../App";

const INTENT_COLORS = {recon:"#2d9cff",brute_force:"#ffcc33",credential_theft:"#ff9900",sql_injection:"#ff3366",privilege_escalation:"#ff2222",malware_deploy:"#cc00ff",data_exfil:"#ff6600",xss:"#ffaacc",apt:"#aa0000",script_kiddie:"#33aa55"};
const SVC_COLORS = {SSH:"#2d9cff",FTP:"#a855f7",HTTP:"#ffaa00",MySQL:"#ff3363",SMTP:"#00d4ff"};

const TT_STYLE = {contentStyle:{background:"#0f1826",border:"1px solid #1a2d42",borderRadius:6,fontSize:11},itemStyle:{color:"#c8d6e5"},labelStyle:{color:"#7a8fa5"}};

export default function AnalyticsPage() {
  const { stats, attacks } = useAttacks();
  const [tab, setTab] = useState("overview");

  const intentData = Object.entries(stats?.by_intent||{}).map(([k,v])=>({name:k.replace(/_/g," "),value:v,raw:k})).sort((a,b)=>b.value-a.value);
  const svcData    = Object.entries(stats?.by_service||{}).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value);
  const sevData    = Object.entries(stats?.by_severity||{}).map(([k,v])=>({name:k,value:v}));
  const countryData= Object.entries(stats?.by_country||{}).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value).slice(0,8);
  const timeline   = stats?.timeline||[];

  // Build hourly breakdown from attacks
  const hourlyMap = {};
  attacks.forEach(a=>{
    if(!a.timestamp)return;
    const h=a.timestamp.slice(11,13)+":00";
    hourlyMap[h]=(hourlyMap[h]||0)+1;
  });
  const hourlyData = Object.entries(hourlyMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([t,c])=>({time:t,count:c}));

  // Severity over time
  const sevTimeline = timeline.map((t,i)=>({
    ...t,
    critical: attacks.filter(a=>a.timestamp?.slice(11,16)===t.time && a.severity==="critical").length,
    high:     attacks.filter(a=>a.timestamp?.slice(11,16)===t.time && a.severity==="high").length,
    medium:   attacks.filter(a=>a.timestamp?.slice(11,16)===t.time && a.severity==="medium").length,
  })).slice(-20);

  // Radar data
  const radarData = intentData.slice(0,6).map(d=>({subject:d.name.slice(0,10),A:d.value}));
  const maxIntent = Math.max(...radarData.map(d=>d.A),1);
  const radarNorm = radarData.map(d=>({...d,A:Math.round((d.A/maxIntent)*100)}));

  const totalEvents = stats?.total||attacks.length;
  const avgPerMin = timeline.length ? (totalEvents/Math.max(timeline.length,1)).toFixed(1) : "—";
  const peakMin = timeline.length ? Math.max(...timeline.map(t=>t.count)) : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Attack pattern analysis and trend visualizations</p>
        </div>
        <div className="page-header-right">
          <span className="badge badge-green">{totalEvents.toLocaleString()} total</span>
          <span className="badge badge-amber">{avgPerMin} avg/min</span>
          <span className="badge badge-red">peak {peakMin}</span>
        </div>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid var(--border)",paddingBottom:0}}>
          {["overview","intent","severity","geography","comparison"].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`analytics-tab${tab===t?" active":""}`}
              style={{textTransform:"capitalize"}}>
              {t}
            </button>
          ))}
        </div>

        {tab==="overview" && (
          <div>
            <div className="grid-4 mb-20">
              {[
                ["Total Events",totalEvents,"var(--green)"],
                ["Avg/Minute",avgPerMin,"var(--blue)"],
                ["Peak Minute",peakMin,"var(--red)"],
                ["Attack Types",intentData.length,"var(--amber)"],
              ].map(([lbl,val,col])=>(
                <div key={lbl} className="stat-card" style={{"--card-accent":col}}>
                  <div className="stat-card-label">{lbl}</div>
                  <div className="stat-card-value">{val}</div>
                </div>
              ))}
            </div>
            <div className="grid-2">
              <div className="panel">
                <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--green)"}}/>Attack Rate Over Time</div></div>
                <div className="panel-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChartFallback data={timeline}/>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--blue)"}}/>Attacks by Service</div></div>
                <div className="panel-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={svcData} {...TT_STYLE}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false}/>
                      <XAxis dataKey="name" tick={{fontSize:10,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                      <Tooltip {...TT_STYLE}/>
                      <Bar dataKey="value" radius={[4,4,0,0]}>
                        {svcData.map(d=><Cell key={d.name} fill={SVC_COLORS[d.name]||"#555"}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==="intent" && (
          <div className="grid-2">
            <div className="panel">
              <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--purple)"}}/>Intent Frequency</div></div>
              <div className="panel-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={intentData} layout="vertical" margin={{left:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:9,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:"#c8d6e5"}} axisLine={false} tickLine={false} width={100}/>
                    <Tooltip {...TT_STYLE}/>
                    <Bar dataKey="value" radius={[0,4,4,0]}>
                      {intentData.map(d=><Cell key={d.raw} fill={INTENT_COLORS[d.raw]||"#555"}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="panel">
              <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--cyan)"}}/>Threat Radar</div></div>
              <div className="panel-body">
                {radarNorm.length>2 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarNorm}>
                      <PolarGrid stroke="#1a2d42"/>
                      <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fill:"#7a8fa5"}}/>
                      <Radar name="Attacks" dataKey="A" stroke="#00e87a" fill="#00e87a" fillOpacity={0.15}/>
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <div className="chart-empty">Need more data…</div>}
              </div>
            </div>
          </div>
        )}

        {tab==="severity" && (
          <div>
            <div className="grid-2">
              <div className="panel">
                <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--red)"}}/>Severity Distribution</div></div>
                <div className="panel-body">
                  {sevData.map(d=>{
                    const colors={critical:"var(--red)",high:"var(--amber)",medium:"#ffe033",low:"var(--green)"};
                    const total2=sevData.reduce((a,b)=>a+b.value,0)||1;
                    return (
                      <div key={d.name} className="compare-row">
                        <div className="compare-label">
                          <span className="compare-label-name" style={{color:colors[d.name]||"#aaa",textTransform:"capitalize"}}>{d.name}</span>
                          <span className="compare-label-count">{d.value} ({((d.value/total2)*100).toFixed(1)}%)</span>
                        </div>
                        <div className="compare-bar-track" style={{height:12}}>
                          <div className="compare-bar-fill" style={{width:`${(d.value/total2)*100}%`,background:colors[d.name]||"#555"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--amber)"}}/>Severity Over Time</div></div>
                <div className="panel-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={sevTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false}/>
                      <XAxis dataKey="time" tick={{fontSize:9,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:9,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                      <Tooltip {...TT_STYLE}/>
                      <Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
                      <Line type="monotone" dataKey="critical" stroke="#ff3347" strokeWidth={2} dot={false}/>
                      <Line type="monotone" dataKey="high" stroke="#ffaa00" strokeWidth={2} dot={false}/>
                      <Line type="monotone" dataKey="medium" stroke="#ffe033" strokeWidth={1.5} dot={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==="geography" && (
          <div className="panel">
            <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--blue)"}}/>Top Attack Origins</div></div>
            <div className="panel-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                  <Tooltip {...TT_STYLE}/>
                  <Bar dataKey="value" fill="#2d9cff" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab==="comparison" && (
          <div>
            <div className="grid-2">
              <div className="panel">
                <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--green)"}}/>Intent vs Service Heatmap</div></div>
                <div className="panel-body">
                  <ComparisonHeatmap attacks={attacks}/>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title"><div className="panel-title-dot" style={{background:"var(--purple)"}}/>Hourly Attack Volume</div></div>
                <div className="panel-body">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false}/>
                      <XAxis dataKey="time" tick={{fontSize:9,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:9,fill:"#7a8fa5"}} axisLine={false} tickLine={false}/>
                      <Tooltip {...TT_STYLE}/>
                      <Bar dataKey="count" radius={[3,3,0,0]}>
                        {hourlyData.map((d,i)=><Cell key={i} fill={d.count===Math.max(...hourlyData.map(x=>x.count))?"#ff3347":"#1a4060"}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mini area chart fallback
import { AreaChart, Area } from "recharts";
function AreaChartFallback({ data }) {
  return (
    <AreaChart data={data} margin={{top:4,right:4,bottom:0,left:-20}}>
      <defs>
        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e87a" stopOpacity={0.3}/>
          <stop offset="100%" stopColor="#00e87a" stopOpacity={0.02}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false}/>
      <XAxis dataKey="time" tick={{fontSize:9,fill:"#3a5068"}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
      <YAxis tick={{fontSize:9,fill:"#3a5068"}} axisLine={false} tickLine={false}/>
      <Tooltip contentStyle={{background:"#0f1826",border:"1px solid #1a2d42",borderRadius:6,fontSize:11}} itemStyle={{color:"#00e87a"}} labelStyle={{color:"#7a8fa5"}} formatter={v=>[v,"attacks"]}/>
      <Area type="monotone" dataKey="count" stroke="#00e87a" strokeWidth={2} fill="url(#ag2)" dot={false}/>
    </AreaChart>
  );
}

function ComparisonHeatmap({ attacks }) {
  const services = ["SSH","FTP","HTTP","MySQL","SMTP"];
  const intents  = ["recon","brute_force","sql_injection","malware_deploy","credential_theft"];
  const grid = {};
  services.forEach(s=>intents.forEach(i=>{ grid[`${s}|${i}`]=0; }));
  attacks.forEach(a=>{ const k=`${a.service}|${a.intent}`; if(k in grid) grid[k]++; });
  const maxVal = Math.max(...Object.values(grid),1);

  return (
    <div style={{overflowX:"auto"}}>
      <table style={{borderCollapse:"collapse",width:"100%"}}>
        <thead>
          <tr>
            <td style={{width:60}}/>
            {intents.map(i=><th key={i} style={{fontSize:9,color:"var(--text2)",fontWeight:600,letterSpacing:"0.06em",padding:"4px 6px",textAlign:"center",whiteSpace:"nowrap"}}>{i.replace(/_/g," ")}</th>)}
          </tr>
        </thead>
        <tbody>
          {services.map(svc=>(
            <tr key={svc}>
              <td style={{fontSize:10,color:"var(--blue)",fontWeight:700,padding:"3px 6px",whiteSpace:"nowrap"}}>{svc}</td>
              {intents.map(intent=>{
                const val=grid[`${svc}|${intent}`]||0;
                const opacity=val/maxVal;
                return (
                  <td key={intent} style={{padding:3}}>
                    <div style={{width:"100%",height:32,background:`rgba(0,232,122,${opacity*0.8+0.03})`,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"var(--mono)",color:opacity>0.4?"#fff":"var(--text3)",border:"1px solid rgba(0,232,122,0.1)"}}>
                      {val||""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
