#!/usr/bin/env node
/**
 * One-time migration: frontend/src + simple/src/games → packages/client-core/src
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const frontendSrc = path.join(root, 'kids-game-frontend', 'src');
const simpleGames = path.join(root, 'kids-game-simple', 'src', 'games');
const coreSrc = path.join(root, 'packages', 'client-core', 'src');
const skip = new Set(['router', 'docs', 'main.ts', 'App.vue']);

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('missing', src);
    return;
  }
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function rmRecursive(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

fs.mkdirSync(coreSrc, { recursive: true });
for (const name of fs.readdirSync(frontendSrc)) {
  if (skip.has(name)) continue;
  copyRecursive(path.join(frontendSrc, name), path.join(coreSrc, name));
}
rmRecursive(path.join(coreSrc, 'games'));
copyRecursive(simpleGames, path.join(coreSrc, 'games'));
console.log('[migrate-client-core] ok, entries:', fs.readdirSync(coreSrc).length);