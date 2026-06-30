#!/usr/bin/env node
/** 方案 C：游戏源码仅在 client-core，删除 simple 内重复 games */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const games = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'kids-game-simple', 'src', 'games');
if (fs.existsSync(games)) {
  fs.rmSync(games, { recursive: true, force: true });
  console.log('[cleanup-simple-games] removed', games);
}