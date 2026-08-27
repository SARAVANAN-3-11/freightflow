import Icon from "./Icon";

export default function RouteMap({ lorries, compact = false }) {
  const activeLorries = lorries.filter(
    (lorry) => lorry.status !== "Maintenance",
  );
  return (
    <div className={`route-map ${compact ? "compact-map" : ""}`}>
      <div className="map-noise"></div>
      <div className="map-road road-1"></div>
      <div className="map-road road-2"></div>
      <div className="map-road road-3"></div>
      <div className="map-road road-4"></div>
      <div className="map-route route-line-1"></div>
      <div className="map-route route-line-2"></div>
      <span className="map-city city-pune">Pune</span>
      <span className="map-city city-hyd">Hyderabad</span>
      <span className="map-city city-blr">Bengaluru</span>
      <span className="map-city city-che">Chennai</span>
      <span className="map-city city-coi">Coimbatore</span>
      {activeLorries.map((lorry) => (
        <button
          className={`map-truck ${lorry.status === "Available" ? "available" : ""}`}
          style={{ left: `${lorry.x}%`, top: `${lorry.y}%` }}
          title={`${lorry.id}: ${lorry.currentLocation}`}
          key={lorry.id}
        >
          <Icon name="truck" size={14} />
        </button>
      ))}
      {!compact && (
        <div className="map-legend">
          <span>
            <i className="legend-dot moving"></i> On route
          </span>
          <span>
            <i className="legend-dot parked"></i> Available
          </span>
        </div>
      )}
    </div>
  );
}
