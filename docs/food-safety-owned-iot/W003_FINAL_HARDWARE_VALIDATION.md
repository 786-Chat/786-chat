# BMAX W003 / BK7231N final hardware validation

This runbook is for the user's first Food Safety mouse-trap pilot only.

## Verified hardware facts

- Product: BMAX W003 / NEO NAS-MA02W6 family.
- Wi-Fi SoC: BK7231N.
- Separate trap-control MCU talks to the BK7231N using a Tuya-style UART protocol at 9600 baud.
- Full flash backup exists and must remain untouched.
- Current programming wires on the clean unit:
  - Orange = CEN/reset, normally left loose.
  - Yellow = mouse RXD -> USB-UART TXD.
  - Blue = mouse TXD -> USB-UART RXD.
  - White = GND -> USB-UART GND.
- Never connect USB-UART 3.3V or 5V/VCC to the mouse board.
- The existing CP2102 showed unreliable bulk transfers. Do not use it for a production full-image write unless a complete write + readback has first been proven.

## Known TuyaMCU observations

- DPID 101: boolean; normal value observed as 0.
- DPID 102: battery enum; values 0 and 3 have been observed.
- DPID 103: candidate secondary trap state; real catch transition is not yet proven.
- Do not roll out more traps until one real physical trigger identifies the exact catch transition.

## Safe pilot firmware path

Use a local OpenBeken BK7231N pilot with TuyaMCU enabled. This removes Tuya cloud from normal operation while retaining the original trap-control MCU.

Candidate mapping for the first unit:

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

The bridge defaults to channels 0 and 2 and active value 1, but it establishes a baseline first so an already-active value at boot does not create a false catch alarm.

## HP2 path

```text
W003 / OpenBeken
  -> customer 2.4 GHz Wi-Fi
  -> HP2 Mosquitto
  -> services/food-safety-iot/openbeken-bridge.ts
  -> fs/v1/device/FS-MOUSE-000001/status|event
  -> ingestion-service.ts
  -> owned_iot_devices / owned_iot_events in Neon
  -> Pest Control Admin + Branch Smart Devices / Alarm / Stop Alarm
```

## Pass criteria before Pest Control production deploy

Do not call the hardware finished until all of these pass on one real trap:

1. Full firmware write completes and a readback verifies the written image.
2. Trap boots without Tuya/Smart Life.
3. Local setup/provisioning works and trap joins 2.4 GHz Wi-Fi.
4. HP2 Mosquitto sees the trap online.
5. Bridge sees channel 0/1/2 values and records the real catch transition.
6. Exactly one real catch produces `trap_triggered`.
7. Pest Control Admin and assigned Branch both show the alarm.
8. Stop Alarm clears the dashboard alarm and it stays cleared until a new physical catch.
9. Reset/re-arm produces the expected trap state without duplicate alarms.
10. Trap reconnects after Wi-Fi/router restart.
11. HP2/Mosquitto restart does not lose the device permanently.
12. A power-cycle of the trap reconnects automatically.

Only after all 12 pass should another physical trap be flashed or the Pest Control project be put on its custom production domain.
