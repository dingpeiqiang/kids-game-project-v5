import type { GameState } from './state';
import { OBSTACLE_CONFIG, POWERUP_CONFIG, LANES } from './config';
import type { Obstacle, Coin, Powerup } from './types';

export function spawnObstacle(state: GameState): void {
  const types = Object.keys(OBSTACLE_CONFIG) as Array<keyof typeof OBSTACLE_CONFIG>;
  const type = types[Math.floor(Math.random() * types.length)];
  const cfg = OBSTACLE_CONFIG[type];
  const lane = Math.floor(Math.random() * 3);
  const x = LANES[lane];

  // 检查与最近障碍物的距离
  const nearObs = state.obstacles.find(o => Math.abs(o.y) < 100 && o.lane === lane);
  if (nearObs) return;

  state.obstacles.push({
    x, y: -cfg.h - 20,
    w: cfg.w, h: cfg.h,
    type, color: cfg.color,
    emoji: cfg.emoji,
    lane,
  });
}

export function spawnCoin(state: GameState): void {
  const lane = Math.floor(Math.random() * 3);
  const x = LANES[lane];

  // 检查与最近金币/障碍物的距离
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
  const types = Object.keys(POWERUP_CONFIG) as Array<keyof typeof POWERUP_CONFIG>;
  const type = types[Math.floor(Math.random() * types.length)];
  const cfg = POWERUP_CONFIG[type];
  const lane = Math.floor(Math.random() * 3);
  const x = LANES[lane];

  // 检查距离
  const nearObs = state.obstacles.find(o => Math.abs(o.y) < 80 && o.lane === lane);
  const nearCoin = state.coins.find(c => Math.abs(c.y) < 80 && c.lane === lane);
  const nearPowerup = state.powerups.find(p => Math.abs(p.y) < 100 && p.lane === lane);
  if (nearObs || nearCoin || nearPowerup) return;

  state.powerups.push({
    x, y: -35,
    w: 35, h: 35,
    type, emoji: cfg.emoji, color: cfg.color,
    lane,
    collected: false,
  });
}
