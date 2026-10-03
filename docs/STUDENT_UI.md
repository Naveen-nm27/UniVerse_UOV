# Student Dashboard UI and Use-Case Design

This document defines the Student workspace for UniVerse UOV. Use it together with the [project UI guide](./README.md), [project structure](./PROJECT_STRUCTURE.md), and the authoritative V04 database design.

It covers these student use cases:

- View semester results and courseware/ICA marks.
- View detailed marks for individual assessments.
- View automatically calculated GPA and CGPA.
- Track completed and remaining credits.
- Analyse academic progress and performance trends.
- Download result summaries.
- Review repeat-attempt history, including ICA marks carried forward from earlier attempts.

> **Database prerequisite:** Project documentation refers to `UniVerse_UOV_V04.sql` as the authoritative schema, but the SQL file is not currently committed to this repository. The UI and API contracts below use the documented V04 concepts: students, enrolments, modules, programme/calendar semesters, module offerings, ICA definitions and grades, exams, final results, result status history, and grade scale. Verify all exact table names, columns, types, foreign keys, attempt rules, credit rules, GPA rules, and mark-release rules against the real V04 SQL and approved university policy before implementation.

## 1. Role purpose and security boundary

The Student workspace helps a signed-in student understand current academic performance and progress toward programme completion.

The authenticated database role is `STUDENT`, and the dashboard path is `/student`. The backend must identify the student profile from the authenticated user. Never accept a student ID, registration number, role, GPA, CGPA, credit total, or result status from browser-controlled input when deciding which records to return.

Every student endpoint must:

- Require a valid, active `STUDENT` session.
- Resolve the student profile from the authenticated user ID.
- Return only records belonging to that student.
- Return final results only when their status is `PUBLISHED`.
- Return assessment/coursework marks only when university release policy allows them to be shown.
- Calculate or retrieve GPA, CGPA, and credit totals on the server using approved rules.
- Exclude password hashes, actor IDs, internal notes, raw audit data, and result-verification details not intended for students.

Frontend route guards improve navigation but are not a security boundary.

## 2. Student information architecture

Recommended sidebar order:

1. Overview
2. Results
3. Assessments
4. Academic progress
5. Credit tracker
6. Downloads
7. Profile

Recommended routes:

| Route | Screen | Main purpose |
| --- | --- | --- |
| `/student` | Overview | Current academic summary and recent published results |
| `/student/results` | Semester results | Results grouped and filtered by academic semester |
| `/student/results/:resultId` | Result details | Module result, assessments, grade, credits, and attempt history |
| `/student/assessments` | Assessment marks | Courseware/ICA marks across current or selected semester |
| `/student/progress` | Academic progress | GPA/CGPA trends and programme progress |
| `/student/credits` | Credit tracker | Completed, in-progress, remaining, and repeated credits |
| `/student/downloads` | Result downloads | Generate/download official or provisional result summaries |
| `/student/profile` | Student profile | Safe identity and programme information |

Use a central router and a shared protected Student layout. The current `App.jsx` path-prefix switch is insufficient once these pages are added.

## 3. Shared application shell

Follow the common UniVerse dashboard shell:

- A `248px` plum sidebar on desktop.
- A `64px`–`72px` top bar with the page title, notifications, and student menu.
- A cream/light page background with warm-white cards.
- A labelled modal navigation drawer below tablet width.
- Breadcrumbs on result details and other pages below the top level.
- A maximum content width that keeps charts and tables readable on wide displays.

### Header identity

Show:

- Student name.
- Registration number.
- Programme and current academic context when supplied by the API.
- Profile/avatar menu and logout.

Do not treat values stored in the browser as authoritative. Load current display data from the authenticated student summary endpoint.

### Visual system

Use the existing project palette:

| Token | Hex | Use |
| --- | --- | --- |
| Plum | `#5D1C6A` | Sidebar, headings, primary actions |
| Cream | `#FFF1D3` | Page background and selected navigation |
| Pink | `#CA5995` | Links, focus rings, chart accent |
| Peach | `#FFB090` | Highlights and secondary chart accent |
| Ink | `#36123F` | Main text |

Use white/warm-white cards, plum-tinted borders, `12px`–`16px` radii, and restrained shadows. Academic information should be clear before it is decorative.

Status, grade, and progress meaning must always include text; colour alone is insufficient.

## 4. Student overview dashboard

The `/student` dashboard should answer: “How am I progressing, and what academic information has recently become available?”

### Header

- Greeting using the student's name.
- Registration number and programme.
- Current academic year/semester if one is active.
- Primary shortcut: **View results**.
- Secondary shortcut: **Download summary**.

### Summary cards

Show four concise cards:

1. **Current GPA** — GPA for the latest semester with published results.
2. **CGPA** — cumulative value and the “calculated through” semester.
3. **Completed credits** — completed credits against total programme credits.
4. **Latest published results** — number of results released in the most recent publication/semester.

Every metric must include its scope. Examples: “Semester 1, 2026,” “Through Level 2 Semester 2,” or “72 of 120 credits.” Do not show unexplained numbers.

### Dashboard layout

```text
+---------------------------------------------------------------+
| Welcome, Student Name                         [View results]   |
| Registration No. | Programme             [Download summary]   |
+---------------------------------------------------------------+
| Current GPA | CGPA       | Credits completed | New results    |
+---------------------------------------------------------------+
| Academic progress trend       | Credit completion             |
| line chart                     | progress bar / summary         |
+---------------------------------------------------------------+
| Latest published results      | Recent assessment marks       |
| compact result rows            | compact assessment rows       |
+---------------------------------------------------------------+
| Repeat/carry-forward notice, only when relevant                |
+---------------------------------------------------------------+
```

### Latest results panel

Show a maximum of five recently published results with:

- Module code and title.
- Semester.
- Final grade.
- Credits earned.
- Attempt label such as “First attempt” or “Repeat attempt 2.”
- A link to the result details page.

Do not show `ENTERED`, `VALIDATED`, `WITH_DEAN_OFFICE`, or `RETURNED` final results, and do not hint that unpublished results exist.

### Recent assessments panel

Show recently released assessment marks with:

- Module code.
- Assessment title/type.
- Mark, maximum mark, and percentage when provided by the server.
- Release date.
- Carry-forward badge when the displayed mark came from an earlier attempt.

If marks exist but are not released to students, display nothing about them rather than showing a hidden/pending row that leaks their existence.

### Attention messages

Use informational cards for student-relevant conditions, such as:

- Repeat attempt recorded.
- ICA mark carried forward from a named previous attempt.
- Credit requirement category still incomplete.
- A new result summary is available for download.

Do not display internal verification notes, staff comments, or operational workflow states.

## 5. STU-01: View semester results

**Goal:** Allow the student to review published results by academic semester.

### Results page

Provide:

- Academic year filter.
- Semester filter.
- Optional module search.
- “All published semesters” view.
- Result count and last publication/update time.

Preserve non-sensitive filters in the URL:

```text
/student/results?academicYear=2026&semester=1
```

### Desktop result table

| Column | Description |
| --- | --- |
| Module | Module code and title |
| Credits | Credit value for the attempted module |
| Courseware/ICA | Released aggregate coursework mark or grade, if policy permits |
| Examination | Released examination mark/grade, if policy permits |
| Final grade | Approved published grade |
| Grade point | Server-supplied grade point where policy permits |
| Attempt | Current/first/repeat attempt number |
| Status | `Passed`, `Not passed`, or another approved student-facing label |
| Action | View details |

The UI must not derive pass/fail from colours or hard-coded grade lists. Receive an approved `outcomeLabel` from the API or apply a centrally approved mapping to server-returned outcome codes.

### Semester summary

Above or below the table, show:

- Semester GPA.
- Attempted credits.
- Earned/completed credits.
- Number of modules passed.
- Number of repeat/currently incomplete modules, when policy allows.

Clearly label provisional summaries if the university considers them non-official.

### Empty and unavailable states

Differentiate:

- No published results for the selected semester.
- No results match the selected module search.
- Results could not be loaded.

Never say “results are awaiting validation” unless the university explicitly allows students to see workflow status.

## 6. STU-02: View assessment details

**Goal:** Show released courseware/ICA marks and how they contribute to a module result.

### Assessment list page

Use a context-first layout:

1. Select academic year/semester.
2. Select or expand a module offering.
3. View released assessment items.

Each module card or row should show:

- Module code and title.
- Lecturer name only if the student-facing policy permits it.
- Attempt number.
- Released assessment count.
- Courseware/ICA aggregate when available.

### Assessment detail display

| Field | UI treatment |
| --- | --- |
| Assessment number/title | Primary row label |
| Assessment type | Badge such as Assignment, Quiz, Lab, or ICA |
| Obtained mark | Numeric value returned by the server |
| Maximum mark | Display beside obtained mark |
| Weight | Percentage contribution, only if stored/approved |
| Weighted contribution | Server-calculated value, only if applicable |
| Grade | Grade-scale label when applicable |
| Released at | Secondary metadata |
| Source attempt | Shown for carried-forward marks |

Do not calculate official weighted marks in the browser. The API should return normalized display values and calculation results.

### Carried-forward assessment mark

When an ICA mark is carried from an earlier attempt, show a clearly labelled information block:

```text
Carried forward
This ICA mark was carried forward from Attempt 1, Semester 2, 2025.
Original mark: 68/100
Applied to: Attempt 2, Semester 2, 2026
```

Only show this when the database explicitly links or flags the carry-forward. Never infer it merely because two marks have equal values.

## 7. STU-03: GPA and CGPA

**Goal:** Present approved GPA calculations in a way students can understand.

### Calculation ownership

GPA and CGPA must be calculated by the backend or retrieved from an authoritative database calculation. The frontend must not invent the grade-point scale, decide which attempts replace earlier attempts, or decide which modules count toward GPA.

The server must apply approved rules for:

- Grade-to-point conversion from `GRADE_SCALE` or its V04 equivalent.
- Credit weighting.
- Excluded, non-credit, incomplete, withdrawn, or pass/fail modules.
- Repeat attempts and grade replacement.
- Rounding precision.
- Which result statuses are eligible—student calculations must use only published/approved results.

### Progress page GPA section

Show:

- Current/latest semester GPA.
- CGPA.
- “Calculated through” academic semester and publication timestamp.
- A semester-by-semester trend chart.
- An accessible data table containing the same values as the chart.
- A short “How this is calculated” explanation sourced from approved policy.

Example server-supplied series:

```json
[
  { "semesterId": 3, "label": "2025 - Semester 1", "gpa": 3.12 },
  { "semesterId": 4, "label": "2025 - Semester 2", "gpa": 3.28 },
  { "semesterId": 5, "label": "2026 - Semester 1", "gpa": 3.41 }
]
```

Do not display a zero when GPA is unavailable. Show `Not available` with an explanation such as “No published credit-bearing results are available for this semester.”

### Calculation breakdown

Optionally provide an expandable breakdown for transparency:

| Module | Credits counted | Grade | Grade points | Quality points |
| --- | ---: | --- | ---: | ---: |

All values must come from the server. If policy does not permit the full formula breakdown, omit it.

## 8. STU-04: Credit tracking

**Goal:** Show progress toward programme credit requirements without double-counting attempts.

### Credit summary

Show:

- Total programme credits required.
- Credits completed/earned.
- Credits currently in progress.
- Credits remaining.
- Optional category totals such as core, elective, or general education if V04 models them.

Use a labelled progress bar with visible numeric text:

```text
72 of 120 credits completed — 60%
```

### Credit rules

The backend must determine credit status. The UI must not:

- Count repeated attempts more than once.
- Treat an enrolled/in-progress module as completed.
- Count a failed attempt as earned credit.
- Assume every module uses the same credit value.
- Subtract credits without considering substitutions or programme requirements.

### Credit detail screen

Group modules by programme requirement or academic level when supported:

| Group | Required | Completed | In progress | Remaining |
| --- | ---: | ---: | ---: | ---: |
| Core | 90 | 60 | 12 | 18 |
| Elective | 30 | 12 | 6 | 12 |

Provide a module-level expandable list for verification. Mark repeated modules with an attempt badge while counting the module credit only according to approved programme rules.

If the database does not model requirement categories, show only verified total, completed, and remaining credits. Do not invent programme requirements in the client.

## 9. STU-05: Progress analysis

**Goal:** Help the student understand academic performance over time.

### Recommended visualizations

Use no more than three primary visualizations on one page:

1. **GPA by semester:** line chart.
2. **Credits completed:** horizontal progress bar or compact stacked bar.
3. **Grade distribution:** bar chart, only if the API can calculate it accurately from published results.

Every chart must have:

- A descriptive title and timeframe.
- Axis labels and readable values.
- A legend where needed.
- A non-colour distinction for multiple series.
- An accessible table or text summary with the same information.
- A useful empty state when there is insufficient data.

### Performance trend messages

Use factual descriptions such as:

- “Semester GPA increased from 3.12 to 3.28.”
- “18 additional credits were completed this academic year.”

Trend statements should be supplied or derived from server-returned published aggregates. Avoid judgemental language such as “poor student” and do not predict future grades.

### Small datasets

For one semester, prefer a summary card and table rather than an artificial one-point line chart. For no published semesters, show an onboarding/empty state.

## 10. STU-06: Download result summaries

**Goal:** Let students download a safe result summary generated from published data.

### Download page

Provide:

- Summary type: semester result summary or cumulative result summary.
- Academic year and semester when a semester summary is selected.
- Format supported by the backend, preferably PDF.
- Clear label indicating official, provisional, or unofficial status.
- Generated date and included-through semester.

The download action should call a protected endpoint. Do not generate an authoritative result document solely from DOM content in the browser.

### Download behaviour

- Disable the button while generation is in progress.
- Show progress/processing state for long-running generation.
- Use the filename returned by the server or a safe predictable name.
- Handle an expired session before exposing the file.
- Do not place access tokens in query strings.
- Do not expose permanent public storage URLs.
- Announce success/failure to assistive technology.

Suggested filenames:

```text
UOV_Result_Summary_2026_Semester_1.pdf
UOV_Cumulative_Result_Summary_2026-09-28.pdf
```

The document should include only the authenticated student's data and published results. If verification codes or signatures are required, the backend/document service must create them.

## 11. STU-07: Repeat-attempt history

**Goal:** Make previous attempts and carried-forward marks understandable without confusing them with the current result.

### Result details attempt timeline

For a module with multiple attempts, show the current/latest attempt first and provide a chronological timeline:

```text
Attempt 2 — 2026 Semester 2
Current published result: B
ICA: 68 (carried forward from Attempt 1)
Exam: released value/grade, when policy permits

Attempt 1 — 2025 Semester 2
Published result: F
ICA: 68
Exam: released value/grade, when policy permits
```

Each attempt should include:

- Attempt number.
- Academic year and semester.
- Module offering/context.
- Published final grade and student-facing outcome.
- Released ICA/courseware and examination details.
- Credits earned for that attempt as determined by the backend.
- Whether the attempt is current, repeated, superseded, or otherwise classified by policy.
- Explicit links between original and carried-forward ICA records when present.

### Repeat display rules

- Do not overwrite an earlier attempt in the UI.
- Do not combine separate attempts into one unexplained row.
- Clearly distinguish historical grade from the grade used in current CGPA.
- Do not infer that the latest attempt replaces every prior grade; use server-supplied `countsTowardGpa` or equivalent policy output.
- Do not double-count earned credit.
- If an attempt is not published, do not expose it or indicate its existence.

## 12. Student-facing API contracts

These endpoints are UI requirements, not permission to bypass V04 verification. Exact response fields should be finalized after reviewing the schema and academic policy.

| Method and route | Purpose |
| --- | --- |
| `GET /api/student/dashboard` | Profile summary, GPA/credits, latest results, recent assessments |
| `GET /api/student/results` | Authenticated student's published results, filtered by semester |
| `GET /api/student/results/:resultId` | One owned published result and its details/history |
| `GET /api/student/assessments` | Released assessment marks for owned enrolments |
| `GET /api/student/progress` | GPA/CGPA and published progress aggregates |
| `GET /api/student/credits` | Server-calculated credit totals and requirement groups |
| `GET /api/student/result-summaries` | Available result-summary downloads/generation options |
| `POST /api/student/result-summaries` | Generate a protected result summary |
| `GET /api/student/result-summaries/:id/download` | Download an owned generated file |
| `GET /api/student/profile` | Safe student and programme details |

Do not add `studentId` to these routes. The server derives it from the authenticated user. A result or download ID must also be checked for ownership.

### Dashboard response example

```json
{
  "data": {
    "profile": {
      "fullName": "Student Name",
      "registrationNumber": "2024ICT001",
      "programme": { "id": 3, "code": "BICT", "name": "BSc in ICT" },
      "currentContext": "2026 - Semester 1"
    },
    "summary": {
      "currentGpa": 3.41,
      "currentGpaLabel": "2026 - Semester 1",
      "cgpa": 3.29,
      "calculatedThrough": "2026 - Semester 1",
      "completedCredits": 72,
      "requiredCredits": 120,
      "latestPublishedResultCount": 6
    },
    "gpaTrend": [
      { "semesterId": 4, "label": "2025 - Semester 2", "gpa": 3.28 },
      { "semesterId": 5, "label": "2026 - Semester 1", "gpa": 3.41 }
    ],
    "latestResults": [
      {
        "resultId": 91,
        "moduleCode": "ICT 302",
        "moduleTitle": "Software Engineering",
        "semesterLabel": "2026 - Semester 1",
        "finalGrade": "B+",
        "creditsEarned": 3,
        "attemptNumber": 1,
        "outcomeCode": "PASSED"
      }
    ],
    "recentAssessments": [],
    "notices": [],
    "generatedAt": "2026-09-28T09:00:00.000Z"
  }
}
```

The API must use `null`, not `0`, for unavailable GPA values.

### Result details response example

```json
{
  "data": {
    "resultId": 91,
    "module": { "id": 14, "code": "ICT 302", "title": "Software Engineering", "credits": 3 },
    "semester": { "id": 5, "label": "2026 - Semester 1" },
    "attemptNumber": 2,
    "finalGrade": "B",
    "gradePoint": 3.0,
    "outcomeCode": "PASSED",
    "creditsEarned": 3,
    "countsTowardGpa": true,
    "assessments": [
      {
        "assessmentId": 81,
        "title": "ICA 1",
        "obtainedMark": 68,
        "maximumMark": 100,
        "carriedForward": true,
        "sourceAttemptNumber": 1,
        "sourceSemesterLabel": "2025 - Semester 2"
      }
    ],
    "attemptHistory": []
  }
}
```

Only include mark fields approved for student release. Omit restricted fields rather than returning them with misleading placeholder values.

## 13. Frontend component plan

Recommended organization:

```text
apps/client/src/
|-- api/
|   |-- client.js
|   `-- student.js
|-- components/
|   |-- common/
|   |   |-- EmptyState.jsx
|   |   |-- ErrorState.jsx
|   |   |-- LoadingSkeleton.jsx
|   |   |-- StatusBadge.jsx
|   |   `-- ProgressBar.jsx
|   `-- layout/
|       `-- StudentShell.jsx
|-- features/student/
|   |-- StudentSummaryCards.jsx
|   |-- LatestResults.jsx
|   |-- AssessmentList.jsx
|   |-- GpaTrendChart.jsx
|   |-- CreditProgress.jsx
|   |-- ResultTable.jsx
|   |-- AttemptTimeline.jsx
|   `-- ResultDownloadForm.jsx
|-- pages/student/
|   |-- StudentDashboard.jsx
|   |-- StudentResults.jsx
|   |-- StudentResultDetails.jsx
|   |-- StudentAssessments.jsx
|   |-- StudentProgress.jsx
|   |-- StudentCredits.jsx
|   |-- StudentDownloads.jsx
|   `-- StudentProfile.jsx
```

Keep API calls outside presentational components. Use one authenticated API wrapper that sends the access token or relies on the final secure cookie strategy.

### Page state requirements

Every data page needs distinct states for:

- Initial loading.
- Successful data display.
- Successful empty response.
- Filtered no-results response.
- Authentication failure.
- Authorization failure.
- Retryable server/network failure.

Abort stale requests when filters change or a page unmounts. Do not briefly display one semester's results under another semester's heading.

## 14. Responsive design

Test at approximately `320px`, `768px`, `1024px`, and `1440px`.

### Mobile

- Convert the sidebar into a modal drawer with focus trapping and focus restoration.
- Stack summary cards in one column or a readable two-column grid where space permits.
- Replace wide result tables with labelled result cards, or place them in an explicitly labelled horizontal-scroll region.
- Keep the module name and final grade visible without horizontal scrolling where possible.
- Display attempt history as a vertical timeline.
- Stack chart and table alternatives; do not make charts too short to read.
- Keep buttons and controls at least `44px` high/wide where practical.

### Tablet and desktop

- Use a four-card dashboard summary row where space allows.
- Place GPA trend and credit progress side by side.
- Keep filters in a compact toolbar, wrapping without overlap.
- Use sticky table headings for long result lists.

Avoid page-level accidental horizontal scrolling at all breakpoints.

## 15. Accessibility requirements

- Use semantic `header`, `nav`, `main`, `section`, and table elements.
- Give every chart a text summary and accessible table alternative.
- Do not use colour alone for grades, pass/fail outcomes, carried-forward marks, or trend direction.
- Use visible keyboard focus based on the pink/plum palette with sufficient contrast.
- Associate filter labels and errors with controls.
- Announce loading completion, download success, and errors through an appropriate live region.
- Mark the current sidebar route with `aria-current="page"`.
- Ensure drawers and dialogs trap focus and restore it when closed.
- Respect `prefers-reduced-motion` for chart and page animations.
- Format numbers so screen readers receive meaningful values, such as “3.41 GPA” and “72 of 120 credits.”

## 16. Privacy and data-display rules

- Show only the signed-in student's academic information.
- Never expose database actor IDs, staff notes, audit JSON, password hashes, tokens, or unpublished result workflow.
- Do not cache private academic API responses in shared browser storage.
- Clear protected state on logout.
- Avoid putting student IDs, registration numbers, grades, or tokens in query strings when they are not needed.
- Validate ownership for result details and generated downloads on every request.
- Use generic `404` responses when an ID does not belong to the current student.
- Prevent search engines and shared caches from indexing/caching protected pages and downloads.
- Use university locale/timezone consistently for semester dates and publication timestamps.

## 17. Loading, empty, and error copy

Use clear, non-alarming language:

| State | Suggested message |
| --- | --- |
| Dashboard loading | “Loading your academic overview…” |
| No published results | “No published results are available for this semester.” |
| No assessment marks | “No released assessment marks are available for this selection.” |
| GPA unavailable | “GPA is not available because this semester has no eligible published results.” |
| Credit data unavailable | “Credit progress is temporarily unavailable.” |
| Download processing | “Preparing your result summary…” |
| Request failed | “We couldn't load this information. Please try again.” |
| Session expired | “Your session has expired. Sign in again to continue.” |

Do not expose database, stack-trace, or internal workflow language in student-facing messages.

## 18. Implementation order

1. Verify the V04 student, enrolment, module, semester, assessment, result, grade-scale, and attempt relationships.
2. Align authentication with uppercase `STUDENT` and `/student`.
3. Build the protected Student shell and central routing.
4. Implement `GET /api/student/dashboard` and connect the overview.
5. Implement semester results and result details using published results only.
6. Implement released assessment details and explicit carry-forward provenance.
7. Implement authoritative GPA/CGPA and credit aggregation endpoints.
8. Add accessible progress charts with table alternatives.
9. Implement protected server-generated result-summary downloads.
10. Add repeat-attempt history and verify GPA/credit counting rules.
11. Complete responsive, accessibility, privacy, and integration testing.

Do not build charts or credit calculations on mock client formulas and later treat them as official. Establish the server contracts and policy rules first.

## 19. Testing checklist

### Access and privacy

- A missing/invalid session cannot access student endpoints.
- A non-student role cannot access `/api/student`.
- Student A cannot retrieve Student B's result, assessment, or download by changing an ID.
- Unpublished results never appear in counts, lists, charts, GPA, CGPA, downloads, or attempt history.
- Restricted assessment marks never appear in API responses or empty-state hints.
- Tokens and sensitive fields never appear in the UI, URL, logs, or generated filenames.

### Academic correctness

- GPA and CGPA match approved test cases and rounding policy.
- Credits are not earned for failed/in-progress attempts.
- Repeat attempts are not double-counted for credit.
- The correct attempt contributes to GPA under approved replacement rules.
- Carried-forward marks link to the correct original attempt.
- Unavailable GPA is `null` and renders as “Not available,” not zero.
- Downloaded summaries match the on-screen published-result scope.

### UI quality

- Loading, empty, filtered-empty, error, and retry states render correctly.
- Semester filters are preserved in the URL.
- Stale filter requests are cancelled.
- Charts have accessible data alternatives.
- Tables/cards work at mobile and desktop widths.
- Every interactive feature is keyboard accessible.
- Client lint and production build pass.

## 20. Completion checklist

Before a Student screen is considered complete:

- The V04 entities and approved academic rules used by the screen are documented.
- The API derives the student from authentication and checks record ownership.
- Only published/released information is returned.
- GPA, CGPA, credits, repeat handling, and mark carry-forward are server-owned.
- Current and historical attempts are clearly distinguished.
- Numbers include timeframe and context.
- Loading, empty, retry, and error states exist.
- Mobile and keyboard flows are usable.
- Charts have accessible alternatives.
- Downloads are protected and server-generated.
- Privacy, API integration, and academic calculation tests pass.
