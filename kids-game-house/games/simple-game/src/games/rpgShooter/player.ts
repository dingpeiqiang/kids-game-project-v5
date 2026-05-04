// 玩家逻辑模块
import { GAME_CONFIG, LEVEL_STATS } from './config';
import { GameState, Particle, FloatText } from './types';

// 初始化玩家属性
export function initPlayerStats(state: GameState): void {
  const stats = LEVEL_STATS[Math.min(state.playerLevel - 1, LEVEL_STATS.length - 1)];
  state.playerMaxHP = stats.hp;
  state.playerHP = Math.min(state.playerHP, state.playerMaxHP);
  state.playerATK = stats.atk;
}

// 玩家升级
export function levelUp(state: GameState): void {
  state.playerLevel++;
  state.expToLevel = Math.floor(25 * Math.pow(1.4, state.playerLevel - 1));
  
  const stats = LEVEL_STATS[Math.min(state.playerLevel - 1, LEVEL_STATS.length - 1)];
  state.playerMaxHP = stats.hp;
  state.playerHP = state.playerMaxHP;
  state.playerATK = stats.atk;

  // 添加升级提示文字
  state.floatTexts.push({
    text: `🎉 Lv.${state.playerLevel}!`,
    x: state.playerX,
    y: state.playerY - 30,
    life: 2,
    color: '#FFD700',
    size: 28
  });

  // 升级特效（华丽的粒子爆炸）
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 / 30) * i;
    const speed = 3 + Math.random() * 5;
    state.particles.push({
      x: state.playerX,
      y: state.playerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.5,
      color: i % 2 === 0 ? '#FFD700' : '#FF6B6B',
      size: 5 + Math.random() * 3
    });
  }

  state.shakeAmt = 8;
  state.screenFlash = 0.3;
}

// 更新玩家位置（处理输入）
export function updatePlayer(state: GameState, dt: number): void {
  if (state.gameEnded) return;

  const stats = LEVEL_STATS[Math.min(state.playerLevel - 1, LEVEL_STATS.length - 1)];
  const effectiveSpeed = stats.speed + state.speedBoost * 0.5;

  // 键盘输入
  let dx = 0, dy = 0;
  if (state.keys['w'] || state.keys['arrowup']) dy -= 1;
  if (state.keys['s'] || state.keys['arrowdown']) dy += 1;
  if (state.keys['a'] || state.keys['arrowleft']) dx -= 1;
  if (state.keys['d'] || state.keys['arrowright']) dx += 1;

  // 鼠标/触摸方向
  const mouseDx = state.targetX - state.playerX;
  const mouseDy = state.targetY - state.playerY;
  const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

  if (mouseDist > 10) {
    dx += mouseDx / mouseDist;
    dy += mouseDy / mouseDist;
  }

  // 标准化并移动
  const moveDist = Math.sqrt(dx * dx + dy * dy);
  if (moveDist > 0) {
    state.playerX += (dx / moveDist) * effectiveSpeed;
    state.playerY += (dy / moveDist) * effectiveSpeed;
  }

  // 边界限制
  state.playerX = Math.max(20, Math.min(GAME_CONFIG.CANVAS_WIDTH - 20, state.playerX));
  state.playerY = Math.max(20, Math.min(GAME_CONFIG.CANVAS_HEIGHT - 20, state.playerY));

  // 更新射击角度
  if (mouseDist > 5) {
    state.shootAngle = Math.atan2(mouseDy, mouseDx);
  }

  // 无敌时间递减
  if (state.invincible > 0) {
    state.invincible -= dt / 1000;
  }
}

// 玩家受伤
export function playerHit(state: GameState, damage: number = 1): void {
  if (state.invincible > 0) return;

  if (state.shieldCount > 0) {
    // 护盾吸收
    state.shieldCount--;
    state.floatTexts.push({
      text: `🛡️ 护盾抵挡! (${state.shieldCount}剩余)`,
      x: state.playerX,
      y: state.playerY - 30,
      life: 1.5,
      color: '#4D96FF',
      size: 18
    });
    state.invincible = 1.0;
    state.shakeAmt = 5;
    
    // 护盾破碎特效
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      state.particles.push({
        x: state.playerX,
        y: state.playerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: '#4D96FF',
        size: 3
      });
    }
  } else {
    // 直接受伤
    state.playerHP -= damage;
    state.invincible = 2.0;
    state.shakeAmt = 10;
    state.screenFlash = 0.4;
    state.combo = 0;
    
    // 受伤警告
    state.floatTexts.push({
      text: '⚠️ 受伤!',
      x: state.playerX,
      y: state.playerY - 40,
      life: 1.5,
      color: '#FF4757',
      size: 20
    });
    
    // 受伤特效
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      state.particles.push({
        x: state.playerX,
        y: state.playerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: '#FF4757',
        size: 4
      });
    }
  }
}
