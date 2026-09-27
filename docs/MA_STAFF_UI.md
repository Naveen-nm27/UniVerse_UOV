# Management Assistant UI and Use-Case Instructions

This document defines how to design and implement the Management Assistant (MA) workspace in UniVerse UOV. Use it together with the [project UI guide](./README.md) and [project structure](./PROJECT_STRUCTURE.md).

## 1. Role purpose

The Management Assistant maintains the operational academic data used by students, lecturers, Heads of Department, Deans, and administrators. The MA creates accounts, maintains teaching resources and timetables, enters grades, and records the result-verification workflow.

The authenticated database role is `MA` and its dashboard path is `/ma`. The backend must obtain this role from the authenticated user. Never offer a role selector or accept an MA role claimed by the browser.

V04 grants these default permissions to MA users:

| Permission | UI capability |
| --- | --- |
| `users.create` | Create student, lecturer, and other authorised accounts |
| `grades.write` | Enter and update ICA and final grades |
| `results.status.update` | Move results through the verification workflow |
| `results.status.view` | View result status and history |
| `timetable.write` | Manage offerings and recurring timetable slots |
| `devices.write` | Manage fingerprint devices |

Render actions from the server-returned effective permissions. The backend must enforce the permission again on every write.

## 2. Application shell

Use the common UniVerse dashboard shell:

- A `248px` plum sidebar on desktop.
- A top bar with page title, notifications, and MA profile menu.
- A cream/light content background with white cards.
- A responsive navigation drawer below tablet width.
- Breadcrumbs on create, edit, detail, and workflow pages.

Recommended sidebar order:

1. Overview
2. Users
3. Academic setup
4. Timetable
5. Devices
6. Grades
7. Result workflow
8. Documents
9. Audit activity

Group secondary items under expandable sections instead of creating a very long flat menu. Highlight the active destination and preserve keyboard navigation.

## 3. Dashboard design

The `/ma` overview should answer “What needs my attention today?” rather than repeat every navigation item.

### Header

- Greeting using the MA's name.
- Current date and office name when available.
- Primary shortcut: **Create user**.
- Secondary shortcut: **Enter grades**.

### Summary cards

Show a small, useful set of metrics such as:

- Active users
- Today's lecture sessions
- Results awaiting action
- Active timetable issues or device issues

Every card must state its timeframe and link to the filtered detail page. Do not invent counts on the client; obtain them from a dashboard summary endpoint.

### Work queue

Show time-sensitive items in priority order:

- Returned results needing correction
- Results awaiting validation or Dean-office movement
- Timetable conflicts
- Inactive or unassigned devices
- Recently failed imports, if bulk import is implemented

### Recent activity

Display recent actions relevant to the logged-in MA. Use `AUDIT_LOG` data through a safe server response; do not expose raw sensitive JSON values.

## 4. Use-case catalogue

### MA-01: Create a user account

**Actor:** MA with `users.create`  
**Goal:** Create an account and its role-specific profile.  
**Entry point:** Users → Create user.

Flow:

1. Choose the account type: Student, Lecturer, HOD, Dean, MA, or Administrator, subject to policy.
2. Enter common user information: name, university email, phone, and role.
3. Show only the selected role's profile fields.
4. Review a summary before submission.
5. Submit once; disable the button while processing.
6. Show the generated/temporary credential delivery outcome without exposing `password_hash`.

Role-specific fields:

| Role | Required profile context |
| --- | --- |
| Student | Registration number, batch, programme and programme start date |
| Lecturer | Department, date joined, optional staff number, HOD status where authorised |
| HOD | Lecturer details plus the department-head assignment |
| Dean | Department/faculty and appointment date |
| MA | Optional staff number and office name |
| Administrator | Admin level |

Validation and safeguards:

- Check email and registration/staff-number uniqueness on the server.
- Populate departments, batches, and programmes from API lookups.
- Use integer IDs from V04, not legacy UUID examples.
- New accounts default to active and should require a password change where V04 specifies it.
- Set `created_by` from the authenticated MA, never from a form field.
- If profile creation fails, the user and profile transaction must roll back together.

### MA-02: Find and inspect users

**Goal:** Locate a user and view safe account/profile information.

Provide:

- Search by name, email, registration number, or staff number.
- Filters for role, department/programme where relevant, and active status.
- Paginated results with name, identifier, role, status, and last login.
- A details view with profile data and an audit/activity summary.

Never display password hashes or authentication tokens. Account deactivation, reset, and profile editing require explicit endpoints and permissions; do not imply they exist merely because account creation exists.

### MA-03: Maintain academic reference data

**Goal:** Maintain the data required by student and teaching workflows.

Screens should cover, as authorised:

- Departments and programmes
- Batches
- Calendar semesters
- Programme semesters
- Modules
- Halls

Use a list/detail or list/drawer pattern for small records and a dedicated page for complex records. Warn before changes that affect existing offerings or enrolments. The backend owns referential-integrity decisions.

### MA-04: Create and manage module offerings

**Goal:** Assign a module to a calendar semester, lecturer, and hall.

Flow:

1. Select semester.
2. Select module.
3. Select lecturer, filtered by relevant department when appropriate.
4. Select hall and show capacity/context.
5. Review possible duplication or conflicts.
6. Save the offering and record the authenticated MA as updater.

Respect V04's uniqueness and foreign-key rules. Show server conflict responses next to the relevant field.

### MA-05: Manage the timetable

**Actor:** MA with `timetable.write`  
**Goal:** Create recurring lecture times without lecturer or hall conflicts.

The main view should support week and table presentations. Provide filters for academic year, semester, programme, lecturer, hall, and active status.

The slot form includes:

- Module offering
- Hall
- Day of week
- Start and end time
- Effective-from and optional effective-until dates
- Active status

Rules:

- Display day values as Monday–Sunday while sending the V04 value `1`–`7`.
- End time must be later than start time.
- Effective-until cannot precede effective-from.
- Check both lecturer and hall overlap on the server.
- Present conflicts with the clashing module, lecturer/hall, day, and time.
- Never silently overwrite or deactivate an existing slot.

### MA-06: Manage fingerprint devices

**Actor:** MA with `devices.write`  
**Goal:** Register and maintain one device per hall.

Provide a device list with serial number, assigned hall, status, and last update. The form includes device serial, hall, and active status.

- Enforce one device per hall.
- Do not display or edit raw device secrets. A UI may show whether a secret reference is configured.
- Require confirmation before deactivation because it affects attendance capture.
- Record the authenticated MA in `updated_by`.

### MA-07: Define ICAs and enter ICA grades

**Actor:** MA with `grades.write`  
**Goal:** Create ICA definitions for an offering and record grades for enrolled students.

Design the grade-entry workspace as a context-first flow:

1. Select academic year/semester.
2. Select programme/module offering.
3. Select or create the ICA number and title.
4. Load only valid enrolments for the offering.
5. Enter grades in a keyboard-friendly grid.
6. Validate and review changed rows.
7. Save in a transaction and show a row-level outcome.

The selected module, semester, lecturer, and ICA must remain visible while entering data. Grade options come from `GRADE_SCALE`; never hard-code a second grade scale in the browser.

### MA-08: Enter final results

**Actor:** MA with `grades.write`  
**Goal:** Record exam and approved overall grades for enrolled students.

The screen must clearly separate `exam_grade` from `final_grade`. Require an exam associated with the same module offering as the enrolment. Show attempt number and current/repeat status to prevent entry against the wrong attempt.

New results begin at `ENTERED`. Populate `entered_by` and `updated_by` from the authenticated MA. Do not allow the browser to submit arbitrary actor IDs.

### MA-09: Update result verification status

**Actor:** MA with `results.status.update`  
**Goal:** record the official result workflow and its history.

Statuses are:

```text
ENTERED
VALIDATED
WITH_DEAN_OFFICE
PUBLISHED
RETURNED
```

Show status as a labelled badge and timeline, never by colour alone. The action panel should show only transitions allowed by backend policy. Require a note for `RETURNED` and any other transition where policy requires explanation.

When an update is submitted, the backend must update `FINAL_RESULTS.status` and insert `RESULT_STATUS_HISTORY` in one transaction. A successful publication should show `published_at`. Students must only see results after `PUBLISHED`.

### MA-10: Upload or associate student documents

**Goal:** add a document reference for a student.

The UI should select a student, document type, and file. The backend/integration owns Google Drive upload and stores the resulting path/file ID. Never ask users to paste service credentials or expose storage secrets.

Display upload progress, failure recovery, document metadata, and uploader/time. Confirm replacement or deletion when those capabilities are later implemented.

### MA-11: Review audit activity

**Goal:** trace important data changes.

Provide filters for date, actor, table/domain, action, and record ID. Translate database table names into readable domain labels where possible. Detailed differences should be human-readable and redact secrets or unnecessary personal data.

Audit history is read-only in the UI.

## 5. Core screen inventory

| Route suggestion | Screen | Primary component pattern |
| --- | --- | --- |
| `/ma` | Overview | Metrics, work queue, recent activity |
| `/ma/users` | User directory | Filterable table |
| `/ma/users/new` | Create user | Sectioned, conditional form |
| `/ma/users/:id` | User details | Profile summary and tabs |
| `/ma/academic/*` | Academic setup | Lists and edit forms |
| `/ma/offerings` | Module offerings | Filterable table/form |
| `/ma/timetable` | Timetable | Week view plus table view |
| `/ma/devices` | Devices | Status table and form |
| `/ma/grades/ica` | ICA grades | Context selector and entry grid |
| `/ma/grades/final` | Final results | Context selector and entry grid |
| `/ma/results` | Result workflow | Status-filtered work queue |
| `/ma/results/:id` | Result details | Summary, actions, timeline |
| `/ma/documents` | Documents | Student search and upload |
| `/ma/audit` | Audit activity | Read-only filterable log |

These are frontend route suggestions. API routes and permission enforcement must be designed independently and securely.

## 6. Form and table behaviour

For every MA data-management page:

- Preserve filters in the URL so pages can be refreshed/shared safely.
- Debounce text search and cancel stale requests.
- Use server pagination for large student, enrolment, attendance, and audit datasets.
- Provide loading skeletons, empty states, and retryable error states.
- Keep a dirty-form warning before navigation.
- Prevent duplicate submissions.
- Show a success message identifying what was saved.
- Refetch affected lists after a mutation rather than assuming client state is authoritative.
- Use optimistic updates only for low-risk reversible actions.

Bulk grade entry and imports must report partial failures per row. Never show “Saved successfully” if some rows failed.

## 7. Visual instructions

Follow the main palette:

- Plum `#5D1C6A`: sidebar, primary buttons, primary headings.
- Cream `#FFF1D3`: page background and selected navigation surfaces.
- Pink `#CA5995`: focus rings, links, active accents.
- Peach `#FFB090`: notification dots, highlights, secondary badges.

Use white/warm-white content cards, subtle plum-tinted borders, `12px`–`16px` radii, and restrained shadows. Data-entry screens should prioritise clarity over decorative graphics.

Status colours may add meaning but must include text:

- Neutral: `ENTERED`
- Informational: `VALIDATED`
- Pending: `WITH_DEAN_OFFICE`
- Success: `PUBLISHED`
- Attention/error: `RETURNED`

Use accessible status colours derived for sufficient contrast; the four brand colours alone are not a complete semantic palette.

## 8. Responsive and accessibility requirements

- Convert the sidebar to a labelled modal drawer on mobile.
- Stack filters and actions below tablet width.
- Keep grade-entry tables horizontally scrollable with the student identity column sticky.
- Use a non-grid mobile alternative when data entry becomes impractical.
- Maintain at least `44px` touch targets.
- Associate every error with its field using `aria-describedby`.
- Move focus to the first invalid field after submission.
- Announce save/error results through an appropriate live region.
- Ensure modals trap focus and restore it to the trigger when closed.
- Require keyboard operation for tables, menus, forms, dialogs, and date/time controls.

## 9. Security and data rules

- Protect all `/ma` routes with authenticated role and permission checks.
- The UI may hide unavailable actions, but the backend is the security boundary.
- Never expose password hashes, JWT secrets, device secrets, or unrestricted audit JSON.
- Obtain actor IDs (`created_by`, `updated_by`, `entered_by`, `granted_by`) from the session on the server.
- Validate relationships, uniqueness, overlaps, grade values, and status transitions on the server.
- Use database transactions for a user plus profile, bulk grade operations, and result status plus history.
- Use CSRF-safe authentication/storage practices when the final auth architecture is selected.
- Log sensitive writes without logging raw passwords or tokens.

## 10. Implementation order

Recommended sequence:

1. Align authentication, `MA` role handling, `/ma` route protection, and V04 entities.
2. Build shared app shell, navigation, route guards, and permission-aware actions.
3. Build MA overview and user directory.
4. Implement MA-managed account creation with role-specific profiles.
5. Implement academic reference data and module offerings.
6. Implement timetable and device management.
7. Implement ICA/final grade entry.
8. Implement result workflow and history.
9. Implement documents and audit views.
10. Add integration tests for permissions and critical workflows.

Do not start high-risk grade or result workflows on top of the current legacy entity model. Align the backend with V04 first.

## 11. Completion checklist

Before an MA screen is considered complete:

- The use case and required permission are identified.
- The page has loading, empty, success, validation, conflict, and server-error states.
- The active academic context is visible throughout the task.
- Mobile layout and keyboard flow are usable.
- Destructive/high-impact actions require confirmation.
- Actor IDs and role are not accepted from browser-controlled fields.
- V04 relationships and integer IDs are respected.
- The backend revalidates permissions and business rules.
- Relevant writes are transactional and auditable.
- Client lint/build and applicable API tests pass.
