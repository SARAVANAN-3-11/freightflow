import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const mapCenter = [15.2, 77.6];

export default function OptimizationRouteMap({ loads = [], lorries = [], shipments = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const map = L.map(containerRef.current, { zoomControl: false }).setView(mapCenter, 5);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    if (routeLayerRef.current) routeLayerRef.current.remove();
    const layer = L.layerGroup().addTo(map);
    routeLayerRef.current = layer;
    const bounds = [];
    let cancelled = false;

    const routeJobs = loads.flatMap((load, loadIndex) => {
      const planShipments = (load.shipments || []).map((id) => shipments.find((item) => item.id === id)).filter(Boolean);
      const points = planShipments.flatMap((shipment) => {
        const origin = [Number(shipment.originLat), Number(shipment.originLon)];
        const destination = [Number(shipment.destinationLat), Number(shipment.destinationLon)];
        return origin.every(Number.isFinite) && destination.every(Number.isFinite) ? [origin, destination] : [];
      });
      if (points.length < 2) return [];
      return [{ load, points, loadIndex }];
    });

    routeJobs.forEach(({ load, points, loadIndex }) => {
      points.forEach((point, pointIndex) => {
        bounds.push(point);
        L.circleMarker(point, {
          radius: pointIndex === 0 ? 7 : 5,
          color: pointIndex === 0 ? "#536eea" : "#20ab7c",
          fillColor: "#fff",
          fillOpacity: 1,
          weight: 3,
        }).bindTooltip(`${pointIndex === 0 ? "Pickup" : "Delivery"} · ${load.lorryId}`).addTo(layer);
      });
    });

    Promise.all(routeJobs.map(async ({ load, points, loadIndex }) => {
      const coordinates = points.map(([latitude, longitude]) => `${longitude},${latitude}`).join(";");
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);
      if (!response.ok) throw new Error("Route service unavailable");
      const result = await response.json();
      return { load, loadIndex, geometry: result.routes?.[0]?.geometry };
    })).then((routes) => {
      if (cancelled) return;
      routes.filter((route) => route.geometry).forEach(({ load, loadIndex, geometry }) => {
        L.geoJSON(geometry, {
          style: { color: ["#536eea", "#20ab7c", "#e8952e"][loadIndex % 3], weight: 5, opacity: 0.85 },
        }).bindTooltip(`${load.lorryId} · optimized route`).addTo(layer);
      });
      if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] });
    }).catch(() => undefined);

    return () => { cancelled = true; layer.remove(); };
  }, [loads, lorries, shipments]);

  return <div ref={containerRef} className="optimization-route-map" aria-label="Calculated optimization routes" />;
}
