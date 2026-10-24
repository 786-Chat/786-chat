# BMAX W003 / Mouse #11 — independent catch reporting feasibility
**Review date:** 2026-10-24. **Status:** candidate design only, no flashing, no Tuya billing, no MQTT dependency in preferred architecture.

## Verified evidence from this project (not proofs of native API connection)
- Mouse #11 uses an observed BK7231N Wi-Fi module; board shows UART-labelled RXD, TXD, CEN, 3V3. Only a qualified technician should handle internal electronics because of the high-voltage trap circuit.
- Smart Life successfully paired the device to Wi-Fi and displayed notifications **"Mouse was killed"** and **"Low voltage"**, plus a battery display that changed from 75% to 100% after a power cycle. The readings are not independently verified live and may be quantised/stale.
- Its Smart Life MCU firmware page showed current **V1.0.1** and available **V1.0.8**, but **do not upgrade** until compatibility and backup are reviewed.
- Stock factory setup Wi-Fi sightings on HP2 were not evidence of true catch events. Two-second red LED at power-on is **not a catch**.
- Smart Life local network test failed with notice that low-power Wi-Fi devices may not support network detection.
- In the current draft, Mujeeb event relay, gateway and Admin/Branch isolation tests pass using simulated events. Original factory firmware **does not currently deliver real catch events to that relay**.

## External hardware lead: SIMILAR BUT NOT YET CONFIRMED SAME BOARD

The public project https://github.com/kedube/tuya-smart-mousetrap documents a **Neo Coolcam NAS-MA02W6-V1** trap using:
- separate MCU (catch detection, battery, LED and power cycling) + BK7231N (Wi-Fi);
- low-power TuyaMCU serial protocol v0 at 9600 baud, MCU powering down Wi-Fi between reports;
- status DP **101** bool "Mouse killed", **102** enum battery 0/1/2/3 -> 100/75/50/25%, **103** bool "Low voltage";
- OpenBeken `TuyaMCU` and `tmSensor` drivers.
The documentation's firmware mapping and wake timing apply to the **documented Neo Coolcam model**, NOT automatically to BMAX W003. Similar Smart Life labels are promising but are insufficient to bind DPIDs or call catches. The external example uses **MQTT**; ours must validate a separate reliable **non-MQTT** event transport. Its Wi-Fi radio may only stay awake briefly for each status report. Existing OpenBeken `SendGet`/`SendPOST` support HTTP commands, but encrypted remote API forwarding, authentication and fast wake delivery are **not yet established** on this hardware.

## What would need to be confirmed before touching firmware

1. Check whether we already have a **full original private BK7231N firmware backup** from the *same* Mouse #11 (must not be guessed from Mouse #4 or other devices). Never upload/share flash dumps: they may contain Wi-Fi credentials and Tuya keys. If an existing dump is present, extract and share **only a sanitised DP schema and product-model information**; do not share secrets.
2. Compare original W003 product ID, board/MCU model, UART settings and DP schema against the external NAS-MA02W6-V1. Don't assume DP101 or battery enum mapping.
3. Before any changes, verify a *recoverable, complete* private stock backup and a physical safety plan with qualified technician. No case opening, jumper probing or HV handling in this stage.
4. Prototype wake-time-safe event forwarding using a **secure authenticated** HTTPS-capable firmware or appropriate locally trusted adapter; **never** expose unauthenticated HTTP or embedded bearer secrets to the public internet. Remote customer sites must work independently of being on the HP2 home LAN.
5. Prove a genuine catch and reset can be distinguished from power-on red LED, sleeping and reconnects. Ensure stable event identifiers, duplicate suppression, offline retries, battery freshness and branch isolation.
6. Only after independent bench evidence and Admin/Branch controlled preview verification, consider merging/rebuilding. Don't publish a customer alarm from test data.

## Status UI requirement

Off-without-a-report, asleep, temporarily disconnected, and genuinely turned OFF are distinct states. In the similar documented board, turning the physical switch OFF kills power without sending an OFF message. Thus an automatic **"Mouse turned OFF"** claim would be unsupported unless our exact W003 provides explicit power telemetry. Show **Last verified report / sleeping / unverified**, and retain the admin's separate manual OFF confirmation.

## Current operator instruction

Keep Mouse #11 paired for reversible reference. Do not pay Tuya, upgrade MCU, reset, unpair, flash, or open the trap yet. Next zero-risk check is to locate an existing *local firmware backup filename and size* on HP2, without opening/read-out or uploading backup bytes.
