import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const schemas = {
  postgresql: path.join(rootDir, 'prisma', 'schema.prisma'),
  sqlite: path.join(rootDir, 'prisma', 'sqlite', 'schema.prisma'),
};

const provider = process.env.DB_PROVIDER ?? 'postgresql';
const args = process.argv.slice(2);

if (!Object.hasOwn(schemas, provider)) {
  console.error(`Unsupported DB_PROVIDER "${provider}". Use "sqlite" or "postgresql".`);
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && provider === 'sqlite') {
  console.error('Refusing to run Prisma with SQLite while NODE_ENV=production.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

if (provider === 'sqlite' && !process.env.DATABASE_URL.startsWith('file:')) {
  console.error('SQLite DATABASE_URL must start with "file:".');
  process.exit(1);
}

if (
  provider === 'postgresql' &&
  !process.env.DATABASE_URL.startsWith('postgresql://') &&
  !process.env.DATABASE_URL.startsWith('postgres://')
) {
  console.error('PostgreSQL DATABASE_URL must start with "postgresql://" or "postgres://".');
  process.exit(1);
}

const schema = schemas[provider];
const result = spawnSync('prisma', [...args, '--schema', schema], {
  cwd: rootDir,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
