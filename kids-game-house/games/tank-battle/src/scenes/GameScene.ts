import Phaser from 'phaser'
import { useConfigStore } from '@/stores/config'

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
    
    console.log(`📐 游戏区域：${gameWidth}x${gameHeight}, 偏移：(${this.offsetX}, ${this.offsetY})`)
    console.log(`🎯 实际可玩区域：左上角 (${this.offsetX}, ${this.offsetY}) 到 右下角 (${this.offsetX + gameWidth}, ${this.offsetY + gameHeight})`)
  }
  
  /**
   * 从 GTRS 预加载所有资源
   */
  protected preloadFromGTRS(): void {
    // 先同步加载 GTRS JSON（因为文件已经在 public 目录）
    const gtrsUrl = '/themes/tank_default/GTRS.json'
    
    // 使用 XMLHttpRequest 同步加载配置
    const xhr = new XMLHttpRequest()
    xhr.open('GET', gtrsUrl, false) // 同步请求
    xhr.send()
    
    if (xhr.status !== 200) {
      console.error('❌ 无法加载 GTRS 配置:', xhr.statusText)
      this.load.start()
      return
    }
    
    try {
      const gtrs = JSON.parse(xhr.responseText)
      
      // 加载图片资源
      if (gtrs.resources?.images?.scene) {
        Object.entries(gtrs.resources.images.scene).forEach(([key, data]: [string, any]) => {
          if (data.src && !this.textures.exists(key)) {
            console.log('📦 加载图片:', key, '->', data.src)
            this.load.image(key, data.src)
          }
        })
      }
      
      // 加载音频资源（带容错处理，允许失败）
      const loadAudioWithFallback = (_category: string, audioList: any) => {
        if (!audioList) return
        Object.entries(audioList).forEach(([key, data]: [string, any]) => {
          if (data.src) {
            console.log('🔊 加载音频:', key, '->', data.src)
            this.load.audio(key, data.src)
          }
        })
      }
      
      loadAudioWithFallback('bgm', gtrs.resources.audio?.bgm)
      loadAudioWithFallback('effect', gtrs.resources.audio?.effect)
      
      // 启动加载队列
      this.load.start()
    } catch (error) {
      console.error('❌ 解析 GTRS 配置失败:', error)
      this.load.start()
    }
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
