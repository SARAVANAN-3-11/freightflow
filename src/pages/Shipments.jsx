import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import StatusPill from "../components/StatusPill";

export default function Shipments({ data, onNavigate, onAddShipment }) {
  const { shipments, lorries } = data;
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      shipments.filter(
        (shipment) =>
          (filter === "All" || shipment.status === filter) &&
          `${shipment.id} ${shipment.customer} ${shipment.origin} ${shipment.destination}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [filter, query, shipments],
  );
  const getLorry = (id) => lorries.find((lorry) => lorry.id === id || lorry.databaseId === id);
  return (
    <section className="page shipments-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">SHIPMENT CONTROL</p>
          <h1>Shipment board</h1>
          <p className="page-subtitle">
            Keep critical loads moving and deadlines protected.
          </p>
        </div>
        <button
          className="new-lorry-button"
          onClick={onAddShipment}
        >
          <Icon name="plus" size={18} /> Add shipment
        </button>
      </div>
      <div className="shipment-summary">
        <div>
          <span className="summary-icon critical">
            <Icon name="clock" size={18} />
          </span>
          <span>
            <b>
              {shipments.filter((s) => s.priority === "Critical").length}{" "}
              critical
            </b>
            <small>need a capacity decision</small>
          </span>
        </div>
        <div>
          <span className="summary-icon blue">
            <Icon name="package" size={18} />
          </span>
          <span>
            <b>
              {shipments.filter((s) => s.status === "Assigned").length} assigned
            </b>
            <small>currently in the network</small>
          </span>
        </div>
        <div>
          <span className="summary-icon amber">
            <Icon name="target" size={18} />
          </span>
          <span>
            <b>
              {shipments.filter((s) => s.status === "Unassigned").length}{" "}
              unassigned
            </b>
            <small>ready for optimization</small>
          </span>
        </div>
      </div>
      <article className="panel shipments-panel">
        <div className="fleet-list-top">
          <div className="filter-tabs">
            {["All", "Assigned", "Unassigned", "Planning"].map((item) => (
              <button
                key={item}
                className={filter === item ? "selected" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="search-box">
            <Icon name="search" size={17} />
            <input
              placeholder="Search shipments"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="shipments-table">
          <div className="shipment-head">
            <span>SHIPMENT</span>
            <span>ROUTE</span>
            <span>WEIGHT / VOLUME</span>
            <span>DEADLINE</span>
            <span>ASSIGNMENT</span>
            <span></span>
          </div>
          {filtered.map((shipment) => {
            const lorry = getLorry(shipment.lorryId);
            return (
              <div className="shipment-row" key={shipment.id}>
                <div className="shipment-id">
                  <span className="package-tile">
                    <Icon name="package" size={18} />
                  </span>
                  <span>
                    <b>{shipment.id}</b>
                    <small>{shipment.customer}</small>
                  </span>
                </div>
                <div className="shipment-route">
                  <b>
                    {shipment.origin} <span>→</span> {shipment.destination}
                  </b>
                  <small>{shipment.value} declared value</small>
                </div>
                <div>
                  <b>{shipment.weight} t</b>
                  <small>{shipment.volume} m³</small>
                </div>
                <div className="deadline-cell">
                  <StatusPill value={shipment.priority} />
                  <small>
                    <Icon name="clock" size={13} />
                    {shipment.deadline}
                  </small>
                </div>
                <div className="assignment-cell">
                  {lorry ? (
                    <>
                      <span className="assignment-avatar">
                        {lorry.id.replace("LRY-", "")}
                      </span>
                      <span>
                        <b>{lorry.id}</b>
                        <small>{shipment.progress}% complete</small>
                      </span>
                    </>
                  ) : (
                    <button
                      className="assign-button"
                      onClick={() => onNavigate("optimization")}
                    >
                      Assign load <Icon name="chevron" size={14} />
                    </button>
                  )}
                </div>
                <button className="row-button" onClick={() => onNavigate("optimization")} aria-label={`Plan ${shipment.id}`}>
                  <Icon name="more" size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}
