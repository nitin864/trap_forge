

import os
import random
import re
from typing import Optional

try:
    from openai import OpenAI
    _xai_key = os.getenv("XAI_API_KEY", "")
    client = OpenAI(
        api_key=_xai_key,
        base_url="https://api.x.ai/v1",
    )
    LLM_AVAILABLE = bool(_xai_key)
    if LLM_AVAILABLE:
        print("[TrapForge Deception] Grok (xAI) API ready")
    else:
        print("[TrapForge Deception] XAI_API_KEY not set — using template fallback")
except ImportError:
    LLM_AVAILABLE = False
    print("[TrapForge Deception] openai package not installed — using template fallback")

BANNERS = {
    "SSH": [
        "SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5\r\n",
        "SSH-2.0-OpenSSH_7.9p1 Debian-10\r\n",
        "SSH-2.0-OpenSSH_8.4p1 Raspbian-5\r\n",
    ],
    "FTP": [
        "220 ProFTPD 1.3.6 Server (Corporate FTP) [10.0.0.1]\r\n",
        "220 vsFTPd 3.0.3 ready.\r\n",
        "220 FileZilla Server 0.9.60 beta\r\n",
    ],
    "HTTP": [
        "HTTP/1.1 200 OK\r\nServer: Apache/2.4.41 (Ubuntu)\r\nContent-Type: text/html\r\n\r\n<html><body>Welcome</body></html>",
        "HTTP/1.1 200 OK\r\nServer: nginx/1.18.0\r\nContent-Type: text/html\r\n\r\n<html><title>Index</title></html>",
    ],
    "MySQL": [
        "5.7.32-log MySQL Community Server (GPL)\r\n",
        "8.0.27 MySQL Community Server - GPL\r\n",
    ],
    "SMTP": [
        "220 mail.corp.internal ESMTP Postfix (Ubuntu)\r\n",
        "220 smtp.company.com Microsoft ESMTP MAIL Service\r\n",
    ],
}

# Canned fake responses — used when LLM not available
FAKE_RESPONSES = {
    "SSH": {
        "ls": "anaconda3  Desktop  Documents  Downloads  backups  secret_keys\ndb_credentials.txt  server_config.bak",
        "pwd": "/root",
        "whoami": "root",
        "id": "uid=0(root) gid=0(root) groups=0(root)",
        "uname": "Linux prod-server-01 5.4.0-74-generic #83-Ubuntu SMP Sat May 8 02:35:39 UTC 2021 x86_64",
        "cat /etc/passwd": "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nmysql:x:105:109::/nonexistent:/bin/false",
        "cat /etc/shadow": "cat: /etc/shadow: Permission denied",
        "ps aux": "USER       PID %CPU %MEM    VSZ   RSS TTY STAT START   TIME COMMAND\nroot         1  0.0  0.1 168748  9448 ?  Ss   08:12   0:03 /sbin/init\nroot       542  0.0  0.2 282936 16384 ?  Ssl  08:12   0:00 /usr/sbin/sshd -D\nmysql      891  0.0  1.2 1241628 97256 ? Sl   08:12   0:12 /usr/sbin/mysqld",
        "netstat": "Active Internet connections (servers and established)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:3306            0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN",
        "default": "bash: command not found",
    },
    "FTP": {
        "USER": "331 Password required for user.\r\n",
        "PASS": "230 User logged in.\r\n",
        "LIST": "200 PORT command successful.\r\n150 Opening ASCII mode data connection for file list.\r\n-rw-r--r--   1 root root   4096 Apr  1 09:00 customers.csv\r\n-rw-r--r--   1 root root  81920 Apr  1 09:00 finance_q1.xlsx\r\n-rw-r--r--   1 root root   2048 Apr  1 09:00 config.ini\r\n226 Transfer complete.\r\n",
        "RETR": "150 Opening BINARY mode data connection.\r\n[binary data stream...]\r\n226 Transfer complete.\r\n",
        "default": "500 Unknown command.\r\n",
    },
    "HTTP": {
        "admin":     "HTTP/1.1 200 OK\r\nServer: Apache/2.4.41\r\nContent-Type: text/html\r\n\r\n<html><h2>Admin Panel</h2><form>Username:<input name=u> Password:<input name=p type=password><button>Login</button></form></html>",
        "config":    "HTTP/1.1 200 OK\r\nServer: Apache/2.4.41\r\nContent-Type: text/plain\r\n\r\ndb_host=10.0.0.5\ndb_user=admin\ndb_pass=Sup3rS3cr3t!\napi_key=sk-fakekeyfortesting123",
        ".env":      "HTTP/1.1 200 OK\r\nServer: Apache/2.4.41\r\nContent-Type: text/plain\r\n\r\nDB_PASSWORD=hunter2\nSECRET_KEY=abc123secret\nAWS_KEY=AKIA1234FAKE5678",
        "passwd":    "HTTP/1.1 200 OK\r\nServer: Apache/2.4.41\r\nContent-Type: text/plain\r\n\r\nroot:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin",
        "wp-admin":  "HTTP/1.1 200 OK\r\nServer: Apache/2.4.41\r\nContent-Type: text/html\r\n\r\n<html><title>WordPress Login</title><form><input name=log><input name=pwd type=password><button>Login</button></form></html>",
        "phpmyadmin":"HTTP/1.1 200 OK\r\nServer: Apache/2.4.41\r\nContent-Type: text/html\r\n\r\n<html><title>phpMyAdmin</title><form><input name=pma_username><input name=pma_password type=password></form></html>",
        "OR 1=1":    "HTTP/1.1 500 Internal Server Error\r\nServer: Apache/2.4.41\r\n\r\nMySQL Error: You have an error in your SQL syntax near '1=1' at line 1",
        "UNION":     "HTTP/1.1 500 Internal Server Error\r\nServer: Apache/2.4.41\r\n\r\nMySQL Error: The used SELECT statements have a different number of columns",
        "script":    "HTTP/1.1 200 OK\r\nServer: Apache/2.4.41\r\nContent-Type: text/html\r\n\r\n<html><body>Hello <script>document.cookie</script></body></html>",
        "default":   "HTTP/1.1 200 OK\r\nServer: Apache/2.4.41\r\nContent-Type: text/html\r\n\r\n<html><title>Corporate Portal</title><body><h3>Welcome to the internal portal.</h3></body></html>",
    },
    "MySQL": {
        "SELECT": "+----+----------+------------------+\n| id | username | email            |\n+----+----------+------------------+\n|  1 | admin    | admin@corp.com   |\n|  2 | dbuser   | db@corp.com      |\n|  3 | readonly | reader@corp.com  |\n+----+----------+------------------+\n3 rows in set (0.01 sec)",
        "SHOW": "Tables_in_prod_db\ncustomers\norders\nusers\npayments\nconfig\nsessions",
        "DROP": "ERROR 1044 (42000): Access denied for user 'web'@'localhost' to database 'prod_db'",
        "default": "ERROR 1064 (42000): You have an error in your SQL syntax",
    },
    "SMTP": {
        "EHLO": "250-mail.corp.internal Hello\r\n250-SIZE 52428800\r\n250-AUTH LOGIN PLAIN\r\n250 STARTTLS\r\n",
        "MAIL": "250 2.1.0 Ok\r\n",
        "RCPT": "250 2.1.5 Ok\r\n",
        "default": "500 5.5.2 Error: bad syntax\r\n",
    },
}

LLM_SYSTEM_PROMPT = """You are an AI playing the role of a vulnerable server in a honeypot.
Your job is to generate convincing fake responses to attacker commands.
Rules:
- Respond AS the server would (not as a human)
- Always give slightly believable fake data (fake usernames, fake IPs, fake files)
- Never reveal this is a honeypot
- Keep responses under 200 chars
- For dangerous commands (rm, shutdown) return "permission denied" errors
- Format output as the real service would (SSH shell output, FTP codes, HTTP responses etc.)
"""


class DeceptionEngine:

    def get_banner(self, service: str) -> str:
        options = BANNERS.get(service, [f"220 {service} Service Ready\r\n"])
        return random.choice(options)

    def respond(self, command: str, service: str, intent: dict) -> str:
        """Generate a deceptive response using LLM or fallback templates."""
        if LLM_AVAILABLE:
            return self._llm_respond(command, service, intent)
        return self._template_respond(command, service, intent)

    def _llm_respond(self, command: str, service: str, intent: dict) -> str:
        try:
            resp = client.chat.completions.create(
                model="grok-3-fast",
                messages=[
                    {"role": "system", "content": LLM_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Service: {service}\nAttacker command: {command}\nIntent detected: {intent['label']}\nGenerate server response:"},
                ],
                max_tokens=150,
                temperature=0.7,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"[TrapForge Deception] LLM error: {e}, falling back to template")
            return self._template_respond(command, service, intent)

    def _template_respond(self, command: str, service: str, intent: dict) -> str:
        templates = FAKE_RESPONSES.get(service, {})
        cmd_upper = command.upper()

        # Try to match a keyword in the templates
        for key, response in templates.items():
            if key != "default" and (key in command or key in cmd_upper):
                return self._inject_variation(response, intent)

        # Intent-based responses
        if intent["label"] == "privilege_escalation":
            return "sudo: 3 incorrect password attempts"
        if intent["label"] == "malware_deploy":
            return f"bash: {command.split()[0]}: command not found"
        if intent["label"] == "data_exfil":
            return "Connection closed by remote host."
        if intent["label"] == "apt":
            return "Operation completed successfully"  # Let them think it worked!

        return templates.get("default", "Command not recognized.")

    def _inject_variation(self, response: str, intent: dict) -> str:
        """Add small random variations to seem more realistic."""
        if intent["severity"] in ("critical", "high"):
            # Occasionally give extra fake juicy data to keep attacker engaged
            extras = [
                "\n# NOTE: backup credentials in /root/.secrets",
                "\n# last login: Apr 1 from 192.168.1.100",
                "",
            ]
            return response + random.choice(extras)
        return response
