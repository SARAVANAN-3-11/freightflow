import { useCallback, useEffect, useMemo, useState } from "react";
import { applyOptimization as persistOptimization, createLorry, createShipment as persistShipment, getFleetSnapshot, updateLorryStatus as persistLorryStatus } from "../services/api";
import { optimizeFleet } from "../services/optimizationService";
import { subscribeToTelemetry } from "../services/realtimeService";

export function useFleetData() {
  const [lorries, setLorries] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [optimization, setOptimization] = useState({ loads: [], score: 0, distanceSaved: 0, costSaved: 0, generatedAt: "No run yet" });
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    const fetchFleetSnapshot = async () => {
      try {
        const snapshot = await getFleetSnapshot();
        if (snapshot?.lorries) setLorries(snapshot.lorries);
        if (snapshot?.shipments) setShipments(snapshot.shipments);
        if (snapshot?.optimization) setOptimization(snapshot.optimization);
      } catch { setLorries([]); setShipments([]); }
      setLoading(false);
    };
    fetchFleetSnapshot();
    const unsubscribeGps = subscribeToTelemetry((telemetry) => {
      if (!telemetry?.lorryId || telemetry.type === "rfid:scan") return;
      setLorries((items) =>
        items.map((lorry) =>
          (lorry.id === telemetry.lorryId || lorry.databaseId === telemetry.lorryId)
            ? { ...lorry, latitude: telemetry.latitude, longitude: telemetry.longitude }
            : lorry,
        ),
      );
    });
    const unsubscribeRfid = subscribeToTelemetry((event) => {
      if (event?.type !== "rfid:scan") return;
      setLorries((items) => items.map((lorry) =>
        lorry.id === event.lorryId || lorry.databaseId === event.lorryId || lorry.id === event.lorryCode
          ? { ...lorry, status: event.status === "IN_TRANSIT" ? "En route" : event.status === "AVAILABLE" ? "Available" : "Maintenance" }
          : lorry,
      ));
    });
    return () => { unsubscribeGps(); unsubscribeRfid(); };
  }, [setLorries, setShipments, setOptimization]);

  const addLorry = useCallback(async (form) => {
    const newLorry = await createLorry(form);
    setLorries((current) => [newLorry, ...current]);
    return newLorry;
  }, []);

  const addShipment = useCallback(async (form) => {
    const newShipment = await persistShipment(form);
    setShipments((current) => [newShipment, ...current]);
    return newShipment;
  }, []);

  const runOptimization = useCallback(async () => {
    setOptimizing(true);
    try {
      const next = await optimizeFleet({ lorries, shipments, fuelPrice: 95 });
      setOptimization({ ...next, generatedAt: new Date().toISOString() });
      return next;
    } finally { setOptimizing(false); }
  }, [lorries, shipments]);

  const applyOptimization = useCallback(async (plan) => {
    const result = await persistOptimization({ loads: [plan] });
    const assignment = new Map(plan.shipments.map((id) => [id, plan.lorryId]));
    setShipments((items) => items.map((shipment) => assignment.has(shipment.id)
      ? { ...shipment, lorryId: assignment.get(shipment.id), status: "Assigned" }
      : shipment,
    ));
    return result;
  }, []);

  const updateLorryStatus = useCallback(
    (id, status) => {
      persistLorryStatus(id, status).then(() => setLorries((items) =>
        items.map((lorry) => (lorry.id === id ? { ...lorry, status } : lorry)),
      ));
    },
    [setLorries],
  );

  const metrics = useMemo(() => {
    const active = lorries.filter(
      (lorry) => lorry.status === "En route",
    ).length;
    const available = lorries.filter(
      (lorry) => lorry.status === "Available",
    ).length;
    const urgent = shipments.filter(
      (shipment) =>
        shipment.priority === "Critical" || shipment.priority === "High",
    ).length;
    return {
      total: lorries.length,
      active,
      available,
      urgent,
      shipments: shipments.length,
      assigned: shipments.filter((shipment) => shipment.status === "Assigned")
        .length,
    };
  }, [lorries, shipments]);

  return {
    loading,
    lorries,
    shipments,
    optimization,
    optimizing,
    metrics,
    addLorry,
    addShipment,
    runOptimization,
    applyOptimization,
    updateLorryStatus,
  };
}
