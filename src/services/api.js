const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4001").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || `API request failed: ${response.status}`);
  return body;
}

export const getFleetSnapshot = () => request("/api/fleet/snapshot");
export const createLorry = (payload) => request("/api/fleet/lorry", {
  method: "POST",
  body: JSON.stringify(payload),
});
export const updateLorryStatus = (id, status) => request(`/api/fleet/${encodeURIComponent(id)}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status }),
});
export const scanRfid = (payload) => request("/api/hardware/rfid", {
  method: "POST",
  body: JSON.stringify(payload),
});
export const runOptimization = (payload) => request("/api/optimization/run", {
  method: "POST",
  body: JSON.stringify(payload),
});
export const applyOptimization = (payload) => request("/api/optimization/apply", {
  method: "POST",
  body: JSON.stringify(payload),
});
export const createShipment = (payload) => request("/api/shipments", {
  method: "POST",
  body: JSON.stringify(payload),
});