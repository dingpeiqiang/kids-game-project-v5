/**
 * 游戏首页显示配置
 *
 * 通过 enabledGames 控制首页展示哪些游戏。
 * 未列出的游戏不会在首页显示，但代码和路由仍然保留。
 * 排行榜、道具系统等也会自动按此配置过滤。
 *
 * 使用场景：
 * - 逐步上线新游戏（先在配置中关闭，稳定后再开启）
 * - 临时下线有问题的游戏
 * - A/B 测试不同游戏组合
 */

export interface GameConfig {
  /** 游戏ID，与 games.ts 中的 GAMES[].id 对应 */
  id: string
  /** 是否在首页显示 */
  visible: boolean
  /** 排序权重，数字越小越靠前（同分类内） */
  order: number
  /** 角标标签（如"新"、"热门"、"限时"），空字符串不显示 */
  badge: string
}

/**
 * 游戏显示配置表
 *
 * 修改此数组即可控制首页显示哪些游戏：
 * - visible: false → 首页不显示该游戏卡片
 * - order: 调整同分类内的显示顺序
 * - badge: 添加角标（支持：新/热门/限时/推荐 等）
 *
 * 注意：如果某个游戏 ID 未在此配置中出现，默认 visible=false（不显示）
 */
export const GAME_DISPLAY_CONFIG: GameConfig[] = [
  // // ── 热门消除 ──
  { id: 'eliminate',     visible: true,  order: 1,  badge: '热门' },
  { id: 'tetris',        visible: true,  order: 2,  badge: '' },
  { id: 'jewelMatch',    visible: true,  order: 3,  badge: '' },
  { id: 'bubbleShooter', visible: true,  order: 4,  badge: '' },

  // // ── 反应力 ──
  { id: 'pop',           visible: true,  order: 1,  badge: '' },
  { id: 'whackMole',     visible: true,  order: 2,  badge: '推荐' },
  { id: 'colorTap',      visible: true,  order: 3,  badge: '' },

  // // ── 切割爽感 ──
  { id: 'fruitSlice',    visible: true,  order: 1,  badge: '' },
  { id: 'cookieCut',     visible: true,  order: 2,  badge: '' },

  // // ── 动作闯关 ──
  { id: 'dodge',         visible: true,  order: 1,  badge: '' },
  { id: 'racingRun',     visible: true,  order: 2,  badge: '热门' },
  { id: 'snake',         visible: true,  order: 3,  badge: '推荐' },
  { id: 'neonRun',       visible: true,  order: 4,  badge: '' },
  { id: 'slimeJump',     visible: true,  order: 5,  badge: '' },

  // // ── 益智休闲 ──
  { id: 'sort',          visible: true,  order: 1,  badge: '' },
  { id: 'bouncePath',    visible: true,  order: 2,  badge: '' },
  { id: 'starCatcher',   visible: true,  order: 3,  badge: '' },

  // // ── 3D沉浸 ──
  { id: 'stack3d',       visible: true,  order: 1,  badge: '' },

  // // ── 堆叠建造 ──
  { id: 'stack',         visible: true,  order: 1,  badge: '' },

  // ── 射击枪战 ──
  { id: 'spaceShooter',  visible: true,  order: 1,  badge: '新' },
  { id: 'dragonShooter', visible: true,  order: 2,  badge: '新' },
  { id: 'rpgShooter',    visible: true,  order: 3,  badge: '推荐' },
  { id: 'rpgShooterTD',  visible: true,  order: 4,  badge: '新' },
  { id: 'contraRpg',     visible: true,  order: 5,  badge: '新' },

  // // ── 策略塔防 ──
  { id: 'towerDefense',  visible: true,  order: 1,  badge: '新' },

  // // ── 卡牌记忆 ──
  { id: 'memoryMatch',   visible: true,  order: 1,  badge: '' },
]

// ── 工具函数 ──────────────────────────────────────────────

/** 获取某个游戏的显示配置（未配置则默认不显示） */
export function getGameDisplayConfig(gameId: string): GameConfig {
  const found = GAME_DISPLAY_CONFIG.find(c => c.id === gameId)
  return found || { id: gameId, visible: false, order: 99, badge: '' }
}

/** 获取所有可见的游戏ID列表 */
export function getVisibleGameIds(): string[] {
  return GAME_DISPLAY_CONFIG.filter(c => c.visible).map(c => c.id)
}

/** 判断某个游戏是否可见 */
export function isGameVisible(gameId: string): boolean {
  return getGameDisplayConfig(gameId).visible
}
