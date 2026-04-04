import { Logger } from '../utils/Logger'
// ============================================================================
//
// 📌 说明:
//   重构后的状态管理器只做一件事：管理 PlayerState 枚举的转换和查询。
//   ❌ 不再直接操作 player Sprite 的 setAlpha/setVisible/setActive
//   ❌ 不再包含 onHit / startRespawning / markAsDead 等高层流程方法
//   ❌ 不再依赖 scene 引用来获取 player
//
//   所有高层逻辑已上移到 PlayerController。
//   此类仅作为 PlayerController 的内部状态查询辅助。
// ============================================================================

/**
 * ⭐ 玩家状态枚举
 */
export enum PlayerState {
  ALIVE = 'ALIVE',              // 存活，可操作
  DYING = 'DYING',              // 正在死亡（受击动画中）
  RESPAWNING = 'RESPAWNING',    // 等待复活（无敌闪烁中）
  INVINCIBLE = 'INVINCIBLE',    // 无敌状态（复活后保护期）
  DEAD = 'DEAD'                 // 死亡（生命耗尽）
}

/**
 * ⭐ 玩家状态配置（由 PlayerController 传入）
 */
export interface IPlayerStateConfig {
  invincibleDuration: number      // 无敌持续时间（毫秒）
  dyingDuration: number           // 死亡动画持续时间（毫秒）
  blinkInterval: number           // 闪烁间隔（毫秒）
  blinkCount: number              // 闪烁次数
}

/**
 * ⭐ 玩家状态管理器（纯状态机）
 *
 * 职责：
 *   - 持有当前 PlayerState
 *   - 提供状态查询方法（getState / canAct / isValid / isInvincible / isDying）
 *   - 提供状态转换方法（transitionTo）
 *
 * ⚠️ 注意：此类不再操作任何 Sprite 或 gameStore。
 *    视觉效果和游戏逻辑由 PlayerController 统一处理。
 */
export class PlayerStateManager {
  private currentState: PlayerState = PlayerState.ALIVE

  constructor() {
    Logger.info('✅ [PlayerStateManager] 已创建 —— 纯状态机')
  }

  // ===========================================================================
  // 📊 状态查询
  // ===========================================================================

  /**
   * ⭐ 获取当前状态
   */
  getState(): PlayerState {
    return this.currentState
  }

  /**
   * ⭐ 设置当前状态（由 PlayerController 调用）
   */
  setState(state: PlayerState): void {
    this.currentState = state
  }

  /**
   * ⭐ 是否可以行动（移动、射击）
   */
  canAct(): boolean {
    return this.currentState === PlayerState.ALIVE ||
           this.currentState === PlayerState.INVINCIBLE ||
           this.currentState === PlayerState.RESPAWNING
  }

  /**
   * ⭐ 是否处于有效状态（可以参与碰撞检测）
   */
  isValid(): boolean {
    return this.currentState !== PlayerState.DEAD &&
           this.currentState !== PlayerState.DYING
  }

  /**
   * ⭐ 是否无敌（兼容旧查询，实际无敌标志由 PlayerController 管理）
   */
  isInvincible(): boolean {
    return this.currentState === PlayerState.INVINCIBLE ||
           this.currentState === PlayerState.RESPAWNING
  }

  /**
   * ⭐ 是否正在死亡
   */
  isDying(): boolean {
    return this.currentState === PlayerState.DYING
  }

  // ===========================================================================
  // 🔄 状态转换
  // ===========================================================================

  /**
   * ⭐ 转换到指定状态
   */
  transitionTo(state: PlayerState): void {
    const old = this.currentState
    this.currentState = state
    if (old !== state) {
      Logger.debug(`🔄 [PlayerStateManager] ${old} → ${state}`)
    }
  }

  // ===========================================================================
  // 🔧 重置与销毁
  // ===========================================================================

  /**
   * ⭐ 重置状态
   */
  reset(): void {
    this.currentState = PlayerState.ALIVE
  }

  /**
   * ⭐ 销毁
   */
  destroy(): void {
    this.currentState = PlayerState.ALIVE
  }
}
