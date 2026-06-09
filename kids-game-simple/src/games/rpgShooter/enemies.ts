// 敌人系统模块
import { GAME_CONFIG, ENEMY_TYPES } from './config';
import { GameState, Enemy } from './types';
import { spawnEnemyBullet } from './bullets';

// 生成敌人
export function spawnEnemy(state: GameState): void {
  if (!state.gameStarted) return;

  const side = Math.floor(Math.random() * 4);
  let x = 0, y = 0, vx = 0, vy = 0;

  // 从四个方向生成
  if (side === 0) { // 上方
    x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
    y = -30;
    vx = (state.playerX - x) * 0.01 + (Math.random() - 0.5) * 1;
    vy = GAME_CONFIG.ENEMY_BASE_SPEED + Math.random() * state.difficulty * 0.3;
  } else if (side === 1) { // 左侧
    x = -30;
    y = Math.random() * GAME_CONFIG.CANVAS_HEIGHT * 0.6;
    vx = GAME_CONFIG.ENEMY_BASE_SPEED + Math.random() * state.difficulty * 0.3;
    vy = (state.playerY - y) * 0.01 + (Math.random() - 0.5) * 0.5;
  } else if (side === 2) { // 右侧
    x = GAME_CONFIG.CANVAS_WIDTH + 30;
    y = Math.random() * GAME_CONFIG.CANVAS_HEIGHT * 0.6;
    vx = -(GAME_CONFIG.ENEMY_BASE_SPEED + Math.random() * state.difficulty * 0.3);
    vy = (state.playerY - y) * 0.01 + (Math.random() - 0.5) * 0.5;
  } else { // 下方
    x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
    y = GAME_CONFIG.CANVAS_HEIGHT + 30;
    vx = (state.playerX - x) * 0.01 + (Math.random() - 0.5) * 1;
    vy = -(GAME_CONFIG.ENEMY_BASE_SPEED + Math.random() * state.difficulty * 0.3);
  }

  // 根据难度选择敌人类型
  let typeIdx = 0;
  const r = Math.random();
  
  if (state.difficulty >= 5 && r < 0.08) {
    typeIdx = 3; // Boss (8%)
  } else if (state.difficulty >= 4 && r < 0.20) {
    typeIdx = 5; // Tank (12%)
  } else if (state.difficulty >= 3 && r < 0.35) {
    typeIdx = 4; // Fast (15%)
  } else if (state.difficulty >= 2 && r < 0.55) {
    typeIdx = 2; // Hex (20%)
  } else if (r < 0.75) {
    typeIdx = 1; // Diamond (20%)
  }
  // else typeIdx = 0; // Circle (25%)

  const type = ENEMY_TYPES[typeIdx];
  
  state.enemies.push({
    x,
    y,
    w: type.w,
    h: type.h,
    hp: type.hp + Math.floor(state.difficulty / 2),
    maxHp: type.hp + Math.floor(state.difficulty / 2),
    score: type.score,
    exp: type.exp,
    color: type.color,
    shape: type.shape,
    speed: type.speedMult * (GAME_CONFIG.ENEMY_BASE_SPEED + state.difficulty * 0.2),
    vx,
    vy,
    type: typeIdx
  });
}

// 更新所有敌人
export function updateEnemies(state: GameState, dt: number): void {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];

    // 冻结时敌人不移动
    if (state.freezeTimer <= 0) {
      // 追踪玩家AI
      const dx = state.playerX - e.x;
      const dy = state.playerY - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        e.vx += (dx / dist) * 0.02;
        e.vy += (dy / dist) * 0.02;
      }

      // 特殊敌人行为
      if (e.shape === 'fast') {
        // 快速敌人：Z字形移动
        const time = Date.now() * 0.005;
        e.vx += Math.sin(time) * 0.1;
      } else if (e.shape === 'tank') {
        // 坦克敌人：缓慢但稳定
        e.vx *= 0.95;
        e.vy *= 0.95;
      }

      // 限制速度
      const speed = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
      const maxSpeed = e.speed * (1 + state.difficulty * 0.1);
      
      if (speed > maxSpeed) {
        e.vx = (e.vx / speed) * maxSpeed;
        e.vy = (e.vy / speed) * maxSpeed;
      }

      e.x += e.vx;
      e.y += e.vy;

      // 随机发射弹幕
      if (Math.random() < 0.01) {
        spawnEnemyBullet(state, e);
      }
    }

    // 出屏检查（留余量）
    if (e.x < -80 || e.x > GAME_CONFIG.CANVAS_WIDTH + 80 || 
        e.y < -80 || e.y > GAME_CONFIG.CANVAS_HEIGHT + 80) {
      state.enemies.splice(i, 1);
    }
  }
}

// 绘制敌人
export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  ctx.save();
  ctx.translate(e.x, e.y);

  const size = Math.max(e.w, e.h) / 2;

  if (e.shape === 'circle') {
    // 圆形基础敌人
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-3, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(3, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-3, -1, 1.2, 0, Math.PI * 2);
    ctx.arc(3, -1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
  } else if (e.shape === 'diamond') {
    // 菱形中型敌人
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
  } else if (e.shape === 'hex') {
    // 六边形重型敌人
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 血量条
    if (e.hp < e.maxHp) {
      const barW = e.w;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW / 2, -size - 8, barW, 3);
      ctx.fillStyle = '#00E676';
      ctx.fillRect(-barW / 2, -size - 8, barW * (e.hp / e.maxHp), 3);
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -2, 3, 0, Math.PI * 2);
    ctx.arc(4, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-4, -1, 1.8, 0, Math.PI * 2);
    ctx.arc(4, -1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    
  } else if (e.shape === 'boss') {
    // Boss - 三角形
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, size * 0.8);
    ctx.lineTo(-size, size * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 血量条
    const barW = e.w + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-barW / 2, -size - 12, barW, 5);
    ctx.fillStyle = '#FF4757';
    ctx.fillRect(-barW / 2, -size - 12, barW * (e.hp / e.maxHp), 5);

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-5, 0, 4, 0, Math.PI * 2);
    ctx.arc(5, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(-5, 0, 2, 0, Math.PI * 2);
    ctx.arc(5, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    
  } else if (e.shape === 'fast') {
    // 快速型 - 流线型
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 速度线
    ctx.strokeStyle = e.color + '88';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-size - i * 5, -size * 0.3 + i * 5);
      ctx.lineTo(-size - 10 - i * 5, -size * 0.3 + i * 5);
      ctx.stroke();
    }
    
  } else if (e.shape === 'tank') {
    // 坦克型 - 方形带装甲
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.shadowBlur = 0;

    // 装甲装饰
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size + 4, -size + 4, size * 2 - 8, size * 2 - 8);

    // 血量条
    if (e.hp < e.maxHp) {
      const barW = e.w;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW / 2, -size - 8, barW, 4);
      ctx.fillStyle = '#00E676';
      ctx.fillRect(-barW / 2, -size - 8, barW * (e.hp / e.maxHp), 4);
    }
  }

  ctx.restore();
}
