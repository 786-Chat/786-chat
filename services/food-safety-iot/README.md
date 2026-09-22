# Food Safety Owned IoT Service

This folder is an isolated Phase 1 prototype. It does not replace the live Tuya integration yet.

## Purpose

Prove that a Food Safety branded device can:

1. authenticate to our own MQTT broker,
2. report online/heartbeat data,
3. send a trap-triggered event,
4. be mapped to an existing customer/branch,
5. drive the existing branch alarm UI.

## Local simulator

Environment variables:

```bash
MQTT_URL=mqtts://your-broker.example.com:8883
MQTT_USERNAME=per-device-or-test-user
MQTT_PASSWORD=secret
DEVICE_ID=FS-MOUSE-000001
AUTO_TRIGGER_SECONDS=20
```

Run:

```bash
npm install
npm run simulate
```

The simulator publishes a retained status heartbeat every 15 seconds. When `AUTO_TRIGGER_SECONDS` is set it publishes one `trap_triggered` event after that delay.

## Production security

The simulator accepts username/password for development only. Production hardware should use unique per-device credentials, ideally X.509 client certificates or another revocable device-specific credential. Never flash one shared secret into all factory units.

## What comes next

The next implementation step is the ingestion service that subscribes to the Food Safety topics, validates device identity, writes last-seen/status/events to Neon, and forwards a new `trap_triggered` transition into the existing branch notification/alarm flow.

After the simulator path is proven, the same protocol is implemented on the ESP32-class prototype.