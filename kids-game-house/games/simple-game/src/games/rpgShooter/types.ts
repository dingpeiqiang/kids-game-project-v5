// RPG Shooter 类型定义

// 玩家子弹
export interface PlayerBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  atk: number;
  color: string;
  tracking: boolean;
  piercing?: boolean;
}

// 敌人子弹
export interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  damage: number;
}

// 敌人
export interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  score: number;
  exp: number;
  color: string;
  shape: string;
  speed: number;
  vx: number;
  vy: number;
  type: number;
}

// 粒子
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

// 浮动文字
export interface FloatText {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
  size: number;
}

// 掉落物
export interface Drop {
  x: number;
  y: number;
  type: string;
  icon: string;
  color: string;
  life: number;
  vy: number;
  powerupType?: string;
}

// 星星背景
export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  bright: number;
}

// 连击奖励状态
export interface ComboReward {
  active: boolean;
  timer: number;
  type: 'rapidfire' | 'invincible' | 'nuke' | '';
}

// Boss状态
export interface Boss {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  phase: number;
  attackTimer: number;
  pattern: 'spiral' | 'rain' | 'charge';
}

// 游戏状态接口
export interface GameState {
  // 玩家状态
  playerX: number;
  playerY: number;
  playerLevel: number;
  playerHP: number;
  playerMaxHP: number;
  playerATK: number;
  playerExp: number;
  expToLevel: number;
  invincible: number;
  shootAngle: number;
  
  // 射击状态
  lastShot: number;
  
  // 游戏对象数组
  bullets: PlayerBullet[];
  enemyBullets: EnemyBullet[];
  enemies: Enemy[];
  particles: Particle[];
  floatTexts: FloatText[];
  drops: Drop[];
  stars: Star[];
  
  // 游戏流程
  gameStarted: boolean;
  gameEnded: boolean;
  elapsed: number;
  startTime: number;
  difficulty: number;
  waveCount: number;
  spawnTimer: number;
  
  // 视觉效果
  shakeAmt: number;
  screenFlash: number;
  
  // 分数系统
  score: number;
  combo: number;
  comboTimer: number;
  
  // 能量系统
  energy: number;
  maxEnergy: number;
  autoCollectRadius: number;
  
  // 道具库存
  inventory: string[];
  
  // 属性加成
  speedBoost: number;
  atkBoost: number;
  
  // 道具效果计时器
  laserTimer: number;
  freezeTimer: number;
  cloneTimer: number;
  score2xTimer: number;
  shieldCount: number;
  
  // 连击奖励
  comboReward: ComboReward;
  
  // Boss
  currentBoss: Boss | null;
  
  // 输入状态
  targetX: number;
  targetY: number;
  keys: { [key: string]: boolean };
}
