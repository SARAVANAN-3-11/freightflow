import { runOptimization as requestOptimization } from "./api";

export function optimizeFleet({ lorries, shipments, fuelPrice }) {
  return requestOptimization({ lorries, shipments, fuelPrice });
}