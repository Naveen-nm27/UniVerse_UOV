import { useEffect, useState } from "react";
import { downloadStudentResults, getStudentAssessments, getStudentDashboard, getStudentResults, getStudentResultDetails } from "../../api/users";
import "./StudentDashboard.css";

const navItems = [
  "Overview",
  "Results",
  "Assessments",
  "Academic progress",
  "Credit tracker",
  "Downloads",
  "Profile",
];

const summaryCards = [
  { label: "Current GPA", value: "3.72", context: "Semester 1, 2026" },
  { label: "CGPA", value: "3.64", context: "Through Level 2 Sem 2" },
  { label: "Completed credits", value: "72 / 120", context: "Programme requirement" },
  { label: "Latest published results", value: "4", context: "This semester" },
];

const resultRows = [
  { code: "CS 2013", title: "Data Structures", semester: "Semester 1", grade: "A-", credits: 3, attempt: "First attempt", action: "View details" },
  { code: "MA 2012", title: "Discrete Mathematics", semester: "Semester 1", grade: "B+", credits: 2, attempt: "First attempt", action: "View details" },
  { code: "CP 2011", title: "Database Systems", semester: "Semester 1", grade: "A", credits: 3, attempt: "First attempt", action: "View details" },
  { code: "EC 1011", title: "Professional Communication", semester: "Semester 1", grade: "B", credits: 1, attempt: "Carry-forward", action: "View details" },
];

const assessmentRows = [
  { code: "CS 2013", title: "Coding Lab 02", mark: "89 / 100", percentage: "89%", date: "Released 14 Aug 2026" },
  { code: "CP 2011", title: "ER Diagram Assignment", mark: "94 / 100", percentage: "94%", date: "Released 11 Aug 2026" },
  { code: "MA 2012", title: "Quiz 03", mark: "82 / 100", percentage: "82%", date: "Released 09 Aug 2026" },
];

const progressSeries = [62, 68, 76, 74, 82, 88, 90];

function LegacyStudentDashboard() {
  return (
    <div className="student-dashboard">
      <aside className="student-sidebar" aria-label="Student navigation">
        <div className="sidebar-brand">
          <span className="brand-icon">U</span>
          <span>UniVerse</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`nav-item ${index === 0 ? "active" : ""}`}
              aria-current={index === 0 ? "page" : undefined}
            >
              <span className="nav-bullet" aria-hidden="true" />
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-label">Academic year</p>
          <strong>2026 / 2027</strong>
          <span>Level 2 • Semester 1</span>
        </div>
      </aside>

      <div className="student-main">
        <header className="student-topbar">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1>Student dashboard</h1>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Notifications">
              🔔
            </button>
            <div className="profile-pill">
              <div className="profile-avatar">SM</div>
              <div>
                <strong>Sandeep Mendis</strong>
                <span>2024/CS/221</span>
              </div>
            </div>
          </div>
        </header>

        <main className="student-content">
          <section className="welcome-card card">
            <div>
              <p className="eyebrow small">Welcome back</p>
              <h2>Hello, Sandeep</h2>
              <p className="meta-line">Reg. no. 2024/CS/221 • BSc (Hons) in Computer Science</p>
            </div>

            <div className="welcome-actions">
              <button type="button" className="primary-button">View results</button>
              <button type="button" className="secondary-button">Download summary</button>
            </div>
          </section>

          <section className="summary-grid" aria-label="Student summary metrics">
            {summaryCards.map((card) => (
              <article key={card.label} className="card metric-card">
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.context}</span>
              </article>
            ))}
          </section>

          <section className="panel-grid">
            <article className="card trend-card">
              <div className="section-header">
                <div>
                  <p className="eyebrow small">Academic progress</p>
                  <h3>Performance trend</h3>
                </div>
                <span className="badge badge-soft">Semester 1</span>
              </div>

              <div className="chart" aria-label="Performance trend chart">
                <div className="chart-grid" aria-hidden="true" />
                <svg viewBox="0 0 460 170" role="img" aria-label="Student performance line chart">
                  <path
                    d="M10 120 C65 118, 80 90, 120 96 S180 62, 220 75 S285 36, 330 54 S386 24, 450 30"
                    fill="none"
                    stroke="#CA5995"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 120 C65 118, 80 90, 120 96 S180 62, 220 75 S285 36, 330 54 S386 24, 450 30 L450 170 L10 170 Z"
                    fill="rgba(202, 89, 149, 0.12)"
                  />
                </svg>
                <div className="chart-labels" aria-hidden="true">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </div>
            </article>

            <article className="card credit-card">
              <div className="section-header compact">
                <div>
                  <p className="eyebrow small">Progress</p>
                  <h3>Credit completion</h3>
                </div>
              </div>

              <div className="credit-ring" aria-label="72 percent of credits completed">
                <div className="credit-ring-inner">
                  <strong>72%</strong>
                  <span>Completed</span>
                </div>
              </div>

              <div className="credit-summary">
                <div>
                  <span>Completed</span>
                  <strong>72 / 120</strong>
                </div>
                <div>
                  <span>Remaining</span>
                  <strong>48</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="card results-card">
              <div className="section-header">
                <div>
                  <p className="eyebrow small">Published results</p>
                  <h3>Latest results</h3>
                </div>
                <button type="button" className="link-button">All results</button>
              </div>

              <div className="results-table" role="table" aria-label="Latest published results">
                <div className="table-head" role="row">
                  <span>Module</span>
                  <span>Semester</span>
                  <span>Grade</span>
                  <span>Credits</span>
                  <span>Attempt</span>
                  <span />
                </div>

                {resultRows.map((row) => (
                  <div key={`${row.code}-${row.grade}`} className="table-row" role="row">
                    <span>
                      <strong>{row.code}</strong>
                      <small>{row.title}</small>
                    </span>
                    <span>{row.semester}</span>
                    <span>{row.grade}</span>
                    <span>{row.credits}</span>
                    <span>{row.attempt}</span>
                    <button type="button" className="table-link">{row.action}</button>
                  </div>
                ))}
              </div>
            </article>

            <article className="card assessments-card">
              <div className="section-header">
                <div>
                  <p className="eyebrow small">Assessment marks</p>
                  <h3>Recent assessments</h3>
                </div>
                <button type="button" className="link-button">View all</button>
              </div>

              <div className="assessment-list">
                {assessmentRows.map((item) => (
                  <div key={`${item.code}-${item.title}`} className="assessment-item">
                    <div className="assessment-copy">
                      <strong>{item.code}</strong>
                      <span>{item.title}</span>
                    </div>
                    <div className="assessment-score">
                      <strong>{item.mark}</strong>
                      <small>{item.percentage}</small>
                    </div>
                    <span className="assessment-date">{item.date}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="card notice-card">
            <div className="notice-icon" aria-hidden="true">i</div>
            <p>
              Repeat attempt recorded for <strong>CS 3102</strong>. The previous ICA component has been carried forward and will continue to count toward the latest result summary.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

const studentNavigation = [["Overview", "overview"], ["Results", "results"], ["Assessments", "assessments"], ["Progress", "progress"], ["Downloads", "downloads"]];

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [results, setResults] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [semesterId, setSemesterId] = useState("");

  useEffect(() => {
    Promise.all([getStudentDashboard(semesterId), getStudentResults(semesterId), getStudentAssessments(semesterId)])
      .then(([summary, resultRows, assessmentRows]) => { setDashboard(summary); setResults(resultRows || []); setAssessments(assessmentRows || []); })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [semesterId]);

  const profile = dashboard?.profile;
  const summary = dashboard?.summary || {};
  const initials = (profile?.fullName || "Student").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const completed = summary.completedCredits;
  const required = summary.requiredCredits;
  const percentage = completed != null && required ? Math.round((completed / required) * 100) : null;
  async function download() {
    setDownloading(true); setError("");
    try { const blob = await downloadStudentResults(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "result-summary.pdf"; link.click(); URL.revokeObjectURL(url); }
    catch (downloadError) { setError(downloadError.message); } finally { setDownloading(false); }
  }

  return <div className="student-shell">
    <aside className="student-sidebar" aria-label="Student navigation">
      <a className="student-brand" href="/student"><span>U</span>UniVerse</a><p className="student-role">Student portal</p>
      <nav className="student-nav">{studentNavigation.map(([label, id], index) => <a key={id} className={index === 0 ? "is-active" : ""} href={`#${id}`}>{label}</a>)}</nav>
      <div className="student-account"><b>{initials}</b><div><strong>{profile?.fullName || "Student"}</strong><small>{profile?.registrationNumber || "Loading profile"}</small></div></div>
      <button className="student-signout" type="button" onClick={() => { localStorage.removeItem("universe_session"); sessionStorage.removeItem("universe_session"); window.location.assign("/"); }}>Sign out</button>
    </aside>
    <main className="student-main">
      <section className="student-intro" id="overview"><p className="student-eyebrow">Student workspace</p><h1>{loading ? "Loading your academic record" : `Welcome, ${firstName(profile?.fullName)}`}</h1><p>{profile?.programme?.name || "Your programme information will appear here."}{profile?.currentContext ? ` · ${profile.currentContext}` : ""}</p>{profile?.academicYear && <p className="student-intake-year">Academic year of enrolment: {profile.academicYear}</p>}<label className="student-semester">View study period <select value={semesterId} onChange={(event) => setSemesterId(event.target.value)}><option value="">All published periods</option>{(dashboard?.semesters || []).map((semester) => <option key={semester.id} value={semester.id}>{semester.label}</option>)}</select></label></section>
      {error && <div className="student-error" role="alert">{error}</div>}
      <section className="student-summary"><StudentMetric label="Current GPA" value={studentNumber(summary.currentGpa)} detail={summary.currentGpaLabel || "Current published semester"} /><StudentMetric label="CGPA" value={studentNumber(summary.cgpa)} detail={summary.calculatedThrough || "Published results in view"} /><StudentMetric label="Core credits" value={completed == null ? "—" : required == null ? completed : `${completed} / ${required}`} detail={semesterId ? "Selected semester" : "Published results"} /><StudentMetric label="Published results" value={summary.latestPublishedResultCount ?? 0} detail="Available to view" /></section>
      <section className="student-grid" id="progress"><article className="student-panel"><StudentTitle eyebrow="Batch performance" title="Grades by subject" /><p className="student-panel-description">Open a subject to see the published grades in your batch.</p><StudentBatchChart rows={dashboard?.batchPerformance || []} /></article><article className="student-panel student-credit"><StudentTitle eyebrow="Programme progress" title={required ? "Core credit completion" : "Core credits in view"} /><strong>{percentage == null ? `${completed ?? "—"} credits` : `${percentage}%`}</strong>{required && <div className="student-progress"><span style={{ width: `${percentage || 0}%` }} /></div>}<p>Completed <b>{completed ?? "—"}</b>{required && <span>Remaining <b>{Math.max(0, required - completed)}</b></span>}</p></article></section>
      <section className="student-panel" id="results"><div className="student-panel-head"><StudentTitle eyebrow="Published results" title="Results by study year" /><a href="#downloads">Download summary</a></div><StudentResults rows={results} loading={loading} /></section>
      <section className="student-panel" id="assessments"><StudentTitle eyebrow="Assessment marks" title="Released assessments" /><div className="student-assessments">{assessments.slice(0, 6).map((item) => <div className="student-assessment" key={item.assessmentId}><div><strong>{item.module.code}</strong><span>{item.title}</span></div><b>{item.grade || "—"}</b><small>{item.semester.label}</small></div>)}{!loading && !assessments.length && <p className="student-empty">No released assessments are available yet.</p>}</div></section>
      <section className="student-download" id="downloads"><div><p className="student-eyebrow">Downloads</p><h2>Official result summary</h2><p>Download a PDF of your published results.</p></div><button type="button" disabled={downloading} onClick={download}>{downloading ? "Preparing download…" : "Download PDF"}</button></section>
    </main>
  </div>;
}

function StudentMetric({ label, value, detail }) { return <article className="student-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function StudentTitle({ eyebrow, title }) { return <div><p className="student-eyebrow">{eyebrow}</p><h2>{title}</h2></div>; }
function StudentResults({ rows, loading }) {
  if (!rows.length) return <p className="student-empty">{loading ? "Loading results…" : "No published results are available yet."}</p>;

  const byYear = new Map();
  const sortedRows = [...rows].sort((a, b) =>
    (a.semester.studyYear ?? Infinity) - (b.semester.studyYear ?? Infinity) ||
    (a.semester.semesterNumber ?? Infinity) - (b.semester.semesterNumber ?? Infinity) ||
    a.module.code.localeCompare(b.module.code) ||
    a.attemptNumber - b.attemptNumber
  );

  for (const row of sortedRows) {
    const yearKey = row.semester.studyYear ?? "other";
    if (!byYear.has(yearKey)) byYear.set(yearKey, new Map());
    const semesters = byYear.get(yearKey);
    if (!semesters.has(row.semester.id)) {
      semesters.set(row.semester.id, { label: row.semester.label, rows: [] });
    }
    semesters.get(row.semester.id).rows.push(row);
  }

  return <div className="student-results-by-year">{[...byYear].map(([year, semesters]) =>
    <section className="student-result-year" key={year}>
      <h3>{year === "other" ? "Other periods" : `Year ${String(year).padStart(2, "0")}`}</h3>
      {[...semesters].map(([id, semester]) => <div className="student-result-semester" key={id}>
        <h4>{semester.label}</h4>
        <div className="student-result-subjects">{[...new Map(semester.rows.map((row) => [row.module.id, row])).values()].map((row) => <StudentResultSubject key={row.module.id} row={row} />)}</div>
      </div>)}
    </section>
  )}</div>;
}
function StudentTrend({ trend }) { if (!trend.length) return <div className="student-chart-empty">Performance trend will appear after GPA values are published.</div>; const values = trend.map((point) => Number(point.value)); const low = Math.min(...values); const spread = Math.max(...values) - low || 1; const points = values.map((value, index) => `${20 + index * (400 / Math.max(1, values.length - 1))},${140 - ((value - low) / spread) * 100}`).join(" "); return <div className="student-chart"><svg viewBox="0 0 440 165"><line x1="20" y1="20" x2="420" y2="20" /><line x1="20" y1="70" x2="420" y2="70" /><line x1="20" y1="120" x2="420" y2="120" /><polyline points={points} />{points.split(" ").map((point, index) => { const [cx, cy] = point.split(","); return <circle key={index} cx={cx} cy={cy} r="4" />; })}</svg><div>{trend.map((point, index) => <span key={index}>{point.label}</span>)}</div></div>; }
function StudentResultSubject({ row }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const panelId = `result-details-${row.resultId}`;
  async function loadDetails() {
    setLoading(true); setError("");
    try { setDetails(await getStudentResultDetails(row.resultId)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  function toggle() {
    setOpen(!open);
    if (!open && !details && !loading) loadDetails();
  }
  return <article className="student-result-subject">
    <button type="button" className="student-result-subject-heading" aria-expanded={open} aria-controls={panelId} onClick={toggle}>
      <span className="student-result-subject-code">{row.module.code}</span>
      <strong>{row.module.title}</strong>
      <span className="student-result-subject-toggle" aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    <section hidden={!open} id={panelId} className="student-attempt-history" aria-label={`${row.module.code} attempt history`} aria-busy={loading}>
      <p className="student-result-credits">Module credits: {row.module.credits}</p>
      <h4>{row.module.code} · All attempts</h4>
      {loading && <p role="status">Loading attempt details…</p>}
      {error && <div role="alert"><p>{error}</p><button type="button" className="student-details-button" onClick={loadDetails}>Try again</button></div>}
      {details && !loading && !error && <>
        {!details.attemptHistory?.length && <p>No attempt history is available.</p>}
        {(details.attemptHistory || []).map((attempt) => <article className="student-attempt-card" key={`${attempt.enrollmentId}-${attempt.resultId ?? "pending"}`}>
          <h5>Attempt {attempt.attemptNumber}{attempt.isCurrent ? " · Current" : ""}</h5>
          <dl>
            <div><dt>Study period</dt><dd>{attempt.semester.label} · {attempt.semester.academicYear}</dd></div>
            <div><dt>Enrollment status</dt><dd>{attempt.enrollmentStatus}</dd></div>
            <div><dt>Enrolled</dt><dd>{attemptDate(attempt.enrolledAt)}</dd></div>
            <div><dt>Result</dt><dd>{attempt.resultId == null ? "Awaiting publication" : "Published"}</dd></div>
            <div><dt>Final grade</dt><dd>{attempt.finalGrade ?? "—"}</dd></div>
            <div><dt>Grade point</dt><dd>{studentNumber(attempt.gradePoint)}</dd></div>
            <div><dt>Exam</dt><dd>{attempt.examType ?? "—"}{attempt.isResit ? " · Resit" : ""}</dd></div>
            <div><dt>Exam date</dt><dd>{attemptDate(attempt.examDate)}</dd></div>
            <div><dt>Exam grade</dt><dd>{attempt.examGrade ?? "—"}</dd></div>
            <div><dt>Published</dt><dd>{attemptDate(attempt.publishedAt)}</dd></div>
          </dl>
          <h6>ICA assessments</h6>
          {attempt.assessments.length ? <ul>{attempt.assessments.map((assessment) => <li key={assessment.assessmentId}>{assessment.title}: <b>{assessment.grade ?? "—"}</b></li>)}</ul> : <p>No released assessments are available for this attempt.</p>}
        </article>)}
      </>}
    </section>
  </article>;
}
function attemptDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB");
}
function StudentBatchChart({ rows }) {
  if (!rows.length) return <div className="student-chart-empty">Batch grades will appear when published results are available.</div>;

  return <div className="student-subject-grid">{rows.map((subject) => {
    const largestCount = Math.max(1, ...subject.gradeCounts.map(({ count }) => count));
    const tickStep = Math.max(1, Math.ceil(largestCount / 4));
    const axisMax = Math.ceil(largestCount / tickStep) * tickStep;
    const ticks = Array.from({ length: axisMax / tickStep + 1 }, (_, index) => axisMax - index * tickStep);
    const accessibleCounts = subject.gradeCounts.map(({ grade, count }) => `${grade}: ${count}`).join(", ");

    return <details className="student-subject-card" key={subject.moduleCode}>
      <summary>
        <span className="student-subject-code">{subject.moduleCode}</span>
        <strong>{subject.moduleTitle}</strong>
        <small>{subject.studentCount} student{subject.studentCount === 1 ? "" : "s"} with a published result</small>
        <span className="student-subject-toggle" aria-hidden="true">+</span>
      </summary>
      <div className="student-grade-chart" role="img" aria-label={`${subject.moduleTitle} grade counts: ${accessibleCounts}. Latest published attempt counted for each student.`}>
        <div className="student-grade-figure" style={{ minWidth: `${Math.max(190, subject.gradeCounts.length * 38 + 32)}px` }}>
          <span className="student-grade-y-title">Count</span>
          <div className="student-grade-plot">
            <div className="student-grade-yaxis">{ticks.map((tick) => <span key={tick}>{tick}</span>)}</div>
            <div className="student-grade-area">
              <div className="student-grade-grid" aria-hidden="true">{ticks.map((tick) => <span key={tick} />)}</div>
              <div className="student-grade-bars">{subject.gradeCounts.map(({ grade, count }) => {
                const height = `${(count / axisMax) * 100}%`;
                return <div className="student-grade-column" key={grade}>
                  <strong style={{ bottom: `calc(${height} + 4px)` }}>{count}</strong>
                  <span style={{ height }} />
                </div>;
              })}</div>
            </div>
          </div>
          <div className="student-grade-xaxis">{subject.gradeCounts.map(({ grade }) => <b key={grade}>{grade}</b>)}</div>
          <span className="student-grade-x-title">Grade</span>
        </div>
        <p>Latest published attempt counted once per student.</p>
      </div>
    </details>;
  })}</div>;
}
function studentNumber(value) { return value == null ? "—" : Number(value).toFixed(2); }
function firstName(value) { return (value || "Student").split(" ")[0]; }
