import { MULTI_PLATFORM_GENERATOR_RULES } from "@/lib/786-admin/multi-platform-generator-rules"

export const OPTIONAL_PROJECT_FEATURE_RULES = `
USER-REQUEST-ONLY PROJECT SCOPE — MANDATORY:
- Build only the pages, sections, features, actions, and navigation explicitly requested by the user.
- Do not automatically add Menu, About, Contact, Gallery, Booking, Checkout, Products, Services, Dashboard, Admin, Login, Register, Language, Currency, or any other page or feature unless the user explicitly asks for it.
- Do not copy a standard template, repeated section set, navigation structure, color system, layout, or visual design from previous projects.
- Derive the project structure and design from the current user request and the current project's existing files only.
- For a new project, create only the minimum required framework files plus the files needed to satisfy the request.
- For an existing project, preserve unrelated pages, sections, design, data, and functionality. Modify only what the user requested.
- Never invent navigation destinations. Every navigation link must correspond to a real file returned in the same response or already present in the existing project file tree.
- If the user asks for one page, do not expand it into a multi-page site unless they explicitly request multiple pages.
- If a requested detail is not specified, choose a reasonable implementation detail without adding unrelated business features or pages.

GENERATED APP PREVIOUS/NEXT PAGE CONTROLS — USER REQUEST ONLY:
- This applies inside the customer's generated application only. Never add a Pages button, Pages manager, page-management overlay, page list, or page-management sidebar to the 786.Chat builder dashboard.
- Do NOT automatically add < and > page controls just because a project has multiple pages. Add them only when the customer explicitly asks for previous/next page arrows, page-to-page arrows, or equivalent sequential page navigation.
- If the customer requests these controls and the generated application has only one visible top-level customer page, do not add them because there is no previous or next page.
- If the customer requests these controls and the generated application has two or more visible top-level customer pages, add compact visible < and > controls inside each generated page header or equivalent top page action area.
- The < control navigates to the previous visible top-level customer page in the application's page/navigation order. The > control navigates to the next visible top-level customer page.
- On the first page, disable the < control. On the last page, disable the > control. Do not wrap around unless the customer explicitly asks for circular navigation.
- These controls navigate between real pages; they must not paginate, hide, replace, delete, rename, or recreate the application's existing navigation links.
- Keep the application's normal header/navigation exactly as designed. The arrows are an optional additional convenience only when requested, not a replacement navigation system.
- Exclude utility authentication routes such as login, register, forgot-password, reset-password, verification and API routes from this previous/next page sequence unless the customer explicitly asks to include them.
- Give the controls accessible labels such as Previous page and Next page, keep them keyboard and touch accessible, and preserve the generated application's visual style on desktop, tablet and mobile.

PROJECT TYPE DECISION — MANDATORY:
- Decide whether the request is for a marketing website, an operational business application, an IoT/device platform, or a mixed public website plus authenticated application.
- Never reduce ERP, CRM, manufacturing, food production, school management, pest control, field service, inventory, quality, maintenance, analytics, multi-company SaaS or IoT requests to a landing page.
- If the request includes records, workflows, users, devices, events, roles, reports, production, inventory, maintenance, alerts, factories, branches, customers, students, technicians, sensors, subscriptions or permissions, generate real application architecture.

BUSINESS APPLICATION ARCHITECTURE:
- Create real App Router pages for requested modules, not decorative sections pretending to be software.
- Create a shared workspace layout, navigation, dashboards, list/detail views, forms, filters, tables, charts, status badges, loading, empty and error states where required.
- Create app/api/** route handlers for requested CRUD operations and actions.
- Create typed models, Zod validation and a Neon/PostgreSQL-compatible schema or migration when persistent relational data is requested.
- Enforce authentication and role/tenant authorisation in route handlers when authentication or tenant separation is requested, not only in the UI.
- Do not claim that database actions, notifications, payments, integrations or device commands are live unless the returned files implement them.
- Prefer a complete working vertical slice over many fake modules. For a very large system, fully implement the requested core and create explicit extension points.

BACKEND GENERATION ORDER — MANDATORY:
- When the request includes Neon, PostgreSQL, database, API, CRUD, customers, orders, records or persistence, generate the backend files before validation. Never stop after generating only frontend files.
- For database-backed requests, return sql/schema.sql and sql/migrations/001_initial.sql first, then lib/server/env.ts, lib/server/db.ts, backend/manifest.json, scripts/migrate.mjs, required app/api/** routes, and only then UI files that consume those APIs.
- If the user names database tables such as customers and orders, CREATE TABLE statements for every named table must exist in sql/schema.sql and the initial migration in the same response.
- If the user requests collection and item CRUD, create both app/api/<resource>/route.ts and app/api/<resource>/[id]/route.ts in the same response.
- For CRUD resources, app/api/<resource>/route.ts must export async function GET and async function POST. app/api/<resource>/[id]/route.ts must export async function GET, PATCH and DELETE. Do not use only exported const arrow handlers for these validator-required methods.
- Each CRUD resource must contain direct Zod validation in its collection/item route files using z.object(...), z.string(...) or z.coerce(...). Shared schemas may also be used, but do not rely only on an imported schema because route validation must be visible in the API files.
- For single-resource CRUD such as reservations, customers, products or orders, finish BOTH API route files before spending tokens on cosmetic frontend sections. The collection route must visibly contain z.object(...) plus export async function GET and export async function POST. The item route must visibly contain z.object(...), z.string(...) or z.coerce(...) plus export async function GET, export async function PATCH and export async function DELETE.
- Never omit GET from the item route. Never collapse PATCH/DELETE into a generic handler. Never move all Zod schemas into another file when the validator requires route-local evidence.
- When the request asks for reservations CRUD, explicitly generate app/api/reservations/route.ts with GET + POST and app/api/reservations/[id]/route.ts with GET + PATCH + DELETE, and include direct Zod parsing in those route files.
- For Neon, lib/server/db.ts must import @neondatabase/serverless and expose a lazy function named getDb or getSql. Do not create the Neon client at module scope and never use Proxy.
- DATABASE_URL must be loaded lazily. If lib/server/env.ts owns the actual environment lookup, lib/server/db.ts must still explicitly reference the DATABASE_URL variable name in a comment or typed helper description and call the lazy env getter only from inside getDb/getSql so build-time page collection does not require the database.
- Never emit .env, .env.local, .env.production, .env.example, .env.sample, credentials.json, service-account files or private-key files. Put environment variable NAMES only in docs/backend-setup.md and backend/manifest.json; never output credential values.
- Never submit a generation response for validation while any mandatory backend file from the structured plan is absent.
- For an existing project, preserve frontend files and focus the generation response on missing backend files instead of rewriting the whole application.
- When the user explicitly says no authentication, do not invent auth, sessions, email verification or tenant guards. Implement the requested public backend safely with Zod validation, parameterized queries and explicit error handling.
- When authentication is requested, enforce it server-side before database access.
- A valid frontend preview does not count as completion of a backend request. Backend schema, APIs and required admin/data views must all be present before reporting success.

MULTI-COMPANY SAAS:
- When requested, model organisations/companies, factories/sites, branches, memberships, users, roles and scoped permissions.
- Include tenant ownership keys on business records and prevent cross-tenant access.
- Add subscriptions, plans and billing only when requested.

MANUFACTURING AND FOOD PRODUCTION:
- Support requested suppliers, raw materials, goods in, batches, recipes/BOM, production runs, quality checks, packing, inventory, warehouses, maintenance, deliveries, traceability, expiry, recalls and reports.
- Preserve batch/lot traceability from supplier receipt through production, packing, inventory and delivery when requested.
- Generate operational forms and data views, not sample marketing cards.

SCHOOL MANAGEMENT:
- Support requested students, guardians, teachers, classes, attendance, timetables, assignments, exams, fees, results, notices and role-scoped dashboards.

PEST CONTROL AND FIELD SERVICE:
- Support requested customers, sites, buildings, rooms/zones, devices/traps, inspections, detections, treatments, work orders, technicians, schedules, evidence, compliance reports and alerts.
- Keep customer, site, device and service history linked for traceability.

IOT AND DEVICE MANAGEMENT:
- Support requested device registration, unique identifiers, provisioning, firmware, connectivity method, last-seen time, online/offline state, battery, signal strength, location, telemetry and event history.
- Support Wi-Fi, Bluetooth gateway, MQTT and HTTPS integration boundaries when requested.
- Separate event ingestion APIs from dashboard display.
- For physical hardware, create typed adapters and a simulator unless the user provides the real protocol, payload format, authentication and firmware/API documentation.
- Never pretend arbitrary hardware can be controlled through browser Bluetooth or Wi-Fi without a compatible protocol and permission model.
- Use secure per-device credentials or signed tokens where appropriate; never hard-code secrets.

PEST SENSOR / TRAP EVENTS:
- When requested, model company, customer/site, building, room/zone, device ID, location, event type, pest detected, timestamp, battery, signal, online state, acknowledgement, action taken and assigned technician.

NOTIFICATIONS AND AUTOMATION:
- Add push, email, SMS, WhatsApp, webhook or in-app notifications only when requested.
- Use provider adapters and environment variables, with delivery status, retries, acknowledgement and audit history when required.
- Never claim notification delivery succeeded without a real provider response.

ANALYTICS, AUTOMATION AND INTEGRATIONS:
- Analytics, Automation, Integrations and device dashboards are valid modules when the current project requires them.
- Never reject these modules merely because they were inappropriate in a previous unrelated project.
- Build analytics from domain data, with relevant company, site, date, status, device, product, batch, class or technician filters.
- Add CSV, PDF or Excel export only when requested and supported by available dependencies or a clearly defined implementation boundary.

OPTIONAL PROJECT FEATURES:
- Add optional features only when the user asks for them.
- Keep every generated feature inside the active project files.
- Return complete working files and preserve unrelated design.

Contact action:
- When requested, create a working external contact action using the user-provided destination.
- Use a real link and a declared editable project constant.
- Do not show a success message unless a real project action completed.

Language:
- When requested, create app/language/page.tsx or a working selector in the requested component.
- Include declared translation dictionaries for every language shown.
- Switching language must update the visible text implemented by the returned files.

Currency:
- When requested, create app/currency/page.tsx or a working selector in the requested component.
- Define currency code, locale, symbol, and project conversion rate in one declared source of truth.
- Update displayed prices consistently across returned product, cart, checkout, booking, invoice, and payment files.
- Use Intl.NumberFormat when practical.
- Do not describe project conversion rates as live rates.

Booking:
- When the user requests Booking, Reservations, Appointments, or a /booking route, create app/booking/page.tsx as a functional booking page.
- app/booking/page.tsx itself must contain a real <form> with submit handling using onSubmit, action, or formAction, plus date/time or appointment/booking controls.
- Do not make app/booking/page.tsx only a thin wrapper around a shared component when submit-booking is required; keep the functional form and its submit handler in the booking route file so requirement validation can verify it directly.
- The submit action must update visible state, call a real requested API/action, or otherwise perform a concrete booking action. Do not render a decorative form with no submit behaviour.

Real pages:
- When requested, create real App Router files such as app/booking/page.tsx, app/checkout/page.tsx, app/payment-method/page.tsx, app/language/page.tsx, and app/currency/page.tsx.
- Navigation must point to matching real routes.
- Do not substitute fake sections inside app/page.tsx for requested pages.

${MULTI_PLATFORM_GENERATOR_RULES}
`
