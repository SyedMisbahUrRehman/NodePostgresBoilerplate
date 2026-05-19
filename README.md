# Node.js + Express + TypeScript + Prisma + PostgreSQL / SQLite

Production-oriented REST API boilerplate with JWT access tokens, opaque refresh tokens (SHA-256 hashed in the database), Argon2 password hashing, SMTP email (password reset + optional email verification), structured env validation, and consistent JSON response envelopes.

## Requirements

- Node.js 20+
- PostgreSQL 14+ for production
- SQLite for local development

## Quick start

1. Copy environment file and adjust secrets. The example uses SQLite for local development:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies and generate Prisma Client:

   ```bash
   npm install
   npm run db:generate
   ```

3. Create the local SQLite database and run migrations:

   ```bash
   npm run db:migrate
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | `tsx watch` on `src/server.ts`       |
| `npm run build`   | Compile TypeScript to `dist/`        |
| `npm run typecheck` | `tsc --noEmit`                    |
| `npm start`       | Run compiled app from `dist/`        |
| `npm run lint`    | ESLint on `src/`                     |
| `npm run format`  | Prettier (`src/`) + `prisma format` for both schemas |
| `npm run format:check` | Prettier check on `src/` only |
| `npm run db:generate` | Generate Prisma Client for `DB_PROVIDER` |
| `npm run db:migrate`  | Run migrations for `DB_PROVIDER` |
| `npm run db:push`     | Push schema for `DB_PROVIDER` (prototyping) |
| `npm run db:studio`   | Prisma Studio for `DB_PROVIDER` |
| `npm run db:generate:postgres` | Generate Prisma Client for PostgreSQL |
| `npm run db:migrate:postgres`  | Run PostgreSQL migrations (dev) |
| `npm run db:migrate:deploy:postgres` | Apply committed PostgreSQL migrations in production (`migrate deploy`) |
| `npm run db:generate:sqlite`   | Generate Prisma Client for SQLite |
| `npm run db:migrate:sqlite`    | Run SQLite migrations |

## Environment

All variables are validated at startup via Zod in [`src/config/env.ts`](src/config/env.ts). See [`.env.example`](.env.example) for descriptions.

Notable flags:

- **`DB_PROVIDER`**: `sqlite` for local development or `postgresql` for production. SQLite is rejected when `NODE_ENV=production`.
- **`DATABASE_URL`**: must match `DB_PROVIDER` (`file:./dev.db` for SQLite, `postgresql://...` or `postgres://...` for Postgres).
- **`LOG_LEVEL`**: `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` \| `silent` (Pino).
- **`ENABLE_REQUEST_LOGS`**: `true` / `false` — HTTP access-style logs via `pino-http`.
- **`ENABLE_DEBUG_LOGS`**: `true` / `false` — when `NODE_ENV=development`, enables verbose Prisma query logging.
- **`ENABLE_STACK_TRACE`**: `true` / `false` — include `stack` on JSON error responses (avoid in production).
- **`PORT`**: HTTP listen port.
- **`TRUST_PROXY`**: forwarded for `X-Forwarded-*` when behind a reverse proxy (`true`, `false`, or hop count).
- **`CORS_ORIGIN`**: comma-separated browser origins, or `*` for development. In **`NODE_ENV=production`**, wildcard `*` is rejected — use an explicit list.
- **`CORS_CREDENTIALS`**: `true` / `false`. Must be `false` when `CORS_ORIGIN` is `*` (browsers disallow credentialed wildcard CORS). Use `true` only with an explicit allowlist of real origins.
- **`AUTH_RATE_LIMIT_WINDOW_MS` / `AUTH_RATE_LIMIT_MAX`**: stricter limits for all routes under `{API_PREFIX}/auth` (in addition to the global limiter).
- **`RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX`**: global API rate limit (excluding `GET /health`).
- **`EMAIL_VERIFICATION_ON_SIGNUP`**: when `true`, sends a verification email on signup, **does not issue JWT/refresh tokens until the email is verified**, and blocks `login` / `refresh-token` until `emailVerifiedAt` is set (via `POST /auth/verify-email`).

JWT secrets must be at least **32 characters** in all environments (enforced by env schema).

## Database Providers

Prisma does not allow switching the datasource provider from `DATABASE_URL` alone, so this project keeps provider-specific schemas:

- [`prisma/schema.prisma`](prisma/schema.prisma) is the PostgreSQL schema and production default.
- [`prisma/sqlite/schema.prisma`](prisma/sqlite/schema.prisma) is the local development SQLite schema.

Use `.env` to select the provider:

```env
# local development
NODE_ENV=development
DB_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
```

```env
# production
NODE_ENV=production
DB_PROVIDER=postgresql
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db?schema=public
```

The `db:*` scripts route Prisma to the correct schema and fail fast if `DB_PROVIDER` and `DATABASE_URL` do not agree.

### PostgreSQL migrations (production)

Initial schema is versioned under [`prisma/migrations`](prisma/migrations) for PostgreSQL. In production, run migrations before starting the app, for example:

```bash
npm run db:migrate:deploy:postgres
```

Use `npm run db:migrate:postgres` during development to create new migrations. SQLite uses a separate migration history under [`prisma/sqlite/migrations`](prisma/sqlite/migrations).

## API

Base path: `{API_PREFIX}` (default `/api/v1`).

### Health

- `GET /health` — liveness JSON `{ "status": "ok" }` (not under `API_PREFIX`).

### Auth (`{API_PREFIX}/auth`)

| Method | Path               | Body                                                                 | Auth   |
| ------ | ------------------ | -------------------------------------------------------------------- | ------ |
| POST   | `/signup`          | `{ "email", "password" }` — returns **`accessToken` + `refreshToken`** when `EMAIL_VERIFICATION_ON_SIGNUP=false`. When `EMAIL_VERIFICATION_ON_SIGNUP=true`, returns **`user` only** (no tokens) until `POST /verify-email`, then the user can `POST /login`. |
| POST   | `/login`           | `{ "email", "password" }` — blocked with **`EMAIL_NOT_VERIFIED`** (403) when verification is enabled and the email is not verified yet. |
| POST   | `/refresh-token`   | `{ "refreshToken" }`                                                 | —      |
| POST   | `/logout`          | `{ "refreshToken" }`                                                 | —      |
| POST   | `/forgot-password` | `{ "email" }`                                                      | —      |
| POST   | `/reset-password`  | `{ "token", "password" }` (`token` from email link query)          | —      |
| POST   | `/verify-email`    | `{ "token" }` (from verification email)                            | —      |
| GET    | `/me`              | —                                                                    | Bearer |

Password rules: minimum **8** characters, max **128**, at least **one letter** and **one digit** (see Zod schemas in [`src/modules/auth/auth.validation.ts`](src/modules/auth/auth.validation.ts)).

### Response shape

**Success:**

```json
{
  "success": true,
  "code": "LOGIN_SUCCESSFUL",
  "message": "Login successful.",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password.",
  "details": {}
}
```

Machine-readable codes live in [`src/common/codes.ts`](src/common/codes.ts); default user-facing copy in [`src/common/messages.ts`](src/common/messages.ts).

## SMTP

Configure `SMTP_*` in `.env`. For local testing, [Mailtrap](https://mailtrap.io/) or [Ethereal](https://ethereal.email/) work well. If `SMTP_USER` / `SMTP_PASS` are empty, Nodemailer still works for providers that use IP allowlisting without auth (uncommon).

Password reset emails link to `{APP_URL}/reset-password?token=...` — point your frontend to that route or change the URL builder in [`src/lib/mailer.ts`](src/lib/mailer.ts).

## Security notes

- Refresh tokens are **never** stored in plaintext; only `sha256` of the opaque token is persisted.
- Forgot-password responses are generic (`PASSWORD_RESET_EMAIL_SENT`) to reduce email enumeration.
- Argon2 is used for password hashes.
- Helmet (with JSON-API-friendly defaults), CORS aligned with browser rules, JSON body size limit, global rate limiting plus **stricter limits on `/auth`**, and **JWT access tokens pinned to `HS256`**.
- `getEnv()` lazy-loads validated configuration on first use (after `dotenv` in `server.ts`).

## Project layout

- [`src/server.ts`](src/server.ts) — loads `.env`, validates config, bootstraps the app.
- [`src/app.ts`](src/app.ts) — Express middleware and routes.
- [`src/modules/auth`](src/modules/auth) — auth routes, controller, service, validation.
- [`prisma/schema.prisma`](prisma/schema.prisma) — production PostgreSQL data models.
- [`prisma/sqlite/schema.prisma`](prisma/sqlite/schema.prisma) — local SQLite data models.

## License

MIT
