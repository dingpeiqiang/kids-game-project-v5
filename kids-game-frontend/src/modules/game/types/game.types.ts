export interface GameState {
  lives: number;
  questionCount: number;
  score: number;
  duration: number;
}

export interface GameConfig {
  gameType: string;
  mode: GameMode;
  container: HTMLElement;
  player1: PlayerInfo;
  player2?: PlayerInfo;
  maxScore?: number;
  timeLimit?: number;
}

export interface PlayerInfo {
  id: number;
  username: string;
  nickname?: string;
}

export enum GameMode {
  SINGLE = 'single',
  LOCAL_BATTLE = 'local-battle',
  ONLINE_BATTLE = 'online-battle',
  TEAM = 'team',
}

/**
 * 游戏模式配置（后端返回）
 */
export interface GameModeConfiguration {
  /** 配置 ID */
  id: number;
  /** 游戏 ID */
  gameId: number;
  /** 模式类型 */
  modeType: string;
  /** 模式名称 */
  modeName: string;
  /** 是否启用 */
  enabled: boolean;
  /** 配置内容（JSON 字符串） */
  configJson: string;
  /** 排序权重 */
  sortOrder: number;
  /** 创建时间 */
  createTime: number;
  /** 更新时间 */
  updateTime: number;

  // ========== 可视化配置字段 (UI 使用，不保存到后端) ==========
  /** 是否显示高级配置 */
  showAdvanced?: boolean;

  // 单人模式配置
  aiDifficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  aiResponseDelay?: number;

  // 本地对抗配置
  timeLimit?: number;
  questionCount?: number;
  allowDuplicateQuestions?: boolean;

  // 组队模式配置
  playersPerTeam?: number;
  winCondition?: 'score' | 'time' | 'questions' | 'survival';
  targetScore?: number;
  gameDuration?: number;

  // 多人乱斗配置
  maxPlayers?: number;
  allowLateJoin?: boolean;
  showEliminationAnimation?: boolean;

  // 网络对战配置
  serverRegion?: 'cn' | 'us' | 'eu' | 'asia';
  maxLatency?: number;
  enableRollback?: boolean;
  showLeaderboard?: boolean;
}

/**
 * 解析后的模式配置
 */
export interface ParsedModeConfig {
  /** 模式类型 */
  modeType: string;
  /** 模式名称 */
  modeName: string;
  /** 是否启用 */
  enabled: boolean;
  /** 具体配置项 */
  config: Record<string, any>;
  /** 排序权重 */
  sortOrder: number;
}
