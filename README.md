# Node.js + Express + TypeScript + Prisma + PostgreSQL

Production-oriented REST API boilerplate with JWT access tokens, opaque refresh tokens (SHA-256 hashed in the database), Argon2 password hashing, SMTP email (password reset + optional email verification), structured env validation, and consistent JSON response envelopes.

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Quick start

1. Copy environment file and adjust secrets:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies and generate Prisma Client:

   ```bash
   npm install
   npm run db:generate
   ```

3. Create the database and run migrations:

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
| `npm start`       | Run compiled app from `dist/`        |
| `npm run lint`    | ESLint on `src/`                     |
| `npm run format`  | Prettier write                       |
| `npm run db:generate` | `prisma generate`                |
| `npm run db:migrate`  | `prisma migrate dev`             |
| `npm run db:push`     | `prisma db push` (prototyping)   |
| `npm run db:studio`   | Prisma Studio                    |

## Environment

All variables are validated at startup via Zod in [`src/config/env.ts`](src/config/env.ts). See [`.env.example`](.env.example) for descriptions.

Notable flags:

- **`LOG_LEVEL`**: `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` \| `silent` (Pino).
- **`ENABLE_REQUEST_LOGS`**: `true` / `false` — HTTP access-style logs via `pino-http`.
- **`ENABLE_DEBUG_LOGS`**: `true` / `false` — when `NODE_ENV=development`, enables verbose Prisma query logging.
- **`ENABLE_STACK_TRACE`**: `true` / `false` — include `stack` on JSON error responses (avoid in production).
- **`PORT`**: HTTP listen port.
- **`TRUST_PROXY`**: forwarded for `X-Forwarded-*` when behind a reverse proxy (`true`, `false`, or hop count).
- **`EMAIL_VERIFICATION_ON_SIGNUP`**: sends verification email and creates `EmailVerificationToken` rows.

JWT secrets must be at least **32 characters** in all environments (enforced by env schema).

## API

Base path: `{API_PREFIX}` (default `/api/v1`).

### Health

- `GET /health` — liveness JSON `{ "status": "ok" }` (not under `API_PREFIX`).

### Auth (`{API_PREFIX}/auth`)

| Method | Path               | Body                                                                 | Auth   |
| ------ | ------------------ | -------------------------------------------------------------------- | ------ |
| POST   | `/signup`          | `{ "email", "password" }`                                          | —      |
| POST   | `/login`           | `{ "email", "password" }`                                          | —      |
| POST   | `/refresh-token`   | `{ "refreshToken" }`                                                 | —      |
| POST   | `/logout`          | `{ "refreshToken" }`                                                 | —      |
| POST   | `/forgot-password` | `{ "email" }`                                                      | —      |
| POST   | `/reset-password`  | `{ "token", "password" }` (`token` from email link query)          | —      |
| POST   | `/verify-email`    | `{ "token" }` (from verification email)                            | —      |
| GET    | `/me`              | —                                                                    | Bearer |

Password rules: minimum **8** characters, max **128** (see Zod schemas in [`src/modules/auth/auth.validation.ts`](src/modules/auth/auth.validation.ts)).

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
- Helmet, CORS, JSON body size limit, and global rate limiting are enabled by default.

## Project layout

- [`src/server.ts`](src/server.ts) — loads `.env`, validates config, bootstraps the app.
- [`src/app.ts`](src/app.ts) — Express middleware and routes.
- [`src/modules/auth`](src/modules/auth) — auth routes, controller, service, validation.
- [`prisma/schema.prisma`](prisma/schema.prisma) — data models.

## License

MIT
