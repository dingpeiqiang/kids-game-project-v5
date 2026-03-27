/**
 * {{GAME_NAME}} - 游戏逻辑入口
 *
 * 🎯 在这个文件中实现游戏的核心逻辑
 * - 初始化 Phaser 游戏
 * - 处理游戏规则
 * - 管理游戏状态
 *
 * 框架已提供：
 * - UI 组件 (ScorePanel, GameOverView, StartView 等)
 * - 状态管理 (useGameStore)
 * - 屏幕适配 (ScreenAdapter)
 * - GTRS 主题加载 (GTRSLoader)
 * - 音频管理 (AudioManager)
 * - 道具系统 (ItemSystem)
 */

import Phaser from 'phaser'

// ============================================================================
// 🎮 游戏配置 - 根据游戏需求修改这些配置
// ============================================================================

const GAME_CONFIG = {
  // 游戏画布逻辑尺寸（像素）
  // Scale.FIT 模式下，画布会按此比例缩放适配屏幕
  width: 640,
  height: 360,
  backgroundColor: '#1e293b'
}

// 屏幕适配配置
const SCALE_CONFIG = {
  /**
   * 缩放模式:
   * - 'RESIZE':  画布尺寸跟随容器变化，实现全屏（推荐大多数游戏）
   * - 'FIT':     保持宽高比，缩放到容器内（固定尺寸画布）
   * - 'ENVELOP': 保持宽高比，铺满容器（可能裁剪边缘）
   * - 'EXPAND':  保持宽高比，放大铺满窗口
   * - 'NONE':    不缩放，固定画布尺寸
   *
   * ⚠️ 使用 RESIZE 模式时，游戏逻辑中请用 scene.scale.width / scene.scale.height
   *    获取实时画布尺寸，而非 GAME_CONFIG 中的固定值。
   */
  mode: 'RESIZE',
  /** 居中方式: 'CENTER_BOTH' | 'CENTER_HORIZONTALLY' | 'CENTER_VERTICALLY' */
  autoCenter: 'CENTER_BOTH'
}

// 难度配置
const DIFFICULTY_CONFIGS = {
  easy: {
    speed: 60,
    scoreMultiplier: 1.0
  },
  medium: {
    speed: 100,
    scoreMultiplier: 1.0
  },
  hard: {
    speed: 150,
    scoreMultiplier: 1.0
  }
}

let game: Phaser.Game | null = null

/**
 * 初始化游戏
 * @param container 游戏容器元素
 * @param callbacks 回调函数
 */
export function initGame(
  container: HTMLElement,
  callbacks?: {
    onScoreChange?: (score: number) => void
    onGameOver?: () => void
    onDifficultyChange?: (difficulty: string) => void
  }
) {
  // 创建 Phaser 游戏实例（已内置屏幕适配）
  game = new Phaser.Game({
    ...GAME_CONFIG,
    parent: container,
    scale: {
      mode: Phaser.Scale[SCALE_CONFIG.mode as keyof typeof Phaser.Scale],
      autoCenter: Phaser.Scale[SCALE_CONFIG.autoCenter as keyof typeof Phaser.Scale],
      width: '100%',
      height: '100%'
    },
    scene: {
      preload,
      create,
      update
    }
  })

  // ==================== 游戏状态 ====================
  let score = 0
  let isGameOver = false

  // ==================== 在这里实现游戏逻辑 ====================

  function preload() {
    // TODO: 加载游戏资源
    // 示例: this.load.image('player', '/themes/default/images/player.png')
    // 使用 GTRS 加载器: 参见 GTRSLoader 组件
  }

  function create() {
    // RESIZE 模式下用 scale 获取实时画布尺寸
    const w = this.scale.width
    const h = this.scale.height

    // TODO: 创建游戏对象
    // 示例:
    // const player = this.add.image(w / 2, h / 2, 'player')

    // 显示提示（开发时参考）
    this.add.text(w / 2, h / 2 - 20, '{{GAME_NAME}}', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(w / 2, h / 2 + 20, '点击开始开发你的游戏', {
      fontSize: '16px',
      color: '#9ca3af'
    }).setOrigin(0.5)
  }

  function update(time: number, delta: number) {
    // TODO: 游戏循环逻辑
    // 示例: 处理移动、碰撞检测等
  }

  // ==================== 暴露给外部的 API ====================

  return {
    /**
     * 获取当前分数
     */
    getScore: () => score,

    /**
     * 加分
     */
    addScore: (points: number) => {
      score += points
      callbacks?.onScoreChange?.(score)
    },

    /**
     * 游戏结束
     */
    gameOver: () => {
      isGameOver = true
      callbacks?.onGameOver?.()
    },

    /**
     * 设置难度
     */
    setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => {
      callbacks?.onDifficultyChange?.(difficulty)
    },

    /**
     * 暂停游戏
     */
    pause: () => {
      game?.scene.pause('default')
    },

    /**
     * 恢复游戏
     */
    resume: () => {
      game?.scene.resume('default')
    }
  }
}

/**
 * 销毁游戏
 */
export function destroyGame() {
  if (game) {
    game.destroy(true)
    game = null
  }
}

/**
 * 暂停游戏
 */
export function pauseGame() {
  game?.scene.pause('default')
}

/**
 * 恢复游戏
 */
export function resumeGame() {
  game?.scene.resume('default')
}

// 导出难度配置，供难度选择器使用
export { DIFFICULTY_CONFIGS }
