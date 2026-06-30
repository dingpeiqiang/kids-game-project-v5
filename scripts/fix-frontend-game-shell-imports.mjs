#!/usr/bin/env node
/**
 * games 内 ../../platform|services|utils|engine3d|composables
 * 改为 @shell/*，供 vue-tsc 解析（Vite bridge 仅运行时有效）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const gamesRoot = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  'kids-game-frontend',
  'src',
  'games',
);

const FOLDERS = ['platform', 'services', 'utils', 'engine3d', 'composables'];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|vue)$/.test(name)) files.push(p);
  }
  return files;
}

function fixContent(s) {
  let next = s;
  for (const folder of FOLDERS) {
    // ../../../platform/foo -> @shell/platform/foo
    next = next.replace(
      new RegExp(`from ['"](?:\\.\\./){2,4}${folder}/`, 'g'),
      `from '@shell/${folder}/`,
    );
    next = next.replace(
      new RegExp(`import\\(['"](?:\\.\\./){2,4}${folder}/`, 'g'),
      `import('@shell/${folder}/`,
    );
  }
  return next;
}

let n = 0;
for (const file of walk(gamesRoot)) {
  const s = fs.readFileSync(file, 'utf8');
  const next = fixContent(s);
  if (next !== s) {
    fs.writeFileSync(file, next);
    n++;
  }
}
console.log('[fix-frontend-game-shell-imports]', n, 'files');