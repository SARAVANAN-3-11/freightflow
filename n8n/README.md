# FreightFlow RFID automation

Import `freightflow-rfid-maintenance.json` into n8n.

For local n8n, the imported workflow already calls the local API:

```env
FREIGHTFLOW_API_URL=http://localhost:4001
```

The HTTP Request node uses `http://localhost:4001/api/automation/rfid-maintenance` directly for local development.

For a deployed API, use its public HTTPS URL instead:

```env
FREIGHTFLOW_API_URL=https://freightflow-api.onrender.com
```

Activate the workflow and send RFID reader events to the n8n production webhook URL:

```json
{
  "rfidTag": "RFID-DOST-002",
  "gate": "service",
  "readerId": "reader-01"
}
```

The workflow calls `POST /api/automation/rfid-maintenance`. The API then:

1. Finds the lorry by `rfid_tag`.
2. Updates its status to `MAINTENANCE`.
3. Inserts an audit row into `rfid_events`.
4. Broadcasts `rfid:scan` over Socket.io for the dashboard.
5. Returns the updated lorry and scan event to n8n.

The `service` gate is the maintenance trigger. Keep the API URL reachable from the n8n host; `localhost` only works when n8n and the API run on the same machine.
