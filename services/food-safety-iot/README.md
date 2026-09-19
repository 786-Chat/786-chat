# Food Safety Owned IoT

This is the only smart-device backend for the Pest Control project. It does not require Tuya or Smart Life.

Flow:

1. Admin registers a device in Pest Control Smart Devices.
2. The device receives an FS-MOUSE serial such as FS-MOUSE-000001.
3. Admin enters the customer's 2.4 GHz Wi-Fi in the Smart Devices Wi-Fi setup card.
4. The Wi-Fi password is sent directly from the browser to the local device setup portal and is not stored in Neon.
5. The device connects to the Food Safety MQTT gateway.
6. This ingestion service writes heartbeat, battery, RSSI and trap events to owned_iot_devices / owned_iot_events.
7. Admin and Branch dashboards show Online/Offline, trap alarms and Stop Alarm using the owned-device records.

MQTT topics:

- fs/v1/device/{deviceId}/status
- fs/v1/device/{deviceId}/event
- fs/v1/device/{deviceId}/telemetry
- fs/v1/device/{deviceId}/command
- fs/v1/device/{deviceId}/ack

Production devices must use unique credentials and TLS. Never reuse one MQTT password for the whole fleet.
