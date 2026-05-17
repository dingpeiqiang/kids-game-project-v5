export type PowerupType = 'boost' | 'shield' | 'magnet' | 'double';

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'car' | 'cone' | 'truck';
  color: string;
  emoji: string;
  lane: number;
}

export interface Coin {
  x: number;
  y: number;
  w: number;
  h: number;
  lane: number;
  collected: boolean;
}

export interface Powerup {
  x: number;
  y: number;
  w: number;
  h: number;
  type: PowerupType;
  emoji: string;
  color: string;
  lane: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}
