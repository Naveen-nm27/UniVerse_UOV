# Codex prompt: Build the Head of Department dashboard UI

Implement a working Head of Department (HOD) dashboard in the existing React application. This is a **frontend-only** task. Build the screens, interactions and authenticated API integration where endpoints exist; do not create backend routes, change result rules or update the database. Inspect the current application first and reuse its routing, session handling and shared visual components. Preserve unrelated work.

The authenticated role is `HOD` and its dashboard route is `/hod`. A HOD reviews records and reports for their **assigned department**, not for every department. The backend determines their department and allowed actions. The browser must not treat an editable department ID, role value or visible button as authority.

## Required use cases

1. **Verify results:** review result submissions routed to the HOD, inspect the necessary course/semester context and student result completeness, then perform only verification actions returned as allowed by the API.
2. **Approve or reject reports:** review reports submitted for HOD decision, approve or reject with the required note/reason, and see the outcome clearly. Keep this workflow separate from result verification.
3. **View verification history:** find previous decisions, see who acted, when, what changed and any permitted reason or comment.

Do not add grade-entry fields. Management Assistants enter grades; the HOD reviews according to the approved workflow. Do not provide a direct “Publish results” action unless the backend explicitly authorises that transition for this HOD.

## Layout and visual direction

Make the workspace match the university's existing administration interface: persistent left sidebar on desktop, accessible drawer on mobile, compact top bar with page title and signed-in HOD identity, and warm-white cards on a light/cream content surface. Use the established palette: plum `#5D1C6A`, cream `#FFF1D3`, pink `#CA5995`, peach `#FFB090` and dark ink text. Keep spacing generous and tables easy to scan. Use subtle borders/shadows, not decorative gradients or distracting animation. Statuses must have text labels; colour is supplementary.

Sidebar order: **Overview**, **Verify results**, **Report approvals**, **Verification history**. Show the assigned department name in the shell when returned by the API. If a HOD also teaches, keep lecturer features separate or link to the authorised lecturer workspace; do not mix lecturer class data into HOD decision queues.

## Screens and interactions

### 1. Overview (`/hod`)

Show a focused work queue: results awaiting HOD verification, reports awaiting approval, recently returned/rejected items and recent decisions. Summary cards must state their timeframe and link to filtered lists. Show the HOD's department and a last-updated timestamp. Use live server counts; no hard-coded example numbers. If nothing is pending, show a genuine clear-queue state rather than an empty panel.

### 2. Verify results (`/hod/results`)

Provide a searchable, server-paginated queue of result submissions assigned to this HOD's department. Filters should include status, programme, module/offering, batch and calendar semester where supported. Each row should show module code/title, teaching semester, batch/programme, number of enrolled/result rows, submission date, current status and the latest actor or action. Make the selected academic context impossible to miss.

Open one submission at `/hod/results/:submissionId`. Show a review summary and a student-result table containing only fields the HOD is permitted to see: registration number/name, enrolment or attempt number, ICA/exam/final grade if authorised, missing-grade flags, repeat/resit indicator and result status. Distinguish missing data from a real zero or fail grade. Provide summary checks such as missing rows, duplicate attempts, invalid/incomplete entries or unpublished status only when the API supplies verified checks. Include a link to the decision/history timeline.

Show action buttons based solely on the API's `allowedActions` (or equivalent): for example **Verify**, **Return for correction**, or another approved transition. Do not hard-code a status sequence or let the UI submit arbitrary target status strings. Require a reason whenever the server marks it mandatory; show a review/confirmation dialog with the module, batch, semester, action and note before submitting. Disable duplicate submission, handle conflict if another staff member acts first, then refetch the record and queue. If the API only supports per-result verification, make that granularity explicit; if it supports an offering-level decision, show the affected record count and any partial-failure response. Never display “Verified” unless the server confirms success.

### 3. Approve or reject reports (`/hod/reports`)

Use a separate queue for reports routed to the HOD. Do not assume that a “report” is the same object as a final result. Show the report title/type, submitting person or office, department, covered period, submitted date, current status and due date if supplied. Provide filters for pending/approved/rejected, report type and date range, with server pagination.

At `/hod/reports/:reportId`, show report metadata, safe preview or authenticated download if available, supporting information and any prior comments/decisions. Present **Approve** and **Reject** only when returned as permitted actions. Reject must require an explanation; approval requires a note only if policy says so. Show a confirmation summary before submitting. On success, refetch the report and its timeline. On `409` or another stale-state error, explain that the report changed and refresh before allowing another decision. Never approve an unseen report automatically or simulate approval in client state.

### 4. Verification history (`/hod/history`)

Provide a read-only, server-paginated timeline/table of this department's authorised result-verification and report-approval events. Include date/time, item type, module/report title, programme/batch where relevant, previous status, new status, actor and permitted note/reason. Support filters for item type, action/outcome, actor, date range and academic semester where the API allows them. Keep result and report events distinguishable. Link each event to its authorised detail view; if the underlying item is no longer accessible, show a safe unavailable state.

History must reflect persisted server events, not local UI state. Do not offer edit/delete controls for history. Redact raw audit payloads, credentials, private notes and student data that the HOD is not entitled to see.

## Shared data and access rules

- Protect `/hod` routes with the server-confirmed `HOD` role and active session. Route successful HOD login to `/hod` using the application's approved internal destination logic. A route guard improves navigation, but every API request still relies on backend authorisation.
- Use the existing shared authenticated API client, configured base URL and session mechanism. Keep requests outside presentational components. Abort stale searches and detail requests when filters or routes change.
- Do not send a client-chosen `departmentId`, `actorId`, `verifiedBy` or `approvedBy` as proof of scope or identity. The API must derive those from the authenticated HOD and their active department assignment.
- Treat result status labels such as `ENTERED`, `VALIDATED`, `WITH_DEAN_OFFICE`, `PUBLISHED` and `RETURNED` as display data only. The backend decides allowed transitions. Student-facing results remain unavailable until the approved publication step; the HOD UI must not bypass this policy.
- Handle loading, genuine empty, filtered-empty, unavailable integration, permission denied, expired session, network error and concurrent-update states. Display field errors beside the relevant input and offer retry where safe.
- Use semantic headings and landmarks, labelled controls, visible keyboard focus, accessible dialogs, at least 44px touch targets where practical, and responsive tables that scroll within their own region on mobile. Do not communicate a decision or status only through colour.

## Build order and completion check

First inspect the existing login/route setup, staff dashboard shell and result/report API responses. Build the protected HOD shell and overview, then result queue/detail/decision flow, report queue/detail/decision flow, and finally persisted history. If a required endpoint, report definition or permitted HOD transition is missing, implement an honest unavailable state and report the exact missing contract; do not invent workflow rules or expand this task into backend work.

Run client lint and production build plus focused UI tests if available. Manually check an HOD and a non-HOD account, no pending items, result verification with required note, report approval and rejection, stale-state conflict, department-scope denial, history filtering, expired session and a narrow mobile viewport. Finish with a short report of screens built, live integrations, missing API pieces and check results.
