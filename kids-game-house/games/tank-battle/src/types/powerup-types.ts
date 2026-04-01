// ============================================================================
// 🎁 道具系统类型定义
// ============================================================================

/**
 * ⭐ 道具类型枚举
 */
export enum PowerUpType {
  // ─── 基础道具 ──────────────────────────────────────────
  STAR = 'star',        // 火力升级
  SHIELD = 'shield',    // 护盾
  CLOCK = 'clock',      // 时间冻结
  
  // ─── 新道具 ──────────────────────────────────────────
  GUN = 'gun',          // 散弹枪
  HOMING = 'homing',    // 追踪导弹
  BOMB = 'bomb',        // 全屏炸弹
  SPEED = 'speed',      // 速度提升
  HEALTH = 'health',    // 生命恢复
  ARMOR = 'armor',      // 装甲强化
  GRENADE = 'grenade',  // 手榴弹
  INVINCIBLE = 'invincible', // 无敌状态
  LIFE = 'life'         // 额外生命
}

/**
 * ⭐ 道具生成配置
 */
export interface IPowerUpSpawnConfig {
  maxCount: number           // 场上最大数量
  spawnInterval: number      // 生成间隔（毫秒）
  despawnTime: number        // 未拾取消失时间（毫秒）
  spawnRates: Record<PowerUpType, number>  // 生成概率
}

/**
 * ⭐ 道具效果数据
 */
export interface IPowerUpEffectData {
  type: PowerUpType
  duration: number      // 持续时间（0 为永久/立即）
  power: number         // 效果值
  description: string   // 描述
}
