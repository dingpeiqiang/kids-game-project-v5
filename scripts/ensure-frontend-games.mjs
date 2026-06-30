/**
 * 构建/审计前：若 src/games 缺失且 packages 仍在，自动从 client-core 复制
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const gamesDest = path.join(repoRoot, 'kids-game-frontend', 'src', 'games');
const gamesSrc = path.join(repoRoot, 'packages', 'client-core', 'src', 'games');
const registry = path.join(gamesDest, 'gameRegistry.ts');

if (fs.existsSync(registry)) {
  process.exit(0);
}

if (!fs.existsSync(gamesSrc)) {
  console.error(
    '[ensure-frontend-games] 缺少 kids-game-frontend/src/games。\n' +
      '请执行: pnpm finalize:packages\n' +
      '或从备份恢复 games 目录。',
  );
  process.exit(1);
}

function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const sf = path.join(from, ent.name);
    const df = path.join(to, ent.name);
    if (ent.isDirectory()) copyRecursive(sf, df);
    else fs.copyFileSync(sf, df);
  }
}

copyRecursive(gamesSrc, gamesDest);
console.log('[ensure-frontend-games] copied packages/client-core/src/games -> kids-game-frontend/src/games');