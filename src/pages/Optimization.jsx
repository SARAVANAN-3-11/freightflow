import Icon from "../components/Icon";
import LoadBar from "../components/LoadBar";
import StatusPill from "../components/StatusPill";
import OptimizationRouteMap from "../components/OptimizationRouteMap";
import { useState } from "react";

export default function Optimization({ data }) {
  const { lorries, shipments, optimization, optimizing, runOptimization: solveFleet, applyOptimization } = data;
  const [message, setMessage] = useState("");

  const runOptimization = async () => {
    setMessage("");
    try {
      await solveFleet();
      setMessage("Optimization matrix solved successfully using live database records.");
    } catch (error) {
      setMessage("Error executing optimizer: " + error.message);
    }
  };

  const applyPlan = async (plan) => {
    try {
      await applyOptimization(plan);
      setMessage(`Route successfully assigned to lorry!`);
    } catch (error) {
      setMessage(error.message || "Could not save route plan.");
    }
  };

  const findLorry = (id) => lorries.find((item) => item.id === id);
  const findShipment = (id) => shipments.find((item) => item.id === id);

  const loads = optimization.loads || [];
  const rejectedCount = (optimization.rejected || []).length;
  const score = optimization.score || 0;

  const qualityTitle = score >= 90 ? "Excellent allocation" : score >= 70 ? "Needs review" : "No feasible plan yet";
  const qualityMessage = rejectedCount 
    ? `${rejectedCount} shipment load(s) exceeded available capacity constraints.` 
    : loads.length > 0 
      ? "All live shipment deadlines are covered with available capacity." 
      : "Run optimization to calculate routes from database.";

  return (
    <section className="page optimization-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">LIVE DATABASE & OR-TOOLS SYNC</p>
          <h1>Load optimizer</h1>
          <p className="page-subtitle">
            Processing real-time Supabase telemetry against Python constraints.
          </p>
        </div>
        <button
          className="new-lorry-button optimize-button"
          onClick={runOptimization}
          disabled={optimizing}
        >
          {optimizing ? <span className="button-spinner"></span> : <Icon name="route" size={18} />} 
          {optimizing ? " Solving matrix…" : " Run optimization"}
        </button>
      </div>

      <div className="solver-notice">
        <span><Icon name="info" size={18} /></span>
        <div>
          <b>Live Database Status</b>
          <p>Loaded {lorries.length} active lorries and {shipments.length} live shipments from Supabase.</p>
        </div>
        <span className="solver-time">
          Generated: {optimization.generatedAt || new Date().toLocaleTimeString()}
        </span>
      </div>

      <div className="optimization-score-grid">
        <article className="panel score-panel">
          <div className="score-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" />
              <circle
                className="score-progress"
                cx="60"
                cy="60"
                r="48"
                style={{ strokeDashoffset: 302 - (302 * score) / 100 }}
              />
            </svg>
            <span>
              <b>{score}</b>
              <small>/ 100</small>
            </span>
          </div>
          <div>
            <p className="eyebrow">PLAN QUALITY</p>
            <h2>{qualityTitle}</h2>
            <p>{qualityMessage}</p>
          </div>
        </article>

        <article className="panel savings-panel">
          <div>
            <span className="savings-icon"><Icon name="route" size={21} /></span>
            <p>OPTIMIZED DISTANCE</p>
            <b>{optimization.totalDistance || 0} km</b>
            <small>across live route matrix</small>
          </div>
          <div>
            <span className="savings-icon money">₹</span>
            <p>ROUTE FUEL COST</p>
            <b>₹{(optimization.totalFuelCost || 0).toLocaleString("en-IN")}</b>
            <small>based on vehicle efficiency & ₹95/L</small>
          </div>
          <div>
            <span className="savings-icon teal"><Icon name="clock" size={20} /></span>
            <p>DEADLINE COVERAGE</p>
            <b>{optimization.deadlineCoverage || 0}%</b>
            <small>feasible delivery windows</small>
          </div>
        </article>
      </div>

      <article className="panel optimization-map-panel">
        <div className="panel-head">
          <div>
            <h2>Optimized route map</h2>
            <p>Road routes calculated from live shipment coordinates.</p>
          </div>
          <span className="result-live"><i></i> Solver preview</span>
        </div>
        <OptimizationRouteMap loads={loads} lorries={lorries} shipments={shipments} />
      </article>

      <div className="optimizer-layout">
        <article className="panel route-plan-panel">
          <div className="panel-head">
            <div>
              <h2>Recommended route plan</h2>
              <p>{loads.length} live route plan{loads.length === 1 ? "" : "s"} computed by Python engine.</p>
            </div>
            <span className="result-live"><i></i> Live API</span>
          </div>

          {loads.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              No route matrix generated yet. Click "Run optimization" to query the solver.
            </div>
          )}

          {loads.map((plan, index) => {
            const lorry = findLorry(plan.lorryId);
            const stops = (plan.route || "Origin -> Destination").split("->").map((place) => place.trim()).filter(Boolean);
            return (
              <div className="recommended-route" key={plan.lorryId}>
                <div className="route-number">0{index + 1}</div>
                <div className="route-plan-main">
                  <div className="route-plan-title">
                    <span className="truck-tile"><Icon name="truck" size={19} /></span>
                    <span>
                      <b>{lorry?.name || plan.lorryId}</b>
                      <small>Max Weight: {lorry?.max_weight || lorry?.capacity_weight}kg · {lorry?.fuel_efficiency || 8} km/L</small>
                    </span>
                    <StatusPill value="Recommended" />
                  </div>
                  
                  <div className="route-path">
                    <span className="route-start"></span>
                    <span>
                      {(plan.route || "Warehouse → Destination").split("->").map((place, idx, arr) => (
                        <span key={idx} className={idx === 0 ? "origin" : ""}>
                          {place.trim()}
                          {idx < arr.length - 1 && <i>→</i>}
                        </span>
                      ))}
                    </span>
                    <span className="route-end"></span>
                  </div>

                  <div className="route-timeline" aria-label={`Route stops: ${stops.join(" to ")}`}>
                    {stops.map((stop, stopIndex) => (
                      <span className="route-stop" key={`${stop}-${stopIndex}`}>
                        <i className={stopIndex === 0 ? "route-stop-origin" : stopIndex === stops.length - 1 ? "route-stop-destination" : "route-stop-waypoint"}></i>
                        <b>{stop}</b>
                        {stopIndex < stops.length - 1 && <em></em>}
                      </span>
                    ))}
                  </div>

                  <div className="plan-foot">
                    <span><Icon name="route" size={15} /> {plan.distance}</span>
                    <span><Icon name="clock" size={15} /> ₹{plan.fuelCost}</span>
                    <span>Load fill</span>
                    <LoadBar value={plan.fill} />
                  </div>
                </div>

                <div className="plan-shipments">
                  {plan.shipments?.map((id) => {
                    const shipment = findShipment(id);
                    return (
                      <span key={id}>
                        <b>{shipment?.title || id.substring(0, 8)}</b>
                        <small>{shipment?.weight} kg · Vol: {shipment?.volume} m³</small>
                      </span>
                    );
                  })}
                </div>
                
                <button className="approve-button" onClick={() => applyPlan(plan)}>
                  <Icon name="check" size={17} /> Apply
                </button>
              </div>
            );
          })}
        </article>

        <aside className="panel constraint-panel">
          <div className="panel-head">
            <div>
              <h2>Active constraints</h2>
              <p>Live database enforcement</p>
            </div>
            <Icon name="filter" size={18} />
          </div>
          <div className="constraint-list">
            <div><span className="constraint-check"><Icon name="check" size={14} /></span><span><b>Vehicle capacity</b><small>Supabase max_weight & volume</small></span></div>
            <div><span className="constraint-check"><Icon name="check" size={14} /></span><span><b>Delivery deadlines</b><small>Priority and time window sorting</small></span></div>
            <div><span className="constraint-check"><Icon name="check" size={14} /></span><span><b>Driver status</b><small>Filtering for AVAILABLE fleet</small></span></div>
            <div><span className="constraint-check"><Icon name="check" size={14} /></span><span><b>Fuel pricing</b><small>Dynamic cost matrix calculation</small></span></div>
          </div>
          <button className="outline-button full-width" onClick={runOptimization} disabled={optimizing}>
            <Icon name="filter" size={16} /> Refresh Live Data
          </button>
        </aside>
      </div>
      
      {message && <div className="action-message" role="status">{message}</div>}
    </section>
  );
}