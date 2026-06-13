// 道具系统模块
import type { GameState, Drop } from './types';
import { levelUp } from './player';
import { GAME_CONFIG } from './config';

// 生成掉落物
export function spawnDrop(state: GameState, x: number, y: number): void {
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
        const powerupTypes = ['nuke', 'laser', 'freeze', 'shield', 'score2x', 'clone'];
        drop.powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
      }
      
      state.drops.push(drop);
      break;
    }
  }
}

// 更新掉落物
export function updateDrops(state: GameState, dt: number): void {
  for (let i = state.drops.length - 1; i >= 0; i--) {
    const d = state.drops[i];
    
    // 重力下落
    d.y += d.vy;
    d.life -= 0.005;

    // 自动收集逻辑
    const collectRadius = state.energy >= state.maxEnergy 
      ? state.autoCollectRadius * 2 
      : state.autoCollectRadius;
    
    const dx = state.playerX - d.x;
    const dy = state.playerY - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 如果在收集范围内，自动吸向玩家
    if (dist < collectRadius && dist > 0) {
      const pullStrength = 3;
      d.x += (dx / dist) * pullStrength;
      d.y += (dy / dist) * pullStrength;
    }

    // 移除过期或出界的掉落物
    if (d.life <= 0 || d.y > GAME_CONFIG.CANVAS_HEIGHT + 20) {
      state.drops.splice(i, 1);
    }
  }
}

// 使用道具
export function usePowerup(state: GameState, type: string): boolean {
  const index = state.inventory.indexOf(type);
  if (index === -1) return false;
  
  state.inventory.splice(index, 1);
  
  switch (type) {
    case 'nuke':
      // ☢️ 核弹：全屏爆炸
      state.enemies.forEach(e => {
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = Math.random() * 8 + 3;
          state.particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 1.2,
            color: e.color,
            size: 4 + Math.random() * 5
          });
        }
        const bonus = e.score * 2;
        state.score += bonus;
        state.floatTexts.push({
          text: `💥+${bonus}`,
          x: e.x,
          y: e.y - 10,
          life: 1.2,
          color: '#FF4757',
          size: 16
        });
      });
      state.enemies.length = 0;
      state.shakeAmt = 25;
      state.screenFlash = 0.6;
      state.floatTexts.push({
        text: '☢️ 核弹清场!',
        x: GAME_CONFIG.CANVAS_WIDTH / 2,
        y: GAME_CONFIG.CANVAS_HEIGHT / 2,
        life: 2.5,
        color: '#FF4757',
        size: 32
      });
      break;

    case 'laser':
      // ⚡ 激光弹幕：持续4秒
      state.laserTimer = 4;
      state.floatTexts.push({
        text: '⚡ 激光弹幕!',
        x: state.playerX,
        y: state.playerY - 40,
        life: 2,
        color: '#FFD700',
        size: 24
      });
      break;

    case 'freeze':
      // ❄️ 时间冻结：敌人静止5秒
      state.freezeTimer = 5;
      state.floatTexts.push({
        text: '❄️ 时间冻结!',
        x: GAME_CONFIG.CANVAS_WIDTH / 2,
        y: GAME_CONFIG.CANVAS_HEIGHT / 2,
        life: 2,
        color: '#74B9FF',
        size: 26
      });
      state.screenFlash = 0.2;
      break;

    case 'shield':
      // 🛡️ 护盾：叠加4层
      state.shieldCount += 4;
      state.floatTexts.push({
        text: `🛡️ 护盾×${state.shieldCount}`,
        x: state.playerX,
        y: state.playerY - 40,
        life: 2,
        color: '#4D96FF',
        size: 22
      });
      break;

    case 'score2x':
      // ✨ 双倍分数：15秒
      state.score2xTimer = 15;
      state.floatTexts.push({
        text: '✨ 双倍分数!',
        x: GAME_CONFIG.CANVAS_WIDTH / 2,
        y: GAME_CONFIG.CANVAS_HEIGHT / 2 - 20,
        life: 2,
        color: '#FFD93D',
        size: 26
      });
      break;

    case 'clone':
      // 👾 分身弹：持续6秒
      state.cloneTimer = 6;
      state.floatTexts.push({
        text: '👾 分身弹!',
        x: state.playerX,
        y: state.playerY - 40,
        life: 2,
        color: '#A855F7',
        size: 22
      });
      break;
      
    default:
      return false;
  }
  
  return true;
}

// 处理掉落物拾取
export function handleDropPickup(state: GameState, drop: Drop): void {
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
