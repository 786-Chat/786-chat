import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca";
const PROJECT_ROOT = `generated-projects/${PROJECT_ID}`;
const GATEWAY_PATH = `${PROJECT_ROOT}/server/owned-iot-gateway.ts`;
const HISTORY_VISIBILITY_PATH = `${PROJECT_ROOT}/server/branch-iot-history-visibility.ts`;
const SMART_DEVICES_PATH = `${PROJECT_ROOT}/client/src/components/BranchSmartDevicesPanel.tsx`;
const ALERTS_PATH = `${PROJECT_ROOT}/client/src/components/BranchIotAlertsPanel.tsx`;
const INDEX_PATH = `${PROJECT_ROOT}/server/index.ts`;

function gitShow(ref, path) {
  return execFileSync("git", ["show", `${ref}:${path}`], { encoding: "utf8" });
}

function fail(message) {
  console.error(`[pest-iot] ${message}`);
  process.exit(1);
}

function readOrEmpty(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function canonicalSource(path, requiredMarkers) {
  let source;
  try {
    source = gitShow("origin/main", path);
  } catch {
    fail(`Could not read ${path} from origin/main`);
  }

  for (const marker of requiredMarkers) {
    if (!source.includes(marker)) {
      fail(`Main-branch ${path} is missing required marker: ${marker}`);
    }
  }
  return source;
}

function restoreCanonicalWhenMissing(path, requiredMarkers) {
  const source = canonicalSource(path, requiredMarkers);
  const current = readOrEmpty(path);
  const healthy = requiredMarkers.every((marker) => current.includes(marker));
  if (!healthy) {
    writeFileSync(path, source);
    console.log(`[pest-iot] restored ${path} from origin/main`);
    return true;
  }
  return false;
}

const gatewaySource = canonicalSource(GATEWAY_PATH, ["registerOwnedIotGatewayRoutes"]);
const currentGateway = readOrEmpty(GATEWAY_PATH);
let changed = false;

if (currentGateway !== gatewaySource) {
  writeFileSync(GATEWAY_PATH, gatewaySource);
  console.log(`[pest-iot] synchronized ${GATEWAY_PATH} from origin/main`);
  changed = true;
}

changed = restoreCanonicalWhenMissing(HISTORY_VISIBILITY_PATH, [
  "registerBranchIotHistoryVisibilityRoutes",
  "/api/branch/iot-alarm-history-hidden",
  "/archive",
]) || changed;

changed = restoreCanonicalWhenMissing(SMART_DEVICES_PATH, [
  "function readableStatus",
  "const powerLabel = readableStatus",
  "break-words text-sm font-semibold leading-tight",
]) || changed;

changed = restoreCanonicalWhenMissing(ALERTS_PATH, [
  "Trash2",
  "/api/branch/iot-alarm-history-hidden",
  "archiveHistoryEvent",
  "group relative",
]) || changed;

let indexSource;
try {
  indexSource = readFileSync(INDEX_PATH, "utf8");
} catch {
  fail(`Could not read ${INDEX_PATH}`);
}

let nextIndex = indexSource;

if (!nextIndex.includes("registerOwnedIotGatewayRoutes")) {
  const importMarkers = [
    'import { registerRoutes } from "./routes.js";',
    "import { registerRoutes } from './routes.js';",
  ];

  const importMarker = importMarkers.find((marker) => nextIndex.includes(marker));
  if (!importMarker) fail("Could not find registerRoutes import marker in Pest Control server/index.ts");

  nextIndex = nextIndex.replace(
    importMarker,
    `${importMarker}\nimport { registerOwnedIotGatewayRoutes } from "./owned-iot-gateway.js";`,
  );
}

if (!nextIndex.includes("registerBranchIotHistoryVisibilityRoutes")) {
  const gatewayImport = 'import { registerOwnedIotGatewayRoutes } from "./owned-iot-gateway.js";';
  const routesImport = 'import { registerRoutes } from "./routes.js";';
  const marker = nextIndex.includes(gatewayImport) ? gatewayImport : routesImport;
  if (!nextIndex.includes(marker)) fail("Could not find a safe import marker for branch history visibility routes");
  nextIndex = nextIndex.replace(
    marker,
    `${marker}\nimport { registerBranchIotHistoryVisibilityRoutes } from "./branch-iot-history-visibility.js";`,
  );
}

if (!nextIndex.includes("registerOwnedIotGatewayRoutes(app);")) {
  const startupMarker = "// CRITICAL: DISABLED AUTOMATIC REPAIR TO PREVENT DATA LOSS";
  const fallbackMarker = "\n(async () => {";
  const registration = [
    "// Register the HP2/MQTT -> Pest Control owned-IoT event bridge before the main route set.",
    "registerOwnedIotGatewayRoutes(app);",
    "",
  ].join("\n");

  if (nextIndex.includes(startupMarker)) {
    nextIndex = nextIndex.replace(startupMarker, `${registration}${startupMarker}`);
  } else if (nextIndex.includes(fallbackMarker)) {
    nextIndex = nextIndex.replace(fallbackMarker, `\n${registration}${fallbackMarker}`);
  } else {
    fail("Could not find a safe server startup marker for owned IoT gateway registration");
  }
}

if (!nextIndex.includes("registerBranchIotHistoryVisibilityRoutes(app);")) {
  const routeMarker = "const server = await registerRoutes(app);";
  if (!nextIndex.includes(routeMarker)) {
    fail("Could not find registerRoutes startup marker for branch history visibility registration");
  }
  const registration = [
    routeMarker,
    "",
    "  // Keep branch catch-history archive routes after the main routes so branch sessions are available.",
    "  registerBranchIotHistoryVisibilityRoutes(app);",
  ].join("\n");
  nextIndex = nextIndex.replace(routeMarker, registration);
}

if (nextIndex !== indexSource) {
  writeFileSync(INDEX_PATH, nextIndex);
  console.log(`[pest-iot] restored Pest Control IoT route registrations in ${INDEX_PATH}`);
  changed = true;
}

if (!changed) {
  console.log("[pest-iot] Pest Control owned IoT gateway and branch UI protections already present; no changes required");
}
