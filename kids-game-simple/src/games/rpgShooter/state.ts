// 游戏状态管理
import { GAME_CONFIG } from './config';
import type { GameState, Star } from './types';

// 初始化游戏状态
export function createInitialState(): GameState {
  const stars: Star[] = [];
  
  // 初始化星空背景
  for (let i = 0; i < GAME_CONFIG.STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
      y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
      speed: 0.3 + Math.random() * 1.5,
      size: 0.5 + Math.random() * 2,
      bright: 0.3 + Math.random() * 0.7,
    });
  }

  return {
    // 玩家状态
    playerX: GAME_CONFIG.CANVAS_WIDTH / 2,
    playerY: GAME_CONFIG.CANVAS_HEIGHT / 2,
    playerLevel: 1,
    playerHP: 6,
    playerMaxHP: 6,
    playerATK: 1,
    playerExp: 0,
    expToLevel: 25,
    invincible: 0,
    shootAngle: -Math.PI / 2,
    
    // 射击状态
    lastShot: 0,
    
    // 游戏对象数组
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    floatTexts: [],
    drops: [],
    stars,
    
    // 游戏流程
    gameStarted: false,
    gameEnded: false,
    elapsed: 0,
    startTime: Date.now(),
    difficulty: 1,
    waveCount: 0,
    spawnTimer: 0,
    
    // 视觉效果
    shakeAmt: 0,
    screenFlash: 0,
    
    // 分数系统
    score: 0,
    combo: 0,
    comboTimer: 0,
    
    // 能量系统
    energy: 0,
    maxEnergy: GAME_CONFIG.MAX_ENERGY,
    autoCollectRadius: GAME_CONFIG.AUTO_COLLECT_RADIUS,
    
    // 道具库存
    inventory: [],
    
    // 属性加成
    speedBoost: 0,
    atkBoost: 0,
    
    // 道具效果计时器
    laserTimer: 0,
    freezeTimer: 0,
    cloneTimer: 0,
    score2xTimer: 0,
    shieldCount: 0,
    
    // 连击奖励
    comboReward: {
      active: false,
      timer: 0,
      type: ''
    },
    
    // Boss
    currentBoss: null,
    
    // 输入状态
    targetX: GAME_CONFIG.CANVAS_WIDTH / 2,
    targetY: GAME_CONFIG.CANVAS_HEIGHT / 2,
    keys: {},
    mobileStickX: 0,
    mobileStickY: 0,
  };
}

// 重置游戏状态（用于重新开始）
export function resetState(state: GameState): void {
  const newState = createInitialState();
  Object.assign(state, newState);
}
