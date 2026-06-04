// 子弹系统模块
import { GAME_CONFIG } from './config';
import { GameState, PlayerBullet, EnemyBullet, Enemy } from './types';

// 玩家射击
export function shoot(state: GameState): void {
  const now = Date.now();
  
  // 检查射击冷却
  const currentShootCD = state.comboReward.active && state.comboReward.type === 'rapidfire' 
    ? GAME_CONFIG.SHOOT_CD / 2 
    : GAME_CONFIG.SHOOT_CD;
    
  if (now - state.lastShot < currentShootCD) return;
  state.lastShot = now;

  const effectiveATK = state.playerATK + Math.floor(state.atkBoost);
  const bulletColor = state.atkBoost > 0 ? '#FF6B6B' : '#00E5FF';

  // 寻找最近的敌人
  let nearestEnemy: Enemy | null = null;
  let nearestDist = Infinity;
  
  for (const e of state.enemies) {
    const dx = e.x - state.playerX;
    const dy = e.y - state.playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = e;
    }
  }

  let angle: number;
  let tracking = false;
  
  if (nearestEnemy) {
    // 追踪最近敌人
    angle = Math.atan2(nearestEnemy.y - state.playerY, nearestEnemy.x - state.playerX);
    tracking = true;
  } else {
    // 无敌人时朝鼠标方向射击
    const dx = state.targetX - state.playerX;
    const dy = state.targetY - state.playerY;
    angle = Math.atan2(dy, dx);
  }

  // 创建子弹
  state.bullets.push({
    x: state.playerX,
    y: state.playerY,
    vx: Math.cos(angle) * GAME_CONFIG.BULLET_SPEED,
    vy: Math.sin(angle) * GAME_CONFIG.BULLET_SPEED,
    atk: effectiveATK,
    color: bulletColor,
    tracking
  });
}

// 更新玩家子弹
export function updatePlayerBullets(state: GameState, dt: number): void {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];

    // 追踪子弹逻辑
    if (b.tracking && state.enemies.length > 0) {
      const TRACK_STRENGTH = 0.18;
      let nearestEnemy: Enemy | null = null;
      let nearestDist = Infinity;
      
      for (const e of state.enemies) {
        const dx = e.x - b.x;
        const dy = e.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = e;
        }
      }
      
      if (nearestEnemy) {
        const dx = nearestEnemy.x - b.x;
        const dy = nearestEnemy.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const desiredVx = (dx / dist) * GAME_CONFIG.BULLET_SPEED;
          const desiredVy = (dy / dist) * GAME_CONFIG.BULLET_SPEED;
          b.vx += (desiredVx - b.vx) * TRACK_STRENGTH;
          b.vy += (desiredVy - b.vy) * TRACK_STRENGTH;
          
          // 保持速度恒定
          const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          b.vx = (b.vx / speed) * GAME_CONFIG.BULLET_SPEED;
          b.vy = (b.vy / speed) * GAME_CONFIG.BULLET_SPEED;
        }
      }
    }

    // 更新位置
    b.x += b.vx;
    b.y += b.vy;
    
    // 移除出界子弹
    if (b.x < -10 || b.x > GAME_CONFIG.CANVAS_WIDTH + 10 || 
        b.y < -10 || b.y > GAME_CONFIG.CANVAS_HEIGHT + 10) {
      state.bullets.splice(i, 1);
    }
  }
}

// 生成敌人弹幕
export function spawnEnemyBullet(state: GameState, enemy: Enemy): void {
  if (!state.gameStarted) return;
  
  // Boss发射环形弹幕
  if (enemy.shape === 'boss' && Math.random() < 0.3) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      state.enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color: '#9B59B6',
        damage: 1
      });
    }
  }
  // 重型敌人发射追踪弹
  else if (enemy.shape === 'hex' && Math.random() < 0.2) {
    const angle = Math.atan2(state.playerY - enemy.y, state.playerX - enemy.x);
    state.enemyBullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * 2.5,
      vy: Math.sin(angle) * 2.5,
      color: '#FFA502',
      damage: 1
    });
  }
}

// 更新敌人子弹
export function updateEnemyBullets(state: GameState, dt: number): void {
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i];
    
    // 更新位置
    b.x += b.vx;
    b.y += b.vy;
    
    // 检测与玩家碰撞
    const dist = Math.sqrt((b.x - state.playerX) ** 2 + (b.y - state.playerY) ** 2);
    if (dist < 15 && state.invincible <= 0) {
      // 玩家受伤逻辑在collision模块处理
      state.playerHP -= b.damage;
      state.invincible = 1.5;
      state.shakeAmt = 8;
      state.combo = 0;
      state.enemyBullets.splice(i, 1);
      continue;
    }
    
    // 移除出界子弹
    if (b.x < -10 || b.x > GAME_CONFIG.CANVAS_WIDTH + 10 || 
        b.y < -10 || b.y > GAME_CONFIG.CANVAS_HEIGHT + 10) {
      state.enemyBullets.splice(i, 1);
    }
  }
}
