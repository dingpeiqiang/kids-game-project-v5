// RPG Shooter 模块导出

// 配置
export { GAME_CONFIG, LEVEL_STATS, ENEMY_TYPES, DROP_TYPES } from './config';

// 类型
export type {
  PlayerBullet,
  EnemyBullet,
  Enemy,
  Particle,
  FloatText,
  Drop,
  Star,
  ComboReward,
  Boss,
  GameState
} from './types';

// 状态管理
export { createInitialState, resetState } from './state';

// 玩家逻辑
export { initPlayerStats, levelUp, updatePlayer, playerHit } from './player';

// 子弹系统
export { shoot, updatePlayerBullets, spawnEnemyBullet, updateEnemyBullets } from './bullets';

// 敌人系统
export { spawnEnemy, updateEnemies, drawEnemy } from './enemies';

// 碰撞检测
export { rectCollide, circleCollide, checkBulletEnemyCollisions, checkPlayerEnemyCollisions, checkPlayerDropCollisions } from './collision';

// 道具系统
export { spawnDrop, updateDrops, usePowerup, handleDropPickup } from './powerups';

// 粒子特效
export { createExplosion, createLevelUpEffect, createComboEffect, createHitEffect, createShieldBreakEffect, createCollectEffect, createBulletHitEffect, updateParticles, drawParticles } from './particles';

// 渲染系统
export { drawBackground, drawPlayer, drawBullets, drawDrops, drawFloatTexts, drawHUD, applyScreenEffects, drawEnergyAura, drawStartScreen, drawGameOver } from './rendering';

// 后续添加其他模块导出
// export { ... } from './enemies';
// export { ... } from './bullets';
// export { ... } from './powerups';
// export { ... } from './particles';
// export { ... } from './collision';
// export { ... } from './rendering';
// export { ... } from './input';
