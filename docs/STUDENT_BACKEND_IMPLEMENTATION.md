# Student Backend Implementation and Frontend Integration Guide

This document explains how to implement the Student backend for UniVerse UOV and connect it to the Student UI defined in [`STUDENT_UI.md`](./STUDENT_UI.md).

Read it together with:

- [`README.md`](./README.md) for the shared product and UI rules.
- [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) for repository architecture.
- [`MA_BACKEND_IMPLEMENTATION.md`](./MA_BACKEND_IMPLEMENTATION.md) for common authentication, error, transaction, and API conventions.
- The authoritative `UniVerse_UOV_V04.sql` database design.

> **Schema prerequisite:** The repository documentation names `UniVerse_UOV_V04.sql` as the authoritative schema, but the SQL file is not currently committed here. This guide uses the V04 concepts documented in the project: `USERS`, `ROLES`, `STUDENTS`, programmes, semesters, modules, offerings, enrolments, ICA definitions/grades, exams, `FINAL_RESULTS`, `RESULT_STATUS_HISTORY`, and `GRADE_SCALE`. Verify every exact table/column name, foreign key, status, attempt rule, grade-point rule, and credit rule against the actual SQL and approved academic regulations before writing entities or queries.

## 1. Backend responsibilities

The Student backend must provide read-only access to the authenticated student's permitted academic information and generate protected result summaries.

It is responsible for:

- Resolving the student profile from the authenticated user.
- Enforcing role and effective permissions.
- Enforcing record ownership on every query.
- Returning only `PUBLISHED` final results.
- Returning only assessment marks approved for student release.
- Calculating GPA, CGPA, credit totals, and progress using approved rules.
- Preserving repeat-attempt history and carried-forward ICA provenance.
- Generating protected result-summary downloads.
- Returning safe, stable response DTOs for the React UI.

The frontend must not calculate official GPA/CGPA, decide which attempt counts, infer carried-forward marks, or determine completed credits.

## 2. Current repository gaps

Before implementing Student endpoints, correct these foundational issues:

- `User.js` is a legacy combined user/student model and does not represent normalized V04 identity/profile tables.
- `user.service.js` reads a lowercase role directly from the user record.
- `LoginForm.jsx` expects lowercase `student` and redirects to `/student/dashboard` instead of V04 `STUDENT` and `/student`.
- `data-source.js` uses `synchronize: true`, which is unsafe for a populated V04 database.
- The client does not currently attach its access token to API requests.
- The repository has no Student routes, controllers, services, entities, or pages.
- The shared permissions package is currently a placeholder.
- The shared validation package expects legacy UUID profile IDs.

Complete V04 identity/authentication alignment before relying on Student endpoint security.

## 3. Target request flow

```text
Student React page
  -> student API module
  -> authenticated API client
  -> /api/student route
  -> authenticate middleware
  -> requireRole("STUDENT")
  -> optional requirePermission(...)
  -> controller validates request/query/path
  -> student service resolves authenticated student profile
  -> query/aggregation service reads owned, released records
  -> response mapper creates a safe DTO
  -> React renders server-owned academic values
```

Do not accept a `studentId` or registration number from a Student route. The server derives the student from `req.auth.userId`.

## 4. Recommended server structure

```text
apps/server/src/
|-- middleware/
|   |-- authenticate.js
|   |-- require-role.js
|   |-- require-permission.js
|   |-- validate.js
|   `-- error-handler.js
|-- entities/
|   |-- User.js
|   |-- Role.js
|   |-- Student.js
|   |-- Programme.js
|   |-- CalendarSemester.js
|   |-- Module.js
|   |-- ModuleOffering.js
|   |-- Enrolment.js
|   |-- IcaDefinition.js
|   |-- IcaGrade.js
|   |-- Exam.js
|   |-- FinalResult.js
|   |-- ResultStatusHistory.js
|   |-- GradeScale.js
|   `-- ResultSummary.js             # only if V04/application schema supports it
|-- routes/
|   |-- auth.routes.js
|   `-- student.routes.js
|-- controllers/
|   `-- student.controller.js
|-- services/
|   |-- student-context.service.js
|   |-- student-dashboard.service.js
|   |-- student-results.service.js
|   |-- student-assessments.service.js
|   |-- student-progress.service.js
|   |-- student-credits.service.js
|   `-- student-result-summary.service.js
|-- validators/
|   `-- student.validators.js
|-- mappers/
|   |-- student-result.mapper.js
|   `-- student-assessment.mapper.js
|-- policies/
|   |-- academic-calculation.policy.js
|   `-- assessment-release.policy.js
|-- utils/
|   |-- api-error.js
|   |-- pagination.js
|   `-- decimal.js
|-- app.js
`-- data-source.js
```

The entity list is conceptual until V04 is verified. Do not create duplicate tables merely because a suggested class name appears here.

## 5. Database mapping requirements

### Core relationships

The implementation must confirm and map these relationships from V04:

```text
USERS -> ROLES
USERS -> STUDENTS
STUDENTS -> PROGRAMMES / BATCHES
STUDENTS -> ENROLMENTS
ENROLMENTS -> MODULE_OFFERINGS
MODULE_OFFERINGS -> MODULES
MODULE_OFFERINGS -> CALENDAR_SEMESTERS
ENROLMENTS -> ICA_GRADES -> ICA_DEFINITIONS
MODULE_OFFERINGS -> EXAMS
ENROLMENTS / EXAMS -> FINAL_RESULTS
FINAL_RESULTS -> RESULT_STATUS_HISTORY
FINAL_RESULTS / GRADE_SCALE -> grade point and outcome rules
```

Confirm how V04 models:

- Programme credit requirements.
- Attempt numbers and current/repeat flags.
- The association between attempts and enrolments.
- ICA carry-forward source and destination records.
- Assessment release visibility.
- Whether raw marks or only grades may be shown to students.
- Whether GPA/CGPA is stored, exposed through a view, or must be calculated.
- Which repeat grade counts toward GPA.
- Whether failed attempts remain in cumulative calculations.
- Official result-summary metadata/files.

If the schema does not explicitly represent a rule, obtain an approved academic policy before implementing it. Do not infer policy from sample rows.

### Entity mapping rules

- Set `synchronize: false` in `data-source.js`.
- Use reviewed migrations only for application-owned additions.
- Match V04 integer IDs and database names explicitly.
- Keep `password_hash`, device secrets, internal notes, and restricted audit values out of default selections.
- Map numeric marks, credits, and grade points using types that avoid floating-point errors.
- Convert MySQL `DECIMAL` values intentionally; do not rely on accidental string-to-number conversion.
- Keep database uniqueness and foreign-key constraints intact.
- Never serialize TypeORM entities directly to a Student response.

## 6. Authentication, student context, and permissions

### Authentication contract

The corrected login response should contain the V04 role code and route:

```json
{
  "token": "<access-token>",
  "user": {
    "id": 17,
    "email": "student@vau.ac.lk",
    "fullName": "Student Name",
    "role": "STUDENT",
    "dashboardPath": "/student",
    "permissions": [
      "student.results.view",
      "student.assessments.view",
      "student.progress.view",
      "student.results.download"
    ]
  }
}
```

The permission strings above are proposed application names. Replace them with the exact permission codes present in V04. If V04 grants Student read access exclusively by role rather than individual permission records, keep `requireRole("STUDENT")` as the route boundary and document that decision. Do not invent database permission rows without reviewing the authorization model.

### Student context service

Create one shared function that resolves the current student:

```js
export async function requireStudentContext(auth, manager = AppDataSource.manager) {
  const student = await manager.getRepository(Student).findOne({
    where: { userId: auth.userId },
    relations: { programme: true, batch: true },
  });

  if (!student) {
    throw new ApiError(403, "STUDENT_PROFILE_REQUIRED", "A student profile is required.");
  }

  return student;
}
```

Adapt the fields and relations to V04. Call this service for every Student request. Never use a client-provided student profile ID as a replacement.

### Router boundary

```js
const router = Router();

router.use(authenticate);
router.use(requireRole("STUDENT"));

router.get("/dashboard", requirePermissionIfConfigured("student.progress.view"), getDashboard);
router.get("/results", requirePermissionIfConfigured("student.results.view"), listResults);
router.get("/results/:resultId", requirePermissionIfConfigured("student.results.view"), getResult);
router.get("/assessments", requirePermissionIfConfigured("student.assessments.view"), listAssessments);
router.get("/progress", requirePermissionIfConfigured("student.progress.view"), getProgress);
router.get("/credits", requirePermissionIfConfigured("student.progress.view"), getCredits);
router.post("/result-summaries", requirePermissionIfConfigured("student.results.download"), createSummary);
```

Do not implement `requirePermissionIfConfigured` literally unless the project's authorization policy approves optional permissions. Prefer a single explicit strategy after V04 verification.

## 7. Common endpoint rules

Mount the router at `/api/student`:

```js
app.use("/api/student", studentRoutes);
```

Use consistent success and error shapes:

```json
{ "data": {}, "meta": {} }
```

```json
{
  "error": {
    "code": "RESULT_NOT_FOUND",
    "message": "The result could not be found."
  }
}
```

Recommended codes:

| Status | Use |
| --- | --- |
| `200` | Successful read or completed synchronous download generation |
| `201` | Result summary created |
| `202` | Long-running summary generation accepted |
| `400` | Malformed request |
| `401` | Missing, invalid, or expired authentication |
| `403` | Wrong role, missing permission, or missing Student profile |
| `404` | Owned/released record not found; also use for another student's ID |
| `409` | Summary already processing or academic-state conflict |
| `422` | Invalid semester/filter/summary option |
| `500` | Unexpected error without internal details |

Use `404` rather than revealing that a requested result exists for another student or exists but is unpublished.

## 8. Endpoint inventory

| Method and route | Proposed permission | UI consumer |
| --- | --- | --- |
| `GET /api/student/dashboard` | `student.progress.view` | `/student` |
| `GET /api/student/results` | `student.results.view` | `/student/results` |
| `GET /api/student/results/:resultId` | `student.results.view` | `/student/results/:resultId` |
| `GET /api/student/assessments` | `student.assessments.view` | `/student/assessments` |
| `GET /api/student/progress` | `student.progress.view` | `/student/progress` |
| `GET /api/student/credits` | `student.progress.view` | `/student/credits` |
| `GET /api/student/result-summaries` | `student.results.download` | `/student/downloads` |
| `POST /api/student/result-summaries` | `student.results.download` | `/student/downloads` |
| `GET /api/student/result-summaries/:summaryId/download` | `student.results.download` | Protected file download |
| `GET /api/student/profile` | authenticated `STUDENT` | Header and `/student/profile` |

These are Student self-service routes. Staff-facing Student lookup remains under an independently protected MA/Admin namespace.

## 9. Dashboard service

### Endpoint

```text
GET /api/student/dashboard
```

### Service steps

1. Resolve the authenticated Student profile.
2. Load safe profile/programme context.
3. Identify the latest semester with eligible published results.
4. Calculate or retrieve current GPA and CGPA.
5. Calculate completed and required programme credits.
6. Count newly/latest published results using a documented timeframe.
7. Load the latest five published results.
8. Load the latest released assessments.
9. Build notices only from student-visible facts.
10. Return a single dashboard DTO.

Suggested response is defined in `STUDENT_UI.md`. Keep its `summary`, `gpaTrend`, `latestResults`, `recentAssessments`, and `notices` keys stable.

### Query safety

Every dashboard query must include the authenticated Student relationship and publication/release filters. For example, conceptually:

```sql
WHERE enrolment.student_id = :studentId
  AND final_result.status = 'PUBLISHED'
```

Do not load all results and filter ownership or publication status in JavaScript.

### Consistency

The dashboard contains related aggregates. Where inconsistent concurrent publication could be confusing, run its reads in a read-only transaction with a consistent isolation level supported by the project. Return `generatedAt` so the UI can explain when the snapshot was calculated.

## 10. Semester results service

### List results

```text
GET /api/student/results?academicYear=2026&semesterId=5&q=ICT&page=1&pageSize=25
```

Validate and whitelist all query parameters. Prefer stable semester IDs while returning readable labels. If academic year is a database ID rather than a number in V04, use that ID consistently.

Required filters:

- Authenticated Student ownership.
- `FINAL_RESULTS.status = 'PUBLISHED'`.
- Selected calendar/programme semester, if supplied.
- Module code/title search, if supplied.

Return:

- Published result rows.
- Semester summary.
- Available published-semester filter options.
- Pagination metadata if the dataset warrants it.

### Result row DTO

```json
{
  "resultId": 91,
  "module": { "code": "ICT 302", "title": "Software Engineering" },
  "semester": { "id": 5, "label": "2026 - Semester 1" },
  "credits": 3,
  "coursework": { "displayValue": "68", "released": true },
  "examination": { "displayValue": "B", "released": true },
  "finalGrade": "B+",
  "gradePoint": 3.3,
  "attemptNumber": 1,
  "outcomeCode": "PASSED",
  "outcomeLabel": "Passed",
  "creditsEarned": 3,
  "publishedAt": "2026-09-20T07:30:00.000Z"
}
```

Only return coursework/examination fields allowed by policy. Omit restricted mark data rather than sending it with a `hidden` value that can leak information.

### Semester summary

Return server-calculated values:

```json
{
  "semesterGpa": 3.41,
  "attemptedCredits": 18,
  "earnedCredits": 15,
  "modulesPassed": 5,
  "repeatOrIncompleteModules": 1,
  "calculatedThrough": "2026 - Semester 1"
}
```

Use `null` when GPA is not calculable. Never use zero as “not available.”

### Result detail and ownership

```text
GET /api/student/results/:resultId
```

The result-detail query must join through its enrolment to the authenticated Student and require `PUBLISHED`. A lookup by `resultId` followed by a separate JavaScript ownership check is more error-prone and may leak existence through timing/error differences.

Return module, semester, current attempt, released assessments/exam fields, GPA/credit contribution, and published attempt history.

## 11. Assessment service

### Endpoint

```text
GET /api/student/assessments?semesterId=5&moduleOfferingId=12
```

### Selection rules

Return only assessments that:

- Belong to an enrolment owned by the authenticated Student.
- Belong to the selected offering/semester.
- Are explicitly released to students under V04/policy.
- Contain only approved fields.

Determine how release is represented before implementation. Possible designs include a release flag/timestamp on the assessment definition, grade row, offering, or a separate publication record. Do not equate “a mark exists” with “the mark may be displayed.”

### Normalization

Return display-ready academic values while preserving numeric fields when useful:

```json
{
  "assessmentId": 81,
  "title": "ICA 1",
  "typeCode": "ICA",
  "typeLabel": "In-course assessment",
  "obtainedMark": 68,
  "maximumMark": 100,
  "percentage": 68,
  "weightPercentage": 20,
  "weightedContribution": 13.6,
  "grade": null,
  "releasedAt": "2026-08-18T08:30:00.000Z",
  "carriedForward": true,
  "sourceAttempt": {
    "attemptNumber": 1,
    "semesterId": 4,
    "semesterLabel": "2025 - Semester 2"
  }
}
```

Calculate percentage/weighted contribution on the server using decimal-safe arithmetic and approved rounding. Do not return calculated fields if policy has not defined the formula.

### Carry-forward provenance

Only set `carriedForward: true` when V04 stores an explicit relationship or approved flag. Prefer returning the source assessment grade ID internally mapped to safe source-attempt metadata. Never infer carry-forward because two marks match.

Validate that:

- The source belongs to the same Student.
- Source and destination refer to the correct module/equivalence under policy.
- The source assessment is student-visible.
- No staff-only note is exposed.

## 12. GPA and CGPA service

### Endpoint

```text
GET /api/student/progress
```

### Source of truth

Use this priority:

1. An authoritative V04 view/stored calculation defined by the database design.
2. An approved backend calculation module backed by `GRADE_SCALE` and academic policy.
3. Never a React calculation.

### Required policy configuration

Before implementing calculations, document and test:

- Grade code to grade-point mapping.
- Eligible result statuses (`PUBLISHED` for Student display).
- Credit-bearing versus excluded modules.
- Treatment of incomplete, absent, withdrawn, pass/fail, and exempted results.
- Repeat-attempt replacement or averaging rules.
- Whether failed attempts remain in CGPA.
- Module equivalency/substitution rules.
- Rounding method and decimal places.
- The meaning of attempted and earned credits.

Do not scatter these rules across controllers and SQL strings. Centralize them in an academic calculation policy/service.

### Conceptual calculation

Only if approved policy follows ordinary credit weighting:

```text
qualityPoints = gradePoint × creditsCounted
semesterGpa = sum(semester qualityPoints) / sum(semester creditsCounted)
cgpa = sum(all eligible qualityPoints) / sum(all eligible creditsCounted)
```

This formula is illustrative, not authorization to implement it without verifying UOV rules.

### Decimal handling

Avoid binary floating-point accumulation for official calculations. Use one of:

- Exact `DECIMAL` aggregation in MySQL.
- A reviewed decimal arithmetic library on the server.
- Integer-scaled arithmetic if the grade/credit precision makes it valid.

Round only at the policy-defined stage. Do not round each module prematurely unless policy requires it.

### Progress DTO

```json
{
  "data": {
    "latestSemesterGpa": 3.41,
    "latestSemesterLabel": "2026 - Semester 1",
    "cgpa": 3.29,
    "calculatedThrough": "2026 - Semester 1",
    "calculatedAt": "2026-09-28T09:00:00.000Z",
    "trend": [
      { "semesterId": 4, "label": "2025 - Semester 2", "gpa": 3.28 },
      { "semesterId": 5, "label": "2026 - Semester 1", "gpa": 3.41 }
    ],
    "gradeDistribution": [
      { "grade": "A", "count": 2 },
      { "grade": "B+", "count": 4 }
    ],
    "breakdown": []
  }
}
```

If a value is unavailable, return `null` and optionally a stable reason code such as `NO_ELIGIBLE_PUBLISHED_RESULTS`.

### Caching

Only cache GPA/CGPA if invalidation is reliable when results are published, returned, corrected, or superseded. Include the Student ID and calculation-policy version in any cache key. For the initial implementation, correct database reads are preferable to premature caching.

## 13. Credit-tracking service

### Endpoint

```text
GET /api/student/credits
```

### Rules

The service must use verified programme requirements and published result outcomes to determine:

- `requiredCredits`
- `completedCredits`
- `inProgressCredits`
- `remainingCredits`
- Optional requirement categories
- Module-level contribution details

Do not calculate remaining credits as a blind subtraction if programme categories, substitutions, maximum elective credits, exemptions, or repeat rules can change the answer.

### Repeat protection

Group attempts by the V04 module/requirement identity and apply policy so credit is not counted twice. Return attempts for history, but return the authoritative credit contribution separately:

```json
{
  "moduleId": 14,
  "moduleCode": "ICT 302",
  "credits": 3,
  "creditStatus": "COMPLETED",
  "creditsCounted": 3,
  "attemptCount": 2,
  "countedAttemptNumber": 2
}
```

### Credits DTO

```json
{
  "data": {
    "requiredCredits": 120,
    "completedCredits": 72,
    "inProgressCredits": 18,
    "remainingCredits": 48,
    "completionPercentage": 60,
    "groups": [
      { "code": "CORE", "label": "Core", "required": 90, "completed": 60, "inProgress": 12, "remaining": 18 },
      { "code": "ELECTIVE", "label": "Elective", "required": 30, "completed": 12, "inProgress": 6, "remaining": 12 }
    ],
    "modules": []
  }
}
```

If V04 does not model requirement groups, omit `groups`; do not invent them in JavaScript.

## 14. Repeat-attempt history

Repeat history is returned as part of result details rather than through an unrestricted general history endpoint.

### Query rules

- Begin from the selected owned, published result.
- Identify related attempts through the verified V04 enrolment/module-attempt relationship.
- Return only attempts with a `PUBLISHED` student-visible result.
- Order chronologically and mark the currently selected attempt.
- Return server decisions such as `countsTowardGpa`, `creditsCounted`, and `attemptClassification`.
- Join carried-forward assessment sources only through explicit database relationships.

### Attempt DTO

```json
{
  "attemptNumber": 1,
  "semester": { "id": 4, "label": "2025 - Semester 2" },
  "finalGrade": "F",
  "outcomeCode": "NOT_PASSED",
  "countsTowardGpa": false,
  "creditsCounted": 0,
  "classification": "SUPERSEDED",
  "assessments": []
}
```

Never overwrite or collapse attempts in persistence or the response. The UI needs both history and the policy decision explaining which attempt contributes to aggregates.

## 15. Result-summary generation and download

### Endpoints

```text
GET  /api/student/result-summaries
POST /api/student/result-summaries
GET  /api/student/result-summaries/:summaryId/download
```

### Create request

```json
{
  "type": "SEMESTER",
  "semesterId": 5,
  "format": "PDF"
}
```

Allow only approved types and formats. For a cumulative summary, ignore/reject `semesterId` according to a strict schema.

### Generation rules

The service must:

1. Resolve the authenticated Student.
2. Validate the requested summary scope.
3. Query only the Student's `PUBLISHED` results.
4. Reuse the same GPA/credit services used by the UI.
5. Generate a document using a fixed server template.
6. Store it in protected storage or stream it directly.
7. Record owner, type, scope, generation time, expiry, and safe storage reference if persistence is used.
8. Return no public storage URL or secret.

Include a visible label such as `Official`, `Provisional`, or `Unofficial` only according to university policy. Do not imply an official transcript when the feature creates a summary.

### Synchronous option

For small PDFs, `POST` may return the file directly or create a short-lived record and return `201`:

```json
{
  "data": {
    "summaryId": 44,
    "status": "READY",
    "filename": "UOV_Result_Summary_2026_Semester_1.pdf",
    "expiresAt": "2026-09-28T10:00:00.000Z"
  }
}
```

### Asynchronous option

If generation is slow, return `202` with `PROCESSING`, add a status endpoint or expose status through the list endpoint, and let the UI poll with a limited interval. Store failure codes safe for Student display.

### Download security

The download route must:

- Re-authenticate the request.
- Resolve the Student.
- Query `summaryId` and owner together.
- Reject expired/not-ready summaries.
- Stream with an allowlisted content type.
- Set a safe `Content-Disposition` filename.
- Set `Cache-Control: private, no-store` where appropriate.
- Avoid tokens in URLs and avoid permanent public links.
- Return `404` for another Student's summary.

Escape all document text and prevent HTML/template injection. Do not invoke shell commands with Student-controlled values.

## 16. Profile endpoint

```text
GET /api/student/profile
```

Return only safe data needed by the shell/profile UI:

```json
{
  "data": {
    "fullName": "Student Name",
    "email": "student@vau.ac.lk",
    "registrationNumber": "2024ICT001",
    "programme": { "id": 3, "code": "BICT", "name": "BSc in ICT" },
    "batch": { "id": 8, "label": "2024" },
    "programmeStartDate": "2024-01-15",
    "accountStatus": "ACTIVE"
  }
}
```

Do not add profile-editing behavior unless its authorization, validation, and audit policy is defined separately.

## 17. Validation

Create strict Zod schemas for path, query, and body inputs.

Examples:

```js
const positiveId = z.coerce.number().int().positive();

export const resultIdParams = z.object({
  resultId: positiveId,
}).strict();

export const resultQuery = z.object({
  semesterId: positiveId.optional(),
  academicYear: z.coerce.number().int().min(2000).max(2200).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export const createSummaryBody = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SEMESTER"), semesterId: positiveId, format: z.literal("PDF") }).strict(),
  z.object({ type: z.literal("CUMULATIVE"), format: z.literal("PDF") }).strict(),
]);
```

Do not use query validation as ownership validation. Ownership remains part of the database query/service logic.

## 18. Controllers and error handling

Controllers should only translate HTTP input and output:

```js
export async function getResult(req, res, next) {
  try {
    const result = await studentResultsService.getOwnedPublishedResult({
      auth: req.auth,
      resultId: req.validated.params.resultId,
    });

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}
```

Use centralized error middleware. Translate database failures into stable codes without returning SQL, entity metadata, stack traces, or internal policy details.

Log request correlation ID, route, status, and safe actor ID where appropriate. Never log JWTs, passwords, raw mark payloads, full generated documents, or excessive personal data.

## 19. Performance and query design

- Select only response fields; avoid loading complete entity graphs.
- Filter ownership and release/publication state in SQL.
- Use joins or batched queries to prevent N+1 result/assessment/module lookups.
- Add indexes only after verifying V04 and query plans; likely filters include Student enrolment, offering/semester, result status, result/enrolment, and released assessments.
- Paginate expandable histories if real data volume requires it.
- Cap all page sizes.
- Cache static grade-scale/programme metadata carefully, not private result payloads in shared caches.
- Use `ETag`/conditional requests only if private-cache behavior is correctly configured.
- Set `Cache-Control: private, no-store` for highly sensitive responses and downloads unless a reviewed private caching policy exists.

Measure dashboard query time because it combines aggregates. Do not optimize by weakening publication or ownership filters.

## 20. Frontend integration

### Shared API client

Use the authenticated client described in `MA_BACKEND_IMPLEMENTATION.md`. It should:

- Read `VITE_API_BASE_URL`.
- Attach `Authorization: Bearer <token>` while Bearer auth is in use.
- Parse the standard error shape.
- Clear the session and redirect on `401`.
- Surface `403` without pretending data is empty.
- Support `AbortSignal`.
- Handle `Blob` responses for protected downloads.

The preferred final authentication design is a secure `HttpOnly`, `SameSite` cookie with appropriate CSRF protection.

### Student API module

Create `apps/client/src/api/student.js`:

```js
import { apiRequest, apiDownload } from "./client";

export async function getStudentDashboard({ signal } = {}) {
  const response = await apiRequest("/student/dashboard", { signal });
  return response.data;
}

export async function getStudentResults(query, { signal } = {}) {
  const params = new URLSearchParams(query);
  const response = await apiRequest(`/student/results?${params}`, { signal });
  return response;
}

export async function getStudentResult(resultId, { signal } = {}) {
  const response = await apiRequest(`/student/results/${encodeURIComponent(resultId)}`, { signal });
  return response.data;
}

export async function createResultSummary(input) {
  const response = await apiRequest("/student/result-summaries", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export function downloadResultSummary(summaryId) {
  return apiDownload(`/student/result-summaries/${encodeURIComponent(summaryId)}/download`);
}
```

Construct `URLSearchParams` from allowlisted, defined values so `undefined` does not become a literal query value.

### Route protection

The client route guard must require:

- A session.
- `session.user.role === "STUDENT"`.
- The necessary permission when V04 exposes Student permissions.

Use `session.user.dashboardPath` only after checking it against an allowlist of internal routes. Redirect `/student/dashboard` to `/student` temporarily if old bookmarks must be supported.

### UI mapping

| UI component | API source |
| --- | --- |
| Student header/profile | `/student/profile` or dashboard `profile` |
| Summary cards | Dashboard `summary` |
| GPA chart | Dashboard `gpaTrend` or `/student/progress` |
| Latest result list | Dashboard `latestResults` |
| Result table | `/student/results` |
| Result/attempt timeline | `/student/results/:resultId` |
| Assessment list | `/student/assessments` |
| Credit tracker | `/student/credits` |
| Result download | `/student/result-summaries` endpoints |

Render `null` GPA as “Not available.” Do not recalculate server values in components.

## 21. CORS and transport configuration

The current CORS middleware allows only `Content-Type` and `GET,POST,OPTIONS`. Update it for authenticated Student calls:

```text
Allowed headers: Content-Type, Authorization
Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

Read allowed origins from configuration. If moving to cookie authentication, enable credentials only for explicit trusted origins and implement CSRF protection.

For academic data and downloads:

- Use HTTPS outside local development.
- Add secure response headers.
- Add login rate limiting.
- Limit JSON bodies and document-generation input.
- Configure proxy/load-balancer trust correctly before using forwarded IPs.
- Never use wildcard credentialed CORS.

## 22. Testing strategy

Use a separate test database with V04-equivalent constraints and deterministic academic fixtures.

### Authorization and ownership tests

- Missing/invalid/expired token returns `401`.
- Non-Student role receives `403` for `/api/student`.
- User with no Student profile receives a safe `403`.
- Student A cannot retrieve Student B's result by changing `resultId`.
- Student A cannot download Student B's summary by changing `summaryId`.
- Requests cannot switch identity using `studentId`, registration number, or actor fields.

### Publication and release tests

- Only `PUBLISHED` final results appear in lists, details, dashboard, GPA, credits, history, and downloads.
- `ENTERED`, `VALIDATED`, `WITH_DEAN_OFFICE`, and `RETURNED` results do not leak through counts or empty-state metadata.
- Existing but unreleased assessment marks never appear.
- A result ID owned by the Student but not published returns the same safe response as an unknown ID.

### GPA/CGPA tests

Create policy-approved fixtures for:

- No eligible results (`null`, not zero).
- One normal semester.
- Multiple semesters.
- Non-credit or excluded grades.
- Failed result treatment.
- Repeat replacement/retention.
- Exact rounding boundaries.
- Correct grade-scale version if scales can change over time.

Compare calculations to hand-verified expected values approved by the academic stakeholder.

### Credit tests

- Failed attempts earn no credit unless policy explicitly says otherwise.
- In-progress enrolments are separate from completed credits.
- Repeats do not double-count credit.
- Requirement-group rules are respected.
- Substitutions/equivalences behave according to policy.
- `remainingCredits` never becomes misleading because of excess credits in one category.

### Attempt and carry-forward tests

- Published attempts are returned in the correct order.
- Unpublished attempts are omitted.
- `countsTowardGpa` matches policy.
- Carried-forward marks link to the correct source attempt.
- Equal marks without a database link are not labelled carried forward.
- Source records belonging to another Student cannot be exposed.

### Download tests

- Generated summaries contain only the authenticated Student's published results.
- Semester summaries reject invalid/unauthorized semesters.
- Cumulative summaries use the same GPA/credit services as the API.
- Another Student's summary returns `404`.
- Expired files cannot be downloaded.
- Content type, filename, and cache headers are safe.
- Template values are escaped.

### Contract and client tests

- Responses contain no password hashes, tokens, internal notes, or staff-only fields.
- `null` values render correctly.
- Loading, empty, filtered-empty, error, and retry states work.
- Stale filter requests are aborted.
- `401` clears the session; `403` is not displayed as “no results.”
- Protected Blob downloads handle server JSON errors correctly.
- Client lint and production build pass.

## 23. Implementation order

### Phase 1: foundation

1. Obtain and verify V04 SQL and academic rules.
2. Map V04 identity, role, Student profile, programme, and enrolment entities.
3. Disable TypeORM synchronization.
4. Correct login to return `STUDENT`, `/student`, and verified effective permissions.
5. Add authentication, role/permission middleware, validation, and standard errors.
6. Implement the authenticated Student context service.

### Phase 2: published results vertical slice

1. Map modules, offerings, semesters, final results, and grade scale.
2. Implement owned/published result list and detail queries.
3. Build `/student/results` and `/student/results/:resultId`.
4. Add publication, ownership, and data-redaction integration tests.

### Phase 3: dashboard

1. Implement `GET /api/student/dashboard` using verified result/profile data.
2. Connect Student summary cards and latest results.
3. Add loading, empty, retry, and session-expiry states.

### Phase 4: assessments and repeats

1. Verify assessment-release and carry-forward representation.
2. Implement released assessment queries.
3. Implement published attempt history and carry-forward provenance.
4. Connect assessment and attempt UI.

### Phase 5: academic calculations

1. Approve and encode GPA/CGPA and repeat policies.
2. Implement decimal-safe calculation tests first.
3. Implement progress endpoint.
4. Verify programme credit requirements and implement credits endpoint.
5. Connect accessible charts and credit tracking.

### Phase 6: downloads and hardening

1. Approve result-summary status and format.
2. Implement protected PDF generation/storage/streaming.
3. Add expiry, ownership, and injection tests.
4. Complete performance, privacy, accessibility, and security review.

## 24. Definition of done

The Student backend is complete only when:

- Every used table, relationship, and enum is verified against V04.
- Every endpoint authenticates the user and resolves the Student server-side.
- Role and verified permissions are enforced.
- Ownership is enforced inside database queries.
- Only published final results and released assessments are returned.
- GPA/CGPA, credits, repeat selection, and carry-forward provenance follow approved rules.
- Decimal calculations and rounding have deterministic tests.
- Repeat attempts are preserved without double-counting credit.
- Downloads are generated from the same authoritative services and protected by ownership checks.
- Responses use safe DTOs and reveal no sensitive/internal data.
- Frontend pages implement loading, empty, retry, error, and session-expiry states.
- Server integration tests, client tests, lint, and production build pass.

## 25. First implementation milestone

The recommended first working slice is:

```text
V04 USERS/ROLES/STUDENTS mapping
  -> corrected STUDENT login/session
  -> authenticate + requireRole("STUDENT")
  -> Student context derived from req.auth.userId
  -> owned PUBLISHED result list/detail endpoints
  -> authenticated frontend API wrapper
  -> /student/results UI
```

This proves identity, ownership, publication filtering, database relationships, and frontend integration before implementing complex GPA, credit, repeat, and download logic.
