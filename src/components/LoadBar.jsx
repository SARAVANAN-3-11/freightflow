export default function LoadBar({ value, label = true }) {
  const color = value > 85 ? "full" : value > 65 ? "strong" : "light";
  return (
    <div className="load-group">
      <div className="load-track">
        <span className={color} style={{ width: `${value}%` }}></span>
      </div>
      {label && <b>{value}%</b>}
    </div>
  );
}
