# FreightFlow admin dashboard

Smart lorry load and route optimization MVP with a React/Vite control tower, Node/Express hardware gateway, Supabase persistence, Socket.io GPS telemetry, and a Flask/OR-Tools optimization service.

## Run it

```bash
npm install
npm run dev
```

Use `npm run build` for a production build.

## Run the services

1. Create a Supabase project and run [supabase/schema.sql](supabase/schema.sql) in its SQL editor.
2. Copy `.env.example` to `.env` and provide the Supabase, Gemini, and service URLs.
3. Start the API in another terminal:

```bash
cd server
npm install
npm run dev
```

4. Install Python 3.11+ and the engine dependencies, then start the solver:

```bash
cd engine
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

The frontend reads `VITE_API_URL` and falls back to its local storage snapshot only when the API is unavailable. No synthetic GPS polling is used: vehicle devices should `POST /api/telemetry`, which the API broadcasts over Socket.io.

## Included workflows

- Dashboard KPIs, deadline priority queue, load utilisation, and CSS/SVG analytics chart
- Live fleet map, available/in-transit/maintenance filters, locations, vehicle details, and status updates
- Shipment board with deadline severity and lorry assignment visibility
- Add-lorry form with validation; entries persist through `localStorage`
- OR-Tools-ready load optimizer showing sample solver output and a simulated **Run optimization** state

## Hardware contracts

- `POST /api/telemetry`: `{ lorryId, latitude, longitude, speed, heading }`
- `POST /api/hardware/rfid`: `{ rfidTag, gate: "main" | "service" }`
- `POST /api/optimization/run`: lorries, shipments, optional fuel price and distance matrix
- `POST /api/ai/chat`: `{ message, context }`
