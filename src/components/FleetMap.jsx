import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { subscribeToTelemetry } from "../services/realtimeService";

const mapCenter = [15.2, 77.6];

export default function FleetMap({ lorries, shipments = [] }) {
  const [positions, setPositions] = useState(lorries);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  useEffect(() => setPositions(lorries), [lorries]);
  useEffect(() => {
    const map = L.map("fleet-live-leaflet", { zoomControl: false }).setView(mapCenter, 5);
    mapRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => subscribeToTelemetry((telemetry) => {
    setPositions((items) => items.map((lorry) => lorry.id === telemetry.lorryId ? { ...lorry, ...telemetry } : lorry));
  }), []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const markers = positions
      .filter((lorry) => Number.isFinite(Number(lorry.latitude)) && Number.isFinite(Number(lorry.longitude)))
      .map((lorry) => L.marker([Number(lorry.latitude), Number(lorry.longitude)]).bindTooltip(`${lorry.id} · ${lorry.driver}`));
    const shipmentMarkers = shipments.flatMap((shipment) => {
      const endpoints = [];
      if (Number.isFinite(Number(shipment.originLat)) && Number.isFinite(Number(shipment.originLon))) endpoints.push({ point: [shipment.originLat, shipment.originLon], label: `${shipment.id} pickup` });
      if (Number.isFinite(Number(shipment.destinationLat)) && Number.isFinite(Number(shipment.destinationLon))) endpoints.push({ point: [shipment.destinationLat, shipment.destinationLon], label: `${shipment.id} delivery` });
      return endpoints.map(({ point, label }) => L.circleMarker(point, { radius: 5, color: "#e8952e", fillColor: "#fff4df", fillOpacity: 1, weight: 2 }).bindTooltip(label));
    });
    [...markers, ...shipmentMarkers].forEach((marker) => marker.addTo(map));
    if (routeLayerRef.current) routeLayerRef.current.remove();
    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;
    let cancelled = false;
    const assignedRoutes = shipments.map((shipment) => {
      const lorry = positions.find((item) => item.id === shipment.lorryId || item.databaseId === shipment.lorryId);
      const start = Number.isFinite(Number(shipment.originLat)) && Number.isFinite(Number(shipment.originLon))
        ? [Number(shipment.originLat), Number(shipment.originLon)]
        : lorry && Number.isFinite(Number(lorry.latitude)) && Number.isFinite(Number(lorry.longitude))
          ? [Number(lorry.latitude), Number(lorry.longitude)]
          : [];
      const end = [Number(shipment.destinationLat), Number(shipment.destinationLon)];
      return shipment.lorryId && start.every(Number.isFinite) && end.every(Number.isFinite) ? { shipment, start, end } : null;
    }).filter(Boolean);
    Promise.all(assignedRoutes.map(async ({ shipment, start, end }) => {
      const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`;
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);
      if (!response.ok) throw new Error("Route service unavailable");
      const result = await response.json();
      return { shipment, start, end, geometry: result.routes?.[0]?.geometry };
    })).then((routes) => {
      if (cancelled) return;
      routes.filter((route) => route.geometry).forEach(({ shipment, geometry, start, end }) => {
        L.geoJSON(geometry, { style: { color: "#536eea", weight: 4, opacity: 0.8 } }).bindTooltip(`${shipment.id} · live assigned route`).addTo(routeLayer);
        L.circleMarker(start, { radius: 6, color: "#536eea", fillColor: "#fff", fillOpacity: 1, weight: 3 }).addTo(routeLayer);
        L.circleMarker(end, { radius: 6, color: "#20ab7c", fillColor: "#fff", fillOpacity: 1, weight: 3 }).bindTooltip(`${shipment.id} delivery`).addTo(routeLayer);
      });
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      shipmentMarkers.forEach((marker) => marker.remove());
      routeLayer.remove();
    };
  }, [positions, shipments]);
  return <div id="fleet-live-leaflet" className="route-map fleet-leaflet-map" aria-label="Live fleet map" />;
}