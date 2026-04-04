import Phaser from 'phaser'
import { useConfigStore } from '@/stores/config'
import { Logger } from '../utils/Logger'

/**
 * 游戏场景基类
 * 提供通用的游戏功能和工具方法
 */
export default abstract class GameScene extends Phaser.Scene {
  protected screenW!: number
  protected screenH!: number
  protected offsetX!: number
  protected offsetY!: number
  protected cellSize!: number
  protected gridCols!: number
  protected gridRows!: number
  
  constructor(key: string = 'GameScene') {
    super(key)
  }
  
  create(): void {
    // 初始化屏幕尺寸
    this.screenW = this.scale.width
    this.screenH = this.scale.height
    
    // 从配置读取网格参数（预留配置扩展）
    // const configStore = useConfigStore()
    
    // 默认网格配置（可被子类覆盖）
    this.gridCols = 13
    this.gridRows = 13
    this.cellSize = 64
    
    // 计算偏移量（居中显示）
    const gameWidth = this.gridCols * this.cellSize
    const gameHeight = this.gridRows * this.cellSize
    
    // ✅ 正确的偏移计算：不需要加 cellSize/2，因为 sprite 会自动使用中心点
    this.offsetX = (this.screenW - gameWidth) / 2 + this.cellSize / 2
    this.offsetY = (this.screenH - gameHeight) / 2 + this.cellSize / 2
    
    Logger.debug(`📐 游戏区域：${gameWidth}x${gameHeight}, 偏移：(${this.offsetX}, ${this.offsetY})`)
    Logger.debug(`🎯 实际可玩区域：左上角 (${this.offsetX}, ${this.offsetY}) 到 右下角 (${this.offsetX + gameWidth}, ${this.offsetY + gameHeight})`)
  }
  
  /**
   * 从 GTRS 预加载所有资源（严格模式 - 无兜底）
   */
  protected preloadFromGTRS(): void {
    Logger.debug('📦 [GameScene] 开始预加载资源（严格模式）')
    
    // 先同步加载 GTRS JSON（因为文件已经在 public 目录）
    const gtrsUrl = '/themes/tank_default/GTRS.json'
    
    // 使用 XMLHttpRequest 同步加载配置
    const xhr = new XMLHttpRequest()
    xhr.open('GET', gtrsUrl, false) // 同步请求
    xhr.send()
    
    // 🔴 严格模式：GTRS 配置加载失败直接抛出错误
    if (xhr.status !== 200) {
      const errorMsg = `❌ [GTRS加载失败] 无法加载 GTRS 配置: ${xhr.statusText}`
      console.error(errorMsg)
      throw new Error(errorMsg)
    }
    
    let gtrs: any
    try {
      gtrs = JSON.parse(xhr.responseText)
      Logger.debug('✅ [GTRS加载成功] 配置文件解析成功')
    } catch (error) {
      const errorMsg = `❌ [GTRS解析失败] 无法解析 GTRS 配置: ${error instanceof Error ? error.message : error}`
      console.error(errorMsg)
      throw new Error(errorMsg)
    }
    
    // 🔴 严格模式：验证 GTRS 结构
    if (!gtrs.resources?.images?.scene) {
      const errorMsg = '❌ [GTRS结构错误] resources.images.scene 不存在'
      console.error(errorMsg)
      throw new Error(errorMsg)
    }
    
    if (!gtrs.resources?.audio) {
      const errorMsg = '❌ [GTRS结构错误] resources.audio 不存在'
      console.error(errorMsg)
      throw new Error(errorMsg)
    }
    
    // 加载图片资源（严格验证）
    const imageCount = Object.keys(gtrs.resources.images.scene).length
    Logger.debug(`📦 [图片资源] 发现 ${imageCount} 个图片资源`)
    
    Object.entries(gtrs.resources.images.scene).forEach(([key, data]: [string, any]) => {
      if (!data.src) {
        const errorMsg = `❌ [图片资源配置错误] ${key} 缺少 src 字段`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      if (!this.textures.exists(key)) {
        Logger.debug(`  ✓ 注册图片：${key} -> ${data.src}`)
        this.load.image(key, data.src)
      }
    })
    
    // 加载音频资源（严格验证）
    const audioCategories = ['bgm', 'effect']
    let totalAudioCount = 0
    
    audioCategories.forEach(category => {
      if (gtrs.resources.audio[category]) {
        const count = Object.keys(gtrs.resources.audio[category]).length
        totalAudioCount += count
        Logger.debug(`🔊 [音频资源] ${category}: ${count} 个`)
        
        Object.entries(gtrs.resources.audio[category]).forEach(([key, data]: [string, any]) => {
          if (!data.src) {
            const errorMsg = `❌ [音频资源配置错误] ${key} 缺少 src 字段`
            console.error(errorMsg)
            throw new Error(errorMsg)
          }
          
          Logger.debug(`  ✓ 注册音频：${key} -> ${data.src}`)
          this.load.audio(key, data.src)
        })
      }
    })
    
    Logger.debug(`✅ [资源注册完成] 图片：${imageCount} 个，音频：${totalAudioCount} 个`)
    
    // 设置加载完成回调
    this.load.on('complete', () => {
      Logger.debug('✅ [资源加载完成] 所有资源加载成功')
    })
    
    // 设置加载错误回调（严格模式：直接抛出错误）
    this.load.on('loaderror', (fileObj: any) => {
      const errorMsg = `❌ [资源加载失败] ${fileObj.key} - ${fileObj.type}: ${fileObj.message || '未知错误'}`
      console.error(errorMsg)
      throw new Error(errorMsg)
    })
    
    // 启动加载队列
    this.load.start()
  }
  
  /**
   * 网格坐标转像素坐标（中心点）
   */
  protected gridToPixelCenter(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: this.offsetX + gridX * this.cellSize,
      y: this.offsetY + gridY * this.cellSize,
    }
  }
  
  /**
   * 播放音效
   */
  protected playSound(soundKey: string, volume: number = 1): void {
    if (this.cache.audio.exists(soundKey)) {
      this.sound.play(soundKey, { volume })
    }
  }
}
