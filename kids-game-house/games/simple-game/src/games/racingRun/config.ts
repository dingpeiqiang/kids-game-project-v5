import type { PowerupType } from './types';

export const W = 400;
export const H = 600;

// 3条固定车道
export const LANES = [80, 200, 320];

export const OBSTACLE_CONFIG = {
  car: { emoji: '🚗', color: '#FF4757', w: 40, h: 55 },
  cone: { emoji: '🚧', color: '#FF8C00', w: 35, h: 35 },
  truck: { emoji: '🚛', color: '#C0392B', w: 50, h: 70 },
};

export const POWERUP_CONFIG: Record<PowerupType, { emoji: string; color: string; name: string }> = {
  boost: { emoji: '🔥', color: '#FF6B00', name: '氮气加速!' },
  shield: { emoji: '🛡️', color: '#3498DB', name: '护盾!' },
  magnet: { emoji: '🧲', color: '#9B59B6', name: '磁铁!' },
  double: { emoji: '✨', color: '#F1C40F', name: '双倍分数!' },
};
