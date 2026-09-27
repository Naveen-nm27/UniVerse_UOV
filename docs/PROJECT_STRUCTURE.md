# UniVerse UOV Project Structure

This document describes the repository as it exists now and the intended organization as the application grows. For visual design rules and role-specific UI guidance, also read [README.md](./README.md).

## Repository overview

UniVerse UOV is an npm-workspaces monorepo containing:

- A React 19 and Vite client.
- An Express 5 and TypeORM server.
- Shared validation, type-description, and permission packages.
- Project documentation.
- Root-level Docker Compose and npm orchestration.

All active JavaScript workspaces use ES modules.

## Current repository layout

Only files and directories that currently exist are shown below.

```text
UniVerse_UOV/
|-- apps/
|   |-- client/
|   |   |-- public/
|   |   |   |-- favicon.svg
|   |   |   `-- icons.svg
|   |   |-- src/
|   |   |   |-- api/
|   |   |   |   `-- users.js
|   |   |   |-- assets/
|   |   |   |   |-- hero.png
|   |   |   |   |-- react.svg
|   |   |   |   `-- vite.svg
|   |   |   |-- components/
|   |   |   |   `-- LoginForm.jsx
|   |   |   |-- App.css
|   |   |   |-- App.jsx
|   |   |   |-- index.css
|   |   |   `-- main.jsx
|   |   |-- index.html
|   |   |-- package.json
|   |   `-- vite.config.js
|   `-- server/
|       |-- src/
|       |   |-- api/
|       |   |   `-- users.js
|       |   |-- controllers/
|       |   |   `-- user.controller.js
|       |   |-- entities/
|       |   |   |-- ManAssistence.js
|       |   |   `-- User.js
|       |   |-- routes/
|       |   |   `-- user.routes.js
|       |   |-- services/
|       |   |   `-- user.service.js
|       |   |-- app.js
|       |   |-- data-source.js
|       |   `-- server.js
|       |-- .env.example
|       `-- package.json
|-- docs/
|   |-- MA_STAFF_UI.md
|   |-- PROJECT_STRUCTURE.md
|   `-- README.md
|-- packages/
|   |-- shared-permissions/
|   |   |-- index.js
|   |   `-- package.json
|   |-- shared-types/
|   |   |-- index.js
|   |   `-- package.json
|   `-- shared-validation/
|       |-- index.js
|       `-- package.json
|-- .gitignore
|-- docker-compose.yml
|-- package-lock.json
|-- package.json
`-- README.md
```

## Root workspace

The root `package.json` includes the `apps/*` and `packages/*` npm workspaces.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the client and server together using `concurrently`. |
| `npm run dev:client` | Start the Vite development server. |
| `npm run dev:server` | Start the Express server through Nodemon. |

`docker-compose.yml` contains the repository's container orchestration configuration. Review it before changing local database or service startup behaviour.

## Client application

The browser execution path is:

```text
apps/client/index.html
  -> src/main.jsx
  -> src/App.jsx
  -> src/components/LoginForm.jsx
  -> src/api/users.js
```

### Current responsibilities

- `main.jsx` creates the React root and renders the application in `StrictMode`.
- `App.jsx` currently renders the authentication screen.
- `LoginForm.jsx` owns login form state, client validation, session storage, and post-login redirection.
- `api/users.js` sends authentication requests to the Express API.
- `App.css` contains the current login-page design system and responsive styles.
- `index.css` contains global font and browser-level styles.

There is no public registration page. Management Assistants create user accounts.

### Current limitation

The current login UI uses older lowercase role names and `/.../dashboard` paths. The V04 database uses uppercase role codes and stores the route in `ROLES.dashboard_path`:

```text
STUDENT -> /student
LECTURER -> /lecturer
HOD -> /hod
DEAN -> /dean
MA -> /ma
ADMIN -> /admin
```

Authentication integration must resolve this difference. Prefer a server-returned dashboard path derived from the database instead of maintaining a second client-side mapping.

## Server application

The server execution path is:

```text
apps/server/src/server.js
  -> initialize AppDataSource
  -> start Express app
  -> mount /api/users routes
  -> controller
  -> service
  -> TypeORM entities / MySQL
```

### Layer responsibilities

| Layer | Responsibility |
| --- | --- |
| `server.js` | Initialize the database and start the HTTP server. |
| `app.js` | Configure Express, CORS, JSON parsing, health checks, and routes. |
| `routes/` | Declare endpoint paths and connect them to controllers. |
| `controllers/` | Translate HTTP requests/responses and status codes. |
| `services/` | Apply validation, authentication, hashing, token, and business logic. |
| `entities/` | Map application entities to MySQL through TypeORM. |
| `data-source.js` | Configure the MySQL connection and registered entities. |
| `api/` | Legacy/server-side API helper code; review before expanding it. |

Current routes include:

- `GET /health`
- `POST /api/users/register`
- `POST /api/users/login`

The registration endpoint remains server-side for future protected MA account-management workflows. It must not become public self-registration.

## Database alignment

The authoritative design reference is `UniVerse_UOV_V04.sql`, supplied outside this repository. It defines uppercase table names and a normalized identity model including:

- `USERS`, `ROLES`, and role profile tables.
- `MA_STAFF`, `STUDENTS`, `LECTURERS`, `DEANS`, and `ADMINISTRATORS`.
- Departments, programmes, batches, semesters, modules, and offerings.
- Timetables, halls, fingerprint devices, lecture sessions, and attendance.
- Enrolments, ICA grades, exams, final results, and result history.
- Permissions, documents, and audit logging.

The current TypeORM entities are transitional and do not yet fully match V04. For example, `User.js` still stores legacy role/profile fields directly, and `ManAssistence.js` maps `man_staff` with different column names from V04's `MA_STAFF`. New backend work should migrate toward the V04 schema rather than treating these transitional definitions as authoritative.

Do not enable destructive schema synchronization against a populated V04 database. Use reviewed migrations for schema changes.

## Shared packages

### `@universe/shared-types`

Contains JSDoc user shapes and role-check helpers. Its current role vocabulary predates V04 and must be updated during database/authentication integration.

### `@universe/shared-validation`

Contains Zod schemas for user input. Its current user schemas were created around the earlier registration model and should be revised for MA-managed user creation and V04 integer identifiers.

### `@universe/shared-permissions`

Contains the placeholder `defineAbilityFor(user)` function. CASL role defaults and user permission overrides are not implemented yet.

Backend permission checks remain mandatory even when the frontend hides an action.

## Target client structure

As features are implemented, organize the client by shared primitives and business feature. Do not create empty directories merely to match this example.

```text
apps/client/src/
|-- api/                    # HTTP clients grouped by domain
|-- assets/                 # Images and other static imports
|-- components/
|   |-- common/             # Button, Field, Modal, Table, StatusBadge
|   `-- layout/             # AppShell, Sidebar, TopBar
|-- features/
|   |-- auth/
|   |-- users/
|   |-- timetable/
|   |-- attendance/
|   `-- results/
|-- pages/
|   |-- student/
|   |-- lecturer/
|   |-- hod/
|   |-- dean/
|   |-- ma/
|   `-- admin/
|-- styles/                 # Tokens and shared styles
|-- App.jsx
`-- main.jsx
```

Use a central router, authentication provider, protected routes, and shared application shell as dashboards are introduced.

## Target server structure

Keep the existing route-controller-service separation and grow it by domain:

```text
apps/server/src/
|-- config/
|-- middleware/             # Authentication, authorization, errors
|-- entities/
|-- migrations/
|-- routes/
|-- controllers/
|-- services/
|-- repositories/           # Add only if query complexity warrants it
|-- validators/
|-- app.js
|-- data-source.js
`-- server.js
```

Cross-cutting concerns such as authentication, error formatting, audit logging, and permission checks belong in middleware or shared services, not repeated in controllers.

## Naming and implementation conventions

- Use PascalCase for React components and TypeORM entity exports.
- Use camelCase for JavaScript variables and functions.
- Use lowercase feature-oriented filenames consistently once a convention is selected.
- Keep route declarations thin and business logic in services.
- Keep API calls outside presentational React components.
- Never expose password hashes, JWT secrets, device secrets, or internal audit values.
- Derive access from the authenticated server-side identity.
- Add new source files to the closest existing feature/layer instead of the repository root.
- Update this document whenever directories, primary execution paths, or architectural boundaries change.

## Related documentation

- [UI design and role guide](./README.md)
- [Management Assistant UI and use cases](./MA_STAFF_UI.md)
- [Root project overview](../README.md)
- [Client setup notes](../apps/client/README.md)
