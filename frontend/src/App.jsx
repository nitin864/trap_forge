import { useState, useEffect, useRef, createContext, useContext } from "react";
import Dashboard from "./pages/Dashboard";
import "./App.css";

export const AttackContext = createContext(null);

export function useAttacks() {
  return useContext(AttackContext);
}

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export { API_URL };

export default function App() {
  const [attacks, setAttacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  const [alertQueue, setAlertQueue] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    connectWS();
    fetchStats();
    const statsInterval = setInterval(fetchStats, 5000);
    return () => {
      clearInterval(statsInterval);
      wsRef.current?.close();
    };
  }, []);

  function connectWS() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWS, 3000);
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "history") {
        setAttacks(msg.data);
      } else if (msg.type === "attack") {
        const attack = msg.data;
        setAttacks((prev) => [attack, ...prev].slice(0, 500));
        if (attack.severity === "critical" || attack.severity === "high") {
          setAlertQueue((prev) => [...prev, attack].slice(-5));
          setTimeout(() => {
            setAlertQueue((prev) => prev.filter((a) => a.id !== attack.id));
          }, 5000);
        }
      }
    };
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (_) {}
  }

  return (
    <AttackContext.Provider value={{ attacks, stats, connected, alertQueue }}>
      <Dashboard />
    </AttackContext.Provider>
  );
}
