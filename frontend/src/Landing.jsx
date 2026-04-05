import { useEffect, useRef, useState, useCallback } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useInView,
    AnimatePresence,
    useAnimation,
} from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ─── CONSTANTS ─────────────────────────────────────────────────────────────── */
const MATRIX_CHARS = "01></ssh>sqlrm".split("");
const GREEN = "#00ff88";
const ORANGE = "#ff6b35";
const BLUE = "#3b82f6";
const PURPLE = "#a855f7";
const AMBER = "#f59e0b";
const TEAL = "#14b8a6";

const ATTACK_ROWS = [
    { time: "07:52:48", ip: "192.168.100.229", svc: "MySQL", svcColor: TEAL, intent: "sql injection", sev: "HIGH", conf: "88%", cmd: "SELECT * FROM users WHERE id=1 UNION SEL..." },
    { time: "07:52:40", ip: "192.168.201.111", svc: "SSH", svcColor: BLUE, intent: "privilege escalation", sev: "CRITICAL", conf: "91%", cmd: "find / -perm -4000 2>/dev/null" },
    { time: "07:52:35", ip: "192.168.126.181", svc: "HTTP", svcColor: AMBER, intent: "xss", sev: "MEDIUM", conf: "88%", cmd: "<script>document.cookie</script>" },
    { time: "07:52:26", ip: "192.168.69.135", svc: "FTP", svcColor: PURPLE, intent: "data exfil", sev: "CRITICAL", conf: "65%", cmd: "RETR /etc/passwd" },
    { time: "07:52:17", ip: "192.168.11.109", svc: "SSH", svcColor: BLUE, intent: "privilege escalation", sev: "CRITICAL", conf: "91%", cmd: "find / -perm -4000 2>/dev/null" },
    { time: "07:52:12", ip: "192.168.127.198", svc: "FTP", svcColor: PURPLE, intent: "brute force", sev: "MEDIUM", conf: "72%", cmd: "USER admin PASS password123" },
];

const TICKER_ITEMS = [
    { svc: "SSH", ip: "185.220.101.47", intent: "credential_theft", sev: "CRITICAL", sevColor: ORANGE },
    { svc: "HTTP", ip: "45.33.32.156", intent: "sql_injection", sev: "HIGH", sevColor: AMBER },
    { svc: "FTP", ip: "91.108.4.22", intent: "data_exfil", sev: "CRITICAL", sevColor: ORANGE },
    { svc: "MySQL", ip: "192.241.xx.xx", intent: "brute_force", sev: "MEDIUM", sevColor: BLUE },
    { svc: "SMTP", ip: "103.21.xx.xx", intent: "recon", sev: "LOW", sevColor: "#6b7280" },
];

const FEATURES = [
    { icon: "🧠", title: "ML Intent Classifier", tag: "AI MODEL", tagColor: GREEN, desc: "TF-IDF + LinearSVC trained on 3,000+ labeled attack payloads. Classifies commands into 10 categories — recon, SQLi, RCE, exfil and more — in under 50ms." },
    { icon: "🎭", title: "Adaptive Deception Engine", tag: "LLM POWERED", tagColor: PURPLE, desc: "Grok AI generates convincing fake responses for SSH, FTP, HTTP, MySQL and SMTP — keeping attackers engaged and extracting maximum intelligence." },
    { icon: "📡", title: "Real-time Ops Dashboard", tag: "WEBSOCKET", tagColor: BLUE, desc: "Live attack feed, MITRE ATT&CK mapping, intent breakdown chart, timeline graph, and geo heatmap — all updating in real time via WebSocket." },
    { icon: "🛡️", title: "Auto IP Blocking", tag: "DEFENSE", tagColor: ORANGE, desc: "Automatic blocklisting after configurable severity thresholds. Future connections from blocked IPs are instantly rejected with zero manual intervention." },
    { icon: "📲", title: "Telegram Push Alerts", tag: "NOTIFICATIONS", tagColor: GREEN, desc: "Instant phone notifications for every critical or high-severity event. Know the moment an attacker attempts privilege escalation or malware deployment." },
    { icon: "📋", title: "PDF Incident Reports", tag: "FORENSICS", tagColor: "#6b7280", desc: "One-click downloadable PDF per attacker IP — full command history, MITRE tags, LLM-generated threat narrative, and severity breakdown." },
];

const STEPS = [
    { num: "01", title: "Attacker Connects", tag: "SSH · FTP · HTTP · MySQL · SMTP", desc: "A real attacker or scanner hits one of 5 open honeypot ports. TrapForge serves a convincing service banner and interactive shell prompt." },
    { num: "02", title: "AI Classifies Intent", tag: "10 intent classes · <50ms", desc: "Every command is vectorized and run through the ML classifier. Intent label, severity score, MITRE ATT&CK tag, and confidence assigned in <50ms." },
    { num: "03", title: "Intelligence Deployed", tag: "Real-time · Automated", desc: "Event stored, broadcast live to the dashboard, Telegram alert fired, attacker profile built in the knowledge graph. Full kill chain reconstructed." },
];

const SEV_STYLES = {
    CRITICAL: { bg: "#ff6b3520", color: ORANGE, border: "#ff6b3540" },
    HIGH: { bg: "#f59e0b20", color: AMBER, border: "#f59e0b40" },
    MEDIUM: { bg: "#3b82f620", color: BLUE, border: "#3b82f640" },
    LOW: { bg: "#6b728020", color: "#9ca3af", border: "#6b728040" },
};

/* ─── GLOBAL STYLES ─────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #0a0a0a; color: #e5e5e5; font-family: 'Syne', sans-serif; overflow-x: hidden; }
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image: linear-gradient(#1f1f1f 1px, transparent 1px), linear-gradient(90deg, #1f1f1f 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.03;
    pointer-events: none;
    z-index: 0;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
  * { scrollbar-width: thin; scrollbar-color: #2a2a2a #0a0a0a; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1); opacity: 1; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  .ticker-wrap:hover .ticker-inner { animation-play-state: paused; }
  .ticker-inner { animation: ticker 55s linear infinite; }
  .term-cursor { animation: blink 1s step-end infinite; }
  .pulse-dot::after {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    background: #00ff88;
    animation: pulse-ring 2s ease-out infinite;
  }
`;

/* ─── HOOKS ─────────────────────────────────────────────────────────────────── */
function useCounter(target, duration = 1500) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });

    useEffect(() => {
        if (!inView) return;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(Math.floor(ease * target));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [inView, target, duration]);

    return { val, ref };
}

/* ─── MATRIX CANVAS ──────────────────────────────────────────────────────────── */
function MatrixRain() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let cols, drops, animId;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            cols = Math.floor(canvas.width / 20);
            drops = Array.from({ length: cols }, () => Math.random() * (canvas.height / 14));
        };
        resize();

        const draw = () => {
            ctx.fillStyle = "rgba(10,10,10,0.04)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(0,255,136,0.06)";
            ctx.font = "13px 'JetBrains Mono', monospace";
            for (let i = 0; i < cols; i++) {
                const c = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
                ctx.fillText(c, i * 20, drops[i] * 14);
                if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i] += 0.28;
            }
            animId = requestAnimationFrame(draw);
        };
        draw();

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        />
    );
}

/* ─── NAVBAR ─────────────────────────────────────────────────────────────────── */
function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", fn);
        return () => window.removeEventListener("scroll", fn);
    }, []);

    const links = ["#stats", "#features", "#how-it-works"];
    const labels = ["Stats", "Features", "How It Works"];

    return (
        <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 32px", height: 56,
                background: scrolled ? "rgba(10,10,10,0.96)" : "rgba(10,10,10,0.7)",
                backdropFilter: "blur(12px)",
                borderBottom: `1px solid ${scrolled ? "#1f1f1f" : "transparent"}`,
                transition: "background 0.3s, border-color 0.3s",
            }}
        >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 15 }}>
                <span style={{ position: "relative", display: "inline-block" }}>
                    <span className="pulse-dot" style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: GREEN, position: "relative", zIndex: 1 }} />
                </span>
                TrapForge
            </div>

            {/* Desktop links */}
            <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="nav-desktop">
                {labels.map((label, i) => (
                    <motion.a
                        key={label}
                        href={links[i]}
                        whileHover={{ color: "#e5e5e5" }}
                        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b7280", textDecoration: "none", transition: "color 0.15s" }}
                    >
                        {label}
                    </motion.a>
                ))}
                <motion.a
                    href="#deploy"
                    whileHover={{ boxShadow: "0 0 12px #00ff8844" }}
                    style={{
                        fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 500,
                        padding: "6px 16px", border: `1px solid ${GREEN}`, color: GREEN,
                        background: "transparent", borderRadius: 4, textDecoration: "none",
                        transition: "box-shadow 0.2s",
                    }}
                >
                    Deploy Now →
                </motion.a>
            </div>

            {/* Hamburger */}
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "none", flexDirection: "column", gap: 4, padding: 4 }}
                className="hamburger"
                aria-label="Menu"
            >
                {[0, 1, 2].map(i => (
                    <span key={i} style={{ display: "block", width: 20, height: 2, background: "#6b7280", borderRadius: 2 }} />
                ))}
            </button>

            {/* Mobile menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        style={{
                            position: "fixed", top: 56, left: 0, right: 0,
                            background: "#0a0a0a", borderBottom: "1px solid #1f1f1f",
                            padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16,
                        }}
                    >
                        {labels.map((label, i) => (
                            <a key={label} href={links[i]} onClick={() => setMenuOpen(false)}
                                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                                {label}
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        @media (max-width: 768px) { .nav-desktop { display: none !important; } .hamburger { display: flex !important; } }
      `}</style>
        </motion.nav>
    );
}

/* ─── HERO ───────────────────────────────────────────────────────────────────── */
function Hero() {
    const [count, setCount] = useState(2847);
    const navigate = useNavigate();


    useEffect(() => {
        const id = setInterval(() => setCount(c => c + Math.floor(Math.random() * 4) + 1), 3000);
        return () => clearInterval(id);
    }, []);

    const container = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
    const item = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };

    return (
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px 0", overflow: "hidden" }}>
            <MatrixRain />

            <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
                style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}
            >
                {/* Live badge */}
                <motion.div variants={item} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 11, padding: "6px 14px", border: `1px solid ${GREEN}`, borderRadius: 40, background: "rgba(0,255,136,0.04)", color: GREEN, marginBottom: 28 }}>
                    <span style={{ position: "relative", display: "inline-block" }}>
                        <span className="pulse-dot" style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: GREEN, position: "relative", zIndex: 1 }} />
                    </span>
                    <span>LIVE</span>
                    <span style={{ color: "#2a2a2a" }}>·</span>
                    <motion.span
                        key={count}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {count.toLocaleString()}
                    </motion.span>
                    <span>attacks intercepted today</span>
                </motion.div>

                {/* Headline */}
                <motion.h1 variants={item} style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(36px,6vw,72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 20, color: "#fff" }}>
                    The Honeypot That<br />
                    <span style={{ color: GREEN }}>Thinks Like An Attacker.</span>
                </motion.h1>

                {/* Subheading */}
                <motion.p variants={item} style={{ fontFamily: "Syne, sans-serif", fontSize: 18, color: "#6b7280", lineHeight: 1.65, maxWidth: 580, margin: "0 auto 36px" }}>
                    TrapForge deploys AI-powered decoy services that lure real attackers, classify their intent using ML, and feed live threat intelligence to your ops dashboard — all while keeping real infrastructure untouched.
                </motion.p>

                {/* CTA buttons */}
                <motion.div variants={item} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
                    <motion.a
                        href="#deploy"
                        whileHover={{ filter: "brightness(1.1)", scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 600, padding: "12px 24px", background: GREEN, color: "#000", borderRadius: 4, textDecoration: "none", display: "inline-block" }}
                    >
                        Deploy TrapForge →
                    </motion.a>
                    <motion.button
                        onClick={()=> navigate("/dashboard")}
                        whileHover={{ borderColor: "#fff", color: "#fff" }}
                        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, padding: "12px 24px", background: "transparent", border: "1px solid #2a2a2a", color: "#6b7280", borderRadius: 4, textDecoration: "none", display: "inline-block", transition: "border-color 0.15s, color 0.15s" }}
                    >
                        View Live Dashboard
                    </motion.button>
                </motion.div>

                {/* Trust row */}
                <motion.div variants={item} style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b7280" }}>
                    {["5 Honeypot Services", "10 ML Intent Classes", "Real-time WebSocket Feed"].map((t, i) => (
                        <span key={t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {i > 0 && <span style={{ color: "#2a2a2a", margin: "0 12px" }}>|</span>}
                            {t}
                        </span>
                    ))}
                </motion.div>
            </motion.div>

            {/* Ticker bar */}
            <TickerBar />
        </section>
    );
}

/* ─── TICKER ─────────────────────────────────────────────────────────────────── */
function TickerBar() {
    const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
    return (
        <div className="ticker-wrap" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: "#0d0d0d", borderTop: `1px solid ${GREEN}`, overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div className="ticker-inner" style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap", gap: 0 }}>
                {doubled.map((item, i) => (
                    <span key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, padding: "0 32px" }}>
                        <span style={{ color: BLUE }}>[{item.svc}]</span>{" "}
                        <span style={{ color: "#6b7280" }}>{item.ip} → </span>
                        <span style={{ color: GREEN }}>{item.intent}</span>
                        <span style={{ color: "#6b7280" }}> · </span>
                        <span style={{ color: item.sevColor }}>{item.sev}</span>
                        <span style={{ color: "#2a2a2a", margin: "0 24px" }}>···</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ─── SEV BADGE ──────────────────────────────────────────────────────────────── */
function SevBadge({ sev }) {
    const s = SEV_STYLES[sev] || SEV_STYLES.LOW;
    return (
        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {sev}
        </span>
    );
}

/* ─── SVC BADGE ──────────────────────────────────────────────────────────────── */
function SvcBadge({ svc, color }) {
    return (
        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontFamily: "JetBrains Mono, monospace", background: `${color}18`, color, border: `1px solid ${color}30` }}>
            {svc}
        </span>
    );
}

/* ─── STATS SECTION ──────────────────────────────────────────────────────────── */
function StatCard({ label, target, prefix = "", suffix = "" }) {
    const { val, ref } = useCounter(target);
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            style={{ background: "#161616", borderLeft: `3px solid ${GREEN}`, padding: "24px 20px", borderRadius: "0 4px 4px 0" }}
        >
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 48, fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: 6 }}>
                {prefix}{val.toLocaleString()}{suffix}
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
        </motion.div>
    );
}

function AttackTable() {
    const [rows, setRows] = useState(ATTACK_ROWS);
    const [newRowKey, setNewRowKey] = useState(null);
    const tableRef = useRef(null);
    const inView = useInView(tableRef, { once: true, margin: "-80px" });

    useEffect(() => {
        let idx = 0;
        const id = setInterval(() => {
            const r = ATTACK_ROWS[idx % ATTACK_ROWS.length];
            const now = new Date();
            const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
            const newRow = { ...r, time: t, _key: Date.now() };
            setRows(prev => [newRow, ...prev.slice(0, 5)]);
            setNewRowKey(newRow._key);
            idx++;
        }, 4000);
        return () => clearInterval(id);
    }, []);

    return (
        <div ref={tableRef} style={{ maxWidth: 960, margin: "0 auto" }}>
            {/* Table header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: GREEN }}>
                    <span style={{ position: "relative", display: "inline-block" }}>
                        <span className="pulse-dot" style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: GREEN, position: "relative", zIndex: 1 }} />
                    </span>
                    LIVE ATTACK FEED
                </div>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, background: "rgba(255,107,53,0.15)", color: ORANGE, border: "1px solid rgba(255,107,53,0.3)", borderRadius: 40, padding: "2px 10px" }}>
                    ● 7 critical
                </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                    <thead>
                        <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                            {["TIME", "IP ADDRESS", "SERVICE", "INTENT", "SEVERITY", "CONF", "COMMAND"].map(h => (
                                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: 10 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence initial={false}>
                            {rows.map((r, i) => (
                                <motion.tr
                                    key={r._key ?? i}
                                    initial={r._key === newRowKey ? { opacity: 0, y: -12, background: "rgba(0,255,136,0.06)" } : { opacity: 0 }}
                                    animate={{ opacity: 1, y: 0, background: "transparent" }}
                                    transition={{ duration: 0.3, delay: inView && !r._key ? i * 0.07 : 0 }}
                                    style={{ borderBottom: "1px solid #1f1f1f", cursor: "default" }}
                                    whileHover={{ background: "rgba(255,255,255,0.02)" }}
                                >
                                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: 10 }}>{r.time}</td>
                                    <td style={{ padding: "10px 12px" }}>{r.ip}</td>
                                    <td style={{ padding: "10px 12px" }}><SvcBadge svc={r.svc} color={r.svcColor} /></td>
                                    <td style={{ padding: "10px 12px", color: "#e5e5e5" }}>{r.intent}</td>
                                    <td style={{ padding: "10px 12px" }}><SevBadge sev={r.sev} /></td>
                                    <td style={{ padding: "10px 12px", color: GREEN }}>{r.conf}</td>
                                    <td style={{ padding: "10px 12px", color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.cmd}</td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatsSection() {
    return (
        <section id="stats" style={{ padding: "96px 24px", position: "relative", zIndex: 1 }}>
            {/* Section label */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: GREEN, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 56 }}
            >
                <span style={{ flex: 1, maxWidth: 60, height: 1, background: "#2a2a2a" }} />
                ● LIVE THREAT INTELLIGENCE
                <span style={{ flex: 1, maxWidth: 60, height: 1, background: "#2a2a2a" }} />
            </motion.div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, maxWidth: 900, margin: "0 auto 56px" }}>
                <StatCard label="Total Attacks Captured" target={48291} />
                <StatCard label="Intent Categories (recon, SQLi, RCE, exfil...)" target={10} />
                <StatCard label="ML Classification Speed" target={50} prefix="< " suffix="ms" />
                <StatCard label="Active Honeypot Services" target={5} />
            </div>

            <AttackTable />
        </section>
    );
}

/* ─── FEATURES SECTION ───────────────────────────────────────────────────────── */
function FeaturesSection() {
    return (
        <section id="features" style={{ padding: "96px 24px", background: "#111111", position: "relative", zIndex: 1 }}>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                style={{ textAlign: "center", marginBottom: 56 }}
            >
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>CAPABILITIES</div>
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(24px,4vw,40px)", fontWeight: 700, marginBottom: 12 }}>Everything You Need to Trap Real Attackers</h2>
                <p style={{ fontFamily: "Syne, sans-serif", fontSize: 15, color: "#6b7280", maxWidth: 480, margin: "0 auto" }}>Six production-ready modules. One unified ops dashboard.</p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, maxWidth: 960, margin: "0 auto" }}>
                {FEATURES.map((f, i) => (
                    <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.5, delay: i * 0.06 }}
                        whileHover={{ y: -3, borderColor: "#3f3f3f" }}
                        style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 4, padding: 24, position: "relative", transition: "border-color 0.2s", cursor: "default" }}
                    >
                        <span style={{ fontSize: 28, display: "block", marginBottom: 14 }}>{f.icon}</span>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 8 }}>{f.title}</div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#6b7280", lineHeight: 1.6, paddingBottom: 32 }}>{f.desc}</div>
                        <span style={{ position: "absolute", bottom: 16, right: 16, fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 500, padding: "2px 8px", borderRadius: 3, background: `${f.tagColor}18`, color: f.tagColor, border: `1px solid ${f.tagColor}30` }}>
                            [{f.tag}]
                        </span>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

/* ─── HOW IT WORKS ───────────────────────────────────────────────────────────── */
function HowItWorks() {
    return (
        <section id="how-it-works" style={{ padding: "96px 24px", position: "relative", zIndex: 1 }}>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                style={{ textAlign: "center", marginBottom: 64 }}
            >
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>ARCHITECTURE</div>
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(24px,4vw,40px)", fontWeight: 700 }}>From First Probe to Full Intelligence</h2>
            </motion.div>

            {/* Steps */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap", gap: 0, maxWidth: 960, margin: "0 auto 64px" }}>
                {STEPS.map((step, i) => (
                    <>
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            style={{ flex: 1, minWidth: 220, padding: "0 24px", textAlign: "center" }}
                        >
                            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 48, fontWeight: 700, color: "rgba(0,255,136,0.15)", lineHeight: 1, marginBottom: 12 }}>{step.num}</div>
                            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{step.title}</div>
                            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 12 }}>{step.desc}</div>
                            <span style={{ display: "inline-block", fontFamily: "JetBrains Mono, monospace", fontSize: 9, padding: "3px 10px", background: "rgba(0,255,136,0.07)", color: GREEN, border: "1px solid rgba(0,255,136,0.15)", borderRadius: 3 }}>
                                {step.tag}
                            </span>
                        </motion.div>
                        {i < STEPS.length - 1 && (
                            <motion.div
                                key={`arrow-${i}`}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 + 0.3 }}
                                animate={{ scale: [1, 1.15, 1] }}
                                // Note: can't mix transition and animate like this directly in Framer; use style+keyframe via CSS instead
                                style={{ display: "flex", alignItems: "center", paddingTop: 40, color: "#2a2a2a", fontSize: 20, userSelect: "none" }}
                            >
                                →
                            </motion.div>
                        )}
                    </>
                ))}
            </div>

            {/* Terminal */}
            <Terminal />
        </section>
    );
}

/* ─── TERMINAL ───────────────────────────────────────────────────────────────── */
function Terminal() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            style={{ maxWidth: 720, margin: "0 auto", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 6, overflow: "hidden" }}
        >
            {/* Title bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#161616", borderBottom: "1px solid #1f1f1f" }}>
                <div style={{ display: "flex", gap: 5 }}>
                    {["#3a3a3a", "#3a3a3a", "#3a3a3a"].map((c, i) => <span key={i} style={{ display: "block", width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                </div>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280", marginLeft: 8 }}>trap_forge@honeypot — ssh — 80×24</span>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, lineHeight: 1.85 }}>
                <TermLine color="#6b7280">[TrapForge] SSH Honeypot active on port 2222</TermLine>
                <TermLine color="#6b7280">[TrapForge] Incoming connection from 185.220.101.47...</TermLine>
                <br />
                <TermLine><span style={{ color: GREEN }}>root@prod-server-01:~#</span> cat /etc/shadow</TermLine>
                <TermLine color="#6b7280">{"  "}↳ CLASSIFIED  <span style={{ color: GREEN }}>credential_theft</span>  |  SEVERITY: <span style={{ color: AMBER }}>HIGH</span>  |  CONF: 91%</TermLine>
                <TermLine color="#6b7280">{"  "}↳ TELEGRAM ALERT SENT ⚡</TermLine>
                <TermLine color="#6b7280">{"  "}↳ EVENT BROADCAST → dashboard (WebSocket)</TermLine>
                <br />
                <TermLine color="#4b5563">root:$6$rounds=5000$salt$hash:18000:0:99999:7:::</TermLine>
                <TermLine color="#4b5563">daemon:*:17737:0:99999:7:::</TermLine>
                <TermLine color="#4b5563">[... 24 more lines]</TermLine>
                <br />
                <TermLine>
                    <span style={{ color: GREEN }}>root@prod-server-01:~#</span> find / -perm -4000 2 &gt;/dev/null
                </TermLine>
                <TermLine color="#6b7280">{"  "}↳ CLASSIFIED  <span style={{ color: GREEN }}>privilege_escalation</span>  |  SEVERITY: <span style={{ color: ORANGE }}>CRITICAL</span>  |  CONF: 88%</TermLine>
                <TermLine color={ORANGE}>{"  "}↳ AUTO-BLOCK TRIGGERED — IP 185.220.101.47 added to blocklist</TermLine>
                <br />
                <TermLine color="#4b5563">/usr/bin/sudo</TermLine>
                <TermLine color="#4b5563">/usr/bin/passwd</TermLine>
                <TermLine color="#4b5563">/usr/bin/pkexec</TermLine>
                <TermLine color="#4b5563">[... 12 more]</TermLine>
                <br />
                <div><span style={{ color: GREEN }}>root@prod-server-01:~#</span> <span className="term-cursor" style={{ display: "inline-block", width: 8, height: 13, background: GREEN, verticalAlign: "-2px" }} /></div>
            </div>
        </motion.div>
    );
}

function TermLine({ children, color }) {
    return <div style={{ color: color || "#e5e5e5" }}>{children}</div>;
}

/* ─── DEPLOY CTA ─────────────────────────────────────────────────────────────── */
function DeployCTA() {
    return (
        <section id="deploy" style={{ background: "#0d0d0d", boxShadow: "0 -1px 40px rgba(0,255,136,0.04) inset", textAlign: "center", padding: "96px 24px 72px", position: "relative", zIndex: 1 }}>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, staggerChildren: 0.1 }}
            >
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(0,255,136,0.6)", textTransform: "uppercase", marginBottom: 16 }}>READY TO DEPLOY?</div>

                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, color: "#fff", marginBottom: 12 }}>Start Intercepting Real Attackers.</h2>

                <p style={{ fontFamily: "Syne, sans-serif", fontSize: 15, color: "#6b7280", marginBottom: 40 }}>Self-hosted. No cloud required. Running in under 5 minutes.</p>

                <motion.div
                    whileHover={{ borderColor: GREEN, boxShadow: "0 0 20px rgba(0,255,136,0.08)" }}
                    style={{ display: "inline-block", fontFamily: "JetBrains Mono, monospace", fontSize: 12, background: "#111", border: "1px solid #2a2a2a", borderRadius: 40, padding: "10px 24px", color: GREEN, marginBottom: 32, cursor: "text", userSelect: "all", transition: "border-color 0.2s, box-shadow 0.2s" }}
                >
                    <span style={{ color: "#6b7280" }}>$ </span>
                    git clone https://github.com/yourrepo/trapforge &amp;&amp; cd trapforge &amp;&amp; python backend/main.py
                </motion.div>

                <br />
                <motion.a
                    href="#"
                    whileHover={{ filter: "brightness(1.1)", scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 15, fontWeight: 600, padding: "14px 36px", background: GREEN, color: "#000", borderRadius: 4, textDecoration: "none", display: "inline-block" }}
                >
                    Deploy TrapForge →
                </motion.a>
            </motion.div>
        </section>
    );
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────────── */
function Footer() {
    return (
        <footer style={{ borderTop: "1px solid #1f1f1f", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "relative", zIndex: 1 }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280" }}>TrapForge · AI Honeypot · Built for security research</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280" }}>Made for Hackathon 2025</span>
        </footer>
    );
}

/* ─── SCROLL PROGRESS ────────────────────────────────────────────────────────── */
function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    return (
        <motion.div
            style={{ scaleX: scrollYProgress, transformOrigin: "left", position: "fixed", top: 56, left: 0, right: 0, height: 2, background: GREEN, zIndex: 200, opacity: 0.7 }}
        />
    );
}

/* ─── ROOT LANDING ───────────────────────────────────────────────────────────── */
export default function Landing() {
    return (
        <>
            <style>{GLOBAL_CSS}</style>
            <ScrollProgress />
            <Navbar />
            <main>
                <Hero />
                <StatsSection />
                <FeaturesSection />
                <HowItWorks />
                <DeployCTA />
                <Footer />
            </main>
        </>
    );
}