# UniVerse UOV UI Guide

This document is the shared design reference for the UniVerse UOV frontend. Read it before adding or changing screens so every role receives one coherent product experience. For the Management Assistant workspace, also read [MA_STAFF_UI.md](./MA_STAFF_UI.md).

## 1. Product context

UniVerse is an integrated student-services system for the University of Vavuniya. Users do **not** self-register. A Management Assistant (MA) creates accounts, and users sign in with the credentials they receive. After authentication, the server determines the user's role and dashboard. Never ask the user to choose a role during login and never trust a client-supplied role.

The current frontend is React 19 with Vite. Source files are in `apps/client/src`.

## 2. Authoritative roles and routes

The V04 database schema is the source of truth. The `ROLES` table contains both `role_code` and `dashboard_path`.

| Database role | Audience | Dashboard path |
| --- | --- | --- |
| `STUDENT` | Student | `/student` |
| `LECTURER` | Lecturer | `/lecturer` |
| `HOD` | Head of Department | `/hod` |
| `DEAN` | Dean | `/dean` |
| `MA` | Management Assistant | `/ma` |
| `ADMIN` | Administrator | `/admin` |

The login API should return the authenticated user's role and preferably the database-provided dashboard path. Route guards must verify the session and role before rendering a protected page.

> Integration warning: the current `LoginForm.jsx` still maps older lowercase role names and older `/.../dashboard` paths. Update it to match the table above when the V04 entities and authentication API are integrated.

## 3. Visual identity

Use this palette consistently:

| Token | Hex | Primary use |
| --- | --- | --- |
| Cream | `#FFF1D3` | Warm page backgrounds, light brand surfaces |
| Peach | `#FFB090` | Highlights, small accents, badges |
| Pink | `#CA5995` | Links, focus states, secondary actions |
| Plum | `#5D1C6A` | Primary actions, navigation, headings |
| Ink | `#36123F` | Main text; derived from the plum family |

Prefer CSS custom properties instead of repeating hex values:

```css
:root {
  --color-cream: #fff1d3;
  --color-peach: #ffb090;
  --color-pink: #ca5995;
  --color-plum: #5d1c6a;
  --color-ink: #36123f;
  --color-surface: #fffaf0;
  --color-border: #dfcad8;
  --color-muted: #80667f;
}
```

Do not use all four brand colours at equal visual weight. Plum should anchor the interface, cream should provide space, and pink/peach should be accents.

## 4. Typography and tone

- Use **DM Sans** for interface text, labels, tables, buttons, and navigation.
- Use **Georgia** for large page or authentication headings when a more editorial feel is appropriate.
- Keep body text at least `14px` and interactive labels at least `12px`.
- Prefer sentence case: “Create student account”, not “CREATE STUDENT ACCOUNT”.
- Write short, direct labels. Explain university-specific actions in helper text.
- Use “Management Assistant” on first mention and “MA” where space is limited.

## 5. Layout system

### Authentication pages

Use the existing split layout:

- Left: plum brand/story panel with restrained decorative shapes.
- Right: light form panel with one clear task.
- Hide the decorative panel below `820px`; retain a compact brand header.
- Keep the form around `470px` wide so fields remain easy to scan.

The login screen is the reference implementation:

- `apps/client/src/components/LoginForm.jsx`
- `apps/client/src/App.css`

Do not add a public registration link or registration page.

### Application dashboards

Use a stable application shell for every role:

1. A left sidebar on desktop and drawer navigation on mobile.
2. A top bar containing the current page title, notifications, and user menu.
3. A content area with a maximum readable width and generous spacing.
4. A breadcrumb only when a user is more than one level below a dashboard.

Recommended dimensions:

- Sidebar: `248px` expanded.
- Top bar: `64px` to `72px` high.
- Desktop content padding: `32px`.
- Mobile content padding: `16px` to `20px`.
- Card radius: `12px` to `16px`.
- Control height: at least `44px`; use `52px` to `56px` for important forms.

## 6. Reusable component patterns

Build shared components before duplicating markup across dashboards.

### Buttons

- **Primary:** plum background, white text. One primary action per section.
- **Secondary:** transparent or cream background with plum border/text.
- **Destructive:** reserved for irreversible actions and must request confirmation.
- Always show disabled and loading states. Preserve the button width while loading.

### Forms

- Place labels above controls; placeholders are examples, not labels.
- Show validation beside the field and use `aria-invalid`/`aria-describedby`.
- Use server errors that help the user recover without revealing security details.
- Mark optional fields explicitly; do not rely only on an asterisk.
- For long MA forms, group related fields under titled sections.

### Cards and metrics

- Use white or warm-white cards on the cream/light background.
- Keep shadows subtle; borders should define most dashboard cards.
- Metric cards need a label, value, and context such as a date or comparison.
- Colour must not be the only way to communicate status.

### Tables

- Use tables for users, modules, enrolments, attendance, grades, and audit records.
- Include search/filter controls above the table and pagination below it.
- Keep row actions in a consistent final column.
- On small screens, allow horizontal scrolling or switch each row to a labelled card.
- Use a clear empty state instead of displaying a blank table.

### Feedback

- Use inline messages for field errors.
- Use toast notifications for successful background actions.
- Use a page-level error state when core data cannot load.
- Provide skeletons or clear progress indicators for loading views.
- Confirm destructive or high-impact actions in a modal.

## 7. Role-oriented information architecture

Only expose functions authorised by the backend. Hiding a control is not a security boundary.

### Student

Prioritise current modules, timetable, attendance, published grades/results, GPA/CGPA, and documents.

### Lecturer

Prioritise assigned module offerings, lecture sessions, class lists, attendance views, and result-status visibility. A lecturer must not receive MA-only grade entry controls unless future permissions explicitly allow them.

### HOD

Prioritise department overview, lecturers, programmes/modules, timetable visibility, and result-status visibility.

### Dean

Prioritise academic overview, verification-flow visibility, programmes, and published/awaiting results.

### Management Assistant

Prioritise user creation, batches, programmes, offerings, timetables, devices, ICA/final-grade entry, and result status updates. MA data-entry screens should make the active student/module/semester context impossible to miss.

### Administrator

Prioritise system administration, permissions, account state, audit logs, and operational settings.

## 8. Data and state rules

- Treat V04 SQL names and relationships as authoritative when shaping frontend data.
- IDs are MySQL unsigned integers in V04; do not assume UUIDs.
- Display friendly names/codes, but submit stable IDs.
- The server owns role, permissions, result workflow rules, and dashboard destination.
- Show only `PUBLISHED` final results to students.
- Display dates and times consistently for the University of Vavuniya locale/timezone.
- Never display `password_hash`, device secrets, or token contents.
- Clear session data and protected cached state on logout.

## 9. Accessibility requirements

- Use semantic landmarks: `header`, `nav`, `main`, `section`, and `footer`.
- Every control needs an accessible name.
- All features must work with a keyboard and have a visible focus indicator.
- Maintain WCAG AA contrast, especially when using peach or pink on cream.
- Use `aria-live` or `role="alert"` for asynchronous feedback where appropriate.
- Honour `prefers-reduced-motion`.
- Decorative graphics must be hidden from assistive technology.
- Do not communicate grade/result state using colour alone; include text or icons.

## 10. Responsive behaviour

Design mobile-first and test at approximately `320px`, `768px`, `1024px`, and `1440px`.

- No page should create accidental horizontal scrolling.
- Navigation must collapse into an accessible drawer on small screens.
- Forms become one column on mobile.
- Action bars may stack, but the primary action should remain easy to find.
- Dense tables must scroll within their own labelled region or become cards.
- Touch targets should be at least `44px` high/wide where practical.

## 11. Suggested frontend structure

As the UI grows, use a feature-oriented structure similar to:

```text
apps/client/src/
  api/                 API request functions
  assets/              Static visual assets
  components/
    common/            Buttons, fields, modal, status badge
    layout/            App shell, sidebar, top bar
  features/
    auth/
    users/
    timetable/
    attendance/
    results/
  pages/
    student/
    lecturer/
    hod/
    dean/
    ma/
    admin/
  styles/              Tokens and shared styles
```

Keep API access outside presentational components. Centralise authentication/session handling and protected routing rather than reading storage independently in every page.

## 12. Agent implementation checklist

Before considering a UI task complete, verify:

- The screen uses the approved palette and shared patterns.
- It works for the intended database role and permission.
- Loading, empty, success, validation, and server-error states exist.
- Keyboard navigation and focus styles work.
- Mobile and desktop layouts are usable.
- No public self-registration has been introduced.
- Sensitive or unauthorised data is not rendered.
- API contracts match the V04 schema rather than obsolete entities.
- Client lint and production build pass.

When a requested design conflicts with this guide or the V04 schema, prefer the schema for data/security behaviour and clearly document any intentional visual-system exception.
