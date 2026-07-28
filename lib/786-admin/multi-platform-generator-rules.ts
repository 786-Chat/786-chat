export const MULTI_PLATFORM_GENERATOR_RULES = `
MULTI-PLATFORM PROJECT GENERATION — MANDATORY WHEN REQUESTED:
- Identify the requested product type before generating code: marketing website, web application, mobile application, backend/API, IoT platform, or a combined multi-platform system.
- Identify requested targets independently: web, Android, iPhone/iPad, backend, database, IoT/device service, notifications, analytics, publishing.
- Do not collapse a multi-platform request into one Next.js landing page.
- Generate only the platforms explicitly requested, but keep their data contracts consistent.

PROJECT STRUCTURE:
- For web applications, use Next.js App Router, React and TypeScript.
- For Android/iPhone/tablet applications, create an Expo + React Native project under mobile/ with app/, components/, services/, assets/, app.json and package.json.
- For backend-heavy systems, create route handlers and shared server modules under app/api/** and backend/** or lib/server/** as appropriate.
- For relational storage, include a Neon/PostgreSQL-compatible schema or migrations and typed data contracts.
- For device systems, include an integration service boundary under backend/devices/**, lib/devices/** or services/devices/**.

EXPO MOBILE APPLICATIONS:
- When Android, iPhone, iOS, tablet or Expo is requested, generate one shared React Native codebase.
- Include requested screens such as mobile/app/index.tsx, login.tsx, dashboard.tsx, devices.tsx, alerts.tsx and settings.tsx.
- Include mobile/components, mobile/services, mobile/assets, mobile/app.json and mobile/package.json.
- Use mobile-safe navigation and touch targets. Do not copy desktop navigation into the mobile app.
- Keep API base URL, authentication tokens and environment values outside UI components.
- Explain through project files or README that Apple and Google developer accounts, signing and store review are still required before publishing.

SHARED BACKEND AND DATA CONTRACTS:
- Keep web and mobile clients aligned to one set of request/response types.
- Include authentication, users, companies, branches, roles, permissions, devices, inventory, alerts, reports, notifications, subscriptions and audit logs only when requested or required by the described system.
- Prefer shared schemas/types under shared/** or lib/contracts/**.
- Include pagination, filtering, validation, error responses and tenant scoping for operational APIs.

MULTI-COMPANY TENANCY:
- When multi-company SaaS is requested, every tenant-owned table and API record must include company_id or an equivalent tenant key.
- Enforce tenant access in server code, not only by hiding UI controls.
- Model Platform Owner, Company Owner, Administrator, Manager, Technician, Worker, Staff, Customer and Auditor roles only when relevant.
- Prevent Company A from reading or writing Company B records.

PEST-CONTROL / IOT PLATFORM:
- When requested, support device registration, QR-code pairing, Wi-Fi setup, Bluetooth pairing, online/offline state, battery, signal, trap-open/trap-closed state, caught-event timestamp, GPS or saved installation location, customer site, building, floor, room, technician assignment, maintenance, maps, notifications, analytics and downloadable reports.
- Model the device path explicitly: device or sensor -> Bluetooth gateway or Wi-Fi -> MQTT/HTTPS ingestion -> cloud backend -> Neon -> web/mobile clients -> notifications.
- Separate device telemetry ingestion from user-facing dashboards.
- If real hardware details are missing, generate a simulator and adapter interface. Never claim physical hardware is connected.
- Keep hardware requirements documented: microcontroller, Bluetooth version, Wi-Fi capability, firmware, payload format, sensor type, trigger signal, serial-number format, battery type, cloud-vs-gateway mode, MQTT topics and HTTP API details.

MANUFACTURING / FOOD PRODUCTION:
- When requested, support raw materials, suppliers, purchase orders, production planning, recipes/BOM, batch numbers, line monitoring, quality inspections, temperature records, hygiene checks, allergens, expiry, warehouse stock, traceability, recalls, maintenance, shifts, downtime, wastage, dispatch and barcode/QR scanning.
- Generate working operational pages, forms, route handlers and data models instead of decorative cards.

DESIGN SYSTEM VARIATION:
- Choose a design identity appropriate to the product: industrial control room, clean medical, colourful education, dark IoT command centre, luxury corporate, warehouse operations, food-hygiene workflow, mobile field technician, bento dashboard, map-first interface, factory kiosk or tablet control panel.
- Vary navigation, page structure, colour, typography, chart language, cards, forms, mobile tabs and interaction patterns.
- Do not merely recolour one template.

GENERATION PIPELINE:
- Follow this order: identify application type -> identify platforms -> choose industry modules -> create data model -> create API contracts -> generate web app -> generate Expo app when requested -> generate device integration when requested -> validate files and routes -> return previewable/savable project files.
- For very large requests, implement a coherent end-to-end vertical slice and explicit extension points instead of dozens of fake screens.
- Never claim app-store publication, device connectivity, notification delivery or production deployment unless the required credentials and external services are actually configured.
`
