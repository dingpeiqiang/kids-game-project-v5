/**
 * 一次性：同步 simple/public → frontend/public，复制 android 与验收文档，删除 kids-game-simple
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const simpleRoot = path.join(repoRoot, 'kids-game-simple');
const frontendRoot = path.join(repoRoot, 'kids-game-frontend');

if (!fs.existsSync(simpleRoot)) {
  console.log('kids-game-simple 已不存在，跳过');
  process.exit(0);
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

const pubSrc = path.join(simpleRoot, 'public');
const pubDest = path.join(frontendRoot, 'public');
if (fs.existsSync(pubSrc)) {
  copyRecursive(pubSrc, pubDest);
  console.log('public 已同步到 kids-game-frontend/public');
}

const androidSrc = path.join(simpleRoot, 'android');
const androidDest = path.join(frontendRoot, 'android');
if (fs.existsSync(androidSrc) && !fs.existsSync(androidDest)) {
  copyRecursive(androidSrc, androidDest);
  console.log('android 已复制到 kids-game-frontend/android');
}

const docSrc = path.join(simpleRoot, 'docs', 'MOBILE_ACCEPTANCE_CHECKLIST.md');
const docDest = path.join(frontendRoot, 'docs', 'MOBILE_ACCEPTANCE_CHECKLIST.md');
if (fs.existsSync(docSrc)) {
  fs.mkdirSync(path.dirname(docDest), { recursive: true });
  fs.copyFileSync(docSrc, docDest);
  console.log('已复制 MOBILE_ACCEPTANCE_CHECKLIST.md');
}

fs.rmSync(simpleRoot, { recursive: true, force: true });
console.log('已删除', simpleRoot);
console.log('请执行: git add -A && git status');