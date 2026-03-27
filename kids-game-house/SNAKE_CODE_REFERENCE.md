# 📝 贪吃蛇游戏代码参考与注释

**版本**: v1.0  
**目标**: 通过详细注释提取可复用的代码模式  
**适用**: 所有 Phaser + Vue 3 游戏项目

---

## 📋 目录

1. [Phaser 游戏主类框架](#phaser-游戏主类框架)
2. [GTRS 主题加载系统](#gtrs-主题加载系统)
3. [屏幕自适应系统](#屏幕自适应系统)
4. [音频管理系统](#音频管理系统)
5. [游戏对象渲染示例](#游戏对象渲染示例)
6. [道具系统](#道具系统)
7. [游戏循环与状态管理](#游戏循环与状态管理)

---

## Phaser 游戏主类框架

### 完整的类结构

```typescript
// ============================================================================
// 🎮【可复用框架层】Phaser 游戏引擎封装 - 所有游戏通用
// ============================================================================
// 
// 📌 使用说明:
//   ✅ 这部分代码 (第 1-600 行) 是通用框架，开发新游戏时可直接复制
//   ✅ 包含：GTRS 主题系统、Phaser 初始化、屏幕适配、音频管理、资源加载
//   ✅ 无需修改，直接复用到其他游戏项目
//
// 📌 架构分层:
//   ┌─────────────────────────────────────────┐
//   │  【游戏特定层】(第 600 行以后)            │ ← 需要根据新游戏修改
//   │    ├─ renderSnake()  - 渲染蛇           │
//   │    ├─ renderFood()   - 渲染食物         │
//   │    └─ 其他游戏特定渲染逻辑              │
//   ├─────────────────────────────────────────┤
//   │  【可复用框架层】(第 1-600 行)            │ ← 直接复制复用
//   │    ├─ GTRS 主题加载系统                 │
//   │    ├─ Phaser 引擎初始化                 │
//   │    ├─ 屏幕自适应系统                    │
//   │    ├─ 音频管理系统                      │
//   │    └─ 资源管理系统                      │
//   └─────────────────────────────────────────┘
// ============================================================================

export class SnakePhaserGame {
  // ============================================================================
  // 🔧【可复用框架层】Phaser 游戏配置与状态
  // ============================================================================
  
  private config: Phaser.Types.Core.GameConfig
  private game: Phaser.Game | null = null
  private scene: Phaser.Scene | null = null
  private isReady: boolean = false  // ⭐ 标记资源是否加载完成

  // ============================================================================
  // 🔧【游戏特定配置】根据具体游戏修改这些值
  // ============================================================================
  
  // 👉 设计基准（美术作图标准，不代表画布大小）
  private readonly DESIGN_WIDTH = 720   // 设计宽度
  private readonly DESIGN_HEIGHT = 1280 // 设计高度（竖屏基准）
  
  // 👉 游戏网格配置（⚠️ 根据具体游戏玩法修改）
  private readonly GRID_COLS = 32  // ⚠️ 贪吃蛇：32 列，其他游戏按需修改
  private readonly GRID_ROWS = 18  // ⚠️ 贪吃蛇：18 行，其他游戏按需修改
  
  // 👉 基础单元格大小（像素）
  private readonly BASE_CELL_SIZE = 50  // ⚠️ 可根据游戏需求调整
  
  // ============================================================================
  // 🔧【可复用框架层】全局适配参数（运行时自动计算）
  // ============================================================================
  
  private Adapt = {
    screenW: 0,    // 设备真实宽度
    screenH: 0,    // 设备真实高度
    scale: 1,      // 全局动态缩放比（核心）
    safeTop: 0,    // 顶部安全区（避开刘海）
    safeBottom: 0, // 底部安全区（避开手势条）
    cellSize: 0,   // 动态单元格大小（自动计算）
    gameAreaX: 0,  // 游戏区域左上角 X 坐标
    gameAreaY: 0   // 游戏区域左上角 Y 坐标
  }

  // ============================================================================
  // 🎨【游戏特定层】游戏对象引用（根据具体游戏修改）
  // ============================================================================
  // ⚠️ 说明：这些是游戏特定的渲染对象，不同游戏的对象完全不同
  // ============================================================================
  
  // 👉 贪吃蛇游戏对象（⚠️ 其他游戏需要替换为自己的对象）
  private snakeGroup: Phaser.GameObjects.Group | null = null  // ⚠️ 蛇群组
  private foodSprite: Phaser.GameObjects.Graphics | null = null  // ⚠️ 食物精灵
  private obstacleGroup: Phaser.GameObjects.Group | null = null  // ⚠️ 障碍物群组（可选）
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null  // ⚠️ 粒子系统

  // ============================================================================
  // 🔧【可复用框架层】音频管理对象（所有游戏通用）
  // ============================================================================
  
  // 👉 音频对象（使用 HTML5 Audio，更可靠）
  private bgmMainAudio: HTMLAudioElement | null = null
  private bgmGameplayAudio: HTMLAudioElement | null = null
  private bgmGameoverAudio: HTMLAudioElement | null = null
  private soundEnabled: boolean = true

  // ============================================================================
  // 🔧【可复用框架层】回调与容器引用
  // ============================================================================
  
  // 👉 游戏完成回调
  private onGameComplete?: () => void

  // 🎁 道具效果回调（由外部 Vue 层注入，避免在 Phaser class 内部调用 useGameStore()）
  private onItemEffect?: (type: string) => void

  // 📥 资源加载进度回调（用于外部 UI 显示真实加载进度）
  private onProgress?: (progress: number) => void

  /**
   * 🎁 注入道具效果回调（在 Vue setup 中调用，确保 Pinia 上下文正确）
   */
  setItemEffectCallback(callback: (type: string) => void): void {
    this.onItemEffect = callback
  }

  /**
   * 📥 注入加载进度回调（用于外部 UI 显示真实加载进度）
   */
  setProgressCallback(callback: (progress: number) => void): void {
    this.onProgress = callback
  }
  
  // 👉 容器元素引用
  private containerElement: HTMLElement | null = null

  // ============================================================================
  // 🔧【可复用框架层】构造函数 - Phaser 引擎初始化配置
  // ============================================================================
  // 📌 说明：这段代码所有游戏通用，直接复制
  // ============================================================================
  
  /**
   * 构造函数
   * 📌 说明：所有游戏通用，直接复制
   * @param element 游戏容器 DOM 元素
   * @param onGameComplete 游戏完成回调
   */
  constructor(element: HTMLElement, onGameComplete?: () => void) {
    this.onGameComplete = onGameComplete
    this.containerElement = element
    
    // 🎁 初始化道具系统（如果需要）
    this.itemSystem = new ItemSystem({
      enabled: true,
      spawnInterval: 10000,    // 10 秒生成一个道具
      maxActiveItems: 3,       // 最多 3 个活跃道具
      itemLifetime: 10000,     // 道具存活 10 秒
      debugMode: true         // 开启调试模式
    })

    console.log('📐 游戏设计基准:', {
      designSize: `${this.DESIGN_WIDTH} × ${this.DESIGN_HEIGHT}`,
      gridConfig: `${this.GRID_COLS}列 × ${this.GRID_ROWS}行`,
      cellSize: `${this.BASE_CELL_SIZE}px`
    })

    // 👉 RESIZE 模式：响应式画布，自动适配所有设备
    // 使用闭包保存 self 引用，以便在场景方法中访问 SnakePhaserGame 实例
    const self = this
    
    this.config = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.RESIZE,        // 🔥 响应式（商业项目标准）
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      },
      parent: element,
      backgroundColor: '#1a1a2e',
      scene: {
        preload() {
          // ⭐ 这里的 this 是 Phaser.Scene，self 是 SnakePhaserGame 实例
          self.preload.call(self, this)
        },
        create() {
          self.create.call(self, this)
        },
        update(time: number, delta: number) {
          // Phaser 自动传递 time 和 delta 参数
          self.update.call(self, time, delta)
        }
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    }
  }

  // ============================================================================
  // 🚀【可复用框架层】公共 API - 游戏生命周期管理
  // ============================================================================
  // 📌 说明：这部分代码所有游戏通用，直接复制
  // ============================================================================

  /**
   * ⭐ 启动游戏
   * 📌 说明：所有游戏通用，直接复制
   * @param difficulty 难度级别
   * @param themeId 主题 ID（必需）
   * @throws Error 未提供 themeId 或主题加载失败时
   */
  async start(difficulty: Difficulty, themeId?: string): Promise<void> {
    if (this.game) {
      this.game.destroy(true)
    }

    if (!themeId) {
      throw new Error('[PhaserGame] 必须提供 themeId 才能启动游戏。请先从主题列表选择一个主题。')
    }

    const url = new URL(window.location.href)
    url.searchParams.set('theme_id', themeId)
    window.history.replaceState({}, '', url.toString())

    // ⭐ 先加载主题（含 GTRS 校验和资源下载）
    console.log('[PhaserGame] 🚀 开始加载主题...')
    await this.loadTheme(themeId)
    console.log('[PhaserGame] ✅ 主题加载完成，准备启动 Phaser 游戏引擎')

    // ⭐ 主题加载完成后，再初始化 Phaser 游戏实例
    this.game = new Phaser.Game(this.config)
    
    console.log('[PhaserGame] ⏳ 等待 Phaser 资源预加载完成...')
  }
  
  /**
   * 👉 获取当前 cellSize（供外部调用，如 gameStore 初始化）
   * 📌 说明：所有游戏通用，直接复制
   */
  getCellSize(): number {
    return this.Adapt.cellSize
  }

  /**
   * 🎁 获取道具系统实例
   * 📌 说明：供外部访问道具系统
   */
  getItemSystem(): ItemSystem {
    return this.itemSystem
  }
}
```

---

## GTRS 主题加载系统

### 完整实现

```typescript
// ============================================================================
// 📦【可复用框架层】类型定义与全局状态
// ============================================================================

/**
 * ⭐ GTRSTheme 扩展类型（兼容旧代码）
 * 📌 说明：所有游戏通用，直接复制
 */
export interface GTRSTheme extends BaseGTRSTheme {
  themeInfo?: {
    themeId: string
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
  }
}

// ⭐ 运行时主题对象：null 表示尚未加载，游戏启动前必须通过 loadTheme 赋值
let GTRS: GTRSTheme | null = null

// ⭐ 全局图片资源缓存 Map，避免重复加载相同资源（跨游戏共享）
const imageCache = new Map<string, HTMLImageElement | HTMLCanvasElement>()

// ============================================================================
// 🛠️【可复用框架层】工具函数 - 纯函数，无副作用
// ============================================================================

/**
 * Hex 颜色字符串转数字
 * 📌 说明：所有游戏通用，直接复制
 * @param hex 十六进制颜色字符串（如 "#ff0000"）
 * @returns 数字格式颜色值
 */
function hexToNumber(hex: string): number {
  if (!hex) return 0x000000
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0x000000
  const num = parseInt(clean, 16)
  return isNaN(num) ? 0x000000 : num
}

/**
 * ⭐ 将单个资源 src 路径归一化为根路径（/ 开头）
 * 📌 说明：所有游戏通用，直接复制
 *
 * 支持的输入格式及转换规则：
 *   http(s)://...   → 原样保留（外链 CDN）
 *   /themes/xxx    → 原样保留（推荐写法，public/themes/ 目录）
 *   /assets/xxx    → 原样保留（public/assets/ 目录）
 *   /public/xxx    → /xxx（旧格式兼容）
 *   @/xxx          → /xxx（Vite 别名转换）
 *   themes/xxx     → /themes/xxx（省略开头的 /，自动补充）
 *   assets/xxx     → /assets/xxx
 *   其余           → 原样保留（颜色值等）
 *
 * @param src 原始路径
 * @returns 归一化后的路径
 */
function normalizeOneSrc(src: string): string {
  if (!src || typeof src !== 'string') return src

  // 完整 URL（http/https）：直接返回
  if (src.startsWith('http://') || src.startsWith('https://')) return src

  // 已经是 / 开头：直接返回（支持 /themes/, /assets/ 等）
  if (src.startsWith('/')) {
    // 旧格式 /public/xxx → /xxx
    if (src.startsWith('/public/')) return src.replace('/public/', '/')
    return src
  }

  // Vite 别名：@/xxx → /xxx
  if (src.startsWith('@/')) return src.replace(/^@\\/, '/')

  // 不带 / 前缀的相对路径 → 补充 / 前缀
  return '/' + src
}

/**
 * ⭐ 递归遍历 GTRS 对象，对所有 src 字段执行路径归一化
 * 📌 说明：所有游戏通用，直接复制
 * @param obj GTRS 配置对象
 * @returns 归一化后的对象
 */
function normalizeSrcPaths(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(normalizeSrcPaths)
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (key === 'src' && typeof value === 'string') {
      result[key] = normalizeOneSrc(value)
    } else if (typeof value === 'object') {
      result[key] = normalizeSrcPaths(value)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * ⭐ 将后端主题 JSON 赋值给 GTRS（直接替换，不兜底合并）
 * 📌 说明：所有游戏通用，直接复制
 * ⚠️ 必须在 Phaser 启动前完成调用，否则游戏将无法渲染
 * @param theme 主题配置对象
 */
function applyGTRS(theme: GTRSTheme): void {
  GTRS = normalizeSrcPaths(theme) as GTRSTheme
  console.log('[GTRS] ✅ 主题已加载:', GTRS.themeInfo?.themeName)
}

/**
 * ⭐ 断言 GTRS 已加载，否则抛出错误（开发期快速定位问题）
 * 📌 说明：所有游戏通用，直接复制
 * @returns GTRSTheme 实例
 * @throws Error GTRS 未加载时抛出错误
 */
function assertGTRS(): GTRSTheme {
  if (!GTRS) {
    throw new Error('[GTRS] 主题未加载！请先调用 loadTheme() 获取主题后再启动游戏。')
  }
  return GTRS
}

// ============================================================================
// 🎨【可复用框架层】主题加载方法
// ============================================================================

/**
 * ⭐ 加载主题并赋值 GTRS（含严格 GTRS 校验）
 * 📌 说明：所有游戏通用，直接复制
 *
 * 优化：优先使用 themeStore 已加载的 GTRS，避免重复请求
 *   1. 尝试从 themeStore.gtrsRawJson 获取（已校验通过）
 *   2. 仅当 gtrsRawJson 为空时才从后端获取
 *   3. 无论哪种方式，都需要 validateGTRSTheme() 校验
 *
 * @param themeId 主题 ID
 * @throws Error 主题未登录 / 加载失败 / GTRS 校验不通过时
 */
private async loadTheme(themeId: string): Promise<void> {
  const themeStore = useThemeStore()
  let configJsonStr: string

  // ⭐ 优先复用 themeStore 已加载的 GTRS（已校验通过）
  if (themeStore.gtrsRawJson) {
    console.log('[PhaserGame] ♻️ 复用 themeStore 已加载的 GTRS 主题')
    configJsonStr = themeStore.gtrsRawJson
  } else {
    // ⭐ gtrsRawJson 为空，从后端获取
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('[PhaserGame] 用户未登录，无法加载主题。请先登录后再启动游戏。')
    }

    console.log('[PhaserGame] 🔄 从后端加载 GTRS 主题')
    const response = await fetch(`http://localhost:8080/api/theme/download?id=${themeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      throw new Error(`[PhaserGame] 主题加载失败：HTTP ${response.status}`)
    }

    const result = await response.json()
    if (result.code !== 200 || !result.data) {
      throw new Error(`[PhaserGame] 主题加载失败：服务端 code=${result.code}, message=${result.message}`)
    }

    // ⭐ 提取 configJson（支持后端多种包装格式）
    const raw = result.data

    if (typeof raw === 'string') {
      configJsonStr = raw
    } else if (raw.configJson !== undefined) {
      configJsonStr = typeof raw.configJson === 'string'
        ? raw.configJson
        : JSON.stringify(raw.configJson)
    } else {
      configJsonStr = JSON.stringify(raw)
    }
  }

  // ⭐ GTRS 严格校验（无论从哪里获取都需要校验）
  const validationResult = validateGTRSTheme(configJsonStr)
  if (!validationResult.valid) {
    throw new Error(
      `[PhaserGame] 主题 ${themeId} GTRS 校验失败，游戏无法启动：\n${validationResult.message}`
    )
  }

  // 校验通过，直接赋值（不兜底合并）
  const themeConfig: GTRSTheme = JSON.parse(configJsonStr)
  applyGTRS(themeConfig)
  console.log(`[PhaserGame] ✅ GTRS 主题已加载：${GTRS!.themeInfo?.themeName || '未命名'} (id=${themeId})`)
}

/**
 * ⭐ 获取主题资源配置的 Key
 * 📌 说明：所有游戏通用，直接复制
 * @param assetName 资源名称（如 'snake_head', 'food' 等）
 * @returns 资源配置的 key，如果不存在则返回 undefined
 */
private getThemeAssetKey(assetName: string): string | undefined {
  const resources = assertGTRS().resources
  if (!resources) return undefined
  
  const resource = resources.find(r => r.key === assetName)
  return resource?.key
}

/**
 * ⭐ 从主题获取颜色值（降级方案）
 * 📌 说明：所有游戏通用，直接复制
 * @param colorName 颜色名称
 * @param defaultColor 默认颜色值
 * @returns 颜色值
 */
private getThemeColor(colorName: string, defaultColor: number = 0x000000): number {
  const style = assertGTRS().globalStyle
  if (!style) return defaultColor
  
  const colorHex = (style as any)[colorName]
  if (!colorHex) return defaultColor
  
  return hexToNumber(colorHex)
}
```

---

## 屏幕自适应系统

### 完整实现

```typescript
// ============================================================================
// 📐【可复用框架层】屏幕适配计算 - 所有游戏通用
// ============================================================================
// 📌 说明：这段代码保证游戏在任何设备上都能正确显示
// ⚠️ 参考：直接复制到新游戏，无需修改
// ============================================================================

/**
 * ⭐ 预加载阶段 - 包含屏幕适配计算
 * 
 * 核心职责:
 *   1. 计算屏幕适配参数 (基于容器元素尺寸)
 *   2. 加载 GTRS 主题配置的所有图片资源
 *   3. 计算最佳缩放比和安全区域
 *   4. 初始化 UI 响应式参数
 * 
 * @param scene Phaser 场景对象
 */
private preload(scene: Phaser.Scene): void {
  // 保存场景引用
  this.scene = scene

  if (!this.containerElement) {
    console.warn('⚠️ 容器元素未设置')
    return
  }

  console.log('🔍 开始计算适配参数...')
  console.log('📦 容器元素尺寸:', {
    clientWidth: this.containerElement.clientWidth,
    clientHeight: this.containerElement.clientHeight,
    offsetWidth: this.containerElement.offsetWidth,
    offsetHeight: this.containerElement.offsetHeight
  })

  // 1. 从 DOM 元素获取真实屏幕尺寸（更可靠）
  this.Adapt.screenW = this.containerElement.clientWidth
  this.Adapt.screenH = this.containerElement.clientHeight

  console.log('📏 设备真实尺寸:', `${this.Adapt.screenW} × ${this.Adapt.screenH}`)
  console.log('🎨 当前主题:', assertGTRS().themeInfo?.themeName || '未命名')

  // ⭐ 添加资源加载进度监听
  const totalResourcesToLoad = this.countResourcesToLoad()
  let loadedResources = 0

  scene.load.on('filecomplete', () => {
    loadedResources++
    const progress = (loadedResources / totalResourcesToLoad) * 100
    console.log(`📥 资源加载进度：${loadedResources}/${totalResourcesToLoad} (${progress.toFixed(1)}%)`)
    // 📥 回调给外部 UI
    this.onProgress?.(progress)
  })

  scene.load.on('complete', () => {
    console.log('✅ 所有资源加载完成')
    // 📥 确保最终进度为 100%
    this.onProgress?.(100)
  })

  scene.load.on('error', (key: string, type: string, message: string) => {
    console.warn(`⚠️ 资源加载失败：${key} (${type}) - ${message}`)
  })

  // 2. 加载 GTRS 中配置的所有图片资源
  this.loadGTRSImages(scene)

  // 3. 计算最佳缩放比（自动匹配屏幕，不变形）
  this.Adapt.scale = Math.min(
    this.Adapt.screenW / this.DESIGN_WIDTH,
    this.Adapt.screenH / this.DESIGN_HEIGHT
  )

  // 3. 计算安全区域（手机刘海/底部手势条）
  this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)
  this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)

  // 4. 计算动态单元格大小（保证游戏区域完全显示）
  const baseCellSize = 50  // 基础单元格大小
  const gameAreaWidth = this.GRID_COLS * baseCellSize  // 1600
  const gameAreaHeight = this.GRID_ROWS * baseCellSize // 900
  
  // 可用空间（减去安全区域和边距）
  const availableWidth = (this.Adapt.screenW - 20) * 0.95  // 留 5% 边距
  const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
  
  console.log('📐 可用空间:', {
    width: availableWidth.toFixed(0),
    height: availableHeight.toFixed(0)
  })
  
  const scaleByWidth = availableWidth / gameAreaWidth
  const scaleByHeight = availableHeight / gameAreaHeight
  
  console.log('🔢 缩放系数:', {
    byWidth: scaleByWidth.toFixed(3),
    byHeight: scaleByHeight.toFixed(3)
  })
  
  const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)  // 最大放大 1.5 倍
  this.Adapt.cellSize = baseCellSize * finalScale
  
  const actualGameWidth = this.GRID_COLS * this.Adapt.cellSize
  const actualGameHeight = this.GRID_ROWS * this.Adapt.cellSize
  
  console.log('🎯 最终游戏区域:', {
    cellSize: this.Adapt.cellSize.toFixed(2),
    size: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
    fitsInScreen: actualGameWidth <= this.Adapt.screenW && 
                  actualGameHeight <= (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom)
  })

  console.log('✅ 自动计算适配参数完成', {
    screen: `${this.Adapt.screenW} × ${this.Adapt.screenH}`,
    scale: this.Adapt.scale.toFixed(3),
    safeArea: `top=${this.Adapt.safeTop.toFixed(0)}, bottom=${this.Adapt.safeBottom.toFixed(0)}`,
    cellSize: this.Adapt.cellSize.toFixed(2),
    gameArea: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`
  })
  
  // ⭐ 初始化 UI 参数（基于屏幕尺寸独立计算，不依赖 cellSize）
  initUIParams(this.Adapt.screenW, this.Adapt.screenH)
  
  // 输出详细的游戏参数（用于调试）
  console.log('🎮 游戏显示参数:', {
    gridCols: this.GRID_COLS,
    gridRows: this.GRID_ROWS,
    cellSize: this.Adapt.cellSize.toFixed(2),
    gameAreaSize: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
    offset: `x=${((this.Adapt.screenW - actualGameWidth) / 2).toFixed(1)}, y=${(this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - actualGameHeight) / 2).toFixed(1)}`
  })

  // 🎁 初始化道具系统 (确保 cellSize 已正确计算)
  if (this.Adapt.cellSize <= 0) {
    console.warn('⚠️ cellSize 未正确计算，重新执行适配...')
    // 👉 重新计算适配参数，而不是递归调用 preload
    this.Adapt.scale = Math.min(
      this.Adapt.screenW / this.DESIGN_WIDTH,
      this.Adapt.screenH / this.DESIGN_HEIGHT
    )
    this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)
    this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)
    
    const baseCellSize = 50
    const gameAreaWidth = this.GRID_COLS * baseCellSize
    const gameAreaHeight = this.GRID_ROWS * baseCellSize
    const availableWidth = (this.Adapt.screenW - 20) * 0.95
    const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
    const finalScale = Math.min(availableWidth / gameAreaWidth, availableHeight / gameAreaHeight, 1.5)
    this.Adapt.cellSize = baseCellSize * finalScale
  }
  
  console.log('🎁 初始化道具系统，cellSize:', this.Adapt.cellSize.toFixed(2))
  this.itemSystem.initialize(this.Adapt, this.GRID_COLS, this.GRID_ROWS)
  console.log('🎁 道具系统已初始化')
}

/**
 * 创建游戏场景 - ⭐ 监听屏幕尺寸变化，自动重绘适配
 */
private create(scene: Phaser.Scene): void {
  // 保存场景引用
  this.scene = scene

  console.log('📏 画布初始尺寸:', {
    width: scene.scale.width,
    height: scene.scale.height
  })

  // 🎁 设置道具系统的场景 (用于渲染)
  if (this.itemSystem && this.itemSystem.getIsInitialized()) {
    this.itemSystem.setScene(scene)
    console.log('🎁 道具系统场景已设置')
  }
  
  // ⭐ 重要：使用 Phaser 画布的实际尺寸更新 Adapt，确保后续绘制正确
  this.Adapt.screenW = scene.scale.width
  this.Adapt.screenH = scene.scale.height

  // ⭐ 监听屏幕尺寸变化（RESIZE 模式下会自动触发）
  scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
    console.log('📐 屏幕尺寸变化:', {
      width: gameSize.width,
      height: gameSize.height
    })

    // 更新适配参数
    this.Adapt.screenW = gameSize.width
    this.Adapt.screenH = gameSize.height

    // 重新计算屏幕适配
    this.calculateAdaptParams(gameSize.width, gameSize.height)

    // 🎁 通知道具系统重新初始化
    if (this.itemSystem && this.itemSystem.getIsInitialized()) {
      this.itemSystem.initialize(this.Adapt, this.GRID_COLS, this.GRID_ROWS)
    }

    // TODO: 重建所有游戏元素（背景、网格、蛇、食物等）
    // this.create(scene)
  })

  // ========== 创建游戏对象 ==========
  // 👉 在这里调用各个渲染方法创建游戏对象
  // 例如：this.renderBackground(), this.renderGrid(), this.renderSnake() 等
}

/**
 * ⭐ 计算屏幕适配参数（供 resize 事件调用）
 */
private calculateAdaptParams(containerWidth: number, containerHeight: number): void {
  // 1. 获取设备真实尺寸
  this.Adapt.screenW = containerWidth
  this.Adapt.screenH = containerHeight
  
  // 2. 计算安全区域（手机刘海/底部手势条）
  this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)
  this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)
  
  // 3. 计算动态单元格大小（保证游戏区域完全显示）
  const baseCellSize = 50
  const gameAreaWidth = this.GRID_COLS * baseCellSize
  const gameAreaHeight = this.GRID_ROWS * baseCellSize
  
  // 可用空间（减去安全区域和边距）
  const availableWidth = (this.Adapt.screenW - 20) * 0.95
  const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
  
  // 计算缩放系数
  const scaleByWidth = availableWidth / gameAreaWidth
  const scaleByHeight = availableHeight / gameAreaHeight
  
  // 取最小值，保证游戏区域完全显示
  const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)  // 最大放大 1.5 倍
  this.Adapt.cellSize = baseCellSize * finalScale
  
  const actualGameWidth = this.GRID_COLS * this.Adapt.cellSize
  const actualGameHeight = this.GRID_ROWS * this.Adapt.cellSize
  
  console.log('🎯 最终游戏区域:', {
    cellSize: this.Adapt.cellSize.toFixed(2),
    size: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
    fitsInScreen: actualGameWidth <= this.Adapt.screenW && 
                  actualGameHeight <= (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom)
  })
}
```

---

## 音频管理系统

### 完整实现

```typescript
// ============================================================================
// 🎵【可复用框架层】音频管理系统 - 所有游戏通用
// ============================================================================
// 📌 说明：使用 HTML5 Audio API，更可靠
// ⚠️ 参考：直接复制到新游戏，无需修改
// ============================================================================

/**
 * ⭐ 播放背景音乐
 * 📌 说明：所有游戏通用，直接复制
 * @param type BGM 类型 ('main', 'gameplay', 'gameover')
 * @param config 音频配置
 */
private playBgm(type: 'main' | 'gameplay' | 'gameover', config: {
  src?: string
  volume?: number
  loop?: boolean
}): void {
  if (!this.soundEnabled) {
    console.log('🔇 声音已禁用，跳过 BGM 播放')
    return
  }

  const src = config.src
  if (!src) {
    console.warn(`⚠️ BGM ${type} 未配置 src`)
    return
  }

  // 停止当前播放的 BGM
  this.stopBgm(type)

  // 创建新的 Audio 对象
  const audio = new Audio(src)
  audio.loop = config.loop ?? true
  audio.volume = config.volume ?? 0.6

  // 保存引用
  if (type === 'main') {
    this.bgmMainAudio = audio
  } else if (type === 'gameplay') {
    this.bgmGameplayAudio = audio
  } else if (type === 'gameover') {
    this.bgmGameoverAudio = audio
  }

  // 播放（异步，不等待）
  audio.play().catch(err => {
    console.warn(`⚠️ BGM ${type} 播放失败:`, err)
  })

  console.log(`🎵 播放 BGM: ${type}`, { src, volume: audio.volume, loop: audio.loop })
}

/**
 * ⭐ 停止背景音乐
 * 📌 说明：所有游戏通用，直接复制
 * @param type BGM 类型
 */
private stopBgm(type: 'main' | 'gameplay' | 'gameover'): void {
  let audio: HTMLAudioElement | null = null

  if (type === 'main') {
    audio = this.bgmMainAudio
  } else if (type === 'gameplay') {
    audio = this.bgmGameplayAudio
  } else if (type === 'gameover') {
    audio = this.bgmGameoverAudio
  }

  if (audio) {
    audio.pause()
    audio.currentTime = 0
    audio = null

    console.log(`⏹️ BGM ${type} 已停止`)
  }
}

/**
 * ⭐ 停止所有背景音乐
 * 📌 说明：所有游戏通用，直接复制
 */
private stopAllBgm(): void {
  this.stopBgm('main')
  this.stopBgm('gameplay')
  this.stopBgm('gameover')
}

/**
 * ⭐ 播放音效
 * 📌 说明：所有游戏通用，直接复制
 * @param type 音效类型 ('eat', 'crash', 'prop' 等)
 * @param config 音频配置
 */
private playSound(type: string, config: {
  src?: string
  volume?: number
}): void {
  if (!this.soundEnabled) {
    console.log('🔇 声音已禁用，跳过音效播放')
    return
  }

  const src = config.src
  if (!src) {
    console.warn(`⚠️ 音效 ${type} 未配置 src`)
    return
  }

  // 创建临时 Audio 对象（音效不重复使用）
  const audio = new Audio(src)
  audio.volume = config.volume ?? 0.8

  // 播放（异步，不等待）
  audio.play().catch(err => {
    console.warn(`⚠️ 音效 ${type} 播放失败:`, err)
  })

  // 播放完成后自动销毁
  audio.onended = () => {
    audio = null
  }

  console.log(`🔊 播放音效：${type}`, { src, volume: audio.volume })
}

/**
 * ⭐ 设置声音状态
 * 📌 说明：所有游戏通用，直接复制
 */
setSoundEnabled(enabled: boolean): void {
  this.soundEnabled = enabled
  if (!enabled) {
    this.stopAllBgm()
    if (this.scene) {
      this.scene.sound.stopAll()
    }
  }
}
```

---

## 游戏对象渲染示例

### 蛇渲染（贪吃蛇示例）

```typescript
// ============================================================================
// 🎨【游戏特定层】蛇渲染组件 - 贪吃蛇游戏示例
// ============================================================================
// 📌 说明：这是贪吃蛇游戏特定的渲染逻辑，其他游戏需要实现自己的渲染
// ⚠️ 参考：学习如何将渲染逻辑封装到独立方法
// ============================================================================

/**
 * ⭐ 渲染蛇 - 贪吃蛇游戏核心渲染方法
 * 
 * @param snake 蛇身数组
 * @param headRotation 蛇头旋转角度（弧度）
 */
private renderSnake(snake: SnakeSegment[], headRotation: number = 0): void {
  if (!this.scene || !this.snakeGroup) return

  const scene = this.scene
  const group = this.snakeGroup
  const cellSize = this.Adapt.cellSize

  // 计算游戏区域偏移（居中显示）
  const gameWidth = 32 * cellSize   // GRID_COLS = 32
  const gameHeight = 18 * cellSize  // GRID_ROWS = 18
  const offsetX = (this.Adapt.screenW - gameWidth) / 2
  const offsetY = this.Adapt.safeTop + 
    (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

  // 清除旧的蛇
  group.clear(true, true)

  // 绘制蛇身（遍历每一段）
  snake.forEach((segment, index) => {
    const x = offsetX + segment.x
    const y = offsetY + segment.y
    const size = cellSize * 0.70  // 蛇身大小 = cellSize 的 70%

    if (index === 0) {
      // 🐍 蛇头 - 优先使用主题资源
      const headKey = this.getThemeAssetKey('snake_head')
      if (headKey) {
        const sprite = scene.add.image(x, y, headKey)
        const displaySize = Math.max(size, 16)
        sprite.setDisplaySize(displaySize, displaySize)
        sprite.setRotation(headRotation)  // 👈 应用旋转角度
        group.add(sprite)
      } else {
        // 降级方案：绘制圆形头部
        this.createSnakeHead(scene, x, y, size)
      }
      
    } else if (index === snake.length - 1) {
      // 🐍 蛇尾 - 优先使用主题资源
      const tailKey = this.getThemeAssetKey('snake_tail')
      if (tailKey) {
        const sprite = scene.add.image(x, y, tailKey)
        const displaySize = Math.max(size * 0.7, 16)  // 蛇尾更小
        sprite.setDisplaySize(displaySize, displaySize)
        group.add(sprite)
      } else {
        // 降级方案：渐变透明圆形
        const alpha = 1 - (index / snake.length) * 0.5
        const color = this.themeColors.snakeBody
        const circle = scene.add.circle(x, y, size / 2 * 0.9, color, alpha)
        group.add(circle)
      }
      
    } else {
      // 🐍 蛇身 - 优先使用主题资源
      const bodyKey = this.getThemeAssetKey('snake_body')
      if (bodyKey) {
        const sprite = scene.add.image(x, y, bodyKey)
        const displaySize = Math.max(size * 0.9, 16)
        sprite.setDisplaySize(displaySize, displaySize)
        group.add(sprite)
      } else {
        // 降级方案：渐变透明圆形
        const alpha = 1 - (index / snake.length) * 0.5
        const color = this.themeColors.snakeBody
        const circle = scene.add.circle(x, y, size / 2, color, alpha)
        group.add(circle)
      }
    }
  })
}

/**
 * ⭐ 创建蛇头 - 贪吃蛇游戏特定渲染辅助方法
 * 📌 说明：这是贪吃蛇游戏特定的渲染方法
 * ⚠️ 其他游戏参考：实现自己的 createPlayerShip(), createEnemy() 等辅助方法
 *
 * @param scene Phaser 场景对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param size 大小
 */
private createSnakeHead(scene: Phaser.Scene, x: number, y: number, size: number): void {
  const graphics = scene.add.graphics()
  
  // 头部圆形
  graphics.fillStyle(0x22c55e, 1)
  graphics.fillCircle(x, y, size / 2)
  
  // 眼睛 - 按头部大小比例
  const eyeSize = size * 0.18  // 眼睛占头部 18%
  const eyeOffset = size * 0.25  // 眼睛间距 25%
  graphics.fillStyle(0xffffff, 1)
  graphics.fillCircle(x - eyeOffset, y - eyeOffset * 0.3, eyeSize)
  graphics.fillCircle(x + eyeOffset, y - eyeOffset * 0.3, eyeSize)
  
  // 瞳孔 - 按眼睛比例
  graphics.fillStyle(0x000000, 1)
  graphics.fillCircle(x - eyeOffset, y - eyeOffset * 0.3, eyeSize * 0.5)
  graphics.fillCircle(x + eyeOffset, y - eyeOffset * 0.3, eyeSize * 0.5)
}

// 💡 参考要点:
// 1. 优先使用主题资源（GTRS 配置）
// 2. 提供降级方案（无主题资源时的备选）
// 3. 使用 group.clear() 清除旧对象，避免重叠
// 4. 蛇头、蛇身、蛇尾分别处理，视觉效果更好
// 5. 支持旋转角度（蛇头朝向）
// 6. 渐变透明效果（蛇身透明度递减）

// 🔧 新游戏参考:
// - 飞机大战：renderPlayerShip(), renderEnemy(), renderBullet()
// - 坦克大战：renderTank(), renderBullet(), renderWall()
// - 俄罗斯方块：renderBlock(), renderGrid(), renderNextPiece()
```

---

### 食物渲染（贪吃蛇示例）

```typescript
// ============================================================================
// 🎨【游戏特定层】食物渲染组件 - 贪吃蛇游戏示例
// ============================================================================
// 📌 说明：这是贪吃蛇游戏特定的渲染逻辑
// ⚠️ 参考：学习如何渲染静态游戏对象
// ============================================================================

/**
 * ⭐ 渲染食物 - 贪吃蛇游戏特定方法
 * 
 * @param food 食物对象
 */
private renderFood(food: Food): void {
  if (!this.scene) return

  const cellSize = this.Adapt.cellSize
  const gameWidth = 32 * cellSize
  const gameHeight = 18 * cellSize
  const offsetX = (this.Adapt.screenW - gameWidth) / 2
  const offsetY = this.Adapt.safeTop + 
    (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

  // 清除旧的食物
  if (this.foodSprite) {
    this.foodSprite.clear()
  } else {
    this.foodSprite = this.scene.add.graphics()
  }

  // 计算食物位置（网格坐标 → 像素坐标）
  const x = offsetX + food.position.x
  const y = offsetY + food.position.y
  const size = cellSize * 0.6  // 食物大小 = cellSize 的 60%

  // 优先使用主题资源
  const foodKey = this.getThemeAssetKey(food.type)
  if (foodKey) {
    // 如果有主题资源，使用 Sprite
    const sprite = this.scene.add.sprite(x, y, foodKey)
    sprite.setDisplaySize(size, size)
    
    // 保存到 foodSprite（用于后续清理）
    this.foodSprite = sprite as any
  } else {
    // 降级方案：绘制圆形
    this.foodSprite.fillStyle(this.themeColors.food, 1)
    this.foodSprite.fillCircle(x, y, size / 2)
  }

  console.log('🍎 渲染食物:', {
    type: food.type,
    position: food.position,
    pixelPos: { x: x.toFixed(1), y: y.toFixed(1) }
  })
}
```

---

## 道具系统

### 完整实现

```typescript
// ============================================================================
// 🎁【框架层】道具系统集成 - 所有游戏通用
// ============================================================================
// 📌 说明：道具系统是完全通用的，可以直接复用到任何游戏
// ⚠️ 参考：学习如何集成第三方系统
// ============================================================================

// 👉 在构造函数中初始化
constructor(element: HTMLElement, onGameComplete?: () => void) {
  // ... 其他代码 ...
  
  // 🎁 初始化道具系统
  this.itemSystem = new ItemSystem({
    enabled: true,
    spawnInterval: 10000,    // 10 秒生成一个道具
    maxActiveItems: 3,       // 最多 3 个活跃道具
    itemLifetime: 10000,     // 道具存活 10 秒
    debugMode: true          // 调试模式
  })
}

// 👉 在 preload 中初始化
private preload(scene: Phaser.Scene): void {
  // ... 其他代码 ...
  
  // 🎁 初始化道具系统（确保 cellSize 已计算）
  if (this.Adapt.cellSize <= 0) {
    console.warn('⚠️ cellSize 未正确计算，重新执行适配...')
    // 重新计算适配参数...
  }
  
  console.log('🎁 初始化道具系统，cellSize:', this.Adapt.cellSize.toFixed(2))
  this.itemSystem.initialize(this.Adapt, this.GRID_COLS, this.GRID_ROWS)
  console.log('🎁 道具系统已初始化')
}

// 👉 在 create 中设置场景
private create(scene: Phaser.Scene): void {
  // ... 其他代码 ...
  
  // 🎁 设置道具系统的场景（用于渲染）
  if (this.itemSystem && this.itemSystem.getIsInitialized()) {
    this.itemSystem.setScene(scene)
    console.log('🎁 道具系统场景已设置')
  }
}

// 👉 在 update 中更新道具系统
private update(time: number, delta: number): void {
  // ... 其他代码 ...
  
  // 🎁 更新道具系统（生成道具、碰撞检测）
  if (this.itemSystem && this.itemSystem.getIsInitialized()) {
    this.itemSystem.update(this.currentSnake, [])
  }
}

// 💡 使用提示:
// 1. 道具系统是完全通用的，可以直接复制到其他游戏
// 2. 需要在三个地方调用：initialize(), setScene(), update()
// 3. 道具效果回调由外部 Vue 组件注入（避免在 Phaser 中调用 Pinia）
// 4. 支持自定义配置：生成间隔、最大数量、存活时间等
// 5. 调试模式会输出详细日志，方便排查问题
```

---

## 游戏循环与状态管理

### Update 方法示例

```typescript
// ============================================================================
// 🔄【游戏特定层】游戏循环 - 每帧调用
// ============================================================================
// 📌 说明：这是游戏特定的逻辑，每个游戏都不同
// ⚠️ 参考：学习如何组织游戏循环逻辑
// ============================================================================

/**
 * ⭐ 游戏循环 - 每帧调用
 * 
 * @param time 当前时间（毫秒）
 * @param delta 距离上一帧的时间间隔（毫秒）
 */
private update(time: number, delta: number): void {
  if (!this.scene || !this.isReady) return

  // 1. 更新道具系统（生成道具、碰撞检测）
  if (this.itemSystem && this.itemSystem.getIsInitialized()) {
    this.itemSystem.update(this.currentSnake, [])
  }

  // 2. TODO: 更新游戏逻辑
  // - 玩家移动
  // - 敌人 AI
  // - 碰撞检测
  // - 分数更新
  // ... 根据具体游戏实现
}

/**
 * ⭐ 处理键盘输入 - 游戏特定逻辑
 * 
 * @param key 按键名称
 */
private handleInput(key: string): void {
  // 游戏暂停时忽略输入
  if (!this.scene || this.isPaused) return

  switch(key) {
    case 'ArrowUp':
    case 'W':
      // 👉 实现你的控制逻辑
      console.log('⬆️ 向上移动')
      break
      
    case 'ArrowDown':
    case 'S':
      // 👉 实现你的控制逻辑
      console.log('⬇️ 向下移动')
      break
      
    case 'ArrowLeft':
    case 'A':
      // 👉 实现你的控制逻辑
      console.log('⬅️ 向左移动')
      break
      
    case 'ArrowRight':
    case 'D':
      // 👉 实现你的控制逻辑
      console.log('➡️ 向右移动')
      break
  }
}
```

---

## 总结

### 🎯 核心思想

1. **80% 可复用**: 框架层代码完全通用
2. **20% 定制化**: 只需修改游戏特定的渲染和逻辑
3. **组件化**: 清晰的职责分离，易于维护
4. **渐进式**: 可以逐步添加功能，不需要一步到位

### 📚 相关文档

- [REUSABLE_GAME_FRAMEWORK.md](./REUSABLE_GAME_FRAMEWORK.md) - 可复用游戏开发框架
- [GAME_DEVELOPMENT_STANDARD.md](./GAME_DEVELOPMENT_STANDARD.md) - 游戏开发标准
- [COMPONENT_USAGE_GUIDE.md](./games/snake/src/components/game/components/COMPONENT_USAGE_GUIDE.md) - 组件使用指南

---

**最后更新**: 2026-03-27  
**状态**: ✅ 代码参考已完成  
**适用版本**: Phaser 3.x + Vue 3.x + TypeScript
