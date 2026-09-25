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

## Food Safety Owned IoT Integration (September 2026)

### Smart Mouse Trap Integration
- **Provider**: Food Safety Owned IoT — no third-party device-cloud subscription required.
- **Transport**: customer 2.4 GHz Wi-Fi → Food Safety gateway/MQTT → application backend.
- **Device Registry**: `owned_iot_devices` stores Food Safety device IDs, branch assignment, online/offline state, battery, signal and current alarm state.
- **Events**: `owned_iot_events` stores trap-triggered, trap-reset and other device events.
- **Admin Routes**: `GET /api/iot/owned/status`, `GET/POST /api/iot/devices`, `DELETE /api/iot/devices/:id`, `POST /api/iot/devices/:id/refresh`, alarm test/clear routes.
- **Branch Routes**: `GET /api/branch/iot-devices`, `GET /api/branch/iot-alarms`, and per-device alarm acknowledgement.
- **Admin UI**: Smart Devices lets admin register a device, assign a branch and provision customer Wi-Fi directly to the local Food Safety device setup portal.
- **Wi-Fi Security**: Wi-Fi passwords remain in the browser and are not persisted in the application database.
- **Alarm Flow**: trap events update the owned device record and appear in Admin Dashboard, Branch Dashboard and Smart Devices; Stop Alarm clears the current caught state.
