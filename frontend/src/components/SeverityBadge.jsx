export default function SeverityBadge({ level }) {
  return <span className={`sev-badge sev-${level}`}>{level}</span>;
}
