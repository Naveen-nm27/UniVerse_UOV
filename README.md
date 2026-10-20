# UniVerse UOV

Integrated student services for the University of Vavuniya. The integrated implementation follows the supplied V04 database: Management Assistants create accounts, enter grades and record verification statuses; lecturers, HODs and deans view authorised records.

Read [the branch audit and integration report](docs/FEATURE_INTEGRATION.md) for the reconciled features, validation and remaining integrations. The canonical database is [schema-v04.sql](apps/server/database/schema-v04.sql). Historical schemas are archived under `docs/legacy`.

## Local development

Use Node 22.12 or newer and MySQL 8. Copy `apps/server/.env.example` to `apps/server/.env` and set the database credentials and a strong `JWT_SECRET`.

For a new Docker installation, copy `docker/.env.example` to `docker/.env`, set its password to match the server configuration, then run:

```powershell
docker compose --env-file docker/.env up -d
npm install
npm run db:check-v04 -w apps/server
npm run dev
```

Docker installs V04 only when its MySQL data volume is empty. Existing databases require a separate migration or a new database; the V04 SQL contains destructive fresh-install statements. `npm run db:setup-v04 -w apps/server` creates a separate `universe_uov_v04` database, adds the bootstrap MA and updates this checkout's database name. It refuses to overwrite an existing database.

This checkout already uses the separately created V04 database. The original `universe_uov` database is retained. Bootstrap MA sign-in details are in the ignored `.local/v04-access.json`; first sign-in requires a password change. For a fresh Docker volume that already created V04, use `npm run create:ma -w apps/server` with `MA_EMAIL`, `MA_NAME` and `MA_PASSWORD` set to create its first MA.

The client runs at `http://127.0.0.1:5173`. The API runs at `http://localhost:4000`.

## Demo data

With the MySQL container running and dependencies installed, run from the repository root:

```powershell
npm run seed:demo
```

The command uses `apps/server/.env` to connect to your container's database
(`localhost:3307`, `universe_uov_v04` by default). It also works from the server
workspace with `npm run seed:demo -w apps/server`. The V04 schema must already
be installed; this command does not recreate the database.

It adds 28 fictional students, accounts for all five staff roles, a demo ICT
programme, three modules across three terms, four offerings, timetable slots,
attendance, ICA grades, 86 final results with status histories, and two resit
attempts. Dates are based on the current campus teaching half-year when first
seeded. Existing records and grade scales are preserved; an empty grade scale
gets a fictional A/B/C/F scale for the demo.

| Role     | Email                                                    |
| -------- | -------------------------------------------------------- |
| MA       | `demo.seed.ma@example.test`                              |
| Lecturer | `demo.seed.lecturer@example.test`                        |
| HOD      | `demo.seed.hod@example.test`                             |
| Dean     | `demo.seed.dean@example.test`                            |
| Admin    | `demo.seed.admin@example.test`                           |
| Student  | `demo.seed.student01@example.test` (through `student28`) |

All new demo accounts use **`UniVerseDemo@2026!`**, with no first-login password
change. To use another password, set `DEMO_PASSWORD` before the first run:

```powershell
$env:DEMO_PASSWORD = "YourOwnDemoPassword@2026!"
npm run seed:demo
Remove-Item Env:DEMO_PASSWORD
```

The seed commits in one transaction and records completion in `AUDIT_LOG`.
Running it again leaves the demo records and any subsequent edits unchanged,
including passwords. Conflicting demo emails or codes cause the transaction
to roll back. The command refuses to run with `NODE_ENV=production`.
Academic calculation settings remain controlled by your existing configuration.

## Checks

```powershell
npm test
npm run lint
npm run build
npm run format:check
npm run test:docker -w apps/server
npm run test:seed:demo -w apps/server
npm audit
```

Docker checks create and remove a uniquely named test database on the configured MySQL server. They leave application data intact and include headless Edge checks for all six roles. Set `EDGE_PATH` when Edge is installed elsewhere. `npm run test:v04 -w apps/server` alternatively launches a temporary MySQL instance; set `MYSQLD_PATH` for a different installation.

The demo seed check uses a disposable database to verify rollback, preservation
of existing data, repeated runs, resit relationships, and sign-in for all six roles.

Academic calculation settings remain optional until university policy is approved. Unconfigured repeat/pass rules, ambiguous programme GPA and unsupported requirement totals are shown as unavailable.
