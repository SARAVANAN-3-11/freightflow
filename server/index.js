import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly look for .env in the parent root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 Checking Supabase Connection Config:");
console.log("URL Loaded:", supabaseUrl ? "Yes (" + supabaseUrl.substring(0, 15) + "...)" : "MISSING ❌");
console.log("Key Loaded:", supabaseKey ? "Yes" : "MISSING");

if (!supabaseUrl || !supabaseKey) {
	throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are required");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const port = Number(process.env.PORT || 4001);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const optimizerUrl = (process.env.OPTIMIZER_URL || "http://localhost:5000").replace(/\/$/, "");

app.use(cors({ origin: clientOrigin, credentials: true }));

function presentLorry(row) {
	const status = row.status || row.driver_status || "AVAILABLE";
	const latitude = row.latitude ?? row.current_lat;
	const longitude = row.longitude ?? row.current_lon;
	return {
		...row,
		id: row.lorry_code || row.id,
		databaseId: row.id,
		currentLocation: row.current_location || row.currentLocation || "Live GPS position",
		capacityWeight: row.capacity_weight ?? row.max_weight,
		capacityVolume: row.capacity_volume ?? row.max_volume,
		fuelEfficiency: row.fuel_efficiency || 4,
		rfidTag: row.rfid_tag,
		latitude,
		longitude,
		capacity: Number(row.capacity_weight ?? row.max_weight ?? 0) / 1000,
		status: status === "AVAILABLE" ? "Available" : status === "IN_TRANSIT" ? "En route" : "Maintenance",
	};
}

function presentShipment(row) {
	const originLat = row.origin_lat ?? row.pickup_lat;
	const originLon = row.origin_lon ?? row.pickup_lon;
	const destinationLat = row.destination_lat ?? row.destination_lat;
	const destinationLon = row.destination_lon ?? row.destination_lon;
	const nearestCity = (latitude, longitude) => {
		const cities = [[12.9716, 77.5946, "Bengaluru"], [13.0827, 80.2707, "Chennai"], [17.385, 78.4867, "Hyderabad"], [11.1085, 77.3411, "Tiruppur"], [11.0168, 76.9558, "Coimbatore"], [18.5204, 73.8567, "Pune"], [19.076, 72.8777, "Mumbai"], [9.9252, 78.1198, "Madurai"]];
		return cities.sort((a, b) => ((a[0] - latitude) ** 2 + (a[1] - longitude) ** 2) - ((b[0] - latitude) ** 2 + (b[1] - longitude) ** 2))[0]?.[2] || "Delivery point";
	};
	const weight = Number(row.weight || 0);
	const status = row.status === "ASSIGNED" ? "Assigned" : row.status === "PENDING" ? "Unassigned" : row.status || "Unassigned";
	return {
		...row,
		title: row.title || row.customer || row.id,
		customer: row.customer || row.title || "Live customer",
		origin: row.origin || nearestCity(Number(originLat), Number(originLon)),
		destination: row.destination || nearestCity(Number(destinationLat), Number(destinationLon)),
		weight,
		volume: Number(row.volume || Math.max(weight / 1000, 1)),
		priority: typeof row.priority === "number" ? (["Normal", "Critical", "High"][row.priority] || "Normal") : row.priority || "Normal",
		deadline: row.deadline || row.delivery_deadline,
		status,
		lorryId: row.lorry_id || row.assigned_lorry_id,
		originLat: Number(originLat),
		originLon: Number(originLon),
		destinationLat: Number(destinationLat),
		destinationLon: Number(destinationLon),
	};
}

async function readTable(table, transform) {
	const { data, error } = await supabase.from(table).select("*");
	if (error) throw error;
	return data.map(transform);
}

async function getSnapshot() {
	const [lorries, shipments] = await Promise.all([
		readTable("lorries", presentLorry),
		readTable("shipments", presentShipment),
	]);
	return { lorries, shipments };
}

function databaseStatus(status) {
	return { Available: "AVAILABLE", "En route": "IN_TRANSIT", Maintenance: "MAINTENANCE" }[status] || status;
}

async function resolveLorryId(identifier) {
	const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier || "");
	const query = supabase.from("lorries").select("id");
	const { data, error } = await (isUuid ? query.eq("id", identifier) : query.eq("lorry_code", identifier)).single();
	if (error) throw error;
	return data.id;
}

function lorryLookup(query, identifier) {
	const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier || "");
	return isUuid ? query.eq("id", identifier) : query.eq("lorry_code", identifier);
}

async function assignShipments(lorryId, shipmentIds) {
	let { error } = await supabase.from("shipments").update({ lorry_id: lorryId, status: "Assigned" }).in("id", shipmentIds);
	if (error) ({ error } = await supabase.from("shipments").update({ assigned_lorry_id: lorryId, status: "ASSIGNED" }).in("id", shipmentIds));
	if (error) throw error;
}

async function markLorryInTransit(lorryId, destination) {
	let { error } = await supabase.from("lorries").update({ status: "IN_TRANSIT", destination, updated_at: new Date().toISOString() }).eq("id", lorryId);
	if (error) ({ error } = await supabase.from("lorries").update({ driver_status: "IN_TRANSIT", last_updated: new Date().toISOString() }).eq("id", lorryId));
	if (error) throw error;
}

app.get("/health", (_request, response) => response.json({ status: "ok", service: "freightflow-api" }));

app.get("/api/fleet/snapshot", async (_request, response, next) => {
	try { response.json(await getSnapshot()); } catch (error) { next(error); }
});

app.get("/api/lorries", async (_request, response, next) => {
	try { response.json(await readTable("lorries", presentLorry)); } catch (error) { next(error); }
});

app.get("/api/shipments", async (_request, response, next) => {
	try { response.json(await readTable("shipments", presentShipment)); } catch (error) { next(error); }
});

app.post("/api/shipments", async (request, response, next) => {
	try {
		const body = request.body || {};
		const shipment = {
			id: body.id || `SHP-${Date.now().toString().slice(-6)}`,
			customer: body.customer,
			origin: body.origin,
			destination: body.destination,
			origin_lat: Number(body.originLat),
			origin_lon: Number(body.originLon),
			destination_lat: Number(body.destinationLat),
			destination_lon: Number(body.destinationLon),
			weight: Number(body.weight),
			volume: Number(body.volume),
			priority: body.priority || "Normal",
			deadline: body.deadline,
			status: "Unassigned",
			value: body.value ? Number(body.value) : null,
		};
		let { data, error } = await supabase.from("shipments").insert(shipment).select().single();
		if (error) {
			({ data, error } = await supabase.from("shipments").insert({
				id: crypto.randomUUID(),
				title: `${body.customer} shipment`,
				weight: shipment.weight,
				volume: shipment.volume,
				priority: { Critical: 1, High: 2, Normal: 3 }[shipment.priority],
				pickup_lat: shipment.origin_lat,
				pickup_lon: shipment.origin_lon,
				destination_lat: shipment.destination_lat,
				destination_lon: shipment.destination_lon,
				delivery_deadline: shipment.deadline,
				status: "PENDING",
			}).select().single());
		}
		if (error) throw error;
		response.status(201).json(presentShipment(data));
	} catch (error) { next(error); }
});

app.post("/api/fleet/lorry", async (request, response, next) => {
	try {
		const body = request.body || {};
		const { data, error } = await supabase.from("lorries").insert({
			lorry_code: body.id || body.lorryCode || `LRY-${Date.now().toString().slice(-6)}`,
			registration: body.registration,
			driver: body.driver || "Unassigned",
			type: body.type || "Container",
			status: databaseStatus(body.status || "Available"),
			current_location: body.currentLocation || body.location || "Unknown",
			capacity_weight: body.capacityWeight || Number(body.capacity || 1),
			capacity_volume: body.capacityVolume || Number(body.capacity || 1),
			fuel_efficiency: body.fuelEfficiency || 4,
			fuel: body.fuel === undefined ? 100 : Number(body.fuel),
			utilization: body.utilization || 0,
			rfid_tag: body.rfidTag,
			latitude: body.latitude,
			longitude: body.longitude,
		}).select().single();
		if (error) {
			({ data, error } = await supabase.from("lorries").insert({
				name: `${body.driver || "Unassigned"} · ${body.registration || "New lorry"}`,
				max_weight: Number(body.capacity || body.capacityWeight || 1) * 1000,
				max_volume: Number(body.capacity || body.capacityVolume || 1),
				fuel_efficiency: Number(body.fuelEfficiency || 4),
				driver_status: "AVAILABLE",
				rfid_tag: body.rfidTag,
				current_lat: body.latitude,
				current_lon: body.longitude,
				last_updated: new Date().toISOString(),
			}).select().single());
		}
		if (error) throw error;
		response.status(201).json(presentLorry(data));
	} catch (error) { next(error); }
});

app.patch("/api/fleet/:id/status", async (request, response, next) => {
	try {
		const timestamp = new Date().toISOString();
		let { data, error } = await lorryLookup(supabase.from("lorries").update({ status: databaseStatus(request.body?.status), driver_status: databaseStatus(request.body?.status), updated_at: timestamp, last_updated: timestamp }), request.params.id).select().single();
		if (error) ({ data, error } = await lorryLookup(supabase.from("lorries").update({ driver_status: databaseStatus(request.body?.status), last_updated: timestamp }), request.params.id).select().single());
		if (error) throw error;
		response.json(presentLorry(data));
	} catch (error) { next(error); }
});

app.post("/api/telemetry", async (request, response, next) => {
	try {
		const { lorryId, latitude, longitude, speed, heading } = request.body || {};
		const { data, error } = await lorryLookup(supabase.from("lorries").update({ latitude, longitude, updated_at: new Date().toISOString() }), lorryId).select().single();
		if (error) throw error;
		const event = { lorryId, latitude, longitude, speed, heading, updatedAt: data.updated_at };
		io.emit("gps:telemetry", event);
		response.json(event);
	} catch (error) { next(error); }
});

app.post("/api/hardware/rfid", async (request, response, next) => {
	try {
		const { rfidTag, gate } = request.body || {};
		const { data: lorry, error: lorryError } = await supabase.from("lorries").select("id, lorry_code, status").eq("rfid_tag", rfidTag).single();
		if (lorryError) throw lorryError;
		const nextStatus = gate === "service" ? "MAINTENANCE" : lorry.status === "IN_TRANSIT" ? "AVAILABLE" : "IN_TRANSIT";
		const { error } = await supabase.from("lorries").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", lorry.id);
		if (error) throw error;
		const event = { type: "rfid:scan", lorryId: lorry.lorry_code, rfidTag, gate, status: nextStatus };
		io.emit("rfid:scan", event);
		response.json(event);
	} catch (error) { next(error); }
});

async function proxyOptimization(request, response, next) {
	try {
		const engineResponse = await fetch(`${optimizerUrl}/optimize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request.body || {}) });
		const body = await engineResponse.json();
		response.status(engineResponse.status).json(body);
	} catch (error) { next(new Error(`Optimization engine unavailable: ${error.message}`)); }
}

app.post("/api/optimization/run", proxyOptimization);
app.post("/optimize", proxyOptimization);

app.post("/api/optimization/apply", async (request, response, next) => {
	try {
		const loads = request.body?.loads || [];
		for (const load of loads) {
			const lorryId = await resolveLorryId(load.lorryId);
			const destination = load.destinationGroup || load.route?.split("->").pop()?.trim();
			await assignShipments(lorryId, load.shipments || []);
			await markLorryInTransit(lorryId, destination);
		}
		const { data, error } = await supabase.from("optimization_runs").insert({ score: request.body?.score || null, loads, rejected: request.body?.rejected || [] }).select().single();
		if (error) throw error;
		response.json(data);
	} catch (error) { next(error); }
});

app.post("/api/assignments", async (request, response, next) => {
	try {
		const { lorryId, shipmentIds = [] } = request.body || {};
		const databaseId = await resolveLorryId(lorryId);
		await assignShipments(databaseId, shipmentIds);
		await markLorryInTransit(databaseId);
		response.json({ lorryId, shipmentIds });
	} catch (error) { next(error); }
});

app.use((error, _request, response, _next) => {
	console.error(error);
	response.status(500).json({ error: error.message || "Internal server error" });
});

server.listen(port, () => console.log(`FreightFlow API listening on http://localhost:${port}`));