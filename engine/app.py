from flask import Flask, jsonify, request
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from datetime import datetime, timezone

app = Flask(__name__)


def distance_km(origin, destination):
    lat1, lon1 = origin
    lat2, lon2 = destination
    lat_delta = lat2 - lat1
    lon_delta = lon2 - lon1
    return round(((lat_delta * 111) ** 2 + (lon_delta * 101) ** 2) ** 0.5)


def coordinates(item, prefix="current"):
    latitude = item.get(f"{prefix}_lat", item.get("latitude"))
    longitude = item.get(f"{prefix}_lon", item.get("longitude"))
    if latitude is None or longitude is None:
        return None
    return float(latitude), float(longitude)


def validate_shipments(lorries, shipments):
    capacities = {
        lorry["id"]: (
            float(lorry.get("capacityWeight", lorry.get("capacity_weight", lorry.get("capacity", 0)))),
            float(lorry.get("capacity_volume", lorry.get("capacityVolume", 0))),
        )
        for lorry in lorries
    }
    rejected = []
    for shipment in shipments:
        weight = float(shipment["weight"])
        volume = float(shipment["volume"])
        if not any(weight <= capacity[0] and volume <= capacity[1] for capacity in capacities.values()):
            rejected.append({"shipmentId": shipment["id"], "reason": "No lorry satisfies weight and volume capacity"})
            continue
        origin = coordinates(shipment, "origin") or coordinates(shipment, "pickup")
        destination = coordinates(shipment, "destination")
        deadline = shipment.get("deadline") or shipment.get("delivery_deadline")
        if origin and destination and deadline:
            deadline_text = str(deadline).replace("Z", "+00:00")
            due_at = datetime.fromisoformat(deadline_text)
            if due_at.tzinfo is None:
                due_at = due_at.replace(tzinfo=timezone.utc)
            remaining_hours = (due_at - datetime.now(timezone.utc)).total_seconds() / 3600
            route_distance = distance_km(origin, destination)
            estimated_hours = route_distance / 45 + 1
            if remaining_hours < estimated_hours:
                rejected.append({
                    "shipmentId": shipment["id"],
                    "reason": f"Delivery deadline is too short for the {route_distance} km route (estimated {round(estimated_hours, 1)} hours)",
                })
    return rejected


def optimize(payload):
    lorries = [item for item in payload.get("lorries", []) if item.get("status") in ("AVAILABLE", "Available")]
    shipments = payload.get("shipments", [])
    rejected = validate_shipments(lorries, shipments)
    accepted = [item for item in shipments if item["id"] not in {entry["shipmentId"] for entry in rejected}]
    groups = {}
    for shipment in accepted:
        groups.setdefault(shipment["destination"], []).append(shipment)

    if not lorries or not accepted:
        return {"rejected": rejected, "loads": [], "score": 0, "distanceSaved": 0, "costSaved": 0}

    manager = pywrapcp.RoutingIndexManager(len(lorries), 1, 0)
    routing = pywrapcp.RoutingModel(manager)
    fuel_price = float(payload.get("fuelPrice", 95))
    distances = payload.get("distances", [[0 for _ in lorries] for _ in lorries])
    efficiencies = [max(float(lorry.get("fuel_efficiency", lorry.get("fuelEfficiency", 4))), 0.1) for lorry in lorries]

    def fuel_cost(from_index, to_index):
        origin = manager.IndexToNode(from_index)
        destination = manager.IndexToNode(to_index)
        distance = float(distances[origin][destination])
        return int(distance / efficiencies[origin] * fuel_price * 100)

    routing.SetArcCostEvaluatorOfAllVehicles(routing.RegisterTransitCallback(fuel_cost))
    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    solution = routing.SolveWithParameters(params)
    route_order = []
    if solution:
        index = routing.Start(0)
        while not routing.IsEnd(index):
            route_order.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))

    ordered = sorted(accepted, key=lambda shipment: (shipment.get("priority", "Normal") != "Critical", shipment.get("deadline", "")))
    loads = []
    optimized_cost = 0
    baseline_cost = 0
    for index, (destination, items) in enumerate(groups.items()):
        lorry = lorries[index % len(lorries)]
        origin = coordinates(lorry)
        target = coordinates(items[0], "destination")
        distance = distance_km(origin, target) if origin and target else 0
        efficiency = max(float(lorry.get("fuel_efficiency", lorry.get("fuelEfficiency", 4))), 0.1)
        optimized_cost += distance / efficiency * fuel_price
        baseline_cost += distance / max(efficiency * 0.85, 0.1) * fuel_price
        weight = sum(float(item["weight"]) for item in items)
        volume = sum(float(item["volume"]) for item in items)
        capacity_weight = float(lorry.get("capacityWeight", lorry.get("capacity_weight", lorry.get("capacity", 0))))
        capacity_volume = float(lorry.get("capacity_volume", lorry.get("capacityVolume", 0)))
        fill = round(max(weight / max(capacity_weight, 1), volume / max(capacity_volume, 1)) * 100)
        start = lorry.get("currentLocation", "Origin")
        loads.append({
            "lorryId": lorry["id"],
            "route": " -> ".join([start, destination]),
            "distance": f"{distance} km",
            "fuelCost": round(distance / efficiency * fuel_price),
            "fill": min(fill, 100),
            "destinationGroup": destination,
            "shipments": [item["id"] for item in items],
            "sequence": [item["id"] for item in ordered if item in items],
        })
    saved = max(0, round(baseline_cost - optimized_cost))
    total_distance = sum(float(load["distance"].split()[0]) for load in loads)
    return {"rejected": rejected, "loads": loads, "score": 100 if not rejected else 80, "distanceSaved": round(saved / max(fuel_price, 1)), "costSaved": round(saved), "optimizedCost": round(optimized_cost), "totalDistance": round(total_distance), "totalFuelCost": round(optimized_cost), "deadlineCoverage": round((len(accepted) / max(len(shipments), 1)) * 100)}


@app.post("/optimize")
def optimize_route():
    payload = request.get_json(silent=True) or {}
    try:
        return jsonify(optimize(payload))
    except (KeyError, TypeError, ValueError, IndexError) as error:
        return jsonify({"error": f"Invalid optimization payload: {error}"}), 400


@app.get("/health")
def health():
    return jsonify({"status": "ok", "engine": "ortools"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
