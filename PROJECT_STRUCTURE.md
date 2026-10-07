# UniVerse UOV: Current Project Structure

UniVerse UOV is an npm-workspaces monorepo. It currently contains a React/Vite client, an Express API, and three reusable JavaScript packages. All active workspace packages use ES modules.

## Repository layout

```text
UniVerse_UOV/
├── apps/
│   ├── client/                         # React single-page application
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   └── icons.svg
│   │   ├── src/
│   │   │   ├── assets/                 # Hero and Vite/React image assets
│   │   │   ├── App.jsx                 # Current root UI component
│   │   │   ├── App.css                 # App-specific styles
│   │   │   ├── index.css               # Global styles
│   │   │   └── main.jsx                # React browser entrypoint
│   │   ├── index.html                  # Vite HTML entrypoint
│   │   ├── package.json
│   │   └── vite.config.js              # Vite React configuration
│   │
│   └── server/                         # Express API
│       ├── src/
│       │   ├── app.js                  # Express app and health route
│       │   ├── data-source.js          # TypeORM database configuration
│       │   └── server.js               # API entrypoint
│       ├── .env.example                # Local server configuration template
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   │   ├── index.js                    # JSDoc user shapes and role guards
│   │   └── package.json
│   ├── shared-validation/
│   │   ├── index.js                    # Zod schemas for user input
│   │   └── package.json
│   └── shared-permissions/
│       ├── index.js                    # Placeholder CASL ability factory
│       └── package.json
│
├── docker/                             # Docker-related files (not described here)
├── docs/                               # Project documentation area
├── package.json                        # Workspace root and combined dev command
├── package-lock.json                   # npm dependency lockfile
└── README.md
```

## Workspace orchestration

The root `package.json` declares the following npm workspaces:

```text
apps/*
packages/*
```

The root development commands are:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Runs client and server together through `concurrently`. |
| `npm run dev:client` | Runs the client workspace development server. |
| `npm run dev:server` | Runs the server workspace development server. |

## Client (`@universe/client`)

The client is a Vite-powered React application using JSX and ES modules.

Execution path:

```text
index.html → src/main.jsx → src/App.jsx
```

- `src/main.jsx` creates the React root and renders `App` inside `StrictMode`.
- `src/App.jsx` is currently the Vite starter-style screen. It imports the local hero, React, and Vite assets and contains a simple stateful counter.
- `vite.config.js` enables React support through `@vitejs/plugin-react`.
- The client lists all three shared workspace packages as dependencies, ready for use in UI code.

## Server (`@universe/server`)

The backend is a plain JavaScript Express application using ESM.

```text
npm run dev -w @universe/server
    → nodemon src/server.js
    → Express app listening on PORT or 4000
```

`src/server.js` currently:

1. Creates an Express app.
2. Enables JSON request parsing with `express.json()`.
3. Exposes `GET /health`, returning `{ "status": "ok" }`.
4. Listens on `process.env.PORT` or port `4000`.

The server depends on Express, Zod, bcrypt, JSON Web Token support, MySQL2, TypeORM, CASL, and the three shared packages. Only the health route is implemented at present; database, authentication, and authorization dependencies are installed but not yet wired into application code.

## Shared packages

### `@universe/shared-types`

This package provides JavaScript-friendly developer tooling via JSDoc rather than TypeScript. Its `index.js` declares the user-role union and user object shapes:

```text
User
├── Student
├── Lecturer
├── Administrator
└── ManagementAssistant
```

It also exports four role-check helper functions:

- `isStudent(user)`
- `isLecturer(user)`
- `isAdministrator(user)`
- `isManagementAssistant(user)`

### `@universe/shared-validation`

This package uses Zod to validate user-registration-style input. It exports:

- `studentSchema`
- `lecturerSchema`
- `administratorSchema`
- `managementAssistantSchema`
- `userSchema` — a discriminated union keyed by `role`

All schemas require a valid email, full name, and password with a minimum length of eight characters. Student, lecturer, administrator, and management-assistant records then add their own role-specific fields.

### `@universe/shared-permissions`

This package is reserved for CASL authorization definitions. `defineAbilityFor(user)` is currently a documented placeholder that returns `null`; role defaults and per-user permission overrides have not been implemented.

## Module format and dependencies

Each active workspace package declares `"type": "module"`, so JavaScript source uses standard ESM syntax (`import` and `export`). Workspace dependencies use npm's `"*"` version range, allowing local packages to be resolved through the monorepo workspace configuration.

## Current implementation status

The client and server have runnable minimal entrypoints. The shared-types and shared-validation packages provide the initial common model and input-validation layer. API feature modules, database entities/connections, authentication flows, authorization rules, and domain-specific client pages are not yet present in the current file structure.
