/**
 * 接金币游戏 Demo - 测试框架稳定性
 *
 * 🎮 游戏玩法:
 * - 玩家控制底部方块左右移动
 * - 接到上方掉落的金币得分
 * - 漏接所有生命后游戏结束
 */

import Phaser from 'phaser'

// ============================================================================
// 🎮 游戏配置
// ============================================================================

const GAME_CONFIG = {
  width: 640,
  height: 360,
  backgroundColor: '#1e293b'
}

// 难度配置
const DIFFICULTY_CONFIGS = {
  easy: {
    speed: 300,          // 玩家移动速度 (px/s)
    coinSpeed: 120,      // 金币下落速度 (px/s)
    spawnInterval: 1500, // 金币生成间隔(ms)
    lives: 5
  },
  medium: {
    speed: 400,
    coinSpeed: 200,
    spawnInterval: 1200,
    lives: 3
  },
  hard: {
    speed: 500,
    coinSpeed: 300,
    spawnInterval: 800,
    lives: 2
  }
}

let currentConfig = DIFFICULTY_CONFIGS.medium
let game: Phaser.Game | null = null

// ============================================================================
// 🎮 游戏状态
// ============================================================================

interface Coin {
  obj: Phaser.GameObjects.Arc
  y: number
}

interface GameState {
  score: number
  lives: number
  isGameOver: boolean
  player: Phaser.GameObjects.Rectangle | null
  playerX: number
  coins: Coin[]
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | null
  lastSpawnTime: number
  tipText: Phaser.GameObjects.Text | null
}

/**
 * 初始化游戏
 */
export function initGame(
  container: HTMLElement,
  callbacks?: {
    onScoreChange?: (score: number) => void
    onGameOver?: () => void
    onDifficultyChange?: (difficulty: string) => void
  }
) {
  const state: GameState = {
    score: 0,
    lives: currentConfig.lives,
    isGameOver: false,
    player: null,
    playerX: container.clientWidth / 2,
    coins: [],
    cursors: null,
    lastSpawnTime: 0,
    tipText: null
  }

  // RESIZE 模式：画布尺寸实时跟随容器，配合 CSS w-full h-full 实现全屏
  // 贪吃蛇同款方案：width/height 设为 '100%'，确保填满父容器
  game = new Phaser.Game({
    ...GAME_CONFIG,
    parent: container,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%'
    },
    scene: {
      preload,
      create,
      update
    }
  })

  // ==================== 资源预加载 ====================

  function preload() {
    // 测试阶段不依赖外部资源
  }

  // ==================== 游戏创建 ====================

  function create() {
    state.cursors = this.input.keyboard?.createCursorKeys() || null

    // RESIZE 模式下用 scale 获取实时画布尺寸
    const w = this.scale.width
    const h = this.scale.height

    // 创建玩家方块
    state.player = this.add.rectangle(w / 2, h - 30, 50, 20, 0x22c55e)

    // 画边界参考线（底部）
    this.add.rectangle(w / 2, h - 8, w, 2, 0x334155)

    // 创建 UI
    const scoreText = this.add.text(16, 16, '分数: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial'
    })
    scoreText.setName('scoreText')

    const livesText = this.add.text(w - 16, 16, `❤️ ${state.lives}`, {
      fontSize: '20px',
      color: '#ef4444',
      fontFamily: 'Arial'
    }).setOrigin(1, 0)
    livesText.setName('livesText')

    // 操作提示
    state.tipText = this.add.text(w / 2, h / 2, '🎮 ← → 方向键移动，接住金币！', {
      fontSize: '18px',
      color: '#9ca3af',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // 点击重新开始
    this.input.on('pointerdown', () => {
      if (state.isGameOver) {
        restartGame(this, state, callbacks)
      }
    })
  }

  // ==================== 游戏循环 ====================

  function update(time: number, delta: number) {
    if (state.isGameOver || !state.player || !state.cursors) return

    // 隐藏提示
    if (state.tipText && state.tipText.active) {
      state.tipText.destroy()
      state.tipText = null
    }

    // RESIZE 模式下用 scale 获取实时画布尺寸
    const w = this.scale.width
    const h = this.scale.height

    // 玩家移动 (像素/秒 → 像素/帧)
    const moveAmount = (currentConfig.speed * delta) / 1000
    if (state.cursors.left?.isDown) {
      state.playerX -= moveAmount
    } else if (state.cursors.right?.isDown) {
      state.playerX += moveAmount
    }
    // 边界限制
    state.playerX = Phaser.Math.Clamp(state.playerX, 25, w - 25)
    state.player.x = state.playerX
    state.player.y = h - 30

    // 生成金币
    if (time - state.lastSpawnTime > currentConfig.spawnInterval) {
      spawnCoin(this, state)
      state.lastSpawnTime = time
    }

    // 更新金币
    const coinFall = (currentConfig.coinSpeed * delta) / 1000

    for (let i = state.coins.length - 1; i >= 0; i--) {
      const coin = state.coins[i]
      coin.y += coinFall
      coin.obj.y = coin.y

      // 接到检测
      const dist = Phaser.Math.Distance.Between(state.playerX, h - 30, coin.obj.x, coin.y)
      if (dist < 35) {
        // 得分
        state.score += 10
        callbacks?.onScoreChange?.(state.score)

        const scoreText = this.children.getByName('scoreText') as Phaser.GameObjects.Text
        scoreText?.setText(`分数: ${state.score}`)

        coin.obj.destroy()
        state.coins.splice(i, 1)
        continue
      }

      // 漏接
      if (coin.y > h + 10) {
        coin.obj.destroy()
        state.coins.splice(i, 1)

        state.lives--
        const livesText = this.children.getByName('livesText') as Phaser.GameObjects.Text
        livesText?.setText(`❤️ ${Math.max(0, state.lives)}`)

        if (state.lives <= 0) {
          doGameOver(this, state, callbacks)
        }
      }
    }
  }

  // ==================== 辅助函数 ====================

  function spawnCoin(scene: Phaser.Scene, _state: GameState) {
    const w = scene.scale.width
    const x = Phaser.Math.Between(30, w - 30)
    const obj = scene.add.circle(x, -10, 8, 0xfcd34d)
    _state.coins.push({ obj, y: -10 })
  }

  function doGameOver(scene: Phaser.Scene, state: GameState, callbacks?: {
    onScoreChange?: (score: number) => void
    onGameOver?: () => void
  }) {
    state.isGameOver = true

    const w = scene.scale.width
    const h = scene.scale.height

    scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)

    scene.add.text(w / 2, h / 2 - 30, '游戏结束!', {
      fontSize: '36px',
      color: '#ef4444',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    scene.add.text(w / 2, h / 2 + 20, `最终得分: ${state.score}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    scene.add.text(w / 2, h / 2 + 60, '点击屏幕重新开始', {
      fontSize: '16px',
      color: '#9ca3af',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    callbacks?.onGameOver?.()
  }

  function restartGame(scene: Phaser.Scene, state: GameState, callbacks?: {
    onScoreChange?: (score: number) => void
    onGameOver?: () => void
  }) {
    state.score = 0
    state.lives = currentConfig.lives
    state.isGameOver = false
    state.playerX = scene.scale.width / 2

    for (const coin of state.coins) coin.obj.destroy()
    state.coins = []

    if (state.player) {
      state.player.x = scene.scale.width / 2
      state.player.y = scene.scale.height - 30
    }

    const scoreText = scene.children.getByName('scoreText') as Phaser.GameObjects.Text
    scoreText?.setText('分数: 0')

    const livesText = scene.children.getByName('livesText') as Phaser.GameObjects.Text
    livesText?.setText(`❤️ ${state.lives}`)

    callbacks?.onScoreChange?.(0)
  }

  // ==================== 暴露 API ====================

  return {
    getScore: () => state.score,
    addScore: (points: number) => {
      state.score += points
      callbacks?.onScoreChange?.(state.score)
    },
    gameOver: () => {
      state.isGameOver = true
      callbacks?.onGameOver?.()
    },
    setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => {
      currentConfig = DIFFICULTY_CONFIGS[difficulty]
      state.lives = currentConfig.lives
      callbacks?.onDifficultyChange?.(difficulty)
    },
    pause: () => { game?.scene.pause('default') },
    resume: () => { game?.scene.resume('default') }
  }
}

// ============================================================================
// 🔧 导出函数
// ============================================================================

export function destroyGame() {
  if (game) {
    game.destroy(true)
    game = null
  }
}

export function pauseGame() {
  game?.scene.pause('default')
}

export function resumeGame() {
  game?.scene.resume('default')
}

export { DIFFICULTY_CONFIGS }
