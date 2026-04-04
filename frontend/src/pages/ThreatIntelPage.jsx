import { useMemo } from "react";
import { useAttacks } from "../App";

const MITRE_MAP = {
  recon:               {id:"T1046",name:"Network Service Scanning",tactic:"Discovery"},
  brute_force:         {id:"T1110",name:"Brute Force",tactic:"Credential Access"},
  credential_theft:    {id:"T1552",name:"Unsecured Credentials",tactic:"Credential Access"},
  sql_injection:       {id:"T1190",name:"Exploit Public-Facing App",tactic:"Initial Access"},
  privilege_escalation:{id:"T1548",name:"Abuse Elevation Control",tactic:"Privilege Escalation"},
  malware_deploy:      {id:"T1059",name:"Command & Scripting Interpreter",tactic:"Execution"},
  data_exfil:          {id:"T1041",name:"Exfiltration Over C2",tactic:"Exfiltration"},
  xss:                 {id:"T1189",name:"Drive-by Compromise",tactic:"Initial Access"},
  apt:                 {id:"T1053",name:"Scheduled Task / Job",tactic:"Persistence"},
  script_kiddie:       {id:"T1595",name:"Active Scanning",tactic:"Reconnaissance"},
};

const FLAG_MAP = {"Russia":"🇷🇺","China":"🇨🇳","USA":"🇺🇸","Romania":"🇷🇴","Brazil":"🇧🇷","Iran":"🇮🇷","Nigeria":"🇳🇬","India":"🇮🇳","Germany":"🇩🇪","Ukraine":"🇺🇦"};
const TACTIC_COLORS = {"Discovery":"var(--blue)","Credential Access":"var(--amber)","Initial Access":"var(--red)","Privilege Escalation":"#ff2222","Execution":"var(--purple)","Exfiltration":"#ff6600","Persistence":"#cc00ff","Reconnaissance":"var(--cyan)"};

export default function ThreatIntelPage() {
  const { attacks, stats } = useAttacks();

  // Top attackers by IP
  const ipCounts = useMemo(()=>{
    const m = {};
    attacks.forEach(a=>{
      if(!m[a.ip]) m[a.ip]={ip:a.ip,count:0,country:a.country,sevs:{},intents:{}};
      m[a.ip].count++;
      m[a.ip].sevs[a.severity]=(m[a.ip].sevs[a.severity]||0)+1;
      m[a.ip].intents[a.intent]=(m[a.ip].intents[a.intent]||0)+1;
    });
    return Object.values(m).sort((a,b)=>b.count-a.count).slice(0,10);
  },[attacks]);

  // MITRE coverage
  const mitreData = useMemo(()=>{
    const byIntent = stats?.by_intent||{};
    const maxVal = Math.max(...Object.values(byIntent),1);
    return Object.entries(MITRE_MAP).map(([intent,info])=>({
      intent, ...info,
      count: byIntent[intent]||0,
      pct: ((byIntent[intent]||0)/maxVal)*100,
    })).filter(d=>d.count>0).sort((a,b)=>b.count-a.count);
  },[stats]);

  // Attack chains (sessions with multiple commands)
  const chains = useMemo(()=>{
    const sessions = {};
    attacks.forEach(a=>{
      const key = a.ip;
      if(!sessions[key]) sessions[key]={ip:a.ip,country:a.country,events:[],intents:new Set(),maxSev:"low"};
      sessions[key].events.push(a);
      sessions[key].intents.add(a.intent);
      const rank={critical:4,high:3,medium:2,low:1};
      if((rank[a.severity]||0)>(rank[sessions[key].maxSev]||0)) sessions[key].maxSev=a.severity;
    });
    return Object.values(sessions).filter(s=>s.events.length>2).sort((a,b)=>b.events.length-a.events.length).slice(0,6);
  },[attacks]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Threat Intelligence</h1>
          <p>MITRE ATT&CK mapping · Attacker profiles · Kill chain analysis</p>
        </div>
        <div className="page-header-right">
          <span className="badge badge-blue">{mitreData.length} techniques</span>
          <span className="badge badge-amber">{ipCounts.length} tracked IPs</span>
        </div>
      </div>

      <div className="page-body">
        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14,marginBottom:14}}>
          {/* MITRE ATT&CK Grid */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--amber)"}}/>MITRE ATT&CK Coverage</div>
              <span className="badge badge-amber">{mitreData.length} active</span>
            </div>
            <div className="panel-body">
              <div className="mitre-grid">
                {mitreData.map(d=>(
                  <div key={d.intent} className="mitre-card">
                    <div className="mitre-card-id">{d.id}</div>
                    <div className="mitre-card-name">{d.name}</div>
                    <div style={{fontSize:10,color:TACTIC_COLORS[d.tactic]||"var(--text2)",marginBottom:6}}>{d.tactic}</div>
                    <div className="mitre-card-count" style={{color:d.count>10?"var(--red)":d.count>5?"var(--amber)":"var(--green)"}}>{d.count}</div>
                    <div style={{fontSize:9,color:"var(--text3)"}}>detections</div>
                    <div className="mitre-card-bar"><div className="mitre-card-bar-fill" style={{width:`${d.pct}%`}}/></div>
                  </div>
                ))}
                {mitreData.length===0&&<div className="chart-empty" style={{gridColumn:"1/-1",height:120}}>No MITRE data yet…</div>}
              </div>
            </div>
          </div>

          {/* Top Attackers */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--red)"}}/>Top Attackers</div>
            </div>
            <div className="panel-body-sm">
              {ipCounts.map((ip,i)=>{
                const topIntent=Object.entries(ip.intents).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
                const hasCrit = ip.sevs.critical>0;
                return (
                  <div key={ip.ip} className="attacker-row">
                    <span className="attacker-rank">#{i+1}</span>
                    <div style={{flex:1}}>
                      <div className="attacker-ip">{ip.ip}</div>
                      <div style={{fontSize:10,color:"var(--text3)"}}>
                        {FLAG_MAP[ip.country?.country]||"🌐"} {ip.country?.country} · {topIntent.replace(/_/g," ")}
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div className="attacker-count" style={{color:hasCrit?"var(--red)":"var(--amber)"}}>{ip.count}</div>
                      {hasCrit&&<span className="sev-badge sev-critical" style={{fontSize:8}}>CRIT</span>}
                    </div>
                  </div>
                );
              })}
              {ipCounts.length===0&&<div className="chart-empty" style={{height:100}}>No IP data</div>}
            </div>
          </div>
        </div>

        {/* Attack Chains */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--purple)"}}/>Attack Kill Chains</div>
            <span className="text-xs text-muted">Sessions with 3+ commands</span>
          </div>
          <div className="panel-body">
            {chains.length===0&&<div className="chart-empty" style={{height:80}}>No multi-command sessions yet…</div>}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {chains.map(session=>(
                <div key={session.ip} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span className="ip-tag text-mono">{session.ip}</span>
                    <span style={{fontSize:11,color:"var(--text2)"}}>{FLAG_MAP[session.country?.country]||"🌐"} {session.country?.country}</span>
                    <span className={`sev-badge sev-${session.maxSev}`}>{session.maxSev}</span>
                    <span style={{marginLeft:"auto",fontSize:11,color:"var(--text2)",fontFamily:"var(--mono)"}}>{session.events.length} commands</span>
                  </div>
                  {/* Kill chain steps */}
                  <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:2}}>
                    {session.events.slice(0,8).map((evt,i)=>(
                      <div key={evt.id} style={{display:"flex",alignItems:"center",flexShrink:0}}>
                        <div style={{background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:6,padding:"4px 8px",fontSize:10,color:"var(--text2)",whiteSpace:"nowrap",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",cursor:"default"}} title={evt.command}>
                          <span style={{color:{recon:"#2d9cff",brute_force:"#ffcc33",credential_theft:"#ff9900",sql_injection:"#ff3366",privilege_escalation:"#ff2222",malware_deploy:"#cc00ff",data_exfil:"#ff6600",xss:"#ffaacc",apt:"#aa0000",script_kiddie:"#33aa55"}[evt.intent]||"#aaa",marginRight:4}}>●</span>
                          {evt.intent?.replace(/_/g," ")}
                        </div>
                        {i<session.events.slice(0,8).length-1&&<span style={{color:"var(--border2)",fontSize:14,padding:"0 2px",flexShrink:0}}>→</span>}
                      </div>
                    ))}
                    {session.events.length>8&&<span style={{fontSize:10,color:"var(--text3)",marginLeft:4}}>+{session.events.length-8} more</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* IOC Table */}
        <div className="panel mt-12">
          <div className="panel-header">
            <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--cyan)"}}/>Indicators of Compromise (IOCs)</div>
            <span className="badge badge-blue">{new Set(attacks.map(a=>a.ip)).size} IPs</span>
          </div>
          <div className="attack-table-wrap" style={{maxHeight:300}}>
            <table className="attack-table">
              <thead><tr><th>IP Address</th><th>Country</th><th>Total Events</th><th>Critical</th><th>Top Intent</th><th>Last Seen</th><th>Threat Score</th></tr></thead>
              <tbody>
                {ipCounts.map(ipData=>{
                  const topIntent=Object.entries(ipData.intents).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
                  const critN=ipData.sevs.critical||0;
                  const highN=ipData.sevs.high||0;
                  const score=Math.min(100,critN*20+highN*10+(ipData.count*2));
                  const lastEvent=attacks.find(a=>a.ip===ipData.ip);
                  return (
                    <tr key={ipData.ip}>
                      <td><span className="ip-tag">{ipData.ip}</span></td>
                      <td><span className="text-xs">{FLAG_MAP[ipData.country?.country]||"🌐"} {ipData.country?.country}</span></td>
                      <td><span className="text-mono">{ipData.count}</span></td>
                      <td><span className="text-mono" style={{color:critN>0?"var(--red)":"var(--text3)"}}>{critN}</span></td>
                      <td><span className="text-xs">{topIntent.replace(/_/g," ")}</span></td>
                      <td><span className="text-mono text-xs text-muted">{lastEvent?.timestamp?.slice(11,19)||"—"}</span></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:50,height:4,background:"var(--border)",borderRadius:2,overflow:"hidden"}}>
                            <div style={{width:`${score}%`,height:"100%",background:score>70?"var(--red)":score>40?"var(--amber)":"var(--green)",borderRadius:2}}/>
                          </div>
                          <span className="text-mono text-xs" style={{color:score>70?"var(--red)":score>40?"var(--amber)":"var(--green)"}}>{score}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
