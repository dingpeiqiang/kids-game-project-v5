/**
 * Capacitor 8 无 cap sync -c，通过环境变量写入 server.url
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.env.CAPACITOR_REMOTE_SERVER_URL =
  process.env.CAPACITOR_REMOTE_SERVER_URL || 'https://kidsgame.dingpq.cn:3443';

console.log('[cap-sync-remote] CAPACITOR_REMOTE_SERVER_URL =', process.env.CAPACITOR_REMOTE_SERVER_URL);

execSync('pnpm exec cap sync android', { stdio: 'inherit', cwd: root, env: process.env });