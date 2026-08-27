import { useState } from "react";
import AddLorryModal from "./components/AddLorryModal";
import AddShipmentModal from "./components/AddShipmentModal";
import Layout from "./components/Layout";
import Toast from "./components/Toast";
import { useFleetData } from "./hooks/useFleetData";
import Dashboard from "./pages/Dashboard";
import Fleet from "./pages/Fleet";
import Optimization from "./pages/Optimization";
import Shipments from "./pages/Shipments";

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <span className="brand-mark">
          <span></span>
          <span></span>
          <span></span>
        </span>{" "}
        freightflow
      </div>
      <div className="loading-line">
        <span></span>
      </div>
      <p>Loading your transport network…</p>
    </div>
  );
}

export default function App() {
  const data = useFleetData();
  const [page, setPage] = useState("dashboard");
  const [addingLorry, setAddingLorry] = useState(false);
  const [addingShipment, setAddingShipment] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const addLorry = async (form) => {
    try {
      const lorry = await data.addLorry(form);
      setAddingLorry(false);
      setToast(`${lorry.id} was added and is ready for assignment.`);
    } catch (error) {
      setToast(error.message || "Could not save the lorry.");
    }
  };
  const addShipment = async (form) => {
    try {
      const shipment = await data.addShipment(form);
      setAddingShipment(false);
      setToast(`${shipment.id} was added to the live shipment board.`);
    } catch (error) {
      setToast(error.message || "Could not save the shipment.");
    }
  };
  const common = { data, onNavigate: navigate };
  const views = {
    dashboard: <Dashboard {...common} />,
    fleet: <Fleet data={data} onAddLorry={() => setAddingLorry(true)} />,
    shipments: <Shipments {...common} onAddShipment={() => setAddingShipment(true)} />,
    optimization: <Optimization data={data} />,
  };
  if (data.loading) return <LoadingScreen />;
  return (
    <>
      <Layout
        activePage={page}
        onNavigate={navigate}
        onAddLorry={() => setAddingLorry(true)}
        notificationCount={data.metrics.urgent}
      >
        {views[page]}
      </Layout>
      {addingLorry && (
        <AddLorryModal
          onClose={() => setAddingLorry(false)}
          onSubmit={addLorry}
        />
      )}
      {addingShipment && (
        <AddShipmentModal onClose={() => setAddingShipment(false)} onSubmit={addShipment} />
      )}
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
