# Food Safety Rating - Pest Control Management System

## Overview
This full-stack web application provides a comprehensive pest control management system for the food safety industry. It offers role-based dashboards for administrators and branch users to manage documents, track compliance, and maintain food safety ratings across multiple locations. The system aims to streamline operations, enhance compliance tracking, and improve overall food safety management with a user-friendly interface and robust backend.

## User Preferences
Preferred communication style: Simple, everyday language.

## Mobile & iOS Improvements (February 2026)
- **Viewport**: `viewport-fit=cover` for iOS notch/safe area support (removed `maximum-scale=1` to allow pinch-zoom)
- **Safe area insets**: `env(safe-area-inset-*)` padding for notched iPhones (X and newer)
- **Touch targets**: Minimum 44×44px per Apple Human Interface Guidelines
- **Tap highlight**: `-webkit-tap-highlight-color: transparent` removes blue flash on tap
- **Admin sidebar mobile**: Now a fixed-position drawer overlay on mobile (hamburger toggle always visible at top-left, overlay backdrop closes it). On desktop: existing collapsible in-flow sidebar unchanged.
- **Admin sidebar auto-close**: Clicking any nav item on mobile closes the drawer
- **Branch sidebar logo**: Always uses `/api/branches/:id/logo` endpoint — generates styled initials SVG when no logo uploaded (fixes Rayyan Restaurant and all no-logo branches)
- **Branch mobile icon**: Changed from `MoreVertical` (dots) to `Menu` (hamburger) icon
- **PDF viewer fixes**: All sections (Monthly Reports, Pest Control Docs, My Documents, Yearly Docs) now use PDF.js canvas renderer — no iframes anywhere in branch dashboard

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **UI/UX Decisions**: Dark theme, responsive design, 3D animated elements, custom cursor interactions, PWA capabilities, food safety rating visualization (star ratings).

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (session-based)
- **File Storage**: Replit Object Storage (permanent, survives republishing)
- **API Design**: RESTful endpoints with role-based access control.

### Core Features
- **User & Branch Management**: Admin and branch user roles, individual location management.
- **Document Management**: Categorized file storage (PDF, DOC, XLS, images) with a 24-month retention policy and viewing capabilities. Documents persist permanently unless manually deleted.
- **Pest Control & Compliance Tracking**: Records for treatments, monthly reports, and useful links. Automatic date tracking for monthly report uploads.
- **Notifications**: Real-time messaging between admin and branches.
- **Payment Tracking**: Financial records and automated messaging.
- **Security**: Replit-based OAuth, role-based access, session management, and PIN-based code protection for critical modifications.
- **Data Flow**: Separate admin and branch dashboards for managing and viewing data, with strict data isolation.
- **File Handling**: Dedicated multer configurations for different file types and sections, automatic file path correction, and comprehensive file cleanup on branch deletion.
- **UI Layouts**: Transformed card-based layouts to comprehensive table structures for Monthly Reports, Pest Control Documents, Yearly Documents, and Photos sections for enhanced data overview and management.

## External Dependencies

- **Database**: `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`
- **State Management**: `@tanstack/react-query`
- **UI Components**: `@radix-ui/*`
- **Styling**: `tailwindcss`
- **Validation**: `zod`
- **File Uploads**: `multer`
- **Security**: `bcrypt` (password hashing)
- **PDF Rendering**: `pdfjs-dist` (client-side PDF viewing)

## IoT Integration — Link24 Cloud (April 2026)

### Smart Mouser Pest Control Device Integration
- **Branding**: "Link24 Cloud" (Tuya IoT platform, never expose "Tuya" in UI)
- **Data Center**: Central Europe (`openapi.tuyaeu.com`)
- **Authentication**: HMAC-SHA256 signed requests with token caching
- **Service**: `server/tuya-service.ts` — token management, device info, device status, commands
- **DB Table**: `iotDevices` in `shared/schema.ts` — stores branch assignments with online/offline status cache
- **Storage Methods**: `getIotDevices`, `getIotDevicesByBranch`, `getIotDevice`, `createIotDevice`, `updateIotDevice`, `deleteIotDevice`
- **Admin Routes**: `GET /api/tuya/status`, `GET /api/tuya/test-connection`, `GET /api/tuya/devices`, `GET/POST /api/iot/devices`, `DELETE /api/iot/devices/:id`, `POST /api/iot/devices/:id/refresh`
- **Branch Route**: `GET /api/branch/iot-devices` — returns only devices assigned to that branch
- **Admin UI**: "IoT Cloud Settings" under DEVELOPER TOOLS in admin sidebar — connection status, test button, assign device form, device list with refresh/remove
- **Branch UI**: "Smart Devices" section in branch sidebar — shows assigned devices with online/offline status and status codes
- **Smart Mouser image**: `client/publichttps://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087853714-8a17cb6e-806a-433c-a5b2-5e616bbb45b2-smart-mouser-9IkSDc7KHY9vGd9hY9Z97CfS5sDivs.png`
- **Env vars**: `TUYA_ACCESS_ID`, `TUYA_ACCESS_SECRET`

## Report Generator Feature (February 2026)

### PDF Report Generator from Company Templates
- **Generate Report** button added to Monthly Reports section in Admin Panel
- Admin fills in customer details (name, premises, address, telephone, date, contract no, postcode, town)
- System overlays the data on the company PDF template (Inspection Report or COSHH Risk Assessment)
- Preview the filled PDF before saving
- Saved report appears in Monthly Reports list and can be sent to any branch
- Templates stored in `server/templates/` directory
- PDF generation uses `pdf-lib` library
- API endpoints: `GET /api/report-templates`, `POST /api/monthly-reports/generate`, `POST /api/monthly-reports/preview`
- PDF generator service: `server/pdfGenerator.ts`

## Recent Critical Updates (November 2025)

### COMPLETE Object Storage Migration (November 20, 2025) - PRODUCTION READY ✅
**CRITICAL:** 100% of file uploads now use permanent Replit Object Storage. All future uploads automatically persist across republishing.

**Phase 1 - Existing Files Migration:**
- ✅ 6 files successfully migrated to Object Storage
- ✅ 6 files verified with checksums (100% success rate)
- ✅ Backup manifest saved for rollback capability
- ✅ 0 failures during migration
- ✅ Files now persist permanently across deployments

**Phase 2 - ALL Upload Endpoints Migrated (COMPLETE):**
- ✅ Admin Documents upload (`/api/documents/upload`)
- ✅ Admin Photos upload (`/api/photos` and `/api/photos/upload`)
- ✅ Admin Monthly Reports upload (`/api/monthly-reports`)
- ✅ Admin Yearly Docs upload (`/api/yearly-docs`)
- ✅ Admin Pest Control Docs upload (`/api/pest-control-docs`)
- ✅ Monthly Report file update (`/api/monthly-reports/:id/update-file`)

**Technical Implementation:**
- **Object Storage Service** (server/objectStorage.ts): Upload, download, and ACL management
- **ACL System** (server/objectAcl.ts): Branch data isolation with admin override access
- **File Serving** (/objects/* route): Secure file access with admin/branch authentication
- **Migration Script** (server/migrateToObjectStorage.ts): Safe migration with dry-run, verification, rollback support for yearly docs
- **Backup Manifest**: /home/runner/workspace/migration-backup-manifest.json

**Upload Flow (ALL endpoints):**
1. Multer receives file → saves to temp location
2. ObjectStorageService uploads to permanent storage (`/objects/branch/{branchId}/{category}/{uuid}.{ext}`)
3. Database record updated with permanent Object Storage path
4. Temporary file cleaned up
5. File persists FOREVER unless manually deleted

**File Categories Protected:**
- Branch logos (permanent storage)
- Document uploads (PDF, DOC, XLS, images) - ALL categories
- Monthly reports (upload + file updates)
- Yearly documents (NEW - added to migration)
- Pest control documents
- Photos and attachments (before/after treatment)

**Rollback Capability:**
If needed, run: `tsx server/migrateToObjectStorage.ts rollback`
This will restore all original file paths from the backup manifest.

**Security:**
- Admins have full access to all files
- Branches can only access their own files
- ACL enforced at Object Storage level
- Session-based authentication required

### Previous Data Protection Fixes
- **DISABLED** all automatic file deletion and repair functions (server/index.ts lines 130-148)
- **RESTORED** 3,004 branch logos to permanent storage
- **FIXED** PDF viewer to use PDF.js canvas rendering instead of iframe (bypasses Chrome blocking)
- **CLEANED** database records pointing to missing files (20 broken records removed)
- **PROTECTED** all user data with lifetime storage guarantee - files only delete when manually removed by user

### Known Issues Fixed
- "Failed to load report" error in branch dashboard → Fixed by cleaning orphaned database records
- PDF inline viewer blocked by Chrome → Fixed by implementing PDF.js direct canvas rendering
- Missing branch logos → Fixed by restoring from backup and implementing permanent storage paths
- Document assignment corruption → Fixed by disabling automatic repair functions that were overwriting file paths
- Filesystem files deleted on republish → Fixed by migrating to permanent Object Storage