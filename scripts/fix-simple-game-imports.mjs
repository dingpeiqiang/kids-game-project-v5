#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'kids-game-simple', 'src');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|vue|mjs)$/.test(name)) files.push(p);
  }
  return files;
}

const reList = [
  [/from ['"]@simple\/games\//g, "from '@/games/"],
  [/from ['"]\.\.\/games\//g, "from '@/games/"],
  [/from ['"]\.\.\/\.\.\/games\//g, "from '@/games/"],
  [/import\(['"]\.\.\/\.\.\/games\//g, "import('@/games/"],
  [/import\(['"]\.\.\/games\//g, "import('@/games/"],
];

let n = 0;
for (const file of walk(root)) {
  let s = fs.readFileSync(file, 'utf8');
  let next = s;
  for (const [re, rep] of reList) next = next.replace(re, rep);
  if (next !== s) {
    fs.writeFileSync(file, next);
    n++;
    console.log('fixed', path.relative(root, file));
  }
}
console.log('[fix-simple-game-imports]', n, 'files');