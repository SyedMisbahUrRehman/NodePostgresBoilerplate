import 'dotenv/config';
import { loadEnv } from './config/env.js';

loadEnv();

const { bootstrap } = await import('./bootstrap.js');
await bootstrap();
