import { useAttacks } from "../App";
import StatCards from "../components/StatCards";
import AttackFeed from "../components/AttackFeed";
import IntentChart from "../components/IntentChart";
import ServiceBreakdown from "../components/ServiceBreakdown";
import TimelineChart from "../components/TimelineChart";

export default function Dashboard() {
  const { connected, attacks, stats, aiSuggestions, manualReport, reportGenerating } = useAttacks();

  const criticals = attacks.filter(a=>a.severity==="critical").length;
  const mitre = stats?.by_intent ? Object.entries(stats.by_intent).slice(0,4) : [];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Threat Operations Center</h1>
          <p>Real-time honeypot monitoring · {attacks.length.toLocaleString()} events captured</p>
        </div>
        <div className="page-header-right">
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontFamily:"var(--mono)",padding:"5px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--panel)"}}>
            <div className={`status-dot ${connected?"live":"offline"}`}/>
            <span style={{color:connected?"var(--green)":"var(--red)"}}>{connected?"LIVE FEED":"RECONNECTING"}</span>
          </div>
          <button className="btn btn-purple" onClick={manualReport} disabled={reportGenerating}>
            {reportGenerating ? "⏳ Generating…" : "📄 Export PDF"}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Row */}
        <StatCards />

        {/* Main 3-col layout */}
        <div style={{display:"grid",gridTemplateColumns:"260px 1fr 260px",gap:14}}>

          {/* LEFT COL */}
          <div className="col-stack">
            {/* AI Suggestions */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div className="panel-title-dot" style={{background:"var(--purple)"}}/>
                  AI Suggestions
                </div>
                <span className="badge badge-purple">{aiSuggestions.length}</span>
              </div>
              <div className="ai-suggestion-list">
                {aiSuggestions.length === 0 && <div className="chart-empty" style={{height:80}}>Analyzing…</div>}
                {aiSuggestions.map(s=>(
                  <div key={s.id} className={`ai-suggestion priority-${s.priority}`}>
                    <span className="ai-suggestion-icon">{s.icon}</span>
                    <div className="ai-suggestion-content">
                      <div className="ai-suggestion-title">
                        <span className="ai-priority-badge">{s.priority}</span>{s.title}
                      </div>
                      <div className="ai-suggestion-desc">{s.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service breakdown */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--amber)"}}/>Services Targeted</div>
              </div>
              <div className="panel-body"><ServiceBreakdown/></div>
            </div>
          </div>

          {/* CENTER COL */}
          <div className="col-stack">
            {/* Timeline */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--green)"}}/>Attack Timeline</div>
                <span className="text-xs text-muted text-mono">last 60 min buckets</span>
              </div>
              <div className="panel-body"><TimelineChart/></div>
            </div>

            {/* Live Feed */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div className="panel-title-dot" style={{background:"var(--green)",animation:"pulse 1.4s infinite",boxShadow:"0 0 6px var(--green)"}}/>
                  Live Attack Feed
                </div>
                <span className="badge badge-red">{criticals} critical</span>
              </div>
              <AttackFeed limit={30}/>
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="col-stack">
            {/* Intent donut */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--red)"}}/>Attack Intents</div>
              </div>
              <div className="panel-body"><IntentChart/></div>
            </div>

            {/* MITRE Quick View */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><div className="panel-title-dot" style={{background:"var(--amber)"}}/>MITRE ATT&CK</div>
              </div>
              <div className="panel-body-sm">
                {mitre.map(([intent,count])=>{
                  const MITRE = {recon:"T1046",brute_force:"T1110",credential_theft:"T1552",sql_injection:"T1190",privilege_escalation:"T1548",malware_deploy:"T1059",data_exfil:"T1041",xss:"T1189",apt:"T1053",script_kiddie:"T1595"};
                  return (
                    <div key={intent} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(26,45,66,0.5)"}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--blue)",width:38,flexShrink:0}}>{MITRE[intent]||"T?????"}</span>
                      <span style={{flex:1,fontSize:11,color:"var(--text)"}}>{intent.replace(/_/g," ")}</span>
                      <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--amber)",fontWeight:700}}>{count}</span>
                    </div>
                  );
                })}
                {mitre.length===0&&<div className="chart-empty" style={{height:60}}>No data</div>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
