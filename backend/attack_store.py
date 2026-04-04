"""
TrapForge Attack Store
In-memory storage with stats aggregation.
Replace with Redis or SQLite for persistence.
"""

from collections import defaultdict, deque
from datetime import datetime
from typing import Optional
import threading


class AttackStore:
    def __init__(self, max_size: int = 10000):
        self._lock = threading.Lock()
        self._attacks: deque = deque(maxlen=max_size)
        self._by_id: dict = {}
        self._stats = {
            "total": 0,
            "by_intent": defaultdict(int),
            "by_severity": defaultdict(int),
            "by_service": defaultdict(int),
            "by_country": defaultdict(int),
            "unique_ips": set(),
            "timeline": deque(maxlen=60),  # last 60 ticks
        }

    def add(self, event: dict):
        with self._lock:
            self._attacks.appendleft(event)
            self._by_id[event["id"]] = event

            s = self._stats
            s["total"] += 1
            s["by_intent"][event["intent"]] += 1
            s["by_severity"][event["severity"]] += 1
            s["by_service"][event["service"]] += 1
            s["unique_ips"].add(event["ip"])

            country = event.get("country", {})
            if isinstance(country, dict):
                s["by_country"][country.get("country", "Unknown")] += 1

            # Timeline bucket (per-minute)
            now_min = datetime.utcnow().strftime("%H:%M")
            tl = list(s["timeline"])
            if tl and tl[-1]["time"] == now_min:
                tl[-1]["count"] += 1
                s["timeline"][-1] = tl[-1]
            else:
                s["timeline"].append({"time": now_min, "count": 1})

    def get_recent(self, limit: int = 50) -> list:
        with self._lock:
            return list(self._attacks)[:limit]

    def get_by_id(self, attack_id: str) -> Optional[dict]:
        return self._by_id.get(attack_id)

    def get_stats(self) -> dict:
        with self._lock:
            s = self._stats
            return {
                "total": s["total"],
                "unique_ips": len(s["unique_ips"]),
                "by_intent": dict(s["by_intent"]),
                "by_severity": dict(s["by_severity"]),
                "by_service": dict(s["by_service"]),
                "by_country": dict(s["by_country"]),
                "timeline": list(s["timeline"]),
                "top_intents": sorted(
                    s["by_intent"].items(), key=lambda x: x[1], reverse=True
                )[:5],
            }

    def get_geo_heatmap(self) -> list:
        with self._lock:
            geo_data = []
            seen = {}
            for attack in self._attacks:
                country = attack.get("country", {})
                if isinstance(country, dict) and "lat" in country:
                    key = country.get("country", "?")
                    if key not in seen:
                        seen[key] = {**country, "count": 0}
                    seen[key]["count"] += 1
            return list(seen.values())
