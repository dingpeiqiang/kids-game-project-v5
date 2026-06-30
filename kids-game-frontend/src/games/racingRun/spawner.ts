import type { GameState } from './state';
import { OBSTACLE_CONFIG, POWERUP_CONFIG, LANES, LEVELS, MAX_OBSTACLES, MAX_COINS } from './config';
import type { Obstacle, Coin, Powerup, LevelConfig } from './types';

export function spawnObstacle(state: GameState): void {
  // 性能优化：限制障碍物数量
  if (state.obstacles.length >= MAX_OBSTACLES) return;
  
  const levelConfig = LEVELS[state.currentLevel - 1];
  if (!levelConfig) return;

  const allowedTypes = levelConfig.allowedObstacles || Object.keys(OBSTACLE_CONFIG);
  const types = allowedTypes as Array<keyof typeof OBSTACLE_CONFIG>;
  if (types.length === 0) return;

  const type = types[Math.floor(Math.random() * types.length)];
  const cfg = OBSTACLE_CONFIG[type];
  const lane = Math.floor(Math.random() * 3);
  const x = LANES[lane];

  const nearObs = state.obstacles.find(o => Math.abs(o.y) < 100 && Math.abs(o.x - x) < 50);
  if (nearObs) return;

  const obstacle: Obstacle = {
    x, y: -cfg.h - 20,
    w: cfg.w, h: cfg.h,
    type: type as Obstacle['type'], color: cfg.color,
    emoji: cfg.emoji,
    lane,
    nearMissAwarded: false,
  };

  if (cfg.isDynamic && cfg.speed && (!levelConfig.hasDynamicObstacles || Math.random() > 0.5)) {
    obstacle.vx = (Math.random() > 0.5 ? 1 : -1) * cfg.speed;
  }

  state.obstacles.push(obstacle);
}

export function spawnCoin(state: GameState): void {
  // 性能优化：限制金币数量
  if (state.coins.length >= MAX_COINS) return;
  
  const lane = Math.floor(Math.random() * 3);
  const x = LANES[lane];

  const nearCoin = state.coins.find(c => Math.abs(c.y) < 80 && c.lane === lane);
  const nearObs = state.obstacles.find(o => Math.abs(o.y) < 80 && o.lane === lane);
  const nearPowerup = state.powerups.find(p => Math.abs(p.y) < 80 && p.lane === lane);
  if (nearCoin || nearObs || nearPowerup) return;

  state.coins.push({
    x, y: -30,
    w: 25, h: 25,
    lane,
    collected: false,
  });
}

export function spawnPowerup(state: GameState): void {
  const levelConfig = LEVELS[state.currentLevel - 1];
  if (!levelConfig) return;

  const allowedTypes = levelConfig.allowedPowerups || Object.keys(POWERUP_CONFIG);
  const types = allowedTypes as Array<keyof typeof POWERUP_CONFIG>;
  if (types.length === 0) return;

  const type = types[Math.floor(Math.random() * types.length)];
  const cfg = POWERUP_CONFIG[type];
  const lane = Math.floor(Math.random() * 3);
  const x = LANES[lane];

  // 降低附近检测限制，允许道具与其他元素有更多重叠
  const nearObs = state.obstacles.find(o => Math.abs(o.y) < 50 && o.lane === lane);
  const nearCoin = state.coins.find(c => Math.abs(c.y) < 50 && c.lane === lane);
  const nearPowerup = state.powerups.find(p => Math.abs(p.y) < 60 && p.lane === lane);
  
  // 如果附近有其他元素，有30%的几率仍然生成道具（增加道具出现频率）
  if ((nearObs || nearCoin || nearPowerup) && Math.random() > 0.3) return;

  state.powerups.push({
    x, y: -35,
    w: 35, h: 35,
    type, emoji: cfg.emoji, color: cfg.color,
    lane,
    collected: false,
  });
}
