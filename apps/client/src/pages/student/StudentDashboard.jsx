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

export default function StudentDashboard() {
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
