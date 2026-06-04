// 粒子特效模块
import { GameState, Particle } from './types';

// 创建爆炸特效
export function createExplosion(
  state: GameState,
  x: number, y: number,
  color: string,
  count: number = 15,
  force: number = 5
): void {
  // 基础粒子
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * force + 2;
    const size = 2 + Math.random() * 4;
    
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.2,
      color,
      size
    });
  }
  
  // 环形冲击波（大爆炸时）
  if (count > 8) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * (force * 1.5),
        vy: Math.sin(angle) * (force * 1.5),
        life: 0.8,
        color: '#fff',
        size: 2
      });
    }
  }
}

// 创建升级特效
export function createLevelUpEffect(state: GameState, x: number, y: number): void {
  // 30个放射粒子
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 / 30) * i;
    const speed = 3 + Math.random() * 5;
    
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.5,
      color: i % 2 === 0 ? '#FFD700' : '#FF6B6B',
      size: 5 + Math.random() * 3
    });
  }
}

// 创建连击光环特效
export function createComboEffect(state: GameState, x: number, y: number): void {
  // 12个金色光环粒子
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      life: 1,
      color: '#FFD700',
      size: 3
    });
  }
}

// 创建受伤特效
export function createHitEffect(state: GameState, x: number, y: number): void {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 4;
    
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: '#FF4757',
      size: 4
    });
  }
}

// 创建护盾破碎特效
export function createShieldBreakEffect(state: GameState, x: number, y: number): void {
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: '#4D96FF',
      size: 3
    });
  }
}

// 创建拾取特效
export function createCollectEffect(state: GameState, x: number, y: number): void {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8,
      color: '#fff',
      size: 2
    });
  }
}

// 创建子弹击中特效
export function createBulletHitEffect(state: GameState, x: number, y: number, color: string = '#FFD700'): void {
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8,
      color,
      size: 2
    });
  }
}

// 更新所有粒子
export function updateParticles(state: GameState, dt: number): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    
    // 更新位置
    p.x += p.vx;
    p.y += p.vy;
    
    // 重力影响
    p.vy += 0.05;
    
    // 生命周期衰减
    p.life -= 0.025;
    
    // 移除死亡粒子
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

// 绘制粒子
export function drawParticles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const p of state.particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
