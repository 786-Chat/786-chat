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

PROJECT TYPE DECISION — MANDATORY:
- Decide whether the request is for a marketing website, an operational business application, an IoT/device platform, or a mixed public website plus authenticated application.
- Never reduce ERP, CRM, manufacturing, food production, school management, pest control, field service, inventory, quality, maintenance, analytics, multi-company SaaS or IoT requests to a landing page.
- If the request includes records, workflows, users, devices, events, roles, reports, production, inventory, maintenance, alerts, factories, branches, customers, students, technicians, sensors, subscriptions or permissions, generate real application architecture.

BUSINESS APPLICATION ARCHITECTURE:
- Create real App Router pages for requested modules, not decorative sections pretending to be software.
- Create a shared workspace layout, navigation, dashboards, list/detail views, forms, filters, tables, charts, status badges, loading, empty and error states where required.
- Create app/api/** route handlers for requested CRUD operations and actions.
- Create typed models, Zod validation and a Neon/PostgreSQL-compatible schema or migration when persistent relational data is requested.
- Enforce authentication and role/tenant authorisation in route handlers, not only in the UI.
- Do not claim that database actions, notifications, payments, integrations or device commands are live unless the returned files implement them.
- Prefer a complete working vertical slice over many fake modules. For a very large system, fully implement the requested core and create explicit extension points.

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

Real pages:
- When requested, create real App Router files such as app/booking/page.tsx, app/checkout/page.tsx, app/payment-method/page.tsx, app/language/page.tsx, and app/currency/page.tsx.
- Navigation must point to matching real routes.
- Do not substitute fake sections inside app/page.tsx for requested pages.
`
