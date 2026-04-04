import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AttacksPage from "./pages/AttacksPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ThreatIntelPage from "./pages/ThreatIntelPage";
import ReportsPage from "./pages/ReportsPage";
import AlertToast from "./components/AlertToast";
import "./App.css";

export const AttackContext = createContext(null);
export function useAttacks() { return useContext(AttackContext); }

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export { API_URL };

function generateAIRecommendations(attacks, stats) {
  const recs = [];
  const intents = stats?.by_intent || {};
  const severities = stats?.by_severity || {};
  if (intents.brute_force > 5) recs.push({ title: "IMPLEMENT ACCOUNT LOCKOUT", description: `${intents.brute_force} brute force attempts. Enforce lockout after 5 failed attempts and enable MFA.` });
  if (intents.sql_injection > 3) recs.push({ title: "DEPLOY WEB APPLICATION FIREWALL", description: `${intents.sql_injection} SQL injection attempts. Deploy WAF and use parameterized queries.` });
  if (intents.malware_deploy > 2) recs.push({ title: "BLOCK OUTBOUND WGET/CURL", description: `${intents.malware_deploy} malware deploy attempts. Restrict outbound connections and implement egress filtering.` });
  if (intents.credential_theft > 3) recs.push({ title: "HARDEN FILE PERMISSIONS", description: `${intents.credential_theft} credential theft attempts. Restrict /etc/shadow and rotate all SSH keys.` });
  if ((severities.critical || 0) > 5) recs.push({ title: "ESCALATE TO INCIDENT RESPONSE", description: `${severities.critical} critical events. Engage IR team and consider temporary IP range blocking.` });
  if (recs.length < 2) recs.push({ title: "MAINTAIN MONITORING POSTURE", description: "Continue current monitoring. Review logs daily for emerging threat patterns." });
  return recs.slice(0, 4);
}

async function generatePDFReport(attacks, stats, triggerCount) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const reportId = `TF-${Date.now().toString(36).toUpperCase()}`;

  doc.setFillColor(8,11,16); doc.rect(0,0,W,H,"F");
  doc.setFillColor(15,21,32); doc.rect(0,0,W,28,"F");
  doc.setDrawColor(0,255,136); doc.setLineWidth(0.5); doc.line(0,28,W,28);
  doc.setFillColor(0,255,136); doc.circle(14,14,6,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.text("TRAPFORGE",24,12);
  doc.setTextColor(139,148,158); doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text("AI Adaptive Honeypot — Automated Threat Report",24,18);
  doc.text(`Generated: ${new Date().toUTCString()}`,24,23);
  doc.setFillColor(0,255,136); doc.roundedRect(W-42,5,36,8,2,2,"F");
  doc.setTextColor(8,11,16); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text(`REPORT ${reportId}`,W-40,10.5);
  doc.setFillColor(255,51,51); doc.roundedRect(W-42,15,36,8,2,2,"F");
  doc.setTextColor(255,255,255); doc.text(`AUTO @ ${triggerCount} EVENTS`,W-40.5,20.5);

  let y = 36;
  const critCount = attacks.filter(a=>a.severity==="critical").length;
  const highCount = attacks.filter(a=>a.severity==="high").length;
  const uniqueIPs = new Set(attacks.map(a=>a.ip)).size;
  const topIntent = stats?.top_intents?.[0]?.[0]?.replace(/_/g," ") || "unknown";

  doc.setFillColor(15,21,32); doc.roundedRect(8,y,W-16,7,1,1,"F");
  doc.setFillColor(0,255,136); doc.rect(8,y,3,7,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.text("EXECUTIVE SUMMARY",14,y+4.8); y+=12;
  const summary = [`TrapForge honeypot detected ${attacks.length} attack events from ${uniqueIPs} unique IPs.`,`Critical: ${critCount} · High: ${highCount} · Top Vector: ${topIntent}.`,"All events analyzed by ML classifier with MITRE ATT&CK mapping.","Immediate action recommended for critical-severity findings below."];
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(201,209,217);
  summary.forEach((l,i)=>doc.text(l,12,y+i*5)); y+=summary.length*5+6;

  const kpis = [["TOTAL",attacks.length,[0,255,136]],["UNIQUE IPs",uniqueIPs,[51,170,255]],["CRITICAL",critCount,[255,51,51]],["HIGH",highCount,[255,170,0]]];
  const cW=(W-20)/4;
  kpis.forEach(([lbl,val,col],i)=>{
    const cx=8+i*(cW+1.33);
    doc.setFillColor(15,21,32); doc.roundedRect(cx,y,cW,18,1.5,1.5,"F");
    doc.setDrawColor(...col); doc.setLineWidth(0.5); doc.roundedRect(cx,y,cW,18,1.5,1.5,"S");
    doc.setTextColor(...col); doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.text(val.toString(),cx+cW/2,y+11,{align:"center"});
    doc.setTextColor(139,148,158); doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.text(lbl,cx+cW/2,y+16,{align:"center"});
  }); y+=24;

  doc.setFillColor(15,21,32); doc.roundedRect(8,y,W-16,7,1,1,"F");
  doc.setFillColor(51,170,255); doc.rect(8,y,3,7,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.text("RECENT ATTACK LOG",14,y+4.8); y+=11;
  const cols=[["TIME",22],["IP",30],["SVC",18],["INTENT",36],["SEV",20],["CONF",20],["COMMAND",W-16-22-30-18-36-20-20-6]];
  doc.setFillColor(15,30,50); doc.rect(8,y,W-16,6.5,"F");
  let hx=10;
  cols.forEach(([h,w])=>{ doc.setTextColor(139,148,158); doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.text(h,hx,y+4.5); hx+=w; }); y+=7;
  const SEVC={critical:[255,51,51],high:[255,170,0],medium:[255,238,51],low:[0,255,136]};
  attacks.slice(0,18).forEach((a,idx)=>{
    if(y>H-20)return;
    doc.setFillColor(...(idx%2===0?[15,21,32]:[12,17,26])); doc.rect(8,y,W-16,6,"F");
    const sc=SEVC[a.severity]||[201,209,217];
    const row=[a.timestamp?.slice(11,19)||"—",a.ip||"—",a.service||"—",(a.intent||"—").replace(/_/g," "),a.severity?.toUpperCase()||"—",`${((a.confidence||0)*100).toFixed(0)}%`,(a.command||"—").slice(0,26)];
    let rx=10;
    cols.forEach(([,w],ci)=>{ doc.setTextColor(...(ci===4?sc:[201,209,217])); doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.text(row[ci],rx,y+4); rx+=w; }); y+=6;
  }); y+=6;

  if(y<H-50){
    doc.setFillColor(15,21,32); doc.roundedRect(8,y,W-16,7,1,1,"F");
    doc.setFillColor(170,0,255); doc.rect(8,y,3,7,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.text("AI THREAT RECOMMENDATIONS",14,y+4.8); y+=11;
    generateAIRecommendations(attacks,stats).forEach((rec)=>{
      if(y>H-12)return;
      doc.setFillColor(20,15,30); doc.roundedRect(8,y,W-16,10,1,1,"F");
      doc.setFillColor(170,0,255); doc.circle(13,y+5,2,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text(rec.title,17,y+4);
      doc.setTextColor(139,148,158); doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.text(rec.description.slice(0,90),17,y+8.5); y+=12;
    });
  }

  doc.setFillColor(15,21,32); doc.rect(0,H-10,W,10,"F");
  doc.setDrawColor(30,45,61); doc.setLineWidth(0.3); doc.line(0,H-10,W,H-10);
  doc.setTextColor(139,148,158); doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text("TrapForge AI Honeypot · Confidential Threat Intelligence",W/2,H-4,{align:"center"});

  const filename = `trapforge-report-${new Date().toISOString().slice(0,10)}-${reportId}.pdf`;
  doc.save(filename);
  return filename;
}

export default function App() {
  const [attacks, setAttacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  const [alertQueue, setAlertQueue] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [reports, setReports] = useState([]);
  const [reportCount, setReportCount] = useState(0);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const wsRef = useRef(null);
  const attackCountRef = useRef(0);
  const lastReportTrigger = useRef(0);

  const refreshAI = useCallback((currentAttacks, currentStats) => {
    if (!currentAttacks.length) return;
    const intents = currentStats?.by_intent || {};
    const severities = currentStats?.by_severity || {};
    const services = currentStats?.by_service || {};
    const s = [];
    if ((severities.critical||0)>3) s.push({id:"c1",priority:"CRITICAL",icon:"🚨",title:"Multiple critical attacks",description:`${severities.critical} critical events. Activate incident response protocol.`,action:"View Critical",color:"#ff3333"});
    if (intents.sql_injection>2) s.push({id:"s1",priority:"HIGH",icon:"⛁",title:"SQL Injection campaign",description:`${intents.sql_injection} SQLi attempts. Deploy WAF and audit DB logs.`,action:"View SQLi",color:"#ff9900"});
    if (intents.brute_force>4) s.push({id:"b1",priority:"HIGH",icon:"⚡",title:"Brute force attack sustained",description:`${intents.brute_force} BF attempts. Enable lockout after 5 failures and enforce MFA.`,action:"Block IPs",color:"#ff9900"});
    if (intents.malware_deploy>1) s.push({id:"m1",priority:"CRITICAL",icon:"☣",title:"Malware deployment attempts",description:`${intents.malware_deploy} deploy attempts. Check egress firewall immediately.`,action:"Firewall",color:"#cc00ff"});
    if ((services.SSH||0)>10) s.push({id:"sh1",priority:"MEDIUM",icon:"🔑",title:"SSH heavily targeted",description:`${services.SSH} SSH probes. Move production SSH to non-standard port.`,action:"SSH Config",color:"#ffcc33"});
    if (intents.apt>1) s.push({id:"a1",priority:"CRITICAL",icon:"◉",title:"APT persistence detected",description:`${intents.apt} APT-style commands. Attacker establishing backdoor.`,action:"APT Events",color:"#ff3333"});
    if (!s.length && currentAttacks.length>0) s.push({id:"ok",priority:"LOW",icon:"✅",title:"Threat level: Normal",description:"No critical patterns detected. System monitoring normally.",action:"All Events",color:"#00ff88"});
    setAiSuggestions(s.slice(0,5));
  }, []);

  useEffect(() => {
    connectWS();
    fetchStats();
    const si = setInterval(fetchStats, 5000);
    return () => { clearInterval(si); wsRef.current?.close(); };
  }, []);

  function connectWS() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => { setConnected(false); setTimeout(connectWS, 3000); };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "history") {
        setAttacks(msg.data);
        attackCountRef.current = msg.data.length;
      } else if (msg.type === "attack") {
        const attack = msg.data;
        setAttacks(prev => { const next=[attack,...prev].slice(0,500); attackCountRef.current=next.length; return next; });
        if (attack.severity==="critical"||attack.severity==="high") {
          setAlertQueue(prev=>[...prev,attack].slice(-5));
          setTimeout(()=>setAlertQueue(prev=>prev.filter(a=>a.id!==attack.id)),6000);
        }
        const nc = attackCountRef.current;
        if (nc>0 && nc%12===0 && nc!==lastReportTrigger.current) { lastReportTrigger.current=nc; setReportCount(c=>c+1); }
      }
    };
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
      setAttacks(prev => { refreshAI(prev, data); return prev; });
    } catch (_) {}
  }

  useEffect(() => {
    if (reportCount===0) return;
    setReportGenerating(true);
    const snap = attacks.slice(0,50);
    const snapStats = stats;
    setTimeout(async () => {
      try {
        const filename = await generatePDFReport(snap, snapStats, attacks.length);
        setReports(prev => [{id:Date.now(),filename,timestamp:new Date().toISOString(),attackCount:attacks.length,criticalCount:snap.filter(a=>a.severity==="critical").length,status:"completed"},...prev].slice(0,20));
      } catch(err) { console.error(err); }
      setReportGenerating(false);
    }, 300);
  }, [reportCount]);

  const pages = { dashboard: Dashboard, attacks: AttacksPage, analytics: AnalyticsPage, threatintel: ThreatIntelPage, reports: ReportsPage };
  const PageComponent = pages[activePage] || Dashboard;

  return (
    <AttackContext.Provider value={{ attacks,stats,connected,alertQueue,activePage,setActivePage,reports,reportGenerating,aiSuggestions,reportCount,manualReport:()=>setReportCount(c=>c+1) }}>
      <div className="app-shell">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <div className="main-content">
          <AlertToast />
          <PageComponent />
        </div>
      </div>
    </AttackContext.Provider>
  );
}
