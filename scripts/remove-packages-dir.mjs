/**
 * 在 integrate:packages 且验证 build 通过后，删除仓库根目录 packages/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packagesRoot = path.join(repoRoot, 'packages');
const gamesInFrontend = path.join(repoRoot, 'kids-game-frontend', 'src', 'games', 'gameRegistry.ts');

if (!fs.existsSync(packagesRoot)) {
  console.log('packages/ 已不存在，跳过');
  process.exit(0);
}
if (!fs.existsSync(gamesInFrontend)) {
  console.error('请先执行: pnpm integrate:packages（确保 kids-game-frontend/src/games 存在）');
  process.exit(1);
}

fs.rmSync(packagesRoot, { recursive: true, force: true });
console.log('已删除', packagesRoot);
console.log('建议: pnpm install && pnpm check:frontend');