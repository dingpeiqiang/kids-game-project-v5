/**
 * 统一道具栏绘制工具
 * 为所有游戏提供标准化的 Canvas 道具栏绘制和交互功能
 */

export interface PowerupBarConfig {
  x: number              // 道具栏X坐标
  y: number              // 道具栏Y坐标
  width: number          // 道具栏宽度
  height: number         // 道具栏高度
  itemWidth: number      // 单个道具按钮宽度
  itemHeight: number     // 单个道具按钮高度
  itemGap: number        // 道具间距
  bgColor: string        // 背景颜色
  titleColor: string     // 标题颜色
  textColor: string      // 文字颜色
}

export interface PowerupIcon {
  [key: string]: string
}

// 默认配置
const DEFAULT_CONFIG: PowerupBarConfig = {
  x: 10,
  y: 0, // 需要动态计算
  width: 0, // 需要动态计算
  height: 50,
  itemWidth: 55,
  itemHeight: 20,
  itemGap: 5,
  bgColor: 'rgba(0,0,0,0.6)',
  titleColor: '#FFD700',
  textColor: '#fff'
}

// 道具图标映射
const DEFAULT_ICONS: PowerupIcon = {
  'clear_line': '🧹',
  'clear_4': '💣',
  'slow_drop': '🐌',
  'score2x': '✨',
  'preview': '👁️',
  'speed': '⚡',
  'slow': '🐌',
  'shrink': '✂️',
  'invincible': '🛡️',
  'magnet': '🧲',
  'bomb': '💣',
  'shield': '🛡️',
  'freeze': '❄️',
  'double': '⭐',
  'shuffle': '🔄',
  'hint': '💡',
  'time_plus': '⏰',
  'peek': '👁️'
}

/**
 * 绘制道具栏
 * @param ctx Canvas上下文
 * @param inventory 道具库存数组
 * @param config 配置选项（可选）
 */
export function drawPowerupBar(
  ctx: CanvasRenderingContext2D,
  inventory: string[],
  config?: Partial<PowerupBarConfig>,
  icons?: PowerupIcon
) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const iconMap = { ...DEFAULT_ICONS, ...icons }
  
  // 如果没有道具，显示提示
  if (inventory.length === 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(cfg.x, cfg.y, cfg.width || 300, cfg.height)
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('消除带标记的方块收集道具', cfg.x + (cfg.width || 300) / 2, cfg.y + cfg.height / 2 + 4)
    return
  }
  
  // 计算实际宽度
  const actualWidth = inventory.length * (cfg.itemWidth + cfg.itemGap) + cfg.itemGap
  cfg.width = Math.max(cfg.width || 300, actualWidth)
  
  // 绘制背景
  ctx.fillStyle = cfg.bgColor
  ctx.fillRect(cfg.x, cfg.y, cfg.width, cfg.height)
  
  // 绘制标题
  ctx.fillStyle = cfg.titleColor
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🎒 道具栏:', cfg.x + 10, cfg.y + 18)
  
  // 绘制道具按钮
  inventory.forEach((item, index) => {
    const itemX = cfg.x + 10 + index * (cfg.itemWidth + cfg.itemGap)
    const itemY = cfg.y + 25
    
    // 按钮背景
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(itemX, itemY, cfg.itemWidth, cfg.itemHeight)
    
    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(itemX, itemY, cfg.itemWidth, cfg.itemHeight)
    
    // 图标和名称
    ctx.fillStyle = cfg.textColor
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    const icon = iconMap[item] || '?'
    ctx.fillText(`${icon} ${item}`, itemX + cfg.itemWidth / 2, itemY + 14)
  })
  
  // 提示文字
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('点击使用', cfg.x + cfg.width - 10, cfg.y + cfg.height - 10)
}

/**
 * 检测是否点击了道具栏
 * @param clickX 点击X坐标
 * @param clickY 点击Y坐标
 * @param inventory 道具库存数组
 * @param config 配置选项（可选）
 * @returns 被点击的道具类型，如果没有点击则返回 null
 */
export function checkPowerupClick(
  clickX: number,
  clickY: number,
  inventory: string[],
  config?: Partial<PowerupBarConfig>
): string | null {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  // 检查是否在道具栏区域内
  if (clickY < cfg.y || clickY > cfg.y + cfg.height) {
    return null
  }
  
  if (inventory.length === 0) {
    return null
  }
  
  // 计算实际宽度
  const actualWidth = inventory.length * (cfg.itemWidth + cfg.itemGap) + cfg.itemGap
  const barWidth = Math.max(cfg.width || 300, actualWidth)
  
  if (clickX < cfg.x || clickX > cfg.x + barWidth) {
    return null
  }
  
  // 计算点击的是哪个道具
  const relativeX = clickX - (cfg.x + 10)
  if (relativeX < 0) {
    return null
  }
  
  const itemIndex = Math.floor(relativeX / (cfg.itemWidth + cfg.itemGap))
  
  if (itemIndex >= 0 && itemIndex < inventory.length) {
    return inventory[itemIndex]
  }
  
  return null
}

/**
 * 获取道具栏推荐位置（游戏底部）
 * @param canvasHeight Canvas高度
 * @param gameBottomY 游戏区域底部Y坐标
 * @param gap 间距（默认15px）
 * @returns 推荐的Y坐标
 */
export function getRecommendedBarY(
  canvasHeight: number,
  gameBottomY: number,
  gap: number = 15
): number {
  return gameBottomY + gap
}

/**
 * 创建完整的道具栏配置
 * @param gameBottomY 游戏区域底部Y坐标
 * @param canvasWidth Canvas宽度
 * @param options 额外选项
 * @returns 完整的配置对象
 */
export function createPowerupBarConfig(
  gameBottomY: number,
  canvasWidth: number,
  options?: Partial<PowerupBarConfig>
): PowerupBarConfig {
  return {
    ...DEFAULT_CONFIG,
    x: 10,
    y: getRecommendedBarY(canvasWidth, gameBottomY),
    width: canvasWidth - 20,
    ...options
  }
}
