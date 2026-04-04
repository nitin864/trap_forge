import { useAttacks } from "../App";

export default function ReportsPage() {
  const { reports, reportGenerating, manualReport, attacks, stats } = useAttacks();
  const criticals = attacks.filter(a=>a.severity==="critical").length;
  const uniqueIPs = new Set(attacks.map(a=>a.ip)).size;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports</h1>
          <p>Auto-generated PDF threat reports · triggers every 12 events</p>
        </div>
        <div className="page-header-right">
          <span className="badge badge-purple">{reports.length} generated</span>
          <button className="btn btn-purple" onClick={manualReport} disabled={reportGenerating}>
            {reportGenerating ? <><div className="spinner" style={{width:12,height:12}}/> Generating…</> : "📄 Generate Now"}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats row */}
        <div className="grid-4 mb-20">
          {[
            ["Reports Generated",reports.length,"var(--purple)","📄"],
            ["Current Events",attacks.length,"var(--green)","⚡"],
            ["Critical Events",criticals,"var(--red)","🚨"],
            ["Unique Attackers",uniqueIPs,"var(--blue)","🌐"],
          ].map(([lbl,val,col,icon])=>(
            <div key={lbl} className="stat-card" style={{"--card-accent":col}}>
              <div className="stat-card-icon">{icon}</div>
              <div className="stat-card-label">{lbl}</div>
              <div className="stat-card-value">{val}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14}}>
          {/* Reports list */}
          <div>
            {reportGenerating && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",marginBottom:12,background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.25)",borderRadius:8}}>
                <div className="spinner" style={{width:16,height:16,borderColor:"var(--purple)",borderTopColor:"transparent"}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--purple)"}}>Generating PDF Report…</div>
                  <div className="text-xs text-muted mt-4">Compiling {attacks.length} events into threat intelligence report</div>
                </div>
              </div>
            )}

            {reports.length===0 && !reportGenerating ? (
              <div className="panel" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,gap:12}}>
                <div style={{fontSize:48}}>📄</div>
                <div style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>No reports yet</div>
                <div className="text-muted text-sm" style={{textAlign:"center",maxWidth:300}}>
                  Reports auto-generate every 12 attack events. You can also generate one manually above.
                </div>
                <button className="btn btn-purple mt-12" onClick={manualReport} disabled={reportGenerating}>
                  Generate First Report
                </button>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {reports.map((r,i)=>(
                  <div key={r.id} className="report-card fade-in">
                    <div className="report-card-icon">📄</div>
                    <div className="report-card-info">
                      <div className="report-card-name">{r.filename}</div>
                      <div className="report-card-meta">
                        {new Date(r.timestamp).toLocaleString()} · {r.attackCount} events
                      </div>
                      <div className="report-card-badges">
                        {i===0&&<span className="badge badge-green">Latest</span>}
                        <span className="badge badge-red">{r.criticalCount} critical</span>
                        <span className="badge badge-purple">auto-generated</span>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                      <span className="badge badge-green" style={{padding:"3px 8px"}}>✓ Downloaded</span>
                      <span className="text-xs text-muted">PDF saved</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Config */}
          <div className="col-stack">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--purple)"}}/>Report Settings</div>
              </div>
              <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:14}}>
                {[
                  ["Auto-trigger", "Every 12 events", "var(--green)"],
                  ["Format", "PDF (A4)", "var(--blue)"],
                  ["Contents", "Executive summary, event log, MITRE mapping, AI recommendations", "var(--text2)"],
                  ["Retention", "Last 20 reports in session", "var(--amber)"],
                ].map(([lbl,val,col])=>(
                  <div key={lbl} style={{padding:"8px 12px",background:"var(--bg3)",borderRadius:6,border:"1px solid var(--border)"}}>
                    <div className="text-xs text-muted mb-4">{lbl}</div>
                    <div style={{fontSize:12,color:col}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--green)"}}/>Current Snapshot</div>
              </div>
              <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  ["Total Events",attacks.length,"var(--green)"],
                  ["Critical",criticals,"var(--red)"],
                  ["Unique IPs",uniqueIPs,"var(--blue)"],
                  ["Top Intent",stats?.top_intents?.[0]?.[0]?.replace(/_/g," ")||"—","var(--amber)"],
                ].map(([lbl,val,col])=>(
                  <div key={lbl} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(26,45,66,0.5)"}}>
                    <span className="text-xs text-muted">{lbl}</span>
                    <span style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:col}}>{val}</span>
                  </div>
                ))}
                <button className="btn btn-primary mt-8" onClick={manualReport} disabled={reportGenerating} style={{width:"100%",justifyContent:"center"}}>
                  📄 Generate Report Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
