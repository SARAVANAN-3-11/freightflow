import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:4001").replace(/\/$/, "");

export function subscribeToTelemetry(onTelemetry) {
  if (import.meta.env.VITE_DISABLE_REALTIME === "true") return () => {};
  const socket = io(SOCKET_URL, { transports: ["websocket"] });
  socket.on("gps:telemetry", onTelemetry);
  socket.on("rfid:scan", (event) => onTelemetry({ ...event, type: "rfid:scan" }));
  return () => socket.disconnect();
}