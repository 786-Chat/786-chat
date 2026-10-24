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

Allowed types: trap_triggered or trap_reset. Rejects unknown device,
unauthenticated request, missing upstream event identity, unknown event
type, out-of-range battery data, and invalid content-type. It cannot
assign a branch chosen by a caller: the website resolves it.

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
