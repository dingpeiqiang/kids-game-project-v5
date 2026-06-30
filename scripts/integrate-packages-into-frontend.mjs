/**
 * 将 packages/client-core（games 等）与 packages/shared 并入 kids-game-frontend/src
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const frontendSrc = path.join(repoRoot, 'kids-game-frontend', 'src');
const coreSrc = path.join(repoRoot, 'packages', 'client-core', 'src');
const sharedSrc = path.join(repoRoot, 'packages', 'shared', 'src');

function copyRecursive(from, to) {
  if (!fs.existsSync(from)) {
    console.warn('skip missing:', from);
    return;
  }
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const sf = path.join(from, ent.name);
    const df = path.join(to, ent.name);
    if (ent.isDirectory()) copyRecursive(sf, df);
    else fs.copyFileSync(sf, df);
  }
}

/** 仅当目标不存在或为空时整目录复制 */
function copyDirIfMissing(from, toRel) {
  const to = path.join(frontendSrc, toRel);
  if (fs.existsSync(to)) {
    const entries = fs.readdirSync(to);
    if (entries.length > 0) {
      console.log('keep existing', toRel);
      return;
    }
  }
  copyRecursive(from, to);
  console.log('copied ->', toRel);
}

// games：frontend 无则整目录复制（构建/audit 依赖）
const gamesDest = path.join(frontendSrc, 'games');
const gamesSrc = path.join(coreSrc, 'games');
if (!fs.existsSync(gamesSrc)) {
  console.error('缺少', gamesSrc, '— packages 已删则请从 git 恢复 games 到 kids-game-frontend/src/games');
  process.exit(1);
}
if (!fs.existsSync(gamesDest)) {
  copyRecursive(gamesSrc, gamesDest);
  console.log('copied games -> src/games');
} else {
  console.log('src/games already exists (未覆盖)');
}

// shared：合并 packages/shared/src → src/shared（覆盖同名文件）
if (fs.existsSync(sharedSrc)) {
  copyRecursive(sharedSrc, path.join(frontendSrc, 'shared'));
  console.log('merged shared -> src/shared');
}

// schemas 若 frontend 无则从 core 补
const schemasFrom = path.join(coreSrc, 'schemas');
const schemasTo = path.join(frontendSrc, 'schemas');
if (fs.existsSync(schemasFrom) && !fs.existsSync(path.join(schemasTo, 'gtrs-schema.json'))) {
  copyRecursive(schemasFrom, schemasTo);
  console.log('synced schemas');
}

console.log('Done. Update vite/tsconfig aliases to src/ and remove packages/ when verified.');