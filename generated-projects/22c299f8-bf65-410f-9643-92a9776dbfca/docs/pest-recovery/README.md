# Food Safety mouse hardware and recovery evidence index

Status: **reference only; not a working firmware release**. Date: 2026-11-08.

This folder is deliberately safe for the existing **public** repository. Do not upload physical flash dumps, complete recovery archives, environment files, credentials, customer data, private factory documents, or protected documentation here. The PDFs are held in the user's ChatGPT file Library and prior conversation attachments; this index records their identities so they can be found again without requiring re-upload.

## Factory reports already available in ChatGPT file Library

| Report | Existing Library filename | Content / relevance | Limitation |
| --- | --- | --- | --- |
| CTB26052101701C01 | `577368088267076110592887110a2505.pdf` | 11-page CTB RoHS / materials report, NEO Smart Technology, NAS-MA01W6 and NAS-MA02W6 family | Does not establish Wi-Fi MCU, UART mapping, firmware, MQTT or safe wiring |
| AiTSZ-260601014CW1 | `2817dda4fc5bfe239dc000524f8acde8.pdf` | 32-page EMC report; internal / external sample photographs | Not a firmware specification |
| AiTSZ-260601014S | `7944b6810a2c5daad9e14ae3317c8ab6.pdf` | 74-page wireless test report | May inform radio capability; not proof of Mouse #10 firmware identity |
| RoHS conformity verification | `50a636aeb908b95fc480b51e1a1312ec.pdf` | Conformity document | Does not specify MQTT telemetry |

The originals have **not** been copied to this public repository, Vercel or Neon. Look up the filenames in ChatGPT Library. Do not treat generic test-lab photos as proof of an exact deployed device.

## Hardware identification

- Factory photo PCB silkscreen `NAS-MA01W6-V3 2024.11.25`.
- User-supplied Mouse #10 photo appears to have a matching PCB silkscreen and broadly matching component placement.
- Matching silkscreen is **not** proof of identical MCU, firmware, power circuitry revision or pinout.
- Photos show large capacitors and the shock-generating section. **No exposed-board powering or USB-UART wiring until a qualified electrical-safety review establishes isolation and discharging procedure.**
- Earlier historical BMAX W003 devices may have a BK7231N chip; must be independently established on the exact board.
- Mouse #10 previously observed pairing AP `SmartLife-D1FB`, MAC `F8:17:2D:BB:D1:FA`; registered `FS-MOUSE-000002`, assigned Addis Restaurant. Pairing AP sighting is not authenticated device telemetry.
- Mouse #11 `SmartLife-203B`, `FS-MOUSE-000003`. Preserve.

## Confirmed runtime and gaps

- HP2 Windows scanner `hp2-windows-wifi-scanner.mjs` reads Windows `netsh` wireless sightings and uploads to preview; restored fresh sighting confirmed in Smart Check.
- Smart Check → Smart Devices existing-card handoff and branch assignment confirmed.
- No recent authenticated MQTT from Mouse #10; its 50% battery is a **user-observed Smart Life app value**, not an MQTT report.
- `FS-MOUSE-000001` historical battery 92%, RSSI -58 dBm last timestamp 2026-09-18; provenance of those historical values **not yet determined**. Do not call them proof of actual hardware.

## Backup locations reported by operator (not independently inventoried here)

- HP2 Windows `E:\FoodSafety-Mouse-Backup\`: three 2,097,152-byte BK7231N flash files; earlier SHA-256 checks matched, exact physical source still uncertain.
- HP2 Windows `E:\HP2-BACKUP-2026-10-07\`: `foodsafety-critical-system.tar.gz`, `platformio-openbeken.tar.gz`, `ubuntu-home-settings.tar.gz`. Contains potentially sensitive environment files.
- Other 64 GB, 32 GB, 16 GB removable drives and HP2 SSD: inventory not yet collected. Drive letters and mount points change across reboot and Linux/Windows.

## Existing code references (do not assume deployed to hardware)

- `ops/hp2/hp2-windows-wifi-scanner.mjs`
- `ops/hp2/owned-iot-mqtt-bridge.mjs` (legacy bridge; historically targeted live; **never inject test alarms**)
- `server/owned-iot-gateway.ts`
- `client/src/components/FreshSmartCheck.tsx`
- `client/src/components/OwnedSetupPanel.tsx`
- Separate draft PRs: #1303 (Mouse #10 handoff), #1304 (truthful six report statuses), #1305 (isolated OpenBeken parser/gate, **not** a physical connection fix).

## Recovery procedure

1. Inspect the existing historical device #1 92%/-58 dBm event provenance read-only; identify source device, timestamp, and whether it was test or authentic telemetry.
2. Inventory HP2 drives **read-only**. Record file paths, sizes and hashes of known archives; never print secrets.
3. Compare original code and firmware metadata with NEO documents and open-source repository `kedube/tuya-smart-mousetrap` (different model must not be assumed compatible).
4. Only then determine safe hardware isolation, provisioning, and firmware backup/restore path.
5. Run isolated decoder/gateway tests in preview. No customer alarm until physically demonstrated on known-safe test apparatus.
6. Do not deploy to production `pestcontrol.cat` without explicit approval.

Security: do **not** add passwords (including temporary passwords), gateways tokens, SSH keys, Wi-Fi credentials, `.env` files, or archives containing them. All shared credentials must be rotated if disclosed.
