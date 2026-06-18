/**
 * 远程 WebView：整页从 CAPACITOR_REMOTE_SERVER_URL 加载。
 * 默认打 APK 请用 `pnpm exec cap sync android`（见 docs/ANDROID_RELEASE.md）。
 * 仅当 3443 HTTPS 已在手机 Chrome 验收通过后再用本脚本。
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.env.CAPACITOR_REMOTE_SERVER_URL =
  process.env.CAPACITOR_REMOTE_SERVER_URL || 'https://kidsgame.dingpq.cn:3443';

console.log('[cap-sync-remote] CAPACITOR_REMOTE_SERVER_URL =', process.env.CAPACITOR_REMOTE_SERVER_URL);

execSync('pnpm exec cap sync android', { stdio: 'inherit', cwd: root, env: process.env });