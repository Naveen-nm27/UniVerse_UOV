# Codex prompt: Build the Lecturer dashboard UI

Implement the Lecturer dashboard in the existing React application. Build working, responsive pages and connect them to the application's authenticated API where endpoints already exist. This task is **frontend only**: do not create backend routes, change the database, or write a second specification. Inspect the current UI and reuse its routing, session handling, components and styling where appropriate. Preserve unrelated work.

## What the lecturer needs to do

A lecturer must be able to:

1. See every course/module offering they have been assigned to teach, including current and previous semesters.
2. Open an offering to see the enrolled students and their permitted progress during that semester.
3. See clear course-level charts, including a grade-distribution bar chart with **grades on the X axis and student count on the Y axis**.
4. Compare the same module they taught to different batches or in different semesters, using accurately labelled historical data.
5. If they are officially assigned as an academic advisor, open a **separate advisor area** to see only their assigned advisees and each advisee's academic progress across semesters.

Management Assistants (MA) enter ICA and final grades. The Lecturer UI is read-only for grades and result status. Do not add grade-entry, approval, publication or status-editing controls.

## Layout and visual direction

Create one consistent dashboard shell. On desktop, put navigation in a fixed left sidebar, with the logo/product name, links, active-page indicator and logout/account access. On mobile, turn it into an accessible menu/drawer. Use a compact top bar for the current page title and signed-in lecturer's identity; do not duplicate navigation in a large top header. Keep the content centred with generous spacing and a comfortable maximum width.

Match the existing MA interface: professional university administration software, not a marketing landing page. Use the established palette—plum `#5D1C6A`, cream `#FFF1D3`, pink `#CA5995`, peach `#FFB090`, dark ink text and white/warm-white cards. Use the application's typography, consistent spacing, subtle borders, restrained shadows and clear hierarchy. Charts should be flat and quiet: no gradients, 3D effects, glow, animated bars or decorative visual noise. Use readable axis labels, legends where needed and exact values.

Suggested sidebar order: **Overview**, **My courses**, **Teaching history**, then **My advisees** only for lecturers with a confirmed advisor assignment. Keep advisor content visually and navigationally separate from course rosters.

## Screens and interactions

### 1. Overview (`/lecturer`)

Show a greeting and the lecturer's name/department when provided by the API. Include small summary cards for current courses, current enrolled students and available released-result coverage; label each card's time period. Show current course cards with module code, title, programme, batch, teaching semester, enrolled count and a link to details. Include a recent/previous courses section. An assigned advisor may see an advisee count and a link to the separate advisor area. Do not invent metrics when data is unavailable.

### 2. My courses (`/lecturer/courses`)

List **only assigned offerings**. Provide filters for current/past, module, batch and actual teaching semester, plus search by module code/title. Each offering is a distinct card or table row even when the same module is taught more than once. Show a helpful empty state for a lecturer with no assignments. Keep filters usable on small screens.

### 3. Course detail (`/lecturer/courses/:offeringId`)

At the top, show module code/title, programme, batch, teaching semester and number of enrolled students. Below it, provide:

- A plain bar chart of final grades: grade categories on the X axis, integer student counts on the Y axis. Order categories according to the API's grade scale. Display exact counts above bars or through an accessible interaction, and place a simple data table below the chart.
- A progress chart for the semester **only if the API provides a meaningful series**, such as released assessment completion by date/assessment or published-result coverage over time. Label the metric, time axis, numerator/denominator and data status. Do not invent a progress percentage or equate student grades with the quality of teaching.
- Summary cards for cohort size, students included in the chart, published-result coverage and other reliable, server-provided measures.
- A student roster preview with a clear link to the full roster.

Treat no grades yet, unpublished results, no enrolled students and API failure as different states. Never display zero bars as if unavailable data were a real zero. A chart with one data point should be a simple bar/card rather than an artificial trend.

### 4. Taught students (`/lecturer/courses/:offeringId/students`)

Show every student enrolled in that offering, with search and pagination. Each row should include permitted identity fields (for example registration number and name), assessment/result availability, and a link to an offering-scoped student detail if the API supports it. The detail view should show that student's progress **for this course and semester only**: released assessments, published result, attempt/resit status and a chronological progress summary where available. Keep the module and semester visible so staff do not confuse students or offerings. If the API does not permit individual marks, show status or completion information instead; never reveal hidden data through the browser.

### 5. Teaching history (`/lecturer/modules/:moduleId/history`)

Compare only prior offerings of the **same module** that this lecturer actually taught. Show a table and a clean chart across teaching semesters/batches, with cohort size and publication coverage for every point. A suitable comparison is server-provided pass rate or grade distribution, provided the measure is comparable between cohorts; make incomplete coverage explicit. Allow the lecturer to choose a module and inspect individual offerings. Do not mix modules merely because their names look similar. Do not present a change in cohort results as proof that a lecturer's teaching improved or declined.

### 6. Academic advisor area (`/lecturer/advising`)

Show this navigation item and its pages only when the API confirms an active academic-advisor assignment. List **assigned advisees**, not all students in the lecturer's courses. Provide search and a per-student link. For an advisee, display programme, batch, stable intake academic year, published semester results, GPA/credits when returned by the API, and repeat/resit history. Group academic progress as `Y01S01`, `Y01S02`, `Y02S01` and so on. The student's intake academic year (for example `2023/2024`) stays the same; it is not the changing calendar semester of a course offering. Use a readable GPA-by-study-period graph and a matching table when there is enough data. Do not calculate official GPA, credits or Honours eligibility in the browser.

## Data, access and interaction rules

- Use the server-confirmed `LECTURER` role and existing protected-route/session flow. Route successful lecturer login to `/lecturer`. A client-side guard helps navigation, but the API must remain the source of access decisions.
- Fetch data through one shared authenticated API layer, not `fetch` scattered across components. Use the application's configured API base URL and normal session mechanism. Abort stale requests when the user changes filters or leaves a page.
- The URL may contain an offering, module or student ID, but that ID does not grant access. If the API returns `403` or `404`, show an appropriate unavailable page without leaking other students' information.
- Render only server-provided academic calculations and results that the lecturer is permitted to see. Individual unpublished grades and unreleased assessment marks must not be shown unless the existing API explicitly returns them under an approved staff policy. Do not copy student or grade data into hard-coded arrays for the completed UI.
- Keep teaching semesters, batches and student intake academic year distinct. Account for repeat/resit attempts without counting one student twice in a chart.
- Provide visible loading, empty, no-permission, expired-session, partial-data and retry states. Use real links/actions; no buttons that lead nowhere.
- Make navigation, filters, tables and charts keyboard accessible. Use semantic headings and landmarks, visible focus, non-colour labels, accessible chart data tables and reduced-motion support. Check phone, tablet and desktop widths; avoid page-level horizontal overflow.

## Build order and completion check

First inspect the existing UI, auth flow and available API responses. Build the Lecturer shell and protected routes; then wire overview and course list; then offering detail and roster; then teaching history; finally the conditional advisor area. If a required endpoint is missing, do not fabricate live data or modify the backend under this task: complete the UI states that can be implemented safely and report the exact missing API data needed.

Finish by running the client lint and production build, plus relevant UI tests if they exist. Manually verify login as a lecturer, a lecturer with no past courses, an advisor and a non-advisor, unavailable/unpublished data, an unauthorised offering ID, and a narrow mobile layout. Report what was built, which pages use live data, any missing API fields, and the check results.
