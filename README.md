# Real-Scribe

Real-time collaborative whiteboard and text editor: **React (Vite)** + **Spring Boot** + **PostgreSQL** + **STOMP/WebSocket**.

## Local development

1. **PostgreSQL** — Create a database (e.g. `realscribe`). Configure credentials in `Backend/src/main/resources/application-local.properties` (copy from `application-local.properties.example`; that file is gitignored).

2. **Backend** — From `Backend/`:

   ```bash
   mvn spring-boot:run
   ```

   API default: `http://localhost:8080`.

3. **Frontend** — From `Frontend/`:

   ```bash
   npm install
   npm run dev
   ```

   The dev server proxies `/api` and `/ws` to the backend (see `vite.config.js`). See `Frontend/.env.example` for production-style overrides.

## Deploying the frontend (e.g. Vercel)

- Set **Root Directory** to `Frontend`.
- Set **`VITE_API_URL`** to your HTTPS API base URL (no trailing slash), then redeploy.
- Ensure the Spring Boot app allows your site origin (**`ALLOWED_ORIGINS`** / `WebConfig`).

## Deploying the backend

Use your host’s env vars for JDBC (`SPRING_DATASOURCE_*`, etc.) and the same CORS origins as your frontend URL.

### Production environment variables

#### Backend (Render)

- `SPRING_DATASOURCE_URL` (Neon PostgreSQL URL)
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO` (recommended: `update`)
- `SPRING_JPA_SHOW_SQL` (recommended: `false`)
- `ALLOWED_ORIGINS` (comma-separated exact origins, e.g. `https://your-app.vercel.app`)
- `LOG_LEVEL_ROOT` (recommended: `INFO`)

#### Frontend (Vercel)

- `VITE_API_URL` (Render backend HTTPS URL, no trailing slash)

## Security tooling

- Local secret guard hook:
  - `mkdir -p .git/hooks && ln -sf ../../.githooks/pre-commit .git/hooks/pre-commit`
- CI security workflow:
  - `.github/workflows/security.yml` runs secret scanning, dependency checks, and container scanning.
- Security docs:
  - `SECURITY.md`
  - `docs/SECURITY-CONSIDERATIONS.md`
  - `docs/SECURITY-INCIDENTS.md`
