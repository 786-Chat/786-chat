# Food Safety W003 BK7231N firmware

Custom owned firmware for the BMAX W003 / BK7231N pilot.

## What it does

- Joins the configured 2.4 GHz Wi-Fi network.
- Connects directly to the HP2 Mosquitto broker.
- Parses the trap's local Tuya-style MCU UART protocol at 9600 baud.
- Captures DPIDs 101, 102 and 103 plus raw DP telemetry.
- Establishes a boot baseline before generating a catch alarm.
- Publishes exactly one \`trap_triggered\` event on a normal-to-active transition.
- Publishes \`trap_reset\` on an active-to-normal transition.
- Publishes Food Safety status, battery and RSSI.
- Reconnects Wi-Fi and MQTT automatically.
- Does not require Tuya cloud.

## Build

Set configuration only in the shell; do not commit credentials:

\`\`\`bash
export FS_WIFI_SSID='your-2.4GHz-ssid'
export FS_WIFI_PASSWORD='your-wifi-password'
export FS_MQTT_HOST='192.168.x.x'
export FS_MQTT_PORT='1883'
export FS_MQTT_USERNAME='foodsafety'
export FS_MQTT_PASSWORD='your-mqtt-password'
export FS_DEVICE_ID='FS-MOUSE-000001'
pio run
\`\`\`

The generated \`firmware.uf2\` is the preferred ltchiptool input.

## Safety gate

Before the first write:

1. Two independent full 2 MiB factory reads must match byte-for-byte.
2. Save the SHA-256 of the backup.
3. Confirm \`ltchiptool flash info\` detects BK7231N.
4. Build this firmware and inspect the artifact size.
5. Do not write if any of the above fail.

After flashing, validate one trap end-to-end before touching another unit.
