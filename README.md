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

## Checks

```powershell
npm test
npm run lint
npm run build
npm run format:check
npm run test:docker -w apps/server
npm audit
```

Docker checks create and remove a uniquely named test database on the configured MySQL server. They leave application data intact and include headless Edge checks for all six roles. Set `EDGE_PATH` when Edge is installed elsewhere. `npm run test:v04 -w apps/server` alternatively launches a temporary MySQL instance; set `MYSQLD_PATH` for a different installation.

Academic calculation settings remain optional until university policy is approved. Unconfigured repeat/pass rules, ambiguous programme GPA and unsupported requirement totals are shown as unavailable.
