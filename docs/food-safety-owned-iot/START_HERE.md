# Food Safety Owned IoT Platform — Start Here

## Goal
Build a Food Safety branded IoT platform that does not require Tuya for normal operation. Physical pest-control devices connect to each customer's local Wi-Fi, authenticate to our own cloud, and appear automatically in the Food Safety admin and branch dashboards.

## Target flow

1. Admin creates Customer and Branch.
2. Admin pre-registers a physical device using its factory serial / QR code.
3. Admin assigns the device to Customer → Branch → Location.
4. Device status shows `Awaiting activation` until installed.
5. Installer/customer powers the device at the site.
6. Device enters Food Safety setup mode.
7. Installer connects it to the site's own Wi-Fi using either:
   - Bluetooth provisioning from a branded Food Safety installer app, or
   - captive-portal fallback (`FoodSafety-XXXX`) in a browser.
8. Device connects to the Food Safety IoT cloud over TLS.
9. Cloud authenticates the device using its unique device credential.
10. Admin/branch dashboard automatically changes the device to `Online`.
11. Live heartbeats, battery, trap status, alarms, and last-seen data are shown.
12. A new catch event creates a branch alert and admin notification.

## Core architecture

```text
Physical trap / sensor
  ↓
ESP32-class Wi-Fi + Bluetooth module
  ↓ TLS
MQTT broker (our account/server)
  ↓
Food Safety IoT ingestion service
  ↓
PostgreSQL / Neon device registry + event history
  ↓
786.Chat / Food Safety Admin + Branch dashboards
```

The normal customer never needs to see Tuya, Smart Life, MQTT, broker credentials, or internal cloud details.

## Branding shown to customers

Use only Food Safety wording in customer-facing UI:

- `Food Safety Smart Device`
- `Connect device to Wi-Fi`
- `Connecting to Food Safety Cloud…`
- `Device connected successfully`
- `Live monitoring active`
- `Trap Event: Normal / Triggered`

## Hardware baseline for factory discussion

Recommended first prototype target:

- ESP32-S3 or equivalent Wi-Fi + BLE module.
- 2.4 GHz Wi-Fi support.
- Bluetooth LE provisioning support.
- Physical setup/reset button.
- Status LED/buzzer as required.
- Trap/catch sensor input.
- Battery voltage measurement where battery-powered.
- Unique serial number printed on label.
- QR code containing only non-secret commissioning data.
- Unique per-device secret/certificate injected at factory.
- OTA firmware update support.
- Watchdog and automatic reconnect.
- Local buffering of unsent alarm events during internet outage.

## Device identity

Every factory device gets a permanent serial such as:

- `FS-MOUSE-000001`
- `FS-MOUSE-000002`
- `FS-MOUSE-000300`

The serial is not the authentication secret. Each unit must also receive its own unique cryptographic credential.

Do not use one shared password/key across all devices.

## MQTT topic model

Example topics:

```text
fs/v1/device/{deviceId}/status
fs/v1/device/{deviceId}/event
fs/v1/device/{deviceId}/telemetry
fs/v1/device/{deviceId}/command
fs/v1/device/{deviceId}/ack
```

Devices may publish only to their own status/event/telemetry topics and subscribe only to their own command topic.

## Minimum device payloads

Heartbeat/status example:

```json
{
  "deviceId": "FS-MOUSE-000125",
  "online": true,
  "batteryPct": 84,
  "rssi": -61,
  "firmware": "1.0.0",
  "timestamp": "2026-09-16T03:00:00Z"
}
```

Trap event example:

```json
{
  "deviceId": "FS-MOUSE-000125",
  "eventId": "01J...",
  "type": "trap_triggered",
  "value": true,
  "timestamp": "2026-09-16T03:01:14Z"
}
```

## Admin data model

Each device record should contain at least:

- internal id
- serial/device id
- hardware model
- firmware version
- credential status
- customer id
- branch id
- friendly name
- installation location
- activation status
- online/offline status
- battery
- last seen
- last alarm time
- last event id
- created/activated/updated timestamps

## Important security rules

- TLS only.
- Unique credential per device.
- Device credential never shown in branch dashboard.
- Wi-Fi password is sent directly to the device during provisioning and must not be stored in the Food Safety database.
- Branch users can only see devices assigned to their own branch.
- Installer role can provision/assign devices but cannot see unrelated customer data or platform secrets.
- Admin can revoke one device without affecting all other devices.
- OTA images must be signed before devices accept them.

## Deployment approach

Keep 786.Chat/Vercel for the web/admin application. Use a small always-on IoT service for MQTT because MQTT requires persistent connections.

Recommended first production layout:

- Web/admin: existing 786.Chat / Food Safety stack.
- Database: Neon PostgreSQL.
- MQTT: EMQX or Mosquitto on a dedicated VPS/container platform.
- IoT ingestion/API: Node.js/TypeScript service on the same always-on infrastructure or another container service.
- Alerts: existing Food Safety notification flow.

## Phase plan

### Phase 1 — Software protocol and simulator
Create the device protocol, device registry, MQTT broker, ingestion service, and a software simulator. Confirm that a simulated device can appear Online and trigger an alarm in the dashboard before hardware is ordered.

### Phase 2 — One ESP32 prototype
Factory/developer builds one prototype using the same protocol. Test Wi-Fi provisioning, heartbeat, trap sensor, offline recovery, and OTA.

### Phase 3 — 20-device pilot
Use the existing 20 devices or new prototypes to validate reliability in multiple real sites.

### Phase 4 — 300-unit factory production
Only after the protocol/firmware/hardware are frozen and tested, program unique credentials for all 300 units and perform production QA.

## Factory instruction — critical

Tell the manufacturer:

> The product must not be locked to Tuya/Smart Life or any mandatory third-party cloud. We require our own firmware, our own device identity, Wi-Fi/BLE provisioning, secure MQTT/HTTPS communication to our server, OTA updates, and per-device credentials. The manufacturer must provide the hardware pin map, programming method, test jig requirements, and firmware flashing process.

## Next engineering step

Build Phase 1 without touching the current live Pest Control/Tuya integration. The owned IoT platform stays on a separate branch until the simulator, authentication, and alarm path are proven.