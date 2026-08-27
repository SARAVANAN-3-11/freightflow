import Icon from "../components/Icon";
import LoadBar from "../components/LoadBar";
import MetricCard from "../components/MetricCard";
import FleetMap from "../components/FleetMap";
import StatusPill from "../components/StatusPill";
import { useState } from "react";

export default function Dashboard({ data, onNavigate }) {
  const { metrics, lorries, shipments, optimization } = data;
  const [window, setWindow] = useState("Live network");
  const [selectedSignal, setSelectedSignal] = useState("all");
  const dueShipments = shipments
    .filter((item) => item.priority !== "Normal")
    .slice(0, 4);
  const utilisation = Math.round(
    lorries
      .filter((item) => item.status === "En route")
      .reduce((sum, item) => sum + item.utilization, 0) /
      Math.max(metrics.active, 1),
  );
  return (
    <section className="page dashboard-page">
      <div className="control-tower-hero">
        <div>
          <p className="eyebrow"><span className="live-dot"></span> OPERATIONS CONTROL TOWER · FRIDAY, 28 AUG 2026</p>
          <h1>
            Good morning, Arjun <span>✦</span>
          </h1>
          <p className="page-subtitle">
            A live read on every load, route, and gate across South India.
          </p>
        </div>
        <div className="hero-actions">
          <div className="sync-status"><span className="live-dot"></span> Live sync <b>02:14</b></div>
          <button className="new-lorry-button" onClick={() => onNavigate("optimization")}>
            <Icon name="route" size={17} /> Run optimizer
          </button>
        </div>
      </div>
      <div className="metrics-grid">
        <MetricCard
          icon="truck"
          tone="blue"
          label="Total lorries"
          value={metrics.total}
          detail={`${metrics.active} currently on the road`}
          trend="12%"
        />
        <MetricCard
          icon="package"
          tone="amber"
          label="Open shipments"
          value={metrics.shipments}
          detail={`${metrics.assigned} already assigned`}
          trend="8%"
        />
        <MetricCard
          icon="clock"
          tone="red"
          label="Urgent deadlines"
          value={metrics.urgent}
          detail="Need attention in 24 hours"
        />
        <MetricCard
          icon="target"
          tone="mint"
          label="Average load"
          value={`${utilisation}%`}
          detail="Across active vehicles"
          trend="4.6%"
        />
      </div>
      <div className="engine-strip">
        <button className={`engine-status ${selectedSignal === "all" ? "active" : ""}`} onClick={() => setSelectedSignal("all")}>
          <span className="engine-icon engine-green"><Icon name="check" size={16} /></span>
          <span><b>Network healthy</b><small>All systems operational</small></span>
          <strong>4 / 4</strong>
        </button>
        <button className={`engine-status ${selectedSignal === "capacity" ? "active" : ""}`} onClick={() => { setSelectedSignal("capacity"); onNavigate("optimization"); }}>
          <span className="engine-icon engine-blue"><Icon name="package" size={16} /></span>
          <span><b>Feasibility engine</b><small>Capacity checks passed</small></span>
          <strong>100%</strong>
        </button>
        <button className={`engine-status ${selectedSignal === "fuel" ? "active" : ""}`} onClick={() => { setSelectedSignal("fuel"); onNavigate("optimization"); }}>
          <span className="engine-icon engine-amber"><Icon name="fuel" size={16} /></span>
          <span><b>Fuel assignment</b><small>Cost-aware routing active</small></span>
          <strong>-18.6k</strong>
        </button>
        <button className={`engine-status ${selectedSignal === "gates" ? "active" : ""}`} onClick={() => { setSelectedSignal("gates"); onNavigate("fleet"); }}>
          <span className="engine-icon engine-red"><Icon name="target" size={16} /></span>
          <span><b>RFID gate network</b><small>Last scan 2 min ago</small></span>
          <strong>Online</strong>
        </button>
      </div>
      <div className="dashboard-main-grid">
        <article className="panel fleet-map-panel">
          <div className="panel-head">
            <div>
              <div className="panel-kicker"><span className="live-dot"></span> GPS TELEMETRY</div>
              <h2>Fleet at a glance</h2>
              <p>Live vehicle positions and route progress</p>
            </div>
            <div className="map-controls">
              {["Live network", "Routes"].map((item) => <button key={item} className={window === item ? "selected" : ""} onClick={() => setWindow(item)}>{item}</button>)}
            </div>
          </div>
          <FleetMap lorries={lorries} />
          <div className="fleet-map-footer">
            <div>
              <b><span className="live-dot"></span> {metrics.active} vehicles transmitting</b>
              <span>{window === "Routes" ? "Showing optimized corridors" : "Updated from vehicle GPS · 2 mins ago"}</span>
            </div>
            <button
              className="outline-button"
              onClick={() => onNavigate("fleet")}
            >
              View all vehicles
            </button>
          </div>
        </article>
        <article className="panel analytics-panel live-summary-panel">
          <div className="panel-head">
            <div>
              <div className="panel-kicker">NETWORK PULSE</div>
              <h2>Live operating picture</h2>
              <p>Current conditions across the transport network</p>
            </div>
            <span className="score-badge">LIVE</span>
          </div>
          <div className="pulse-score">
            <strong>{metrics.active}</strong>
            <span>vehicles<br /><b>transmitting now</b></span>
          </div>
          <div className="pulse-list">
            <div><span className="green-dot"></span><b>{metrics.available}</b><span>vehicles ready for assignment</span></div>
            <div><span className="amber-dot"></span><b>{metrics.urgent}</b><span>priority shipments to protect</span></div>
            <div><span className="blue-dot"></span><b>{optimization.loads?.length || 0}</b><span>optimized routes available</span></div>
          </div>
        </article>
      </div>
      <div className="dashboard-bottom-grid">
        <article className="panel attention-panel">
          <div className="panel-head">
            <div>
              <div className="panel-kicker">PRIORITY QUEUE</div>
              <h2>Interventions needed</h2>
              <p>Deadlines and exceptions requiring a decision</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("shipments")}>View all <Icon name="chevron" size={15} /></button>
          </div>
          <div className="attention-list">
            {dueShipments.map((shipment) => (
              <div className="attention-row" key={shipment.id}>
                <span className={`priority-dot ${String(shipment.priority).toLowerCase()}`}></span>
                <div className="attention-main"><b>{shipment.id} · {shipment.customer}</b><small>{shipment.origin} <span>→</span> {shipment.destination}</small></div>
                <div className="attention-deadline"><StatusPill value={shipment.priority} /><small><Icon name="clock" size={13} />{shipment.deadline}</small></div>
                <button className="row-button" onClick={() => onNavigate("optimization")} aria-label={`Optimize ${shipment.id}`}><Icon name="chevron" size={17} /></button>
              </div>
            ))}
          </div>
        </article>
        <article className="panel gate-panel">
          <div className="panel-head"><div><div className="panel-kicker">HARDWARE FEED</div><h2>Gate activity</h2><p>RFID scans from the last 15 minutes</p></div><span className="online-badge"><i></i> Online</span></div>
          <div className="gate-summary"><strong>{metrics.active + metrics.available}</strong><span>vehicles tracked<br /><b>from live fleet data</b></span></div>
          <div className="gate-event"><span className="gate-chip gate-entry"><Icon name="arrowUp" size={14} /></span><span><b>Main Gate · LRY-204</b><small>Entered yard · 10:42 AM</small></span><StatusPill value="En route" /></div>
          <div className="gate-event"><span className="gate-chip gate-exit"><Icon name="arrowUp" size={14} /></span><span><b>Service Gate · LRY-327</b><small>Maintenance bay · 10:31 AM</small></span><StatusPill value="Maintenance" /></div>
          <button className="outline-button gate-button" onClick={() => { setSelectedSignal("gates"); onNavigate("fleet"); }}>Open hardware log <Icon name="chevron" size={14} /></button>
        </article>
      </div>
      <div className="dashboard-bottom-grid dashboard-secondary-grid">
        <article className="panel optimizer-card">
          <div className="optimizer-bg"></div>
          <div className="optimizer-content">
            <span className="optimizer-icon">
              <Icon name="route" size={22} />
            </span>
            <p className="eyebrow">SMART LOAD PLANNING</p>
            <h2>There’s a better route waiting.</h2>
            <p>
              Your available capacity can cover {optimization.loads?.length || 0} live route plan{optimization.loads?.length === 1 ? "" : "s"} with fewer empty kilometres.
            </p>
            <div className="save-stat">
              <span>
                <b>{optimization.distanceSaved} km</b> potential distance saved
              </span>
              <span>
                <b>{optimization.costSaved}</b> estimated savings
              </span>
            </div>
            <button
              className="light-button"
              onClick={() => onNavigate("optimization")}
            >
              Optimize my fleet <Icon name="chevron" size={16} />
            </button>
          </div>
        </article>
      </div>
      <article className="panel vehicle-panel">
        <div className="panel-head">
          <div>
            <h2>Vehicle load status</h2>
            <p>Active lorries and capacity use</p>
          </div>
          <button className="text-button" onClick={() => onNavigate("fleet")}>
            Manage fleet <Icon name="chevron" size={15} />
          </button>
        </div>
        <div className="vehicle-table">
          <div className="table-header">
            <span>VEHICLE</span>
            <span>ROUTE</span>
            <span>LOAD UTILIZATION</span>
            <span>ETA</span>
            <span></span>
          </div>
          {lorries
            .filter((item) => item.status === "En route")
            .map((lorry) => (
              <div className="table-row" key={lorry.id}>
                <div className="vehicle-cell">
                  <span className="truck-tile">
                    <Icon name="truck" size={19} />
                  </span>
                  <span>
                    <b>{lorry.id}</b>
                    <small>{lorry.registration}</small>
                  </span>
                </div>
                <div className="route-cell">
                  <b>
                    {lorry.currentLocation} <span>→</span> {lorry.destination}
                  </b>
                  <small>{lorry.cargo}</small>
                </div>
                <LoadBar value={lorry.utilization} />
                <div className="eta-cell">
                  <b>{lorry.eta}</b>
                  <small>
                    <span className="green-dot"></span> On schedule
                  </small>
                </div>
                <button className="row-button" onClick={() => onNavigate("fleet")} aria-label={`View ${lorry.id}`}>
                  <Icon name="more" size={18} />
                </button>
              </div>
            ))}
        </div>
      </article>
    </section>
  );
}
