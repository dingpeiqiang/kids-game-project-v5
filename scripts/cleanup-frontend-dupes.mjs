#!/usr/bin/env node
/** 删除 kids-game-frontend/src 下已迁入 client-core 的重复目录 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'kids-game-frontend', 'src');
const keep = new Set(['router', 'docs', 'main.ts', 'App.vue', 'vite-env.d.ts']);

for (const name of fs.readdirSync(src)) {
  if (keep.has(name)) continue;
  const p = path.join(src, name);
  fs.rmSync(p, { recursive: true, force: true });
  console.log('removed', p);
}
console.log('[cleanup-frontend-dupes] done');