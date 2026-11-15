# Contabo staging migration — database compatibility gate

Status: **NOT READY TO DEPLOY**. This document applies only to the isolated staging branch `contabo-staging-db-adapter-20261114`.

## Verified from current source

- `lib/db.ts` imports `neon` from `@neondatabase/serverless`, returns a lazy Neon HTTP query function from `getSql()`, and proxies the exported `sql` function.
- `lib/786-admin/db.ts` also instantiates the Neon HTTP client directly and exposes `transaction(queries)`; admin code builds query objects first and commits them as a single transaction.
- The dependencies include `@neondatabase/serverless` but **not** `pg` or `postgres`.
- `lib/auth.ts` requires `JWT_SECRET` of at least 32 characters.
- Application build/start scripts are `next build` and `next start`; default application port is 3000.
- This repository also uses other Neon imports elsewhere, so changing `DATABASE_URL` alone is insufficient.

## Safety gate before any application deployment

1. Keep `main`, Vercel production, Neon data, and pestcontrol.cat unchanged. Never deploy this branch directly to the existing production application.
2. Replace placeholder values in **staging-only** `DATABASE_URL` privately; never commit credentials or copy full connection URLs into chats, GitHub, or deployment logs.
3. Rotate credentials exposed in earlier screenshots/chat, checking existing integrations first. Keep staging credentials distinct from PostgreSQL admin credentials.
4. Inventory all Neon direct imports and query API usage: tagged templates, `sql(query, params)`, query result shapes, nested fragments, and batch transactions.
5. Implement a local PostgreSQL adapter preserving deferred query construction and atomic transaction semantics, with safe parameterized SQL and a pooled internal Docker connection. Add integration tests before switching the staging application.
6. After verifying Neon backups and upload storage, migrate a **copy** to `chat786_staging`, run schema/row-count/constraint comparisons, and validate authentication and dashboard flows.
7. Confirm staging access protection and HTTPS, required environment variables (including `JWT_SECRET`), and application dependencies before deploying.
8. Do not publish any new staging or production endpoint without reviewing access control. Production cutover only after explicit owner approval.

## Operator status (observed through screenshots, not independently connected)

- Coolify project `786-chat-staging` and application `786-chat-staging-app` exist; the app is **Exited**, not deployed.
- PostgreSQL 17 container exists on Contabo; database `chat786_staging` created and empty as of the inspection.
- `chat786_app` login was tested; its role is non-superuser and cannot create databases.
- Docker network named `coolify` appears on both resources, but no application-to-database connection has yet been tested.
- Staging `DATABASE_URL` was saved with placeholder host/password values and must **not** be used as-is.

This file is a deployment guard and implementation checklist, **not** evidence that the migration has been completed or tested.

## Stage A review — 14 November 2026

- **Passed:** dedicated adapter tests, TypeScript validation, and AI JSON regression in CI run `43638887995`.
- **Unresolved:** the broader CI test suite still fails in Phase 1 A/B/C/D and Phase 2 A/B/C/D/F. Failure logs include source-pattern expectation mismatches and module resolution errors. These failures should be triaged separately; do not silently rewrite runtime code to satisfy obsolete string-matching tests.
- **Important compatibility gap:** `lib/786-admin/vercel-project-deployer.ts` directly imports Neon, creates per-generated-project databases, and deploys applications through Vercel. It has NOT been migrated to Coolify/PostgreSQL. Generated-project deployments therefore cannot be called fully self-hosted.
- **Main adapter integration:** `lib/db.ts` now explicitly opts into `pgSql` only if `DATABASE_PROVIDER=postgres` and `CONTABO_STAGING_ONLY=1`, and `lib/786-admin/db.ts` routes admin transactions via `pgTransaction` under the same guard. No production switch has occurred.
- **Important safety limitation:** a successful driver mock test is not proof of a live database integration test; actual Coolify networking, schema permissions, imported data, JWT sessions, uploads and dashboard E2E tests remain outstanding.
- **Do not begin Stage B** until Stage A compatibility gates are complete and the owner has been informed.

## Stage A follow-up — verified disposable PostgreSQL 17 integration (14 November 2026)

- A dedicated GitHub Actions job starts PostgreSQL 17-alpine with a **temporary** `chat786_staging` database and CI-only credentials; it does not contact the Contabo VPS.
- CI run `43639890270` finished with `contabo-postgres-integration: success`: SQL parameter binding, inserts, reads, transactional commit, duplicate-key rollback and explicit query execution were verified against a real PostgreSQL server.
- In the same run, `ai-json-regression: success`, isolated PostgreSQL adapter tests: success, TypeScript validation: success. The combined `test-and-typecheck` job is **failure** because multiple unrelated Phase 1/Phase 2 legacy tests still fail.
- Therefore this adapter has **not** passed every application regression test and **has not** been deployed to Coolify. The generated-project Vercel/Neon path, authentication/session tests against imported data, uploads, staging URL protection, private credential rotation, and production safety checks remain blockers.
- Keep Stage B (Neon data copying) on hold as requested until Stage A is genuinely complete and verified.

## Stage A follow-up — Coolify staging provisioning contract (14 November 2026)

- Added `lib/786-admin/coolify-staging-deployer.ts`: isolated, opt-in, authenticated `POST /api/v1/applications/public` client based on official Coolify API documentation. Uses a specific Git commit, `railpack`, port 3000, and a `/generated-projects/<id>` base directory. It explicitly disables both auto-deploy and instant-deploy.
- Added `tests/phase2/contabo-coolify-staging.test.mjs` to verify creation parameters, branch/commit/path restrictions, staging opt-in and refusal of non-HTTPS Coolify origins. Tests inject a mock HTTP client and never contact Contabo.
- This is **not** the full generated-project migration. The existing `lib/786-admin/vercel-project-deployer.ts` still provisions generated databases through Neon, Vercel Blob storage and Vercel deployments. Do not call generated app hosting functional on Contabo until those paths have been replaced and independently tested.
- Checked the repository's original `main` workflow: `786.Chat CI` failed on commit `c8f713d8` in run `39984879055` (23 October 2026), before this staging branch was created. Therefore at least part of the broader CI red status is an inherited regression; fix and classify failures instead of altering functional code to satisfy outdated source-matching tests.
