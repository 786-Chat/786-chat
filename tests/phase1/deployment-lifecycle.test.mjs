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

test("builder deployment API supports deploy, redeploy, rollback and domain management", () => {
  const route = read("app/api/786-chat/projects/[id]/deploy/route.ts");
  assert.match(route, /action === "redeploy"/);
  assert.match(route, /action === "rollback"/);
  assert.match(route, /action === "refresh-domain"/);
  assert.match(route, /action === "set-primary-domain"/);
  assert.match(route, /action === "remove-domain"/);
  assert.match(route, /setPrimaryProjectDomain/);
  assert.match(route, /removeProjectDomain/);
  assert.match(route, /matchingDomain/);
  assert.match(route, /session\.email/);
});

test("domain removal preserves a usable primary address", () => {
  const domains = read("lib/786-admin/domains.ts");
  assert.match(domains, /function canBePrimary/);
  assert.match(domains, /setPrimaryProjectDomain/);
  assert.match(domains, /Keep at least one deployment address connected to this project/);
  assert.match(domains, /Choose another active domain as primary before removing this address/);
  assert.match(domains, /replacement = domain\.is_primary/);
});

test("Deploy panel exposes domains and release history", () => {
  const workspace = read("components/786-chat/workspace.tsx");
  assert.match(workspace, /Deployment history/);
  assert.match(workspace, /Redeploy current build/);
  assert.match(workspace, /Roll back/);
  assert.match(workspace, /Refresh DNS/);
});

test("workspace exposes customer controls for every connected project domain", () => {
  const manager = read("components/786-chat/project-domain-manager.tsx");
  const wrapper = read("components/786-chat/workspace-with-projects-route.tsx");
  assert.match(manager, /Project domains/);
  assert.match(manager, /Make primary/);
  assert.match(manager, /Remove/);
  assert.match(manager, /window\.confirm/);
  assert.match(manager, /set-primary-domain/);
  assert.match(manager, /remove-domain/);
  assert.match(wrapper, /ProjectDomainManager/);
});
