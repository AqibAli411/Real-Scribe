# Security Considerations

## Architecture Trust Boundaries

- **Browser client (untrusted)** -> REST `/api/**` and STOMP `/ws`.
- **Backend app (trusted)** -> PostgreSQL data plane.
- **Deployment/runtime boundary** -> container and host OS.

## Implemented Security Controls

- **Input validation**
  - `RoomDto` now enforces strict allowlist validation for room id and username.
  - Path variables for room ids are validated against uppercase alphanumeric 6-char format.
- **Rate limiting**
  - API requests are throttled per-client IP (`RateLimitingInterceptor`) to reduce abuse and brute-force scanning.
- **HTTP hardening headers**
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`
- **Error handling**
  - Centralized validation error responses via `GlobalExceptionHandler`.
  - Security-relevant validation and rate-limit events logged without secrets.
- **CORS**
  - Explicit allowlist via `ALLOWED_ORIGINS`; no wildcard origin policy.
- **Secrets hygiene**
  - Added secret-sensitive file patterns to `.gitignore`.
  - Added pre-commit secret scanning hook (`.githooks/pre-commit`).
  - Added CI secret scanning (`gitleaks`) and vulnerability scanning workflow.
- **Container security**
  - Backend container runs as non-root UID/GID.
  - `docker-compose.yml` adds `no-new-privileges`, drops Linux capabilities, uses read-only rootfs for backend, sets resource limits.

## Data Handling

- Avoid logging PII-sensitive payloads, credentials, or tokens.
- Server logs use structured messages with minimal contextual identifiers.
- Text content is persisted in PostgreSQL as JSONB; avoid exposing content in error logs.

## Not Yet Implemented / Needs Product Decisions

- **Authentication and authorization model** is currently minimal. There is no JWT/session auth boundary yet.
- **MFA** not applicable until user authentication exists.
- **CSRF token lifecycle** is typically required when browser cookie auth is introduced.
- **Refresh token rotation** requires planned auth subsystem.

## Operational Guidance

- Set strong production values for:
  - `SPRING_DATASOURCE_*`
  - `ALLOWED_ORIGINS`
- Keep debug logging disabled in production.
- Run CI security workflow on every pull request.
