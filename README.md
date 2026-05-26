# TrapForge 🪤🔥
Live Demo: https://trapforge.vercel.app/ (In our prototype, we are currently facing an issue with fetching live stats in chart and graph formats only in the deployed version, while everything works perfectly locally. We are actively working on fixing it. However, the core functionalities are working properly, including capturing hackers’ IP addresses, payloads, notifications, and other attack-related data in real time.
)
### AI-Powered Adaptive Honeypot — Forge the perfect trap  
> A live cybersecurity system that lures attackers into fake services, classifies their intent using ML, generates deceptive responses using an LLM, and visualises everything on a real-time dashboard.

>Backend Deployed on AWS VPS and frontend on Vercel 
---

## What It Does

```
Attacker connects → Honeypot serves fake SSH/FTP/HTTP/MySQL banner
      ↓
Attacker sends command → ML classifier detects intent
(Recon / Brute Force / SQLi / Malware Deploy / APT / etc.)
      ↓
LLM Deception Engine generates convincing fake response
(keeps attacker engaged, wastes their time)
      ↓
Live Dashboard shows: intent, severity, MITRE ATT&CK ID,
geo-origin, confidence score, attack timeline
```

---

## Project Structure

```
trapforge/
├── backend/
│   ├── main.py              # FastAPI server + honeypot socket listeners
│   ├── classifier.py        # ML intent classifier (TF-IDF + Random Forest)
│   ├── deception_engine.py  # LLM/template response generator
│   ├── attack_store.py      # In-memory attack store + stats
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx              # WebSocket provider + state
    │   ├── App.css              # Dark terminal aesthetic
    │   ├── pages/Dashboard.jsx  # Main dashboard layout
    │   └── components/
    │       ├── StatCards.jsx        # KPI numbers
    │       ├── AttackFeed.jsx       # Live scrolling attack log
    │       ├── IntentChart.jsx      # Donut chart of attack types
    │       ├── TimelineChart.jsx    # Per-minute bar chart
    │       ├── AttackMap.jsx        # SVG world map with origin dots
    │       ├── ServiceBreakdown.jsx # Horizontal bar chart by service
    │       ├── AlertToast.jsx       # Critical alert pop-ups
    │       └── SeverityBadge.jsx    # Coloured severity labels
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Quick Start

### 1. Backend

```bash
cd trapforge/backend
pip install -r requirements.txt

# Add your Grok (xAI) API key for LLM-powered deception + threat narration
# Get your key at: https://console.x.ai/
export XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

python main.py
# → API running at http://localhost:8000
# → Honeypots: SSH:2222, FTP:2121, HTTP:8080, MySQL:3307, SMTP:2525
# → Demo attacker simulating traffic automatically
```

### 2. Frontend

```bash
cd trapforge/frontend
npm install
npm run dev
# → Dashboard at http://localhost:3000
```

---

## Honeypot Ports 

| Port | Mimics  | Real Port |
|------|---------|-----------|
| 2222 | SSH     | 22        |
| 2121 | FTP     | 21        |
| 8080 | HTTP    | 80        |
| 3307 | MySQL   | 3306      |
| 2525 | SMTP    | 25        |

To test manually:
```bash
# Test SSH honeypot
ssh root@localhost -p 2222

# Test FTP honeypot
ftp localhost 2121

# Test HTTP honeypot
curl http://localhost:8080/admin
curl "http://localhost:8080/login?id=1' OR 1=1--"
```

---

## ML Classifier

- **Algorithm**: TF-IDF (char n-grams 2-4) + Random Forest (100 trees)
- **Training data**: 120+ labeled attack commands
- **Classes**: recon, brute_force, credential_theft, sql_injection, privilege_escalation, malware_deploy, data_exfil, xss, apt, script_kiddie
- **MITRE ATT&CK mapping**: each class mapped to a real ATT&CK technique ID

---

## Deception Engine

- **With OpenAI key**: GPT-3.5 generates contextual fake responses per command
- **Without key**: Template engine with 50+ realistic fake outputs per service
- **Strategy**: APT/persistence commands get "success" responses to encourage the attacker to stay longer and reveal more TTPs

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Honeypot  | Python `socket` (raw TCP)           |
| Backend   | FastAPI + WebSockets                |
| ML        | scikit-learn (TF-IDF + RandomForest)|
| LLM       | Grok xAI `grok-3-fast` (via OpenAI SDK) |
| Frontend  | React 18 + Recharts                 |
| Styling   | Custom CSS (Share Tech Mono font)   |
| Realtime  | WebSocket broadcast                 |

---
 
---

 

---

## Judging Criteria Coverage

| Criterion          | How TrapForge covers it                          |
|--------------------|--------------------------------------------------|
| Innovation         | AI vs Attacker deception loop — never seen before|
| Technical depth    | ML pipeline + LLM + real TCP sockets            |
| Real-world impact  | Threat intelligence for SOC teams                |
| AI/Cybersecurity   | Directly in the track — ML + GenAI + Governance  |
| Presentation       | Live demo with real attacks visible on screen    |
