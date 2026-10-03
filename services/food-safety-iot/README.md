# Food Safety Owned IoT Gateway

This service connects the BMAX W003 / BK7231N pilot to the existing Pest Control application without Tuya cloud.

## Data path

```text
W003 / BK7231N
  -> local 2.4 GHz Wi-Fi
  -> HP2 Mosquitto
  -> openbeken-bridge.ts
  -> Food Safety MQTT topics
  -> ingestion-service.ts
  -> Neon owned_iot_devices / owned_iot_events
  -> Pest Control Admin + Branch dashboards
```

## Scripts

- `npm run bridge:openbeken` — converts OpenBeken channel updates to Food Safety status/events.
- `npm run ingest` — validates Food Safety messages and writes device state/events to Neon.
- `npm run simulate` — software-only protocol test.
- `npm run typecheck` — TypeScript verification.

## Important behavior

The W003 bridge establishes the initial trap state as a baseline. It does not create a catch alarm merely because a channel is already active when the gateway starts. A later normal-to-active transition creates exactly one `trap_triggered` event. A reset publishes `trap_reset`, while the Pest Control alarm remains active until the user presses Stop Alarm.

Set `OBK_CAPTURE_ALL_CHANNELS=true` during the first real physical catch so HP2 logs the exact channel/value transition. Do not expand to other traps until the first unit passes the validation gate in `docs/food-safety-owned-iot/W003_FINAL_HARDWARE_VALIDATION.md`.
