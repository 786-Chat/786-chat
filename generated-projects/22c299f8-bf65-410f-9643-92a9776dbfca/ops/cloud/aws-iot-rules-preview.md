# Food Safety mouse -> AWS IoT Core -> 786.Chat preview (not yet activated)

**State:** Preview software integration only. AWS rules, rule secrets, and physical firmware have NOT been verified or installed. Do not imply Mouse 11 is physically MQTT-connected.

## Connection sequence

1. Back up the physical BMAX W003 stock firmware and verify actual Tuya MCU data points.
2. Install only known-compatible custom firmware with a secure 2.4 GHz Wi-Fi provisioning process. The factory `SmartLife-203B` AP uses Tuya's encrypted pairing token; this backend cannot provision it from a browser.
3. Set the firmware device ID to the **existing registered FS-MOUSE ID**, not the physical mouse's informal number. Mouse #11 is already registered as **FS-MOUSE-000003**, but the experimental LibreTiny firmware copy previously used FS-MOUSE-000011. A device ID mismatch is rejected.
4. Provision the restaurant Wi-Fi on the physical device once, without storing the password in the 786.Chat database.
5. Configure a unique AWS IoT Core thing, restrictive per-device publish policy, device certificate, valid root CA, and topic `fs/v1/device/FS-MOUSE-000003/#` as appropriate. Never store certificates, private keys, restaurant Wi-Fi passwords or token values in this repository.
6. Deploy an AWS IoT **HTTP Rule Destination** with confirmation URL `https://<preview-host>/api/iot/cloud`; enable the destination, then create HTTP topic rules below. Use data URL `https://<preview-host>/api/iot/cloud/events`.
7. Configure a NEW random `FOODSAFETY_IOT_CLOUD_WEBHOOK_TOKEN` in the Vercel **preview environment only**. Put the same token in the AWS HTTP action header `x-foodsafety-cloud-token`. This is independent from `FOODSAFETY_IOT_GATEWAY_TOKEN` used by HP2. Leave the cloud endpoint disabled (HTTP 503) until configured.
8. Confirm a genuine physical status/heartbeat first. Only allow catch alarms after validating the actual physical trap sensor data-point mapping.

AWS IoT rules SQL version: `2016-03-23`.

## Status rule (real physical MQTT status only)

```sql
SELECT *, topic(4) AS mqttDeviceId, 'heartbeat' AS type
FROM 'fs/v1/device/+/status'
```

Destination: `https://<preview-host>/api/iot/cloud/events` (HTTP POST); header `x-foodsafety-cloud-token` containing the preview-only secret.

## Event rule (validated real catch/reset only)

```sql
SELECT *, topic(4) AS mqttDeviceId
FROM 'fs/v1/device/+/event'
WHERE eventType = 'trap_triggered' OR eventType = 'trap_reset'
   OR event = 'trap_triggered' OR event = 'trap_reset'
```

The event rule forwards **only** the actual firmware-supplied `eventType` or `event`. Do not fabricate `trap_triggered` to test a customer alarm. If the firmware uses another documented field, validate and update this SQL before activating.

## Battery telemetry (optional after physical verification)

```sql
SELECT *, topic(4) AS mqttDeviceId, 'heartbeat' AS type
FROM 'fs/v1/device/+/telemetry'
```

Battery is recorded only from a genuine `batteryPct`, `battery_pct`, or `battery` field in the MQTT payload, with value 0-100. Unknown Tuya DP enums must not be converted to battery percentage. This telemetry rule should be kept disabled until the device's verified data points are known.

## Diagnostics and safety

- The cloud event endpoint **requires** the dedicated cloud token header and an exact registered and branch-assigned FS-MOUSE ID. A mismatched `mqttDeviceId` returns 400.
- The AWS rule HTTP action needs its destination confirmed and enabled. Confirmation endpoint can confirm AWS IoT in `eu-north-1` only.
- HP2 remains an optional local Wi-Fi pairing-network scanner; it is not the worldwide cloud MQTT broker.
- Vercel cannot maintain a permanent MQTT subscriber, so use AWS IoT HTTP rules for authenticated pushes rather than a serverless MQTT background loop.
- The existing `/api/iot/gateway/events` endpoint for HP2 is unchanged and uses the separate gateway secret.
- No device is shown Connected until its real authenticated MQTT event updates `last_seen_at`.
- Preview-first; do not change the live website or 786.Chat builder until separately approved.
