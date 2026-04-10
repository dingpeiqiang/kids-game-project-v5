// ─
//  src/game/levels/LevelLoader.ts
//  Level configurations (grids + wave spawns)
// ─

import { TileType, LevelConfig, EnemyType } from '../../types';
import { COLS, ROWS, EAGLE_ROW, EAGLE_COL } from '../config';

//  Grid helper ─
type Rect = [row: number, col: number, w?: number, h?: number];

export function buildGrid(
  bricks: Rect[],
  steel: Rect[],
  water: Rect[],
  ice: Rect[],
  trees: Rect[],
): TileType[][] {
  const g: TileType[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(TileType.EMPTY));

  const fill = (list: Rect[], type: TileType) => {
    for (const [r, c, w = 1, h = 1] of list) {
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          if (r + dr < ROWS && c + dc < COLS) g[r + dr][c + dc] = type;
        }
      }
    }
  };

  fill(bricks, TileType.BRICK);
  fill(steel, TileType.STEEL);
  fill(water, TileType.WATER);
  fill(ice, TileType.ICE);
  fill(trees, TileType.TREE);

  // Eagle always occupies two tiles at bottom-centre
  g[EAGLE_ROW][EAGLE_COL] = TileType.EAGLE;
  g[EAGLE_ROW][EAGLE_COL + 1] = TileType.EAGLE;

  return g;
}

// ─
//  STAGE 1 — Introductory, open layout
// ─
const LEVEL_1: LevelConfig = {
  grid: buildGrid(
    /* bricks */[
      [1, 1, 4, 1], [1, 7, 4, 1], [1, 14, 4, 1], [1, 21, 4, 1],
      [3, 0, 2, 1], [3, 4, 2, 1], [3, 8, 3, 1], [3, 13, 3, 1], [3, 19, 2, 1], [3, 23, 3, 1],
      [5, 2, 3, 2], [5, 7, 3, 2], [5, 12, 2, 2], [5, 16, 3, 2], [5, 21, 3, 2],
      [9, 1, 3, 1], [9, 6, 3, 1], [9, 11, 2, 1], [9, 15, 3, 1], [9, 20, 3, 1], [9, 24, 2, 1],
      [11, 0, 2, 2], [11, 4, 3, 2], [11, 9, 3, 2], [11, 14, 3, 2], [11, 19, 2, 2], [11, 23, 3, 2],
      [15, 2, 3, 1], [15, 7, 3, 1], [15, 12, 2, 1], [15, 16, 3, 1], [15, 21, 3, 1],
      [17, 0, 2, 2], [17, 4, 3, 2], [17, 9, 3, 2], [17, 14, 2, 2], [17, 18, 3, 2], [17, 23, 2, 2],
      [21, 1, 3, 1], [21, 6, 3, 1], [21, 11, 2, 1], [21, 15, 3, 1], [21, 20, 3, 1],
      // Eagle protection
      [22, 11, 1, 2], [22, 14, 1, 2], [23, 10, 1, 1], [23, 15, 1, 1], [24, 10, 1, 1], [24, 15, 1, 1],
    ],
    /* steel */[
      [4, 12, 2, 1], [12, 12, 2, 1], [4, 10, 1, 1], [4, 15, 1, 1],
    ],
    /* water */[],
    /* ice   */[],
    /* trees */[[7, 0, 4, 2], [7, 22, 4, 2]],
  ),
  waves: [
    [{ type: EnemyType.BASIC, count: 5 }],
    [{ type: EnemyType.BASIC, count: 4 }, { type: EnemyType.FAST, count: 1 }],
    [{ type: EnemyType.BASIC, count: 3 }, { type: EnemyType.FAST, count: 2 }],
    [{ type: EnemyType.BASIC, count: 2 }, { type: EnemyType.ARMORED, count: 1 }],
  ],
  totalEnemies: 12,
  powerEnemyEvery: 4,
  spawnInterval: 120,
  maxOnScreen: 4,
};

// ─
//  STAGE 2 — Mixed types, tighter corridors
// ─
const LEVEL_2: LevelConfig = {
  grid: buildGrid(
    /* bricks */[
      [1, 0, 4, 1], [1, 6, 2, 1], [1, 9, 2, 1], [1, 13, 2, 1], [1, 17, 2, 1], [1, 20, 2, 1], [1, 23, 4, 1],
      [3, 2, 1, 5], [3, 9, 1, 5], [3, 17, 1, 5], [3, 24, 1, 5],
      [7, 0, 3, 1], [7, 5, 3, 1], [7, 11, 3, 1], [7, 16, 3, 1], [7, 21, 3, 1], [7, 24, 2, 1],
      [9, 2, 2, 4], [9, 8, 2, 4], [9, 14, 2, 4], [9, 20, 2, 4],
      [14, 0, 4, 1], [14, 6, 2, 1], [14, 10, 2, 1], [14, 14, 2, 1], [14, 19, 2, 1], [14, 23, 3, 1],
      [16, 4, 2, 4], [16, 11, 2, 4], [16, 18, 2, 4],
      [20, 1, 3, 1], [20, 6, 2, 1], [20, 10, 3, 1], [20, 15, 2, 1], [20, 20, 3, 1], [20, 24, 2, 1],
      [21, 2, 2, 2], [21, 8, 2, 2], [21, 14, 2, 2], [21, 20, 2, 2], [21, 24, 2, 2],
      [22, 11, 1, 1], [22, 14, 1, 1], [23, 10, 1, 1], [23, 15, 1, 1], [24, 10, 1, 1], [24, 15, 1, 1],
    ],
    /* steel */[
      [1, 11, 4, 1], [7, 12, 2, 1], [14, 12, 2, 1], [20, 12, 2, 1],
      [9, 0, 1, 4], [9, 25, 1, 4],
    ],
    /* water */[[5, 5, 4, 2], [5, 17, 4, 2], [11, 0, 3, 2], [11, 23, 3, 2]],
    /* ice   */[[18, 5, 6, 2], [18, 15, 6, 2]],
    /* trees */[[3, 5, 2, 2], [3, 20, 2, 2], [12, 11, 4, 2]],
  ),
  waves: [
    [{ type: EnemyType.BASIC, count: 3 }, { type: EnemyType.FAST, count: 2 }],
    [{ type: EnemyType.BASIC, count: 2 }, { type: EnemyType.FAST, count: 2 }, { type: EnemyType.ARMORED, count: 1 }],
    [{ type: EnemyType.ARMORED, count: 2 }, { type: EnemyType.FAST, count: 2 }],
    [{ type: EnemyType.ARMORED, count: 2 }, { type: EnemyType.FAST, count: 3 }],
    [{ type: EnemyType.ARMORED, count: 3 }, { type: EnemyType.FAST, count: 2 }],
  ],
  totalEnemies: 16,
  powerEnemyEvery: 4,
  spawnInterval: 100,
  maxOnScreen: 5,
};

// ─
//  STAGE 3 — All types, complex maze
// ─
const LEVEL_3: LevelConfig = {
  grid: buildGrid(
    /* bricks */[
      [0, 0, 26, 1],
      [2, 2, 2, 2], [2, 7, 2, 2], [2, 12, 2, 2], [2, 17, 2, 2], [2, 22, 2, 2],
      [5, 0, 2, 2], [5, 5, 2, 2], [5, 10, 2, 2], [5, 14, 2, 2], [5, 19, 2, 2], [5, 24, 2, 2],
      [8, 2, 2, 2], [8, 7, 2, 2], [8, 12, 2, 2], [8, 17, 2, 2], [8, 22, 2, 2],
      [11, 0, 2, 2], [11, 5, 2, 2], [11, 10, 2, 2], [11, 14, 2, 2], [11, 19, 2, 2], [11, 24, 2, 2],
      [14, 2, 2, 2], [14, 7, 2, 2], [14, 12, 2, 2], [14, 17, 2, 2], [14, 22, 2, 2],
      [17, 0, 2, 2], [17, 5, 2, 2], [17, 10, 2, 2], [17, 14, 2, 2], [17, 19, 2, 2], [17, 24, 2, 2],
      [20, 2, 2, 2], [20, 7, 2, 2], [20, 12, 2, 2], [20, 17, 2, 2], [20, 22, 2, 2],
      [22, 11, 1, 1], [22, 14, 1, 1], [23, 10, 1, 1], [23, 15, 1, 1], [24, 10, 1, 1], [24, 15, 1, 1],
    ],
    /* steel */[
      [1, 0, 26, 1],
      [3, 0, 2, 1], [3, 5, 2, 1], [3, 10, 2, 1], [3, 14, 2, 1], [3, 19, 2, 1], [3, 24, 2, 1],
      [10, 0, 1, 6], [10, 25, 1, 6], [10, 12, 2, 6],
      [6, 3, 2, 2], [6, 21, 2, 2],
    ],
    /* water */[[7, 6, 3, 3], [7, 17, 3, 3], [16, 6, 3, 3], [16, 17, 3, 3]],
    /* ice   */[[4, 10, 6, 1], [13, 5, 16, 1]],
    /* trees */[
      [6, 0, 2, 2], [6, 24, 2, 2], [13, 0, 2, 2], [13, 24, 2, 2], [20, 0, 2, 2], [20, 24, 2, 2],
    ],
  ),
  waves: [
    [{ type: EnemyType.FAST, count: 2 }, { type: EnemyType.ARMORED, count: 3 }],
    [{ type: EnemyType.FAST, count: 3 }, { type: EnemyType.ARMORED, count: 3 }],
    [{ type: EnemyType.FAST, count: 3 }, { type: EnemyType.ARMORED, count: 4 }],
    [{ type: EnemyType.FAST, count: 4 }, { type: EnemyType.ARMORED, count: 4 }],
    [{ type: EnemyType.FAST, count: 4 }, { type: EnemyType.ARMORED, count: 5 }],
    [{ type: EnemyType.FAST, count: 5 }, { type: EnemyType.ARMORED, count: 5 }],
  ],
  totalEnemies: 20,
  powerEnemyEvery: 3,
  spawnInterval: 80,
  maxOnScreen: 6,
};

//  Export ─
export const LEVELS: LevelConfig[] = [LEVEL_1, LEVEL_2, LEVEL_3];

export function getLevel(index: number): LevelConfig {
  if (index < 0 || index >= LEVELS.length) {
    throw new RangeError(`Level ${index} does not exist (0-${LEVELS.length - 1})`);
  }
  return LEVELS[index];
}

export const TOTAL_LEVELS = LEVELS.length;
