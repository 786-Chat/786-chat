# NEO NAS-MA02W6 / BK7231N pilot

This document records the verified first-unit hardware findings and the safe pilot configuration for the Food Safety owned-IoT path.

## Verified first-unit facts

- Seller label: BMAX W003.
- OEM family identified from factory paperwork: NEO smart mousetrap, NAS-MA02W6 family.
- PCB marking observed on the test unit: `WAS-WA02W6-V1`.
- Wi-Fi MCU: BK7231N.
- Factory/Tuya firmware UART configuration recovered from the original flash: 9600 baud.
- Full flash size: 2 MiB.
- Original full-dump SHA-256:
  `d283f73a9a18b736c63e7906ab240f7e2784fbf844171fe149e66933e4d7a60d`.
- UART programming pads (RXD/TXD/GND) and CEN reset were proven on the spare unit.
- The original flash was backed up, recovery-tested, restored and verified byte-for-byte after unsuccessful pilot writes.

Never commit the actual firmware dump, Wi-Fi credentials, Tuya authentication material, device UUIDs or per-device secrets to Git.

## Important pilot constraint

The CP2102 adapter used during bring-up proved reliable for reads and small recovery writes, but full firmware write attempts were not reliable. Do not use that adapter for another full-image write on production hardware.

Use a known-good 3.3 V UART adapter and prove a complete write + readback on the single spare unit before touching any other trap.

## OpenBeken pilot configuration

A closely related NEO NAS-MA01W BK7231N revision has been independently documented as a TuyaMCU/tmSensor device. Its working mapping is:

- DPID 101 -> trap/catch state
- DPID 102 -> battery enum
- DPID 103 -> secondary trap/catch state

Battery enum observed on that family:

- 0 -> 100%
- 1 -> 75%
- 2 -> 50%
- 3 -> 25%

The NAS-MA02W6 must still be verified on the real first unit. Do not assume the mapping for fleet rollout until one physical trigger and battery update are observed.

Candidate OpenBeken startup commands for the single pilot unit:

```text
startDriver TuyaMCU
startDriver tmSensor
setChannelType 0 ReadOnly
setChannelLabel 0 "Trap A"
linkTuyaMCUOutputToChannel 101 val 0
setChannelType 1 ReadOnlyEnum
setChannelLabel 1 "Battery"
setChannelEnum 1 0:100% 1:75% 2:50% 3:25%
linkTuyaMCUOutputToChannel 102 val 1
setChannelType 2 ReadOnly
setChannelLabel 2 "Trap B"
linkTuyaMCUOutputToChannel 103 val 2
```

Set the OpenBeken short MQTT device name to the pilot identity or configure the bridge with the actual short name.

## HP2 bridge

`openbeken-bridge.ts` converts OpenBeken MQTT channel updates into the existing Food Safety protocol:

```text
OpenBeken/NEO trap
  -> HP2 Mosquitto
  -> openbeken-bridge.ts
  -> fs/v1/device/FS-MOUSE-000001/status|event
  -> ingestion-service.ts
  -> Neon
  -> Admin + Branch alarm UI
```

Example environment:

```text
MQTT_URL=mqtt://127.0.0.1:1883
MQTT_USERNAME=food-safety-ingestion
MQTT_PASSWORD=<local-secret>
DEVICE_ID=FS-MOUSE-000001
OBK_DEVICE_NAME=FS-MOUSE-000001
HARDWARE_MODEL=NEO-NAS-MA02W6-BK7231N
FIRMWARE_VERSION=openbeken-1.18.313
OBK_TRAP_CHANNELS=0,2
OBK_BATTERY_CHANNEL=1
STATUS_INTERVAL_SECONDS=15
OBK_STALE_AFTER_SECONDS=90
```

Run:

```bash
npm run bridge:openbeken
```

The bridge publishes `trap_triggered` only on a normal -> triggered transition and `trap_reset` when the aggregate trap state returns to normal. This prevents repeated MQTT refreshes from creating repeated alarms.

## First physical validation after a successful flash

1. Keep Tuya disabled for the pilot.
2. Configure OpenBeken for the HP2 Mosquitto broker.
3. Confirm `<OBK_DEVICE_NAME>/connected` reports online.
4. Confirm channels 0/1/2 publish.
5. Verify channel 1 battery enum against the physical battery condition.
6. Trigger the trap mechanism once and record which of channels 0/2 changes.
7. Confirm exactly one Food Safety `trap_triggered` event reaches Admin and Branch dashboards.
8. Clear/re-arm and confirm `trap_reset`.
9. Reboot HP2/Mosquitto and prove reconnect.
10. Only after this passes should another trap be considered.
