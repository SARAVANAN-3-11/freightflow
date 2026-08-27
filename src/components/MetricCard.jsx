import Icon from "./Icon";

export default function MetricCard({
  label,
  value,
  detail,
  trend,
  icon,
  tone = "blue",
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-head">
        <span className="metric-icon">
          <Icon name={icon} size={19} />
        </span>
        {trend && (
          <span className="metric-trend">
            <Icon name="arrowUp" size={13} />
            {trend}
          </span>
        )}
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-detail">{detail}</div>
    </article>
  );
}
