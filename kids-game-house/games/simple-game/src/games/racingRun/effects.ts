import type { GameState } from './state';
import type { Particle, FloatText } from './types';
import { POWERUP_CONFIG, LEVELS, MAX_PARTICLES, MAX_FLOAT_TEXTS } from './config';
import { audioService } from '../../services/audio';

function makeParticle(x: number, y: number, vx: number, vy: number, life: number, maxLife: number, color: string, size: number, shape?: Particle['shape'], rotation?: number): Particle {
  return { x, y, vx, vy, life, maxLife, color, size, shape, rotation };
}

function trimParticles(state: GameState, incoming: number): void {
  if (state.particles.length + incoming > MAX_PARTICLES) {
    const excess = state.particles.length + incoming - MAX_PARTICLES;
    state.particles.splice(0, Math.min(excess, state.particles.length));
  }
}

export function spawnExplosion(state: GameState, x: number, y: number, count: number, color: string): void {
  trimParticles(state, count + Math.floor(count / 2));

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const spd = 2 + Math.random() * 5;
    state.particles.push(makeParticle(
      x, y,
      Math.cos(angle) * spd,
      Math.sin(angle) * spd,
      1, 1,
      Math.random() > 0.3 ? color : '#FFFFFF',
      2 + Math.random() * 4,
      Math.random() > 0.5 ? 'circle' : 'diamond',
      Math.random() * Math.PI * 2
    ));
  }

  for (let i = 0; i < Math.floor(count / 2); i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 4 + Math.random() * 8;
    state.particles.push(makeParticle(
      x, y,
      Math.cos(angle) * spd,
      Math.sin(angle) * spd - 2,
      0.6, 0.6,
      '#FFD700',
      1 + Math.random() * 2,
      'star'
    ));
  }
}

export function spawnFloatText(state: GameState, x: number, y: number, text: string, color: string): void {
  if (state.floatTexts.length >= MAX_FLOAT_TEXTS) {
    state.floatTexts.shift();
  }
  state.floatTexts.push({ x, y, text, color, life: 1.5, vy: -2 });
}

export function spawnTransformEffect(state: GameState, x: number, y: number, formName: string, color: string): void {
  state.transforming = true;
  audioService.transform();

  trimParticles(state, 60);

  if (formName === '飞船') {
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const dist = 30 + Math.random() * 60;
      state.particles.push(makeParticle(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        Math.cos(angle) * 2,
        Math.sin(angle) * 2,
        8.0, 8.0,
        i % 2 === 0 ? '#00CED1' : '#FFFFFF',
        2 + Math.random() * 2,
        'diamond',
        angle
      ));
    }

    for (let i = 0; i < 10; i++) {
      state.particles.push(makeParticle(
        x + (Math.random() - 0.5) * 20,
        y + 25 + Math.random() * 15,
        (Math.random() - 0.5) * 2,
        2 + Math.random() * 3,
        5.0, 5.0,
        '#87CEEB',
        2 + Math.random() * 3,
        'spark'
      ));
    }

    for (let ring = 0; ring < 3; ring++) {
      setTimeout(() => {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const dist = 15 + ring * 25;
          state.particles.push(makeParticle(
            x + Math.cos(angle) * dist,
            y + Math.sin(angle) * dist,
            Math.cos(angle) * (2 + ring * 0.3),
            Math.sin(angle) * (2 + ring * 0.3),
            3.0, 3.0,
            ring % 2 === 0 ? '#00CED1' : '#FFFFFF',
            1.5 + ring * 0.5,
            'star'
          ));
        }
      }, ring * 120);
    }

  } else if (formName === '坦克') {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spd = 3 + Math.random() * 6;
      state.particles.push(makeParticle(
        x, y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        5.0, 5.0,
        i % 2 === 0 ? '#27AE60' : '#FF6B00',
        3 + Math.random() * 3,
        'diamond',
        angle
      ));
    }

    for (let i = 0; i < 12; i++) {
      state.particles.push(makeParticle(
        x + (Math.random() - 0.5) * 30,
        y + 20 + Math.random() * 20,
        (Math.random() - 0.5) * 2,
        2 + Math.random() * 3,
        4.0, 4.0,
        i % 2 === 0 ? '#808080' : '#27AE60',
        2 + Math.random() * 2,
        'spark'
      ));
    }

    for (let ring = 0; ring < 3; ring++) {
      setTimeout(() => {
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          const dist = 15 + ring * 22;
          state.particles.push(makeParticle(
            x + Math.cos(angle) * dist,
            y + Math.sin(angle) * dist,
            Math.cos(angle) * (3 + ring * 0.3),
            Math.sin(angle) * (3 + ring * 0.3),
            2.5, 2.5,
            ring % 2 === 0 ? '#27AE60' : '#FF6B00',
            2 + ring * 0.5,
            'star'
          ));
        }
      }, ring * 150);
    }

  } else if (formName === '机甲') {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      state.particles.push(makeParticle(
        x, y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd - 2,
        6.0, 6.0,
        i % 2 === 0 ? '#E67E22' : '#FFD700',
        3 + Math.random() * 3,
        'diamond',
        Math.random() * Math.PI * 2
      ));
    }

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const dist = 25 + Math.random() * 50;
      state.particles.push(makeParticle(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        Math.cos(angle) * 1.5,
        Math.sin(angle) * 1.5,
        5.0, 5.0,
        i % 2 === 0 ? '#FFD700' : '#FFFFFF',
        2 + Math.random() * 2,
        'star'
      ));
    }

    for (let ring = 0; ring < 3; ring++) {
      setTimeout(() => {
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          const dist = 12 + ring * 25;
          state.particles.push(makeParticle(
            x + Math.cos(angle) * dist,
            y + Math.sin(angle) * dist,
            Math.cos(angle) * (2 + ring * 0.3),
            Math.sin(angle) * (2 + ring * 0.3),
            3.0, 3.0,
            ring % 2 === 0 ? '#E67E22' : '#FFD700',
            2 + ring * 0.5,
            'diamond',
            angle
          ));
        }
      }, ring * 150);
    }
  }

  state.floatTexts.push({ x, y: y - 100, text: `✨ 变身! ${formName}!`, color, life: 8.0, vy: -3 });

  setTimeout(() => {
    state.transforming = false;
  }, 1500);
}

export function activatePowerup(state: GameState, type: keyof typeof POWERUP_CONFIG, x: number, y: number): void {
  const cfg = POWERUP_CONFIG[type];

  trimParticles(state, 60);

  for (let i = 0; i < 16; i++) {
    state.particles.push(makeParticle(
      x, y,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
      1.2, 1.2,
      cfg.color,
      2 + Math.random() * 4,
      Math.random() > 0.5 ? 'circle' : 'diamond',
      Math.random() * Math.PI * 2
    ));
  }

  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    state.particles.push(makeParticle(
      x, y,
      Math.cos(angle) * 5,
      Math.sin(angle) * 5,
      0.8, 0.8,
      '#FFFFFF',
      1.5 + Math.random() * 2,
      'star'
    ));
  }

  for (let i = 0; i < 8; i++) {
    state.particles.push(makeParticle(
      x + (Math.random() - 0.5) * 40,
      y + (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 2,
      -2 - Math.random() * 3,
      0.6, 0.6,
      cfg.color,
      2 + Math.random() * 3,
      'spark',
      Math.random() * Math.PI
    ));
  }

  for (let i = 0; i < 10; i++) {
    state.particles.push(makeParticle(
      x + (Math.random() - 0.5) * 80,
      y + (Math.random() - 0.5) * 80,
      0, 0,
      0.4 + Math.random() * 0.4,
      0.8,
      Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
      1 + Math.random() * 2,
      'star'
    ));
  }

  for (let ring = 0; ring < 2; ring++) {
    setTimeout(() => {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 20 + ring * 12;
        state.particles.push(makeParticle(
          x + Math.cos(angle) * dist,
          y + Math.sin(angle) * dist,
          Math.cos(angle) * 3,
          Math.sin(angle) * 3,
          0.5, 0.5,
          ring === 0 ? cfg.color : '#FFFFFF',
          2 + ring * 1.5,
          'diamond',
          angle
        ));
      }
    }, ring * 60);
  }

  const addDuration = (timer: number, addition: number): number => {
    return timer > 0 ? timer + addition : addition;
  };

  switch (type) {
    case 'boost':
      state.boostTimer = addDuration(state.boostTimer, 480);
      state.speedMultiplier = 1.8;
      state.shakeFrames = 25;
      state.boostActive = true;
      audioService.engineBoost();
      spawnFloatText(state, x, y - 30, '🔥 超级加速!', '#FF6B00');
      spawnFloatText(state, x, y, '⚡ 速度x2.5!', '#FFD700');
      for (let i = 0; i < 30; i++) {
        state.particles.push(makeParticle(
          x + (Math.random() - 0.5) * 60,
          y + 20,
          (Math.random() - 0.5) * 3,
          3 + Math.random() * 5,
          0.8, 0.8,
          '#FF6B00',
          3 + Math.random() * 4,
          'spark'
        ));
      }
      break;
    case 'shield':
      state.shieldTimer = addDuration(state.shieldTimer, 540);
      audioService.shieldActive();
      spawnFloatText(state, x, y - 30, '🛡️ 护盾激活!', cfg.color);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        state.particles.push(makeParticle(
          x + Math.cos(angle) * 35,
          y + Math.sin(angle) * 35,
          0, 0,
          1.5, 1.5,
          '#3498DB',
          3,
          'diamond',
          angle
        ));
      }
      break;
    case 'magnet':
      state.magnetTimer = addDuration(state.magnetTimer, 480);
      audioService.magnetActive();
      spawnFloatText(state, x, y - 30, '🧲 磁铁吸附!', cfg.color);
      break;
    case 'double':
      state.doubleTimer = addDuration(state.doubleTimer, 600);
      audioService.buff();
      spawnFloatText(state, x, y - 30, '✨ 双倍积分!', cfg.color);
      spawnFloatText(state, x, y, '💰 x2倍得分!', '#F1C40F');
      break;
    case 'invincible':
      state.invincibleTimer = addDuration(state.invincibleTimer, 300);
      state.speedMultiplier = Math.max(state.speedMultiplier, 1.8);
      state.invincibleActive = true;
      audioService.invincibleActive();
      spawnFloatText(state, x, y - 30, '⭐ 无敌模式!', '#F39C12');
      spawnFloatText(state, x, y, '💫 撞穿一切!', '#FFD700');
      break;
    case 'clearObs':
      const oldCount = state.obstacles.length;
      state.obstacles = state.obstacles.filter(o => o.y < 0 || o.y > 150);
      const cleared = oldCount - state.obstacles.length;
      if (cleared > 0) {
        for (let i = 0; i < cleared * 3; i++) {
          spawnExplosion(state, x + (Math.random() - 0.5) * 150, y + Math.random() * 100, 8, '#E74C3C');
        }
        state.score += cleared * 50;
      }
      spawnFloatText(state, x, y - 30, '💥 清除障碍!', cfg.color);
      spawnFloatText(state, x, y, `🔥 +${cleared * 50}分!`, '#FF6B00');
      break;
    case 'addTime':
      state.timeRemaining += 15;
      spawnFloatText(state, x, y - 30, '🕐 时间+15秒!', cfg.color);
      break;
    case 'spaceship':
      state.vehicleForm = 'spaceship';
      state.vehicleFormTimer = addDuration(state.vehicleFormTimer, 420);
      state.spaceshipTimer = addDuration(state.spaceshipTimer, 420);
      state.speedMultiplier = Math.max(state.speedMultiplier, 2.0);
      spawnTransformEffect(state, x, y, '飞船', cfg.color);
      spawnFloatText(state, x, y - 50, '🚀 飞船模式!', '#00CED1');
      spawnFloatText(state, x, y - 20, '✨ 穿墙飞行!', '#FFFFFF');
      break;
    case 'tank':
      state.vehicleForm = 'tank';
      state.vehicleFormTimer = addDuration(state.vehicleFormTimer, 360);
      state.tankTimer = addDuration(state.tankTimer, 360);
      state.speedMultiplier = Math.max(state.speedMultiplier, 1.6);
      spawnTransformEffect(state, x, y, '坦克', cfg.color);
      spawnFloatText(state, x, y - 50, '🎯 坦克模式!', '#27AE60');
      spawnFloatText(state, x, y - 20, '💥 撞碎一切!', '#FF6B00');
      break;
    case 'mecha':
      state.vehicleForm = 'mecha';
      state.vehicleFormTimer = addDuration(state.vehicleFormTimer, 480);
      state.mechaTimer = addDuration(state.mechaTimer, 480);
      state.speedMultiplier = Math.max(state.speedMultiplier, 2.2);
      spawnTransformEffect(state, x, y, '机甲', cfg.color);
      spawnFloatText(state, x, y - 50, '🤖 机甲模式!', '#E67E22');
      spawnFloatText(state, x, y - 20, '⚡ 终极形态!', '#FFD700');
      break;
    case 'scoreBonus':
      const levelConfig = LEVELS[state.currentLevel - 1];
      const scoreMultiplier = levelConfig?.scoreMultiplier || 1;
      const bonus = Math.floor((300 + Math.floor(Math.random() * 501)) * scoreMultiplier);
      state.score += bonus;
      spawnFloatText(state, x, y - 30, `💎 +${bonus}分!`, cfg.color);
      for (let i = 0; i < 8; i++) {
        state.particles.push(makeParticle(
          x + (Math.random() - 0.5) * 60,
          y + (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 2,
          -2 - Math.random() * 3,
          1, 1,
          '#FFD700',
          2 + Math.random() * 3,
          'star'
        ));
      }
      break;
  }
}