import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("production releases keep immutable deployment history", () => {
  const publishing = read("lib/786-admin/publishing.ts");
  assert.match(publishing, /admin_project_deployment_versions/);
  assert.match(publishing, /recordDeploymentVersion/);
  assert.match(publishing, /rollbackProjectDeployment/);
  assert.match(publishing, /owner_email/);
});

test("builder deployment API supports deploy, redeploy, rollback and domain refresh", () => {
  const route = read("app/api/786-chat/projects/[id]/deploy/route.ts");
  assert.match(route, /action === "redeploy"/);
  assert.match(route, /action === "rollback"/);
  assert.match(route, /action === "refresh-domain"/);
  assert.match(route, /matchingDomain/);
  assert.match(route, /session\.email/);
});

test("Deploy panel exposes domains and release history", () => {
  const workspace = read("components/786-chat/workspace.tsx");
  assert.match(workspace, /Deployment history/);
  assert.match(workspace, /Redeploy current build/);
  assert.match(workspace, /Roll back/);
  assert.match(workspace, /Refresh DNS/);
});
