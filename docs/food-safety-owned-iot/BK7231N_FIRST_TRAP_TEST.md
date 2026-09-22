# BK7231N — First Mouse Trap Firmware Test

Goal: convert exactly one spare/test mouse trap from the vendor/Tuya firmware path to a Food Safety-owned MQTT test path without risking the rest of the fleet.

## Rules for the first unit

- Use one sacrificial/test unit only.
- Do not flash multiple traps until the first unit is fully understood.
- Do not connect a USB-UART adapter while the trap is powered from mains. If the product contains any mains circuitry, disconnect it completely and use an isolated low-voltage bench setup.
- Use 3.3 V UART logic only. Do not put 5 V logic on BK7231N UART pins.
- Photograph both sides of the PCB before changing anything.
- Record every visible board/module marking.
- Identify GND, 3V3, TX/RX, CEN/reset and the trap sensor GPIO before flashing.
- Back up the original flash before erasing or writing firmware.

## What we need from the real board

For the first trap, capture:

1. clear photo of complete PCB front;
2. clear photo of complete PCB back;
3. close-up of the BK7231N module/chip and module model marking;
4. close-up of programming/test pads;
5. battery/power voltage;
6. which physical switch/sensor changes when the mouse trap triggers;
7. LED/buzzer pins if present.

Do not assume a pin map from another Tuya device. The BK7231N MCU is known, but the trap manufacturer's GPIO assignment is device-specific.

## Recommended first firmware path

Use OpenBeken only as the first hardware-enablement firmware because it supports BK7231N, local Wi-Fi and MQTT without requiring Tuya/Smart Life. The Food Safety MQTT broker remains ours.

This is a bring-up step, not the final product identity. Once the board pin map and event behavior are proven, we can either:

- maintain a locked Food Safety OpenBeken configuration/build for the pilot; or
- build a dedicated Food Safety BK7231N firmware using the BK7231N/LibreTiny toolchain and the same `fs/v1/device/...` protocol.

## UART hardware

Use a known 3.3 V USB-to-TTL adapter.

Typical connections for programming are:

```text
USB-UART GND -> board GND
USB-UART TX  -> BK7231N RX programming UART
USB-UART RX  -> BK7231N TX programming UART
```

Power the board only according to the verified board voltage. Do not guess the supply rail.

BK7231N flashing commonly uses the `hid_download_py` tool and requires putting/resetting the chip into its UART bootloader. Exact pads and reset method must be confirmed from this board before we issue a write command.

## Backup first

Before writing OpenBeken or any Food Safety image:

1. confirm the serial port appears in Windows Device Manager;
2. confirm TX/RX/GND and reset/CEN wiring;
3. read/dump the existing flash using a BK7231N-compatible tool;
4. store the dump locally under a device-specific folder, for example:

```text
C:\FoodSafety\firmware-backups\FS-MOUSE-000001\original-bk7231n.bin
```

5. compute and record a SHA-256 checksum;
6. keep the backup out of the public repository.

We should not overwrite the original firmware until a readable backup exists.

## First boot target

The first flashed test unit should do only these things:

1. start its local provisioning/AP mode;
2. join the dedicated 2.4 GHz test Wi-Fi;
3. connect to the Dell Mosquitto broker;
4. use device ID `FS-MOUSE-000001`;
5. publish heartbeat/status;
6. publish `trap_triggered` when the physical trap sensor changes;
7. reconnect automatically after router or gateway restart.

Target topics:

```text
fs/v1/device/FS-MOUSE-000001/status
fs/v1/device/FS-MOUSE-000001/event
fs/v1/device/FS-MOUSE-000001/telemetry
fs/v1/device/FS-MOUSE-000001/command
```

## First test sequence

1. Prove Dell broker with the software simulator.
2. Stop the simulator for `FS-MOUSE-000001` so there is only one publisher.
3. Power the flashed BK7231N trap.
4. Confirm the Dell sees the MQTT connection.
5. Confirm one heartbeat payload.
6. Trigger the trap mechanism manually.
7. Confirm one `trap_triggered` event.
8. Reset/re-arm the trap and confirm the state transition.
9. Turn the router off for two minutes, restore it, and confirm automatic reconnect.
10. Turn the Dell broker off/on and confirm automatic reconnect.
11. Leave the test unit running for at least a full working-day soak test before considering another unit.

## Do not do yet

- Do not flash the other traps.
- Do not remove the current Tuya production integration.
- Do not open MQTT to the public internet.
- Do not reuse one MQTT password across the production fleet.
- Do not connect PBX call alerts yet.
- Do not merge this branch into the live production path until the owned-device path is verified.

## Pass criteria

The first BK7231N trap passes hardware bring-up when:

- it operates without Tuya/Smart Life;
- it joins local Wi-Fi reliably;
- the Dell receives status and trap events;
- the physical catch sensor is mapped correctly;
- reconnect works after network interruptions;
- the original firmware backup is preserved;
- no other existing Food Safety devices are affected.
