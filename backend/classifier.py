"""
TrapForge Attack Intent Classifier
Uses TF-IDF + Random Forest trained on labeled attack commands.
Falls back to rule-based classification for demo reliability.
"""

import re
import math
from dataclasses import dataclass
from typing import Optional

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.pipeline import Pipeline
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("[TrapForge Classifier] sklearn not found, using rule-based fallback")


TRAINING_DATA = [
    # (command, label)
    # --- Recon ---
    ("ls -la", "recon"), ("ls -la /etc", "recon"), ("pwd", "recon"),
    ("whoami", "recon"), ("id", "recon"), ("uname -a", "recon"),
    ("cat /etc/os-release", "recon"), ("ps aux", "recon"),
    ("netstat -an", "recon"), ("ifconfig", "recon"), ("ip addr", "recon"),
    ("find / -name", "recon"), ("env", "recon"), ("printenv", "recon"),
    ("GET /admin", "recon"), ("GET /robots.txt", "recon"),
    ("GET /.env", "recon"), ("GET /wp-admin", "recon"),
    ("nmap -sV", "recon"), ("ping -c 1", "recon"),
    ("dir", "recon"), ("ipconfig", "recon"),

    # --- Brute Force ---
    ("USER root", "brute_force"), ("USER admin", "brute_force"),
    ("PASS password", "brute_force"), ("PASS 123456", "brute_force"),
    ("PASS admin", "brute_force"), ("AUTH LOGIN", "brute_force"),
    ("failed password", "brute_force"), ("login attempt", "brute_force"),
    ("admin admin", "brute_force"), ("root toor", "brute_force"),

    # --- Credential Theft ---
    ("cat /etc/passwd", "credential_theft"), ("cat /etc/shadow", "credential_theft"),
    ("cat /etc/sudoers", "credential_theft"), ("cat ~/.ssh/id_rsa", "credential_theft"),
    ("cat ~/.bash_history", "credential_theft"), ("grep password", "credential_theft"),
    ("find / -name *.pem", "credential_theft"), ("find / -name id_rsa", "credential_theft"),
    ("cat /var/log/auth.log", "credential_theft"),
    ("SELECT * FROM users", "credential_theft"),
    ("SELECT username password FROM", "credential_theft"),

    # --- SQL Injection ---
    ("OR 1=1", "sql_injection"), ("DROP TABLE", "sql_injection"),
    ("UNION SELECT", "sql_injection"), ("'; DROP TABLE", "sql_injection"),
    ("1=1--", "sql_injection"), ("admin'--", "sql_injection"),
    ("xp_cmdshell", "sql_injection"), ("SLEEP(5)", "sql_injection"),
    ("BENCHMARK(", "sql_injection"), ("information_schema", "sql_injection"),
    ("LOAD_FILE(", "sql_injection"), ("INTO OUTFILE", "sql_injection"),

    # --- Privilege Escalation ---
    ("sudo su", "privilege_escalation"), ("sudo bash", "privilege_escalation"),
    ("chmod +s", "privilege_escalation"), ("chmod 777", "privilege_escalation"),
    ("find / -perm -4000", "privilege_escalation"),
    ("find / -perm -2000", "privilege_escalation"),
    ("exploit/local", "privilege_escalation"), ("kernel exploit", "privilege_escalation"),
    ("python -c import pty", "privilege_escalation"),
    ("perl -e exec", "privilege_escalation"),

    # --- Malware Deploy ---
    ("wget http", "malware_deploy"), ("curl http", "malware_deploy"),
    ("curl | bash", "malware_deploy"), ("wget | sh", "malware_deploy"),
    ("chmod +x bot", "malware_deploy"), ("./shell.sh", "malware_deploy"),
    ("nc -e /bin/bash", "malware_deploy"), ("bash -i", "malware_deploy"),
    ("python -c import socket", "malware_deploy"),
    ("/tmp/payload", "malware_deploy"), ("base64 -d", "malware_deploy"),

    # --- Data Exfiltration ---
    ("tar czf /tmp", "data_exfil"), ("zip -r /tmp", "data_exfil"),
    ("scp root@", "data_exfil"), ("rsync -avz", "data_exfil"),
    ("curl -F file=", "data_exfil"), ("POST /upload", "data_exfil"),
    ("RETR /etc/passwd", "data_exfil"), ("STOR secret", "data_exfil"),
    ("mysqldump", "data_exfil"), ("pg_dump", "data_exfil"),

    # --- XSS ---
    ("<script>", "xss"), ("javascript:", "xss"),
    ("onerror=", "xss"), ("onload=", "xss"),
    ("document.cookie", "xss"), ("alert(1)", "xss"),
    ("eval(", "xss"), ("innerHTML=", "xss"),

    # --- APT (Advanced Persistent Threat) ---
    ("crontab", "apt"), ("systemctl enable", "apt"),
    ("echo >> /etc/crontab", "apt"), ("at now", "apt"),
    ("useradd backdoor", "apt"), ("adduser hacker", "apt"),
    ("ssh-copy-id", "apt"), ("authorized_keys", "apt"),
    ("iptables -D", "apt"), ("killall syslog", "apt"),
    ("history -c", "apt"), ("unset HISTFILE", "apt"),

    # --- Script Kiddie ---
    ("help", "script_kiddie"), ("?", "script_kiddie"),
    ("hello", "script_kiddie"), ("test", "script_kiddie"),
    ("version", "script_kiddie"), ("quit", "script_kiddie"),
    ("exit", "script_kiddie"), ("hack", "script_kiddie"),
    ("metasploit", "script_kiddie"), ("kali", "script_kiddie"),
]

SEVERITY_MAP = {
    "recon": "low",
    "brute_force": "medium",
    "credential_theft": "high",
    "sql_injection": "high",
    "privilege_escalation": "critical",
    "malware_deploy": "critical",
    "data_exfil": "critical",
    "xss": "medium",
    "apt": "critical",
    "script_kiddie": "low",
}

MITRE_MAP = {
    "recon": "T1046 - Network Service Scanning",
    "brute_force": "T1110 - Brute Force",
    "credential_theft": "T1552 - Unsecured Credentials",
    "sql_injection": "T1190 - Exploit Public-Facing App",
    "privilege_escalation": "T1548 - Abuse Elevation Control",
    "malware_deploy": "T1059 - Command & Scripting Interpreter",
    "data_exfil": "T1041 - Exfiltration Over C2 Channel",
    "xss": "T1189 - Drive-by Compromise",
    "apt": "T1053 - Scheduled Task / Job",
    "script_kiddie": "T1595 - Active Scanning",
}

LABEL_DISPLAY = {
    "recon": "Reconnaissance",
    "brute_force": "Brute Force",
    "credential_theft": "Credential Theft",
    "sql_injection": "SQL Injection",
    "privilege_escalation": "Priv. Escalation",
    "malware_deploy": "Malware Deploy",
    "data_exfil": "Data Exfiltration",
    "xss": "XSS Attack",
    "apt": "APT / Persistence",
    "script_kiddie": "Script Kiddie",
}


class AttackClassifier:
    def __init__(self):
        self.model = None
        if SKLEARN_AVAILABLE:
            self._train()

    def _train(self):
        texts = [t[0] for t in TRAINING_DATA]
        labels = [t[1] for t in TRAINING_DATA]
        self.model = Pipeline([
            ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), max_features=5000)),
            ("clf", RandomForestClassifier(n_estimators=100, random_state=42)),
        ])
        self.model.fit(texts, labels)
        print(f"[TrapForge Classifier] Trained on {len(texts)} samples")

    def classify(self, command: str, service: str = "") -> dict:
        cmd_lower = command.lower()

        if self.model and SKLEARN_AVAILABLE:
            try:
                import numpy as np
                proba = self.model.predict_proba([command])[0]
                classes = self.model.classes_
                idx = int(np.argmax(proba))
                label = classes[idx]
                confidence = float(proba[idx])
                boosted = self._rule_boost(cmd_lower)
                if boosted and confidence < 0.85:
                    label = boosted
                    confidence = max(confidence, 0.88)
            except Exception:
                label, confidence = self._rule_based(cmd_lower)
        else:
            label, confidence = self._rule_based(cmd_lower)

        return {
            "label": label,
            "display": LABEL_DISPLAY.get(label, label),
            "confidence": confidence,
            "severity": SEVERITY_MAP.get(label, "medium"),
            "mitre": MITRE_MAP.get(label, ""),
        }

    def _rule_boost(self, cmd: str) -> Optional[str]:
        patterns = {
            "sql_injection": [r"union.+select", r"or\s+1=1", r"drop\s+table", r"sleep\(\d+\)"],
            "malware_deploy": [r"wget\s+http", r"curl.+\|\s*bash", r"nc\s+-e"],
            "credential_theft": [r"cat\s+/etc/(passwd|shadow)", r"\.ssh/id_rsa"],
            "apt": [r"crontab", r"authorized_keys", r"history\s+-c"],
            "xss": [r"<script", r"javascript:", r"document\.cookie"],
            "privilege_escalation": [r"perm\s+-4000", r"sudo\s+(su|bash)"],
        }
        for label, pats in patterns.items():
            for p in pats:
                if re.search(p, cmd):
                    return label
        return None

    def _rule_based(self, cmd: str) -> tuple:
        boosted = self._rule_boost(cmd)
        if boosted:
            return boosted, 0.91

        keywords = {
            "recon": ["ls", "pwd", "whoami", "ps", "netstat", "ifconfig", "ip ", "uname", "env", "get /"],
            "brute_force": ["user ", "pass ", "auth", "login", "password"],
            "credential_theft": ["passwd", "shadow", "sudoers", "id_rsa", ".bash_history"],
            "data_exfil": ["tar ", "zip ", "scp ", "mysqldump", "retr ", "stor "],
            "privilege_escalation": ["chmod", "sudo ", "perm", "exploit"],
            "malware_deploy": ["wget", "curl", "/tmp/", "chmod +x", "bash -i", "nc "],
            "apt": ["crontab", "systemctl", "useradd", "authorized"],
            "script_kiddie": ["help", "hack", "test", "exit", "quit", "version"],
        }
        best, best_score = "recon", 0.55
        for label, kws in keywords.items():
            score = sum(1 for k in kws if k in cmd)
            if score > best_score:
                best, best_score = label, min(0.5 + score * 0.15, 0.95)
        return best, best_score
