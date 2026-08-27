export default function StatusPill({ value }) {
  const type = String(value).toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-pill ${type}`}>{value}</span>;
}
