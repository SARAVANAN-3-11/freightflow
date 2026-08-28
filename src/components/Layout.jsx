import Icon from "./Icon";

const navigation = [
  { id: "dashboard", label: "Overview", icon: "grid" },
  { id: "fleet", label: "Fleet live view", icon: "truck" },
  { id: "shipments", label: "Shipments", icon: "package" },
  { id: "optimization", label: "Load optimizer", icon: "route" },
  { id: "rfid", label: "RFID automation", icon: "target" },
];

export default function Layout({
  activePage,
  onNavigate,
  children,
  onAddLorry,
  notificationCount = 0,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => onNavigate("dashboard")}
          aria-label="FreightFlow home"
        >
          <span className="brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span>
            freight<span>flow</span>
          </span>
        </button>
        <div className="workspace-label">OPERATIONS</div>
        <nav>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === "shipments" && notificationCount > 0 && <b className="nav-count">{notificationCount}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="sparkle">✦</div>
            <strong>Need a hand?</strong>
            <p>See how smarter routing can lower your cost.</p>
            <button onClick={() => onNavigate("optimization")}>
              View optimizer <Icon name="chevron" size={15} />
            </button>
          </div>
          <button className="profile" onClick={() => onNavigate("fleet")} aria-label="Open fleet profile">
            <span className="avatar avatar-lg">AK</span>
            <span>
              <b>Arjun Khanna</b>
              <small>Fleet manager</small>
            </span>
            <Icon name="more" size={19} />
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-brand"
            onClick={() => onNavigate("dashboard")}
          >
            <span className="brand-mark">
              <span></span>
              <span></span>
              <span></span>
            </span>{" "}
            freightflow
          </button>
          <div className="top-actions">
            <button className="icon-button notify" onClick={() => onNavigate("shipments")} aria-label="Open shipment alerts">
              <Icon name="bell" />
              <i></i>
            </button>
            <button className="new-lorry-button" onClick={onAddLorry}>
              <Icon name="plus" size={18} /> Add lorry
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
