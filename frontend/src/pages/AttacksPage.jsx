import { useState, useMemo } from "react";
import { useAttacks } from "../App";
import AttackFeed from "../components/AttackFeed";

const SEVERITIES = ["all","critical","high","medium","low"];
const SERVICES   = ["all","SSH","FTP","HTTP","MySQL","SMTP"];
const INTENTS    = ["all","recon","brute_force","credential_theft","sql_injection","privilege_escalation","malware_deploy","data_exfil","xss","apt","script_kiddie"];
const INTENT_ICONS = {recon:"◎",brute_force:"⚡",credential_theft:"⚿",sql_injection:"⛁",privilege_escalation:"▲",malware_deploy:"☣",data_exfil:"◈",xss:"✕",apt:"◉",script_kiddie:"◇"};

export default function AttacksPage() {
  const { attacks } = useAttacks();
  const [sevFilter, setSevFilter]     = useState("all");
  const [svcFilter, setSvcFilter]     = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);

  const filtered = useMemo(()=>
    attacks.filter(a=>
      (sevFilter==="all"||a.severity===sevFilter) &&
      (svcFilter==="all"||a.service===svcFilter) &&
      (intentFilter==="all"||a.intent===intentFilter) &&
      (!search || a.ip?.includes(search) || a.command?.toLowerCase().includes(search.toLowerCase()) || a.intent?.includes(search))
    ), [attacks, sevFilter, svcFilter, intentFilter, search]);

  const critCount    = filtered.filter(a=>a.severity==="critical").length;
  const highCount    = filtered.filter(a=>a.severity==="high").length;
  const uniqueIPs    = new Set(filtered.map(a=>a.ip)).size;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Live Attacks</h1>
          <p>Real-time attack event log · {filtered.length.toLocaleString()} of {attacks.length.toLocaleString()} events shown</p>
        </div>
        <div className="page-header-right">
          <div style={{display:"flex",gap:6}}>
            <span className="sev-badge sev-critical">{critCount} critical</span>
            <span className="sev-badge sev-high">{highCount} high</span>
            <span className="badge badge-blue">{uniqueIPs} IPs</span>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Filters bar */}
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search IP, command, intent…"
            style={{flex:1,minWidth:200,background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:6,padding:"7px 12px",color:"var(--text)",fontFamily:"var(--mono)",fontSize:12,outline:"none"}}
          />
          <div style={{display:"flex",gap:4}}>
            {SEVERITIES.map(s=>(
              <button key={s} className={`btn${sevFilter===s?" btn-primary":""}`} style={{padding:"5px 10px",fontSize:11}} onClick={()=>setSevFilter(s)}>{s}</button>
            ))}
          </div>
          <select value={svcFilter} onChange={e=>setSvcFilter(e.target.value)}
            style={{background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:6,padding:"7px 10px",color:"var(--text2)",fontSize:12,outline:"none",cursor:"pointer"}}>
            {SERVICES.map(s=><option key={s}>{s}</option>)}
          </select>
          <select value={intentFilter} onChange={e=>setIntentFilter(e.target.value)}
            style={{background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:6,padding:"7px 10px",color:"var(--text2)",fontSize:12,outline:"none",cursor:"pointer"}}>
            {INTENTS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14}}>
          {/* Main table */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-title-dot" style={{background:"var(--green)",animation:"pulse 1.4s infinite"}}/>
                Event Log
              </div>
              <span className="text-mono text-xs text-muted">{filtered.length} events</span>
            </div>
            <div className="attack-table-wrap" style={{maxHeight:"calc(100vh - 250px)"}}>
              <table className="attack-table">
                <thead>
                  <tr><th>Time</th><th>IP</th><th>Service</th><th>Intent</th><th>Sev</th><th>Conf</th><th>Command</th></tr>
                </thead>
                <tbody>
                  {filtered.slice(0,200).map((a,i)=>(
                    <tr key={a.id} className={i===0?"row-new":""} onClick={()=>setSelected(a)}
                      style={{cursor:"pointer",background:selected?.id===a.id?"rgba(0,232,122,0.04)":""}}>
                      <td><span className="text-mono text-xs text-muted">{a.timestamp?.slice(11,19)||"—"}</span></td>
                      <td><span className="ip-tag">{a.ip}</span></td>
                      <td><span className={`svc-tag svc-${a.service}`}>{a.service}</span></td>
                      <td><div className="intent-cell"><span className="intent-icon">{INTENT_ICONS[a.intent]||"·"}</span><span className="text-xs">{(a.intent||"").replace(/_/g," ")}</span></div></td>
                      <td><span className={`sev-badge sev-${a.severity}`}>{a.severity}</span></td>
                      <td><span className="text-mono text-xs">{((a.confidence||0)*100).toFixed(0)}%</span></td>
                      <td><span className="cmd-cell" title={a.command}>{(a.command||"").slice(0,36)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          <div>
            {selected ? (
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--blue)"}}/>Event Detail</div>
                  <button className="btn" style={{padding:"2px 8px",fontSize:10}} onClick={()=>setSelected(null)}>✕</button>
                </div>
                <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div>
                    <div className="text-xs text-muted mb-4">IP Address</div>
                    <div className="ip-tag text-mono">{selected.ip}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-4">Severity</div>
                    <span className={`sev-badge sev-${selected.severity}`}>{selected.severity?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-4">Intent</div>
                    <div style={{fontSize:13,color:"var(--text)",fontWeight:600}}>{(selected.intent||"").replace(/_/g," ")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-4">MITRE ATT&CK</div>
                    <div className="text-mono" style={{color:"var(--blue)",fontSize:11}}>
                      {{recon:"T1046",brute_force:"T1110",credential_theft:"T1552",sql_injection:"T1190",privilege_escalation:"T1548",malware_deploy:"T1059",data_exfil:"T1041",xss:"T1189",apt:"T1053",script_kiddie:"T1595"}[selected.intent]||"T?????"} 
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-4">Command / Payload</div>
                    <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,padding:"8px 10px",fontFamily:"var(--mono)",fontSize:11,color:"var(--red)",wordBreak:"break-all",lineHeight:1.5}}>
                      {selected.command || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-4">Deceptive Response Sent</div>
                    <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,padding:"8px 10px",fontFamily:"var(--mono)",fontSize:10,color:"var(--green)",wordBreak:"break-all",lineHeight:1.5}}>
                      {selected.response_sent || "—"}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div>
                      <div className="text-xs text-muted mb-4">Service</div>
                      <span className={`svc-tag svc-${selected.service}`}>{selected.service}</span>
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-4">Port</div>
                      <span className="text-mono text-xs">{selected.port}</span>
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-4">Confidence</div>
                      <div className="text-mono text-xs text-green">{((selected.confidence||0)*100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-4">Session Cmds</div>
                      <div className="text-mono text-xs">{selected.session_commands}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-4">Timestamp</div>
                    <div className="text-mono" style={{fontSize:11}}>{selected.timestamp}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-4">Event ID</div>
                    <div className="text-mono" style={{fontSize:10,color:"var(--text3)"}}>{selected.id}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel" style={{display:"flex",alignItems:"center",justifyContent:"center",height:300}}>
                <div style={{textAlign:"center",color:"var(--text3)"}}>
                  <div style={{fontSize:28,marginBottom:8}}>◈</div>
                  <div className="text-xs">Click any row to inspect event</div>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="panel mt-12">
              <div className="panel-header">
                <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--amber)"}}/>Filter Summary</div>
              </div>
              <div className="panel-body" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  ["Total Shown",filtered.length,"var(--green)"],
                  ["Unique IPs",uniqueIPs,"var(--blue)"],
                  ["Critical",filtered.filter(a=>a.severity==="critical").length,"var(--red)"],
                  ["High",filtered.filter(a=>a.severity==="high").length,"var(--amber)"],
                ].map(([label,val,color])=>(
                  <div key={label} style={{background:"var(--bg3)",borderRadius:6,padding:"8px 10px",border:"1px solid var(--border)"}}>
                    <div className="text-xs text-muted mb-4">{label}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:20,fontWeight:700,color}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
