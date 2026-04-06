import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MATRIX_CHARS = "01><ssh>sqlrm".split("");
const GREEN = "#00ff88";

/* ─── MATRIX CANVAS ─────────────────────────────────────────────────────────── */
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
            cols = Math.floor(canvas.width / 22);
            drops = Array.from({ length: cols }, () => Math.random() * (canvas.height / 14));
        };
        resize();
        const draw = () => {
            ctx.fillStyle = "rgba(10,10,10,0.04)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(0,255,136,0.05)";
            ctx.font = "13px 'JetBrains Mono', monospace";
            for (let i = 0; i < cols; i++) {
                const c = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
                ctx.fillText(c, i * 22, drops[i] * 14);
                if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i] += 0.25;
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

/* ─── LOGIN PAGE ─────────────────────────────────────────────────────────────── */
export default function LoginPage() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    // If already authenticated, redirect immediately
    useEffect(() => {
        if (isAuthenticated) navigate(from, { replace: true });
    }, [isAuthenticated]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Slight delay for UX authenticity
        await new Promise((r) => setTimeout(r, 600));

        const ok = login(username.trim(), password);
        if (ok) {
            navigate(from, { replace: true });
        } else {
            setError("ACCESS DENIED — Invalid credentials.");
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes scanline {
          0%   { top: 0; }
          100% { top: 100%; }
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        .login-card { animation: fadeUp 0.5s ease-out both; }

        .login-input {
          width: 100%;
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          padding: 12px 14px;
          color: #e5e5e5;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: ${GREEN};
          box-shadow: 0 0 0 2px rgba(0,255,136,0.08);
        }
        .login-input::placeholder { color: #3f3f3f; }

        .login-btn {
          width: 100%;
          padding: 13px;
          background: ${GREEN};
          color: #000;
          border: none;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: filter 0.2s, transform 0.1s;
          position: relative;
          overflow: hidden;
        }
        .login-btn:hover:not(:disabled) { filter: brightness(1.12); }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-btn::after {
          content: '';
          position: absolute;
          top: -50%; left: -60%;
          width: 40%; height: 200%;
          background: rgba(255,255,255,0.15);
          transform: skewX(-20deg);
          transition: left 0.4s;
        }
        .login-btn:hover::after { left: 120%; }

        .error-shake { animation: shake 0.4s ease-out; }

        .pulse-dot::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: ${GREEN};
          animation: pulse-ring 2s ease-out infinite;
        }
      `}</style>

            <div style={{
                minHeight: "100vh",
                background: "#0a0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                fontFamily: "'Syne', sans-serif",
            }}>
                {/* Matrix canvas background */}
                <MatrixRain />

                {/* Radial glow behind card */}
                <div style={{
                    position: "absolute",
                    width: 600, height: 600,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                {/* Card */}
                <div className="login-card" style={{
                    position: "relative",
                    zIndex: 10,
                    width: "100%",
                    maxWidth: 420,
                    margin: "0 24px",
                    background: "#0f0f0f",
                    border: "1px solid #1f1f1f",
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "0 0 60px rgba(0,255,136,0.04), 0 24px 64px rgba(0,0,0,0.6)",
                }}>
                    {/* Top accent bar */}
                    <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }} />

                    {/* Scanline overlay */}
                    <div style={{
                        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
                        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)",
                    }} />

                    <div style={{ padding: "36px 36px 40px", position: "relative", zIndex: 2 }}>
                        {/* Logo row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
                            <span style={{ position: "relative", display: "inline-block" }}>
                                <span className="pulse-dot" style={{
                                    display: "block", width: 10, height: 10, borderRadius: "50%",
                                    background: GREEN, position: "relative", zIndex: 1,
                                }} />
                            </span>
                            <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 15, color: "#e5e5e5" }}>
                                TrapForge
                            </span>
                            <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: GREEN, background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)", padding: "2px 8px", borderRadius: 3 }}>
                                SECURE ACCESS
                            </span>
                        </div>

                        {/* Heading */}
                        <div style={{ marginBottom: 28 }}>
                            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                                Operator Login
                            </h1>
                            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#4b5563" }}>
                                Authenticate to access the ops dashboard
                            </p>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: "#1a1a1a", marginBottom: 28 }} />

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            {/* Username */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                                    Username
                                </label>
                                <input
                                    id="tf-username"
                                    className="login-input"
                                    type="text"
                                    placeholder="admin"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: error ? 16 : 24 }}>
                                <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                                    Password
                                </label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        id="tf-password"
                                        className="login-input"
                                        type={showPass ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        autoComplete="current-password"
                                        style={{ paddingRight: 44 }}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(s => !s)}
                                        style={{
                                            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "#4b5563", fontSize: 12, fontFamily: "JetBrains Mono, monospace",
                                            padding: 2,
                                        }}
                                    >
                                        {showPass ? "HIDE" : "SHOW"}
                                    </button>
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="error-shake" style={{
                                    marginBottom: 20,
                                    padding: "10px 14px",
                                    background: "rgba(255,51,51,0.06)",
                                    border: "1px solid rgba(255,51,51,0.2)",
                                    borderRadius: 4,
                                    fontFamily: "JetBrains Mono, monospace",
                                    fontSize: 11,
                                    color: "#ff3333",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}>
                                    <span>⚠</span> {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button id="tf-login-btn" className="login-btn" type="submit" disabled={loading}>
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                        <span style={{ animation: "blink 0.8s step-end infinite", display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#000" }} />
                                        AUTHENTICATING...
                                    </span>
                                ) : (
                                    "AUTHENTICATE →"
                                )}
                            </button>
                        </form>

                        {/* Hint row */}
                        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#3f3f3f" }}>
                                DEMO:
                            </span>
                            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#4b5563" }}>
                                admin
                            </span>
                            <span style={{ color: "#2a2a2a", fontSize: 10 }}>/</span>
                            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#4b5563" }}>
                                trapforge2025
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
