import type { GameState } from './state';
import type { Particle, FloatText } from './types';
import { POWERUP_CONFIG } from './config';

export function spawnExplosion(state: GameState, x: number, y: number, count: number, color: string): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const spd = 2 + Math.random() * 5;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1, maxLife: 1,
      color: Math.random() > 0.3 ? color : '#FFFFFF',
      size: 3 + Math.random() * 5,
    });
  }
}

export function spawnFloatText(state: GameState, x: number, y: number, text: string, color: string): void {
  state.floatTexts.push({ x, y, text, color, life: 1.5, vy: -2 });
}

export function activatePowerup(state: GameState, type: keyof typeof POWERUP_CONFIG, x: number, y: number): void {
  const cfg = POWERUP_CONFIG[type];

  // 特效粒子
  for (let i = 0; i < 25; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      life: 1.2, maxLife: 1.2,
      color: cfg.color,
      size: 5 + Math.random() * 8,
    });
  }

  spawnFloatText(state, x, y, cfg.name, cfg.color);

  switch (type) {
    case 'boost':
      state.boostTimer = 300; // 5秒
      state.speedMultiplier = 1.8;
      state.shakeFrames = 15;
      break;
    case 'shield':
      state.shieldTimer = 400; // 6.6秒
      break;
    case 'magnet':
      state.magnetTimer = 360; // 6秒
      break;
    case 'double':
      state.doubleTimer = 480; // 8秒
      break;
  }
}
