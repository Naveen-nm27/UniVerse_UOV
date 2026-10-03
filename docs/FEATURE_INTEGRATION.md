# Student and MA feature integration

The working tree on `ma_staff` combines the student feature from `feature/student` (`63af5e5`) with the MA routes from `ma_staff` (`e3cdb81`). Branch history has not been merged or rewritten. Existing untracked documentation is preserved.

## Run and verify

Use Node 22.12 or newer. Install dependencies with `npm install`, configure `apps/server/.env` using its example, and run `npm run dev` from the repository root. Server environment loading works from either the repository root or the server workspace. Automatic database synchronization remains disabled.

```powershell
npm test -w apps/server
npm run lint -w apps/client
npm run build -w apps/client

# Optional read-only smoke checks against the configured database:
$env:UNIVERSE_DB_SMOKE = '1'
npm test -w apps/server
Remove-Item Env:UNIVERSE_DB_SMOKE
```

`VITE_API_BASE_URL` defaults to `http://localhost:4000/api`; override it in `apps/client/.env`. `FRONTEND_URL` accepts a comma-separated list of trusted origins. Development uses Node's built-in watch mode. TypeORM was updated to a compatible patched 0.3.x version.

## MA account setup

The local database initially had six canonical student accounts and no MA account. The sample MA account `ma.demo@vau.ac.lk` has now been created in `USERS` with `role_code = 'MA'`; change its temporary password at first sign-in. The unrelated lowercase `users` and `man_staff` tables are legacy tables. They are not used by the integrated authentication service.

Create a canonical MA identity with this explicit setup command. It does not change existing accounts or create an unverified staff profile. Use a different email when creating another MA account.

```powershell
$maCredential = Get-Credential -Message 'Use the MA email and a temporary password of at least 12 characters'
$env:MA_EMAIL = $maCredential.UserName
$env:MA_NAME = 'Management Assistant Name'
$env:MA_PASSWORD = $maCredential.GetNetworkCredential().Password
try {
    npm run create:ma -w apps/server
} finally {
    Remove-Item Env:MA_EMAIL, Env:MA_NAME, Env:MA_PASSWORD -ErrorAction SilentlyContinue
}
```

Sign in at `/`. The first sign-in requires changing the temporary password; subsequent sign-ins open `/ma`.

## Generated ID setup

The local development schema was also missing `AUTO_INCREMENT` on the existing unsigned integer primary keys used by account and academic creation. These six keys were repaired without changing existing row data: `USERS`, `STUDENT_PROGRAMMES`, `DEPARTMENTS`, `PROGRAMMES`, `BATCHES`, and `SEMESTERS`. The repair script validates their existing names and types before applying any changes.

For another development database with the same issue, review the dry run and then apply:

```powershell
npm run db:repair-ids -w apps/server
npm run db:repair-ids -w apps/server -- --apply
```

## Connected screens and endpoints

| Screen | API | Behavior |
| --- | --- | --- |
| Sign-in | `POST /api/users/login` | Canonical roles, shared JWT secret, safe session DTO |
| Session | `GET /api/users/me` | Current database role and password-change requirement |
| Password | `POST /api/users/password` | Verifies current password and clears temporary-password requirement |
| MA overview | `GET /api/ma/dashboard` | Actual active-user and result-queue counts; unavailable metrics are `null` |
| MA users | `GET/POST /api/users`, `PATCH /api/users/:userId/status` | Paginated search, transactional student creation, activation controls |
| Academic setup | `GET /api/ma/academic/resources`, `GET/POST /api/ma/academic/:resource`, `PATCH /api/ma/academic/:resource/:id` | Resource availability, validated forms, pagination and editing |
| Form lookups | `GET /api/ma/lookups/{departments,programmes,batches,grade-scale}` | Safe reference options |
| Student dashboard | `GET /api/student/dashboard` | Profile, published results, assessments, GPA and batch aggregates in one response |
| Student results | `GET /api/student/results`, `GET /api/student/results/:resultId` | Ownership and publication filtering |
| Student assessments | `GET /api/student/assessments` | Assessments tied to the same offering and a published enrollment result |
| Student PDF | `GET /api/student/downloads/result-summary` | Private PDF using the selected semester and published results |

The existing `/api/users/register` path is retained as an **authenticated MA-only** alias for student creation. A student payload uses `fullName`, `email`, `password`, `role: "STUDENT"`, `registrationNumber`, integer `programmeId`/`batchId`, `startDate`, and optional `currentSemester`/`phone`. The browser cannot set the creator ID. Failed profile writes roll back the user identity.

Both `/student` and old `/student/dashboard` bookmarks work. Legacy lowercase sessions must sign in again. Previously issued student JWTs containing `userId` are accepted; current role and activation state always come from `USERS`.

## Database scope and remaining feature work

Entity columns used by the supported screens were checked against the available local database. The academic fields match that schema:

- Departments: `departmentName`.
- Programmes: `programmeCode`, `programmeName`, `departmentId`, `durationYears`.
- Batches: `batchName`, `startDate`; no invented programme relationship.
- Calendar semesters: `semesterName`, `academicYear`, `startDate`, `endDate`.
- Modules: existing `moduleCode`, `moduleName`, `credits`, `programmeSemesterId` records can be listed.

The available schema has no `ROLES`, canonical `MA_STAFF`, `PROGRAMME_SEMESTERS`, `HALLS`, timetable, device, permission-override or audit tables. The authoritative V04 SQL is also absent from this repository. No guessed tables or destructive migrations were applied. Programme-semester and hall operations, module writes, staff account creation, timetable/device editing, grade entry, result transitions, documents and audit activity need the verified schema and their domain services first. Their UI shows an explicit unavailable state. Schema errors return a safe `503` rather than false zero totals or leaked SQL. Restart the server after installing verified schema so its metadata cache refreshes.

Assessment release currently follows the student branch's existing rule: a published final result makes its associated ICA grades visible. Independent ICA release and carry-forward provenance need schema support before they can be implemented.

## Academic calculation policy

The previous dashboard counted failed credits, double-counted repeat credits and used hardcoded programme totals. It now preserves published attempts while deduplicating credit by module. Configure these only after the university approves the policy:

```dotenv
# Examples of supported settings, not approved university rules:
GPA_REPEAT_POLICY=LATEST
PASSING_GRADES=A+,A,A-,B+,B,B-,C+,C
```

`GPA_REPEAT_POLICY` supports `LATEST` (latest published attempt per module) and `ALL` (all published attempts). Without a setting, GPA is calculated only where there are no repeated module results. Ambiguous repeat aggregates return `null`. `PASSING_GRADES` is required before completed credits are reported. Missing programme requirements remain `null`; the app does not infer a 120-credit requirement. Grade points are calculated in hundredths and rounded once. CGPA remains cumulative when the semester filter changes. Credits and the PDF use the selected semester.

## Validation scope

Regression tests cover login/session interoperability, revoked/inactive access, server-derived roles and actor IDs, MA-only creation, password changes, reference validation, transaction rollback, pagination, safe DTOs and GPA/credit rules. Optional database checks exercise student ownership/publication, attempt details, PDF generation and every available academic mapping without changing database data. The frontend was linted, built and exercised in headless Edge. Browser checks cover MA counts, account tables, student-creation reference options, academic forms, missing-schema states, student result details, role protection and temporary-password entry. The browser server accepts GET/OPTIONS only and uses a synthetic MA identity; no database writes occur. On Windows with Edge installed, run `npm run build -w apps/client` and `npm run test:browser -w apps/server` to repeat these checks.
