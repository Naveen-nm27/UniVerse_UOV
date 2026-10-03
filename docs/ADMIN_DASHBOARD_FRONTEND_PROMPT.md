# Codex prompt: Build the Administrator dashboard UI

Implement a working Administrator dashboard in the existing React application. This is a **frontend-only** task: build the screens, interactions and API integration where endpoints exist. Do not create backend routes, change the database, run backups or restore data as part of this task. Inspect the current application first and reuse its routing, authentication, components and design patterns. Preserve unrelated work.

The authenticated role is `ADMIN`, and its dashboard route is `/admin`. Administrators have system-wide authority **through permissions enforced by the server**, not because the browser says they are an administrator. The UI should give an authorised admin clear access to system operations while making high-impact actions deliberate, traceable and hard to trigger accidentally.

## Visual direction and navigation

Make this feel like the same product as the Management Assistant workspace: a professional university administration interface with a fixed left sidebar on desktop, accessible drawer on mobile, and a compact top bar for page title, account details and logout. Use the established colours: plum `#5D1C6A`, cream `#FFF1D3`, pink `#CA5995`, peach `#FFB090`, dark text and white/warm-white cards. Use clean typography, clear tables, modest borders and restrained shadows. Avoid decorative animation, gradients, 3D charts or large marketing-style headers.

Sidebar sections:

1. Overview
2. MA staff
3. Backup and recovery
4. Audit logs
5. Monitoring
6. System reports

Show the active page and group related settings if navigation grows. Do not copy grade-entry screens into the Admin dashboard merely because an admin has broad authority; links to other authorised workspaces may be provided if the current application supports them.

## Screens to build

### Overview (`/admin`)

Show a concise operational summary: active users, MA staff accounts, latest successful backup, failed or overdue backup jobs, system health, recent security/operational alerts and recent report jobs. Every metric needs a clear time period or last-updated timestamp and a link to its detail page. Use server-supplied values only. If an integration is unavailable, show “Not connected” or another honest state rather than a fabricated green status.

### MA staff management (`/admin/ma-staff`)

Provide a searchable, paginated directory of Management Assistant accounts with name, staff number if available, office, account status, last sign-in if available, and effective permissions/role summary. Give each row a details view and show only actions the server says this administrator may perform.

Provide an **Add MA staff** form (`/admin/ma-staff/new`) with the fields supported by the API, such as full name, university email, staff number, office, phone and initial account status. Show required/optional labels, server-driven office or role choices, inline validation and a review step before creation. On submit, create the user and MA profile through the existing authenticated API; never construct a fake account in browser state. Show the credential-delivery or invitation outcome returned by the server without displaying password hashes or logging a temporary password. Handle duplicate email/staff number and partial/failed requests clearly. The server decides the `MA` role and records who created the account; do not accept a browser-supplied creator ID as authority.

If existing endpoints support activation, suspension, reset or permission changes, put them in the details page with explicit confirmation and an audit-friendly outcome. Do not add nonfunctional controls for unsupported actions. Prevent an admin from accidentally disabling their own active session unless the backend explicitly supports and explains that workflow.

### Backup and recovery (`/admin/backups`)

Show backup status, retention information when available, the last verified backup, next scheduled backup and a paginated history of backup jobs. Each job should show type (full/incremental if supported), requested by, start/end time, status, size, storage target label, verification/checksum result and an error summary that does not expose secrets. Allow authorised admins to request a new backup, view its progress, refresh its status and inspect failure details **only if backed by real API operations**.

Put recovery in a clearly separated, visually serious section. Let the admin choose an eligible backup, review its date, environment, compatibility and validation result, then request a restore preview/dry run if the API supports one. Before a real restore, show the target environment, expected scope, downtime/data-loss warning, a typed confirmation phrase and the exact operation being requested. Do not execute on a single click. Show job progress and the final verification result. The browser must not upload SQL dumps directly into the app, build shell commands, or pretend a restore succeeded. If restore/verification APIs or policy do not exist, render a clearly disabled or informational recovery state and report that missing integration.

### Audit logs (`/admin/audit`)

Show a server-paginated, read-only audit table with timestamp, actor, action, affected resource, outcome and request/correlation ID when available. Include filters for date range, actor, action/category, resource and success/failure; preserve filters in the URL where useful. A details drawer/page may show safe before/after summaries, but never raw passwords, tokens, database connection strings, device secrets or unredacted personal data. Make empty, filtered-empty, loading and request-failure states distinct. Do not offer edit/delete controls for audit events. Export only if an authorised, redacted server export exists.

### Monitoring (`/admin/monitoring`)

Provide a status overview for the API, database connection, background jobs, backup scheduler, storage and other integrations **that actually report health through the API**. Show “Healthy”, “Degraded”, “Unavailable” or “Unknown” with timestamps and explanatory text, not colour alone. Include trends or small flat charts for useful server-provided measures such as failed logins, API errors, job failures and backup success over time; label axes, units and time ranges. Provide a recent alerts/incidents list with severity, first/last seen and resolved status if supported. Refresh manually or at a modest interval, clean up polling on navigation, and clearly indicate stale monitoring data. Do not invent an alert-acknowledge or service-restart action if no endpoint exists.

### System reports (`/admin/reports`)

Let the admin generate approved system reports using a clear report catalogue and filter form. Candidate reports include users/accounts by role and status, MA activity, enrolment by programme/batch, result-publication status, attendance coverage, audit activity and backup/health history—show only report types the backend actually supports. Filters may include date range, department, programme, batch and status, depending on the report. Explain what each report contains and whether it includes personal information.

After submission, show report job state: queued, running, completed or failed, plus who requested it, its period, generation time and expiry/download availability. Open/download only through an authenticated server URL or protected API response. Support CSV/PDF only when the server generates those formats; do not fabricate files or calculate official academic statistics in React. Show aggregate charts and a table preview when provided, with clear labels and no misleading comparisons. Disable repeated submissions while a job is pending.

## Shared interaction and security rules

- Use the existing login/session flow and protect `/admin` routes for the server-confirmed `ADMIN` role. Derive the destination from the verified session or allowed internal route, not an editable browser role string.
- Use a shared authenticated API client with the application's configured base URL. Keep requests out of presentational components; abort stale requests and handle `401`, `403`, `404`, `409`, validation errors and network failure consistently.
- Treat client-side permission checks as display logic only. Hide unavailable actions, but expect the server to enforce every operation. Never send `createdBy`, `updatedBy` or another actor ID from form input.
- For backup creation, restore and account-state changes, show a review/confirmation step and the server result. Never assume that an accepted asynchronous job has completed. Refresh the job state until completion or let the user return later.
- Do not display secrets, raw backup contents, unrestricted audit payloads or sensitive student data. Use server-provided redacted summaries and aggregate reports.
- Every page needs loading, empty, filtered-empty, unavailable, permission-denied and retry states where relevant. Buttons must do something real; no static dashboard numbers or fake success toasts in the integrated UI.
- Make forms, drawers, tables and charts keyboard accessible. Use semantic headings/landmarks, visible focus, readable contrast, labels beside status colours, accessible table equivalents for charts and responsive layouts at phone, tablet and desktop widths.

## Build order and definition of done

First inspect the current Admin route, MA dashboard shell, authentication flow and available API contracts. Build the protected Admin shell and overview, then MA staff creation/directory, backup and recovery, audit logs, monitoring and report generation. Where an API is absent, implement an honest unavailable state and report the exact missing contract; do not expand this task into backend development or use hard-coded production-looking data.

Run client lint and production build, plus focused UI tests if available. Manually check an Admin and a non-Admin account; successful and duplicate MA creation; backup failure and in-progress jobs; restore confirmation and cancellation; audit pagination/filtering; stale monitoring data; report job progress/download; expired sessions; and a narrow mobile viewport. Finish with a short report of screens built, live API integrations, missing endpoints and check results.
