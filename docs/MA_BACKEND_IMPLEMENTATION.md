# Management Assistant Backend and Frontend Integration Guide

This guide explains how to implement the Management Assistant (MA) backend for the current UniVerse UOV repository and connect it to the existing React MA interface.

It is based on:

- [`MA_STAFF_UI.md`](./MA_STAFF_UI.md), which defines the MA use cases and UI behaviour.
- [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md), which defines the intended repository architecture.
- The current Express, TypeORM, MySQL, React, and Vite code in this repository.
- The V04 database concepts named in the project documentation.

> **Schema prerequisite:** The documentation identifies `UniVerse_UOV_V04.sql` as the authoritative database design, but that SQL file is not currently committed to this repository. Table names and relationships in this guide follow the V04 descriptions in the docs. Before implementing an entity or query, compare every table and column name, type, nullability rule, foreign key, unique constraint, and status value against the actual V04 SQL file. Do not guess missing columns or alter the V04 database to match the current transitional entities.

## 1. Current state and required corrections

The project currently has a working skeleton rather than an MA backend:

- `apps/server/src/app.js` exposes only `/health` and `/api/users`.
- `apps/server/src/routes/user.routes.js` exposes login only.
- `apps/server/src/services/user.service.js` signs a JWT using a legacy role stored directly on `users`.
- `apps/server/src/entities/User.js` combines identity and student profile fields and uses string profile IDs.
- `apps/server/src/entities/ManAssistence.js` maps a transitional `man_staff` structure.
- `data-source.js` has `synchronize: true`, which is unsafe for an existing V04 database.
- The client stores a session and token but does not send the token on API requests.
- `ManagementAssistantDashboard.jsx` contains placeholders instead of fetching dashboard data.
- `LoginForm.jsx` uses legacy lowercase roles and old dashboard paths.

Do not expand the legacy entities into the full MA feature. First align authentication and entities with V04.

### Immediate changes before feature work

1. Add the V04 SQL or an approved schema reference to the development workflow.
2. Replace `synchronize: true` with `synchronize: false` and use reviewed migrations for application-owned schema changes.
3. Map V04 `USERS`, `ROLES`, `MA_STAFF`, permissions, and profile tables accurately.
4. Change role handling to V04 codes: `STUDENT`, `LECTURER`, `HOD`, `DEAN`, `MA`, and `ADMIN`.
5. Obtain the role, dashboard path, user state, and effective permissions from the database during login.
6. Add authentication, permission, validation, error, and audit infrastructure before adding MA write routes.

## 2. Target request flow

```text
React MA page
  -> domain API module
  -> fetch wrapper adds Authorization: Bearer <token>
  -> Express /api/ma route
  -> authenticate middleware verifies token and loads active database user
  -> requirePermission middleware checks effective permissions
  -> controller validates HTTP input/output
  -> service enforces business rules and transaction boundaries
  -> TypeORM repositories/query runner
  -> V04 MySQL tables
```

The browser may request an operation, but it must never decide its own role, permissions, or actor ID.

## 3. Recommended server structure

Grow the existing route-controller-service structure by domain:

```text
apps/server/src/
|-- config/
|   `-- env.js
|-- middleware/
|   |-- authenticate.js
|   |-- require-permission.js
|   |-- validate.js
|   |-- not-found.js
|   `-- error-handler.js
|-- entities/
|   |-- User.js
|   |-- Role.js
|   |-- ManagementAssistant.js
|   |-- Permission.js
|   |-- AuditLog.js
|   `-- ...one accurate mapping per required V04 table
|-- migrations/
|-- routes/
|   |-- auth.routes.js
|   |-- ma-dashboard.routes.js
|   |-- ma-users.routes.js
|   |-- ma-lookups.routes.js
|   |-- ma-academic.routes.js
|   |-- ma-offerings.routes.js
|   |-- ma-timetable.routes.js
|   |-- ma-devices.routes.js
|   |-- ma-grades.routes.js
|   |-- ma-results.routes.js
|   |-- ma-documents.routes.js
|   `-- ma-audit.routes.js
|-- controllers/
|-- services/
|-- validators/
|-- utils/
|   |-- api-error.js
|   |-- pagination.js
|   `-- redact-audit.js
|-- app.js
|-- data-source.js
`-- server.js
```

Keep controllers thin. Transactions, conflict detection, workflow transitions, and entity relationships belong in services.

## 4. V04 entity alignment

Create TypeORM `EntitySchema` mappings only after checking the real SQL. Register all used entities in `data-source.js` and define relations using the actual integer primary and foreign keys.

At minimum, the MA implementation will need mappings for these domains:

| Domain | V04 concepts described by the project docs |
| --- | --- |
| Identity | `USERS`, `ROLES`, role/profile tables |
| MA profile | `MA_STAFF` |
| Authorization | permissions, role defaults, user overrides |
| User profiles | `STUDENTS`, `LECTURERS`, `DEANS`, `ADMINISTRATORS` and any HOD assignment table |
| Academic setup | departments, programmes, batches, calendar semesters, programme semesters, modules, halls |
| Teaching | module offerings, timetable slots |
| Devices | fingerprint devices |
| Grades | enrolments, ICA definitions/grades, exams, `GRADE_SCALE`, final results |
| Workflow | `FINAL_RESULTS`, `RESULT_STATUS_HISTORY` |
| Documents | student document metadata/reference |
| Auditing | `AUDIT_LOG` |

### Entity rules

- Map V04 integer IDs as integers; remove legacy UUID validation.
- Match database table and column names explicitly with `tableName` and `name` where JavaScript uses camelCase.
- Set sensitive columns such as `password_hash` and raw secret references to `select: false` where practical.
- Preserve database unique constraints and foreign keys in the mapping.
- Do not return TypeORM entities directly from controllers. Map them to safe response DTOs.
- Do not model a role as an arbitrary browser-supplied string if V04 stores a role foreign key.
- Rename `ManAssistence.js` to a correctly spelled `ManagementAssistant.js` when replacing the transitional mapping.

### Data source configuration

Use environment-driven configuration and disable automatic schema mutation:

```js
export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  migrationsRun: false,
  entities: [/* verified V04 entity schemas */],
  migrations: ["src/migrations/*.js"],
});
```

Fail startup when production secrets are absent. Do not keep the current fallback JWT secret outside local development.

## 5. Authentication and authorization

### Login response

Change login to join `USERS` to `ROLES` and the appropriate profile. Return a safe session contract:

```json
{
  "token": "<access-token>",
  "user": {
    "id": 42,
    "email": "ma@vau.ac.lk",
    "fullName": "A. Perera",
    "role": "MA",
    "dashboardPath": "/ma",
    "officeName": "Faculty office",
    "permissions": [
      "users.create",
      "grades.write",
      "results.status.update",
      "results.status.view",
      "timetable.write",
      "devices.write"
    ]
  }
}
```

The JWT should contain only stable identity claims such as `sub` and a short expiry. On protected requests, load the current active user and effective permissions from the database. This prevents a revoked permission or deactivated account from remaining authorized until a long-lived token expires.

### Authentication middleware

`authenticate` must:

1. Read `Authorization: Bearer <token>`.
2. Verify the token with the configured secret and allowed algorithm.
3. parse `sub` as the expected V04 integer ID.
4. Load the user, role, and effective permissions from the database.
5. Reject missing, expired, invalid, or inactive users with `401`.
6. Attach a server-owned identity such as `req.auth = { userId, roleCode, permissions }`.

### Authorization middleware

Use a permission check on every protected operation:

```js
router.post(
  "/users",
  authenticate,
  requireRole("MA"),
  requirePermission("users.create"),
  validate(createUserSchema),
  createUser,
);
```

Apply `authenticate` and `requireRole("MA")` to the entire `/api/ma` router, then apply fine-grained permissions per endpoint. The UI may hide a button based on returned permissions, but the server check remains mandatory.

### Token storage note

The current client stores the JWT in Web Storage. This is simple for the first integration but makes a successful XSS attack able to read it. The preferred final design is a secure, `HttpOnly`, `SameSite` cookie plus appropriate CSRF protection. If Bearer tokens remain temporarily, keep expiry short, avoid unsafe HTML rendering, clear both storage locations on logout, and never log tokens.

## 6. Common API conventions

Use `/api/ma` as the protected MA namespace and `/api/auth/login` for authentication. During migration, `/api/users/login` may remain as a temporary alias.

### Success and error shapes

Use consistent JSON:

```json
{ "data": {}, "meta": {} }
```

```json
{
  "error": {
    "code": "TIMETABLE_CONFLICT",
    "message": "The hall is already booked for this time.",
    "fields": { "hallId": "Conflicts with ICT 301, Monday 09:00-11:00." },
    "details": []
  }
}
```

Recommended status codes:

| Status | Use |
| --- | --- |
| `200` | Successful read or update |
| `201` | Resource created |
| `204` | Successful operation with no body |
| `400` | Malformed input |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not permitted |
| `404` | Resource not found or not visible to actor |
| `409` | Unique, relationship, state-transition, or schedule conflict |
| `422` | Field/business validation failure |
| `500` | Unexpected server error with no sensitive details |

### Pagination and filtering

Use server pagination for user, enrolment, result, and audit lists:

```text
GET /api/ma/users?q=perera&role=STUDENT&active=true&page=1&pageSize=25&sort=fullName
```

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 25, "total": 0, "totalPages": 0 }
}
```

Whitelist sort keys, cap `pageSize`, parameterize queries, and escape wildcard search input as required by the chosen query approach.

## 7. Endpoint plan

Exact field names must be finalized from V04, but the resource boundaries can be implemented as follows.

### Dashboard

| Method and route | Permission | Purpose |
| --- | --- | --- |
| `GET /api/ma/dashboard` | authenticated `MA` | Metrics, work queue, recent safe audit activity |

Suggested response:

```json
{
  "data": {
    "profile": { "fullName": "A. Perera", "officeName": "Faculty office" },
    "summary": {
      "activeUsers": 1248,
      "todayLectureSessions": 18,
      "resultsAwaitingAction": 32,
      "operationalIssues": 3
    },
    "workQueue": [
      {
        "id": "result-returned-91",
        "type": "RESULT_RETURNED",
        "title": "ICT 302 results require correction",
        "detail": "Returned with a verification note",
        "href": "/ma/results/91",
        "priority": "high"
      }
    ],
    "recentActivity": [
      {
        "id": 101,
        "action": "Updated final result status",
        "subject": "ICT 302",
        "occurredAt": "2026-09-28T08:45:00.000Z"
      }
    ],
    "generatedAt": "2026-09-28T09:00:00.000Z"
  }
}
```

Calculate counts on the server in a consistent transaction/read snapshot where useful. Define “operational issues” precisely—for example, unresolved timetable conflicts plus inactive/unassigned devices—and document that definition in the service. Redact raw audit JSON.

### Users and lookups

| Method and route | Permission | Purpose |
| --- | --- | --- |
| `GET /api/ma/users` | policy-defined view permission | Search/filter/paginate users |
| `GET /api/ma/users/:id` | policy-defined view permission | Safe user/profile details |
| `POST /api/ma/users` | `users.create` | Create user and role profile atomically |
| `GET /api/ma/lookups/roles` | authenticated `MA` | Allowed account types |
| `GET /api/ma/lookups/departments` | authenticated `MA` | Department options |
| `GET /api/ma/lookups/programmes` | authenticated `MA` | Programme options |
| `GET /api/ma/lookups/batches` | authenticated `MA` | Batch options |
| `GET /api/ma/lookups/grade-scale` | `grades.write` | Database grade options |

Do not add edit, deactivate, reset-password, or delete routes until their permissions and policies are explicitly defined.

For account creation, accept common fields plus a role-specific `profile` object. Do not accept `createdBy`:

```json
{
  "fullName": "Student Name",
  "email": "student@vau.ac.lk",
  "phone": "+94...",
  "roleCode": "STUDENT",
  "profile": {
    "registrationNumber": "2026ICT001",
    "batchId": 8,
    "programmeId": 3,
    "programmeStartDate": "2026-01-15"
  }
}
```

The service must validate the role against account types the authenticated MA may create, generate a temporary credential securely, hash it with bcrypt, set `created_by` from `req.auth.userId`, and create both identity and profile in one transaction. Return the credential-delivery outcome, not `password_hash`.

### Academic setup and offerings

Provide CRUD routes only for V04 resources that policy permits:

```text
/api/ma/departments
/api/ma/programmes
/api/ma/batches
/api/ma/calendar-semesters
/api/ma/programme-semesters
/api/ma/modules
/api/ma/halls
/api/ma/offerings
```

Reads should return friendly labels/codes and stable integer IDs. Writes must reject invalid foreign keys and translate database constraint failures into field-level `409` responses. Offering creation must check the V04 uniqueness rule before insertion and still handle a database unique-constraint race.

### Timetable

| Method and route | Permission | Purpose |
| --- | --- | --- |
| `GET /api/ma/timetable-slots` | policy-defined view permission | Filtered week/table data |
| `POST /api/ma/timetable-slots/check-conflicts` | `timetable.write` | Optional pre-submit conflict preview |
| `POST /api/ma/timetable-slots` | `timetable.write` | Create recurring slot |
| `PATCH /api/ma/timetable-slots/:id` | `timetable.write` | Update without silent replacement |

Server validation must enforce day `1` through `7`, `endTime > startTime`, and `effectiveUntil >= effectiveFrom`. Check both hall and lecturer overlap over intersecting effective-date ranges. Run the final conflict check and insert/update in a transaction with suitable locking or database constraints to reduce race conditions.

Conceptually, a slot conflicts when:

```text
same day
AND time ranges overlap: existing.start < requested.end AND existing.end > requested.start
AND effective date ranges overlap
AND (same hall OR same offering lecturer)
AND existing slot is active
```

Return the clashing module, lecturer/hall, day, and time in a safe `409 TIMETABLE_CONFLICT` response.

### Fingerprint devices

| Method and route | Permission | Purpose |
| --- | --- | --- |
| `GET /api/ma/devices` | policy-defined view permission | Device status list |
| `POST /api/ma/devices` | `devices.write` | Register a device |
| `PATCH /api/ma/devices/:id` | `devices.write` | Change hall/status |

Enforce one device per hall with a database unique constraint and service validation. Never return raw device secrets. Return only a boolean such as `secretConfigured`. Set `updated_by` from the authenticated identity.

### ICA and final grades

| Method and route | Permission | Purpose |
| --- | --- | --- |
| `GET /api/ma/offerings/:id/enrolments` | `grades.write` | Valid grade-entry rows |
| `GET /api/ma/offerings/:id/icas` | `grades.write` | ICA definitions |
| `POST /api/ma/offerings/:id/icas` | `grades.write` | Create ICA definition |
| `PUT /api/ma/icas/:id/grades` | `grades.write` | Transactional bulk ICA grades |
| `GET /api/ma/offerings/:id/exams` | `grades.write` | Exams for offering |
| `PUT /api/ma/exams/:id/final-results` | `grades.write` | Transactional bulk final results |

Load only enrolments valid for the selected offering. Grade values must exist in V04 `GRADE_SCALE`; never rely on the client list. Verify that an exam belongs to the same module offering as every target enrolment. New final results begin as `ENTERED`, and `entered_by`/`updated_by` come from `req.auth.userId`.

For bulk entry, choose and document one transaction policy:

- **All-or-nothing:** reject all rows if any row fails. This is simplest for consistency.
- **Per-row savepoints:** commit valid rows and return a result for every row. This supports the UI requirement for partial outcomes but is more complex.

Never return a general success message if any row failed. A useful contract is:

```json
{
  "data": {
    "saved": 23,
    "failed": 1,
    "rows": [
      { "enrolmentId": 501, "status": "saved" },
      { "enrolmentId": 502, "status": "failed", "code": "INVALID_GRADE", "message": "Unknown grade code." }
    ]
  }
}
```

### Result workflow

| Method and route | Permission | Purpose |
| --- | --- | --- |
| `GET /api/ma/results` | `results.status.view` | Status-filtered work queue |
| `GET /api/ma/results/:id` | `results.status.view` | Result, allowed actions, timeline |
| `POST /api/ma/results/:id/transitions` | `results.status.update` | Apply one allowed transition |

Centralize the transition rules in the backend. Do not let the client set an arbitrary status with a general update endpoint. V04 statuses described by the UI specification are:

```text
ENTERED -> VALIDATED -> WITH_DEAN_OFFICE -> PUBLISHED
                    \-> RETURNED
```

The exact permitted source/target combinations and actors must be confirmed with project policy. Require a note for `RETURNED`. In one transaction:

1. Lock/read the current final-result row.
2. Validate the requested transition against its current status and the actor's permission.
3. Update `FINAL_RESULTS.status` and timestamps such as `published_at` where applicable.
4. Insert `RESULT_STATUS_HISTORY` with actor, previous status, new status, note, and timestamp.
5. Add an audit record if V04 does not already create one automatically.

Return the updated result, timeline, and newly allowed actions. Student endpoints must filter out every result that is not `PUBLISHED`.

### Documents and audit

| Method and route | Permission | Purpose |
| --- | --- | --- |
| `POST /api/ma/students/:id/documents` | policy-defined document permission | Upload and associate document |
| `GET /api/ma/audit` | policy-defined audit view permission | Filtered, redacted activity |

Use `multipart/form-data` for document upload. Validate file type and size, stream it to the storage integration, then store only the approved file ID/path and metadata. If database insertion fails after upload, attempt storage cleanup and record an operational error. Never accept or expose service-account credentials.

Audit responses should translate internal tables/actions into readable labels and redact password hashes, tokens, device secrets, and unnecessary personal data.

## 8. Transaction and audit boundaries

Use `AppDataSource.transaction` or a TypeORM `QueryRunner` for these operations:

| Operation | Atomic work |
| --- | --- |
| Create user | user + correct role profile + credential state + audit |
| Create/update offering | relationship checks + offering write + audit |
| Create/update timetable slot | locked conflict check + slot write + audit |
| Bulk grade entry | validated grade writes + actor metadata + audit/summary |
| Enter final results | results + initial status/history where V04 requires it |
| Transition result | status update + history + publication timestamp + audit |
| Associate document | metadata write + audit; coordinate external upload cleanup |

Pass `req.auth.userId` into the service as a separate trusted argument. Remove any `createdBy`, `updatedBy`, `enteredBy`, or `grantedBy` keys from request schemas so they cannot accidentally flow into persistence.

## 9. Validation design

Update `packages/shared-validation` for V04 and split schemas by operation. Shared schemas are useful for immediate UX feedback, but the server remains authoritative.

Examples:

- Use `z.coerce.number().int().positive()` for V04 IDs received in URL/query input.
- Use a discriminated union on uppercase `roleCode` for create-user profiles.
- Validate dates as `YYYY-MM-DD` and times in the API's documented format.
- Reject unknown keys with strict object schemas for writes.
- Validate pagination, filters, and sort enums.
- Keep permission, database existence, uniqueness, relationship, overlap, and transition validation in server services.

Avoid exposing raw MySQL errors. Convert duplicate keys, foreign-key failures, and business conflicts to stable API error codes.

## 10. Connect the existing React frontend

### Step 1: use environment configuration

Create `apps/client/.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:4000/api
```

Read `import.meta.env.VITE_API_BASE_URL` rather than hard-coding port `4000` in every API file.

### Step 2: centralize session access

Move storage handling out of pages into an auth module. It should:

- Read the selected storage safely.
- Return the token and user.
- Clear both local and session storage on logout or `401`.
- Expose `hasPermission(permission)` for rendering actions.
- Verify `user.role === "MA"` before rendering `/ma` routes.

The route guard is a UX control only; server middleware is the security boundary.

### Step 3: add a shared API client

Create `apps/client/src/api/client.js`:

```js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export async function apiRequest(path, options = {}) {
  const session = readSession();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (response.status === 401) {
    clearSession();
    window.location.assign("/");
    throw new Error("Your session has expired.");
  }

  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Request failed.");
    error.code = payload?.error?.code;
    error.fields = payload?.error?.fields || {};
    error.status = response.status;
    throw error;
  }

  return payload;
}
```

Import `readSession` and `clearSession` from the central auth module rather than duplicating them.

### Step 4: create domain API modules

Example `apps/client/src/api/ma-dashboard.js`:

```js
import { apiRequest } from "./client";

export async function getMaDashboard({ signal } = {}) {
  const response = await apiRequest("/ma/dashboard", { signal });
  return response.data;
}
```

Add equivalent modules for users, lookups, academic setup, timetable, devices, grades, results, documents, and audit. Components should not construct URLs or authentication headers.

### Step 5: wire `ManagementAssistantDashboard.jsx`

Replace `summaryCards` values, `queueItems`, and the empty activity state with server state:

```js
const [dashboard, setDashboard] = useState(null);
const [status, setStatus] = useState("loading");
const [error, setError] = useState("");

useEffect(() => {
  const controller = new AbortController();

  getMaDashboard({ signal: controller.signal })
    .then((data) => {
      setDashboard(data);
      setStatus("success");
    })
    .catch((requestError) => {
      if (requestError.name !== "AbortError") {
        setError(requestError.message);
        setStatus("error");
      }
    });

  return () => controller.abort();
}, []);
```

Then map server keys deliberately:

| Dashboard card | API field |
| --- | --- |
| Active users | `summary.activeUsers` |
| Lecture sessions | `summary.todayLectureSessions` |
| Results awaiting action | `summary.resultsAwaitingAction` |
| Operational issues | `summary.operationalIssues` |

Use `profile.fullName` and `profile.officeName` from the server response rather than treating editable browser storage as authoritative display data. Render:

- Skeletons while loading.
- A retry action on request failure.
- A real empty state only when a successful response has empty arrays.
- Queue links only from an allowed/validated server response or construct them from known type and integer ID.
- Recent activity with locale-formatted timestamps.

### Step 6: update login routing

Remove the legacy `dashboardByRole` values from `LoginForm.jsx`. Prefer the database-derived `session.user.dashboardPath`, while allowing only known internal paths:

```js
const allowedDashboardPaths = new Set([
  "/student", "/lecturer", "/hod", "/dean", "/ma", "/admin",
]);

const destination = session.user.dashboardPath;
if (!allowedDashboardPaths.has(destination)) {
  throw new Error("Your account dashboard is not configured.");
}
window.location.assign(destination);
```

This prevents an unsafe external redirect while respecting V04 `ROLES.dashboard_path`.

### Step 7: add routing and protected layouts

The current `App.jsx` renders the same dashboard for every path starting with `/ma`. Add a central router before building detail pages. Define the routes listed in `MA_STAFF_UI.md` and wrap them in an MA role guard and shared application shell.

If adding a routing dependency is not currently desired, implement a small exact-path switch temporarily, but do not continue using `startsWith("/ma")` once multiple pages exist.

### Step 8: permission-aware controls

Show actions only when the session includes the required permission:

```jsx
{hasPermission("users.create") && (
  <a className="ma-button ma-button-primary" href="/ma/users/new">
    Create user
  </a>
)}
```

Still handle `403` responses because permissions can change after login.

## 11. CORS and HTTP setup

The current manual CORS middleware permits only `Content-Type` and only `GET,POST,OPTIONS`. It will block Bearer authentication and future `PATCH`, `PUT`, and `DELETE` requests.

Update it to allow at least:

```text
Headers: Content-Type, Authorization
Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

Read allowed origins from configuration. If authentication moves to cookies, enable credentials for explicit trusted origins and never combine credentials with wildcard origins.

Also add:

- A JSON body size limit.
- A separate safe upload limit for documents.
- Central not-found and error middleware after routes.
- Security headers (for example through a reviewed middleware package).
- Rate limiting for login and other abuse-sensitive endpoints.
- Request correlation IDs without logging secrets.

## 12. Implementation sequence

Build and verify vertical slices in this order:

### Phase 1: foundation

1. Obtain and verify the V04 SQL.
2. Replace legacy `User` and MA mappings with accurate V04 entities.
3. Disable TypeORM synchronization.
4. Implement login, active-user loading, uppercase roles, dashboard path, and effective permissions.
5. Implement standard errors, validation, authentication, authorization, and tests.
6. Update the client login redirect and authenticated API wrapper.

### Phase 2: first visible integration

1. Implement `GET /api/ma/dashboard`.
2. Connect `ManagementAssistantDashboard.jsx`.
3. Add loading, retry, empty, and unauthorized states.
4. Verify an MA can load it and a non-MA receives `403`.

### Phase 3: users

1. Implement lookup endpoints.
2. Implement paginated user search/details.
3. Implement transactional, role-specific account creation.
4. Build `/ma/users`, `/ma/users/new`, and `/ma/users/:id`.

### Phase 4: academic operations

1. Academic reference data.
2. Module offerings.
3. Timetable with server conflict detection.
4. Fingerprint devices with one-device-per-hall enforcement.

### Phase 5: high-risk academic records

1. Database-driven grade scale and valid enrolment selection.
2. ICA definitions and bulk grade entry.
3. Exams and final results.
4. Result status transitions and history.
5. Tests for transactions, permissions, invalid transitions, and concurrent conflicts.

### Phase 6: integrations and oversight

1. Student document upload/storage integration.
2. Redacted audit activity.
3. Full responsive, accessibility, security, and performance review.

## 13. Testing strategy

Add a server test command and use a separate test database that mirrors V04 constraints.

### Unit tests

- Zod request schemas.
- Effective-permission calculation.
- Result transition policy.
- Timetable range-overlap logic.
- Safe DTO and audit redaction functions.

### API integration tests

- Missing/invalid/expired token returns `401`.
- Active non-MA user cannot access `/api/ma`.
- MA without a required permission receives `403`.
- Actor IDs in request bodies are rejected or ignored and never persisted.
- User plus profile rolls back on any failure.
- Duplicate email/registration/staff number produces `409`.
- Timetable hall and lecturer conflicts produce useful `409` details.
- Invalid grade codes and mismatched offering/exam/enrolment are rejected.
- Result update and history insert commit or roll back together.
- `RETURNED` without a note is rejected.
- Student result endpoints never expose non-`PUBLISHED` results.
- Sensitive entity columns and raw audit values never appear in JSON.

### Client tests/checks

- Login follows only an allowed database dashboard path.
- API requests send authentication and handle `401`/`403`.
- Dashboard shows loading, data, empty, retry, and error states.
- Permission-controlled actions are hidden when unavailable.
- Forms map field errors and prevent duplicate submission.
- Stale searches are aborted.
- Client lint and production build pass.

### Manual database checks

- Foreign keys and unique constraints match V04.
- TypeORM never attempts unintended schema changes.
- Each sensitive write records the real authenticated actor.
- Transaction rollbacks leave no orphan profiles, history, or grade records.

## 14. Definition of done for each MA feature

A feature is complete only when:

- Its V04 tables and constraints have been verified.
- The endpoint requires authentication, the `MA` role, and the appropriate permission.
- Browser-controlled actor or role values are not trusted.
- Request and response contracts are validated and contain no secrets.
- Business rules are enforced in the service and database, not only in React.
- Required writes are transactional and audited.
- The React page has loading, empty, validation, success, conflict, retry, and server-error behaviour as applicable.
- Filters and pagination are server-driven where the dataset can grow.
- Keyboard and mobile use meet the UI specification.
- Server tests, client lint, and client production build pass.

## 15. First implementation milestone

The safest first milestone is:

```text
V04 USERS/ROLES/MA_STAFF/permissions mappings
  -> corrected login response
  -> authenticate + requireRole("MA")
  -> GET /api/ma/dashboard
  -> shared client API wrapper
  -> live ManagementAssistantDashboard
```

Completing this slice proves the identity model, permissions, database connection, API conventions, and frontend integration before the project begins high-risk grade and result workflows.
