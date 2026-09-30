import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca";
const PROJECT_ROOT = `generated-projects/${PROJECT_ID}`;
const GATEWAY_PATH = `${PROJECT_ROOT}/server/owned-iot-gateway.ts`;
const INDEX_PATH = `${PROJECT_ROOT}/server/index.ts`;

function gitShow(ref, path) {
  return execFileSync("git", ["show", `${ref}:${path}`], { encoding: "utf8" });
}

function fail(message) {
  console.error(`[pest-iot] ${message}`);
  process.exit(1);
}

let gatewaySource;
try {
  gatewaySource = gitShow("origin/main", GATEWAY_PATH);
} catch {
  fail(`Could not read ${GATEWAY_PATH} from origin/main`);
}

if (!gatewaySource.includes("registerOwnedIotGatewayRoutes")) {
  fail("Main-branch owned IoT gateway source is missing its route registration export");
}

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

const currentGateway = (() => {
  try {
    return readFileSync(GATEWAY_PATH, "utf8");
  } catch {
    return "";
  }
})();

if (currentGateway !== gatewaySource) {
  writeFileSync(GATEWAY_PATH, gatewaySource);
  console.log(`[pest-iot] synchronized ${GATEWAY_PATH} from origin/main`);
}

if (nextIndex !== indexSource) {
  writeFileSync(INDEX_PATH, nextIndex);
  console.log(`[pest-iot] registered owned IoT gateway in ${INDEX_PATH}`);
}

if (currentGateway === gatewaySource && nextIndex === indexSource) {
  console.log("[pest-iot] owned IoT gateway already present; no changes required");
}
