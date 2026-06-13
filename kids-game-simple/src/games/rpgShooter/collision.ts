// 碰撞检测模块
import { GAME_CONFIG } from './config';
import type { GameState, Enemy, Drop } from './types';
import { playerHit, levelUp } from './player';
import { spawnEnemyBullet } from './bullets';

// 矩形碰撞检测
export function rectCollide(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// 圆形碰撞检测
export function circleCollide(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (r1 + r2);
}

// 检测子弹与敌人碰撞
export function checkBulletEnemyCollisions(state: GameState): void {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    let bulletHit = false;

    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      
      // 碰撞检测
      if (rectCollide(
        b.x - 3, b.y - 3, 6, 6,
        e.x - e.w / 2, e.y - e.h / 2, e.w, e.h
      )) {
        bulletHit = true;
        e.hp -= b.atk;

        // 击中特效
        for (let k = 0; k < 3; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          state.particles.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.8,
            color: '#FFD700',
            size: 2
          });
        }

        // 分身弹：子弹命中时额外产生2颗散射子弹
        if (state.cloneTimer > 0) {
          for (let c = 0; c < 2; c++) {
            const spreadAngle = Math.atan2(b.vy, b.vx) + (c === 0 ? 0.4 : -0.4);
            state.bullets.splice(0, 0, {
              x: b.x,
              y: b.y,
              vx: Math.cos(spreadAngle) * 8,
              vy: Math.sin(spreadAngle) * 8,
              atk: b.atk,
              color: '#A855F7',
              tracking: false
            });
          }
        }

        // 敌人死亡
        if (e.hp <= 0) {
          handleEnemyDeath(state, e, j);
        } else {
          // 仅击中音效（可选）
        }

        break;
      }
    }

    if (bulletHit) {
      state.bullets.splice(i, 1);
    }
  }
}

// 处理敌人死亡
function handleEnemyDeath(state: GameState, enemy: Enemy, index: number): void {
  // 连击系统
  state.combo++;
  state.comboTimer = GAME_CONFIG.COMBO_TIMER;
  
  // 分数计算
  const baseScore = enemy.score * Math.min(state.combo, GAME_CONFIG.COMBO_MAX_MULTIPLIER);
  const scoreBonus = state.score2xTimer > 0 ? baseScore * 2 : baseScore;
  state.score += scoreBonus;

  // 浮动文字显示
  let scoreText = `+${scoreBonus}`;
  let scoreColor = '#FFD700';
  let scoreSize = 16;
  
  if (state.combo >= 10) {
    scoreText = `🔥 ${state.combo}x +${scoreBonus}`;
    scoreColor = '#FF4757';
    scoreSize = 24;
  } else if (state.combo >= 5) {
    scoreText = `${state.combo}x +${scoreBonus}`;
    scoreColor = '#FF6B6B';
    scoreSize = 20;
  }
  
  state.floatTexts.push({
    text: scoreText,
    x: enemy.x,
    y: enemy.y,
    life: 1.5,
    color: scoreColor,
    size: scoreSize
  });

  // 经验获取
  state.playerExp += enemy.exp;
  if (state.playerExp >= state.expToLevel && state.playerLevel < 10) {
    state.playerExp -= state.expToLevel;
    levelUp(state);
  }

  // 爆炸特效
  explode(state, enemy.x, enemy.y, enemy.color, 15 + enemy.type * 6, 5);

  // 高连击特殊效果
  if (state.combo >= 5) {
    state.shakeAmt = 4 + Math.min(state.combo * 0.5, 10);
    state.screenFlash = 0.15;
    
    // 连击光环
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      state.particles.push({
        x: state.playerX,
        y: state.playerY,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 1,
        color: '#FFD700',
        size: 3
      });
    }
  }

  // 生成掉落物
  spawnDrop(state, enemy.x, enemy.y);

  // 积累能量
  state.energy = Math.min(state.maxEnergy, state.energy + 5 + enemy.type * 2);

  // 移除敌人
  state.enemies.splice(index, 1);
}

// 爆炸特效
function explode(
  state: GameState,
  x: number, y: number,
  color: string,
  count: number,
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

// 生成掉落物
function spawnDrop(state: GameState, x: number, y: number): void {
  const drops = [
    { type: 'hp', icon: '💚', color: '#00E676', chance: 0.25 },
    { type: 'exp', icon: '✨', color: '#FFD700', chance: 0.30 },
    { type: 'powerup', icon: '📦', color: '#A855F7', chance: 0.28 }
  ];

  for (const dropDef of drops) {
    if (Math.random() < dropDef.chance) {
      const drop: Drop = {
        x,
        y,
        type: dropDef.type,
        icon: dropDef.icon,
        color: dropDef.color,
        life: 1,
        vy: 0.5 + Math.random() * 0.5
      };
      
      // 道具箱随机绑定道具类型
      if (dropDef.type === 'powerup') {
        // 这里需要从外部传入道具列表，暂时留空
        drop.powerupType = undefined;
      }
      
      state.drops.push(drop);
      break;
    }
  }
}

// 检测玩家与敌人碰撞
export function checkPlayerEnemyCollisions(state: GameState): void {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    
    if (state.invincible <= 0 && rectCollide(
      state.playerX - 12, state.playerY - 12, 24, 24,
      e.x - e.w / 2, e.y - e.h / 2, e.w, e.h
    )) {
      // 玩家受伤
      playerHit(state, 1);
      
      // 移除敌人
      state.enemies.splice(i, 1);
      
      // 检查游戏结束
      if (state.playerHP <= 0) {
        state.gameEnded = true;
        
        // 死亡爆炸特效
        explode(state, state.playerX, state.playerY, '#FF4757', 40, 8);
      }
      
      break;
    }
  }
}

// 检测玩家与掉落物碰撞
export function checkPlayerDropCollisions(state: GameState): void {
  for (let i = state.drops.length - 1; i >= 0; i--) {
    const d = state.drops[i];
    
    // 自动收集逻辑
    const collectRadius = state.energy >= state.maxEnergy 
      ? state.autoCollectRadius * 2 
      : state.autoCollectRadius;
    
    const dx = state.playerX - d.x;
    const dy = state.playerY - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 如果在收集范围内，自动吸向玩家
    if (dist < collectRadius) {
      const pullStrength = 3;
      d.x += (dx / dist) * pullStrength;
      d.y += (dy / dist) * pullStrength;
    }

    // 拾取检测
    if (rectCollide(
      state.playerX - 18, state.playerY - 18, 36, 36,
      d.x - 10, d.y - 10, 20, 20
    )) {
      handleDropPickup(state, d);
      state.drops.splice(i, 1);
    }
  }
}

// 处理掉落物拾取
function handleDropPickup(state: GameState, drop: Drop): void {
  if (drop.type === 'hp') {
    // HP恢复
    state.playerHP = Math.min(state.playerMaxHP, state.playerHP + 2);
    state.floatTexts.push({
      text: '💚+2 HP',
      x: drop.x,
      y: drop.y,
      life: 1,
      color: '#00E676',
      size: 14
    });
  } else if (drop.type === 'exp') {
    // EXP获取
    state.playerExp += 8;
    if (state.playerExp >= state.expToLevel && state.playerLevel < 10) {
      state.playerExp -= state.expToLevel;
      levelUp(state);
    }
    state.floatTexts.push({
      text: '✨+8 EXP',
      x: drop.x,
      y: drop.y,
      life: 1,
      color: '#FFD700',
      size: 14
    });
  } else if (drop.type === 'powerup' && drop.powerupType) {
    // 道具收集
    state.inventory.push(drop.powerupType);
    state.floatTexts.push({
      text: '📦 获得道具!',
      x: drop.x,
      y: drop.y - 10,
      life: 1.5,
      color: '#A855F7',
      size: 16
    });
  }
  
  // 拾取特效
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    state.particles.push({
      x: drop.x,
      y: drop.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8,
      color: '#fff',
      size: 2
    });
  }
}
