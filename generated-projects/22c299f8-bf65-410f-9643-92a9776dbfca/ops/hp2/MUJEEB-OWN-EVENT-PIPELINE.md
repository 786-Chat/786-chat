# Food Safety — Mujeeb own-event relay (draft, inactive)

Goal: Addis Restaurant's real mouse-caught notification should reach its own Branch Dashboard
and the Admin Dashboard without requiring customers to access Smart Life.

## Reuse what already works

- HP2 Ubuntu has Mosquitto and an existing MQTT-to-website gateway bridge.
- HP2's read-only Wi-Fi scanner sees factory SmartLife pairing APs and posts
  real sightings to /api/iot/gateway/wifi-observation.
- Pest Control already has authenticated /api/iot/gateway/events; its server
  derives branch assignment from the registered FS-MOUSE ID, stores events,
  and updates the device alarm state.
- Mouse #10: SmartLife-D1FB / F8:17:2D:BB:D1:FA / FS-MOUSE-000002.
- Mouse #11: SmartLife-203B / F8:17:2D:BB:20:3A / FS-MOUSE-000003.
  Both registered to Addis Restaurant. Previous AP observations alone are
  NOT evidence of MQTT connectivity, customer-Wi-Fi pairing, or catch alerts.

## Desired real-event pipeline

Mouse sensor -> device Wi-Fi -> **verified accessible event source** ->
trusted local bridge -> this Mujeeb event relay -> existing gateway/events API ->
existing admin + assigned customer's branch views.

The **bold link is not implemented** for factory BMAX W003 firmware. The
relay is just the receiver side: it does not read Smart Life notifications,
query Tuya, alter DNS, intercept encrypted traffic, install firmware, or
change any mouse's Wi-Fi credentials.

An unknown Tuya factory firmware chooses its server. It will not call a
new API merely because the mouse MAC or FS-MOUSE ID is registered.
Commercial use requires proving real catch delivery and latency/failure
behaviour; cloud notification mirroring is only a potential experiment.

## Safety and deployment boundaries

- This branch is for review only; **do not merge, rebuild, or deploy** until
  real event source identity and consent are verified and tests pass.
- The adapter is not installed or started on HP2 by this PR.
- It listens on 127.0.0.1 only. Do NOT expose its HTTP port to the internet.
- If the event source is remote, use a securely authenticated transport
  terminating locally (e.g. a managed VPN) after access/security review.
- All incoming events need a separate Bearer token and an explicitly verified
  **event-source identity** -> FS-MOUSE ID binding (e.g. native Tuya device ID
  for a trustworthy Tuya feed, or a separately verified physical optical
  installation ID for a camera). Do not bind using an AP BSSID alone.
- Neither Wi-Fi presence nor an empty notification is interpreted as "caught".
- Every genuine source event needs a unique stable upstreamEventId so retries
  do not create duplicate alarms; the gateway is responsible for idempotency.
- The existing gateway token stays secret on HP2. A DIFFERENT ingest token
  must protect the event receiver. Never put either token in browser code.
- No simulated events should be sent to production customer branches.

## Optional HP2 test configuration (only after source and security approval)

Required, supplied via an existing secret-manager/service environment; do
not put live secrets in a GitHub file or chat:

PEST_CONTROL_BASE_URL=https://pestcontrol.cat
FOODSAFETY_IOT_GATEWAY_TOKEN=<existing protected gateway token>
MUJEEB_INGRESS_TOKEN=<separate 32+ character secret>
MUJEEB_DEVICE_BINDINGS_JSON={"<verified-event-source-id>":"FS-MOUSE-000003"}
MUJEEB_INGRESS_PORT=43117

Start in controlled testing only:
node ops/hp2/mujeeb-event-relay.mjs

The receiver accepts on localhost:
POST /ingest
Authorization: Bearer <MUJEEB_INGRESS_TOKEN>
Content-Type: application/json

Accepted schema (ONLY real source events, never fabricated Wi-Fi sightings):
{
  "sourceDeviceId": "<verified-event-source-id>",
  "type": "trap_triggered",
  "upstreamEventId": "<stable-unique-event-id-from-real-source>",
  "batteryPct": 83
}

Allowed types: trap_triggered, trap_reset, battery_update or signal_update.
- batteryPct (0–100) can accompany a genuine catch/reset report.
- A standalone battery_update requires a **real device-reported** batteryPct.
  It is forwarded as gateway `heartbeat` and updates the existing Admin
  and Branch Smart Devices battery displays **without setting off an alarm**.
- A standalone signal_update requires **real device-reported RSSI** (-110 to
  -1 dBm). It becomes a gateway `heartbeat` and updates the Wi-Fi RSSI on
  Admin and Branch cards **without setting off an alarm**.
- HP2 scanner `signalPercent` (0–100%) remains a **separate** report about
  seeing a factory pairing access point. It has a saved timestamp; the
  dashboard must not call it proof of live restaurant Wi-Fi.
- Admin and Branch Smart Devices show the two different signal sources
  separately, with `Not reported` when genuine readings are absent.
- HP2's Wi-Fi scanner cannot derive batteryPct from SSID, signal strength,
  green/red LED, or elapsed time. No mock values in customer dashboards.
- Battery readings are displayed as last reported; sleeping/offline mice may
  have stale readings. The system should not promise continuous reporting.

The receiver rejects unknown device, unauthenticated request, missing
upstream event identity, unknown event type, out-of-range battery data and
invalid content-type. A caller cannot assign a branch: the website resolves
the branch from its existing FS-MOUSE registration.

Current website wiring (already present, not a new feature):
- Admin GET `/api/iot/alarms`; Branch GET `/api/branch/iot-alarms`
  scoped by the logged-in branch. Both are read by the global alarm listener.
- The Admin/Branch alarm listener polls every 6 seconds in this draft.
- Branch Smart Devices and Branch Alerts also refresh every 6 seconds;
  Admin Smart Devices refreshes every 10 seconds.
- The audible browser alarm may require the admin/customer to interact with
  the webpage first, because browsers can block automatic audio playback.
- These are browser polling alerts, NOT operating-system push notifications
  when the user is logged out or the browser is closed.

Local automated tests (no website/API calls, no customer alarms):
node --test ops/hp2/mujeeb-event-relay.test.mjs

## Optional camera test for HP2 (no wiring, NO real alarms by default)

The user observed that the mouse may detect an animal before the high-voltage
pulse. That sequence is not electrically confirmed by the videos. The red LED
also lights for about three seconds during power-up, so a red pixel or an LED
turning on is **NOT automatically a genuine catch signal**.

The camera observer `camera-led-observer.mjs` is purely an experimental
computer-vision input:
- USB webcam looking **from outside the fully closed trap**, never near
  exposed trap circuitry. Do not touch LED legs, attach USB GND or do
  continuity tests on an energised trap.
- Optional dry-run processing of local video, with no uploads.
- Samples frames at 2fps (320x240) and checks a chosen region of interest.
- Requires a persistent red light across several frames and ignores the
  first 180 seconds of observation after starting.
- Labels changes `RED_LIGHT_CANDIDATE` only. The on-screen red LED at startup,
  phone UI red marks, reflections or changing camera angle can create
  false detections; position and camera ROI need physical verification.
- **By default it cannot send any event to a customer**.
- Experimental delivery to the localhost event relay is separately gated
  behind `--deliver`, a declared verified catch LED, credentials and a
  physically established optical-source binding. Do NOT enable customer
  delivery for an unverified indication or unattended tests.
- A cam connected to HP2 at home does not cover customer restaurants.
  This approach proves only the optical-to-API pathway, not a reliable
  worldwide Wi-Fi connection from the original BMAX W003 firmware.

Initial checks for the user's HP2 camera test:
```sh
ls -l /dev/video* 2>/dev/null || echo "No camera detected"
command -v ffmpeg || echo "ffmpeg not installed"
node --test ops/hp2/camera-led-detector.test.mjs
# Optional offline prerecorded media dry run, NOT real alarm:
node ops/hp2/camera-led-observer.mjs --file /path/to/local-test-video.mp4 --roi 100,100,50,50
```
The ROI above is an illustrative placeholder: calculate it from the actual
camera image with known LED position, not from guesses. Start the dry-run
observer before switching the mouse on. The startup guard is measured from
observer start, **not synchronised to physical mouse power-on**. Do not treat
any candidates as genuine mouse catches until independently verified.


## Next investigation: factory Smart Life / Tuya device source (READ ONLY)

The preferred Mujeeb event-delivery route does **not** use MQTT, but
factory W003 firmware still needs a separately authorised source for
catch, reset, battery and device Wi-Fi reports. Tuya Cloud is a *candidate
upstream source*, NOT a confirmed BMAX W003 catch integration and NOT a
free/self-hosted replacement for Tuya firmware.

Official Tuya guidance:
- Smart Life app devices must first be paired to an account and linked to
  the correct Tuya Developer Cloud project through an authorised QR scan.
- UK accounts are generally served by Central Europe, but check the
  account's region and chosen project's data center.
- GET /v1.0/iot-03/devices/{device_id}/status returns a snapshot of
  actual Data Point (DP) codes reported by Tuya, **if** the device is
  associated with the app account and the project can access it.
- Snapshot codes/values alone do NOT prove a physical catch, freshness,
  or a live local Wi-Fi link. Device status/event notifications may
  require a separately provisioned Tuya message service with costs,
  access limits and regional availability.

READ-ONLY discovery tool, tested with mock cloud responses:

    ops/hp2/tuya-readonly-status-inspector.mjs

No data is written to Tuya, to Pest Control, or to the mouse. The tool
does NOT send a catch to Mujeeb API and does NOT need MQTT.

Prerequisites before real testing:
1. User sees actual Mouse #11 in their authorised Smart Life app and
   confirms pairing at their chosen 2.4 GHz Wi-Fi.
2. User configures a Tuya Developer Cloud project linked by QR scan to
   that app account (do not put passwords/keys in chat or GitHub).
3. A trusted operator identifies the **native Tuya device ID** (this is
   neither FS-MOUSE-000003, SmartLife-203B nor BSSID F8:17:2D:BB:20:3A).
4. The operator places cloud Client ID and Client Secret only into a
   local private environment / secret manager. Do not enter them on
   pestcontrol.cat, 786.Chat builder, screenshots or a GitHub file.

With secrets supplied locally (NOT in source code), run:

    TUYA_REGION=eu node ops/hp2/tuya-readonly-status-inspector.mjs

The inspector requires TUYA_CLIENT_ID, TUYA_CLIENT_SECRET and
TUYA_DEVICE_ID from the private process environment; default output
lists DP codes and value *types*, not values. With --show-values it
prints device data locally; avoid sending potentially private values.
It uses Tuya Cloud HTTPS read-only requests only and never activates
or changes the mouse. The trap must remain OFF until a deliberate,
safe pairing session is arranged.

Acceptance of this route REQUIRES proof that a **real catch** changes
a distinct, consistent device status or produces a signed, authorised
Tuya event. When verified, implement an allowlisted DP-to-catch adapter
with event replay protection and a test-only destination first. Never
treat an arbitrary true/1 or online/offline transition as caught.

References (vendor docs):
- https://developer.tuya.com/en/docs/iot/link-devices?id=Ka471nu1sfmkl
- https://developer.tuya.com/en/docs/cloud/1ef1a3044b?id=Kconf2usgnfwo
- https://developer.tuya.com/en/docs/iot/new-singnature?id=Kbw0q34cs2e5g
- https://developer.tuya.com/en/docs/iot/manage-messages?id=Ka49p7loog3ze


## Remaining acceptance gates

1. Demonstrate that factory BMAX W003 paired on customer Wi-Fi emits a
   real catch/reset indication available from an authorised integration.
   A red LED or audible alarm alone is not a machine-readable event.
2. Determine the verified event-source identity and event type from this
   source; match it to the existing FS-MOUSE registration.
3. Confirm protected network route from the customer/shop event source
   to HP2 or the authorised relay location.
4. Confirm an end-to-end real trigger reaches the correct admin and
   customer dashboards exactly once, then test outages/retries and sleep.
5. Confirm customer privacy, branch separation, access restrictions,
   and incident/alarm escalation before commercial use.

**No Tuya Cloud subscription, flashing, wiring, or purchases are performed
by this draft.** A manufacturer-compatible local protocol, authorised
notification bridge, or compatible firmware is still required upstream.
