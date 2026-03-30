// ============================================================================
// 🎮 关卡流程阶段枚举
// ============================================================================

/**
 * ⭐ 关卡流程阶段
 */
export enum LevelPhase {
  /** 未开始 */
  NOT_STARTED = 'NOT_STARTED',
  
  /** 解锁验证中 */
  UNLOCK_VALIDATING = 'UNLOCK_VALIDATING',
  
  /** 资源加载中 */
  RESOURCES_LOADING = 'RESOURCES_LOADING',
  
  /** 配置解析中 */
  CONFIG_PARSING = 'CONFIG_PARSING',
  
  /** 关卡生成中 */
  LEVEL_SPAWNING = 'LEVEL_SPAWNING',
  
  /** 运行中 */
  RUNNING = 'RUNNING',
  
  /** 结算中 */
  SETTLING = 'SETTLING',
  
  /** 已完成 */
  COMPLETED = 'COMPLETED'
}

/**
 * ⭐ 关卡流程事件接口
 */
export interface LevelFlowEvent {
  phase: LevelPhase
  progress: number // 0-1 进度
  message?: string
  data?: any
}
