import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import LoadBar from "../components/LoadBar";
import FleetMap from "../components/FleetMap";
import StatusPill from "../components/StatusPill";

export default function Fleet({ data, onAddLorry }) {
  const { lorries, shipments, updateLorryStatus } = data;
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(lorries[0]?.id);
  const visibleLorries = useMemo(
    () =>
      lorries.filter(
        (lorry) =>
          (filter === "All" || lorry.status === filter) &&
          `${lorry.id} ${lorry.registration} ${lorry.driver} ${lorry.currentLocation}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [filter, lorries, search],
  );
  const current =
    lorries.find((item) => item.id === selected) || visibleLorries[0];
  return (
    <section className="page fleet-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">LIVE OPERATIONS</p>
          <h1>Fleet live view</h1>
          <p className="page-subtitle">
            Track availability, current locations and every active route.
          </p>
        </div>
        <button className="new-lorry-button" onClick={onAddLorry}>
          <Icon name="plus" size={18} /> Add lorry
        </button>
      </div>
      <div className="fleet-stats">
        <div>
          <span className="green-dot"></span>
          <b>
            {lorries.filter((item) => item.status === "En route").length} on
            route
          </b>
        </div>
        <div>
          <span className="blue-dot"></span>
          <b>
            {lorries.filter((item) => item.status === "Available").length}{" "}
            available now
          </b>
        </div>
        <div>
          <span className="gray-dot"></span>
          <b>
            {lorries.filter((item) => item.status === "Maintenance").length} in
            maintenance
          </b>
        </div>
        <span className="last-sync">
          <Icon name="refresh" size={14} /> Last synced 2 min ago
        </span>
      </div>
      <div className="fleet-live-grid">
        <article className="panel full-map-panel">
          <div className="panel-head">
            <div>
              <h2>Network map</h2>
              <p>Vehicle positions update in near real time</p>
            </div>
            <div className="map-live">
              <i></i> GPS live
            </div>
          </div>
          <FleetMap lorries={lorries} shipments={shipments} />
        </article>
        <aside className="panel selected-vehicle">
          {current ? (
            <>
              <div className="selected-head">
                <span>
                  <span className="truck-tile">
                    <Icon name="truck" size={20} />
                  </span>
                  <span>
                    <b>{current.id}</b>
                    <small>{current.registration}</small>
                  </span>
                </span>
                <StatusPill value={current.status} />
              </div>
              <div className="driver-line">
                <span className="avatar">{current.driverInitials}</span>
                <span>
                  <small>DRIVER</small>
                  <b>{current.driver}</b>
                </span>
              </div>
              <div className="location-block">
                <small>CURRENT LOCATION</small>
                <b>
                  <Icon name="mapPin" size={16} />
                  {current.currentLocation}
                </b>
                <span className="location-line"></span>
                <small>DESTINATION</small>
                <b>
                  <Icon name="target" size={16} />
                  {current.destination}
                </b>
              </div>
              <div className="vehicle-detail-grid">
                <span>
                  <small>FUEL</small>
                  <b>
                    <Icon name="fuel" size={15} />
                    {current.fuel}%
                  </b>
                </span>
                <span>
                  <small>CAPACITY</small>
                  <b>{current.capacity} t</b>
                </span>
              </div>
              {current.status === "En route" && (
                <div className="capacity-detail">
                  <span>
                    <small>LOAD UTILIZATION</small>
                    <b>{current.utilization}%</b>
                  </span>
                  <LoadBar value={current.utilization} label={false} />
                </div>
              )}
              <select
                className="status-select"
                value={current.status}
                onChange={(event) =>
                  updateLorryStatus(current.id, event.target.value)
                }
              >
                <option>Available</option>
                <option>En route</option>
                <option>Maintenance</option>
              </select>
            </>
          ) : (
            <div className="empty-state">No vehicles match this view.</div>
          )}
        </aside>
      </div>
      <article className="panel fleet-list-panel">
        <div className="fleet-list-top">
          <div className="filter-tabs">
            {["All", "En route", "Available", "Maintenance"].map((item) => (
              <button
                className={filter === item ? "selected" : ""}
                key={item}
                onClick={() => setFilter(item)}
              >
                {item}
                <b>
                  {item === "All"
                    ? lorries.length
                    : lorries.filter((lorry) => lorry.status === item).length}
                </b>
              </button>
            ))}
          </div>
          <label className="search-box">
            <Icon name="search" size={17} />
            <input
              placeholder="Search vehicle, driver or city"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="fleet-cards">
          {visibleLorries.map((lorry) => (
            <button
              className={`lorry-card ${selected === lorry.id ? "selected" : ""}`}
              onClick={() => setSelected(lorry.id)}
              key={lorry.id}
            >
              <div>
                <span className="truck-tile">
                  <Icon name="truck" size={19} />
                </span>
                <span className="lorry-name">
                  <b>{lorry.id}</b>
                  <small>{lorry.registration}</small>
                </span>
                <StatusPill value={lorry.status} />
              </div>
              <div className="lorry-route">
                <span>
                  <Icon name="mapPin" size={14} />
                  {lorry.currentLocation}
                </span>
                <span className="route-arrow">→</span>
                <span>
                  <Icon name="target" size={14} />
                  {lorry.destination}
                </span>
              </div>
              <div className="lorry-meta">
                <span>{lorry.driver}</span>
                <span>
                  <Icon name="fuel" size={14} />
                  {lorry.fuel}%
                </span>
              </div>
              {lorry.status === "En route" && (
                <LoadBar value={lorry.utilization} />
              )}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
