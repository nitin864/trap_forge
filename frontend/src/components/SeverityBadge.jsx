const COLORS = {
  critical: { bg: "#2d0a0a", text: "#ff4d4d", border: "#ff2222" },
  high:     { bg: "#2d1a00", text: "#ff9900", border: "#ff8800" },
  medium:   { bg: "#1a1a00", text: "#ffe033", border: "#ccb800" },
  low:      { bg: "#001a0a", text: "#33ff99", border: "#00cc66" },
};

export default function SeverityBadge({ level }) {
  const c = COLORS[level] || COLORS.low;
  return (
    <span style={{
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 4,
      padding: "1px 7px",
      fontSize: 10,
      fontWeight: 700,
      fontFamily: "monospace",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {level}
    </span>
  );
}
