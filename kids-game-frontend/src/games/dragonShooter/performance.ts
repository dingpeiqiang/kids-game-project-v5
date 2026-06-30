// ============================================
// dragonShooter 性能监控工具
// ============================================

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  entities: {
    dragons: number
    bullets: number
    particles: number
    floatTexts: number
    coinDrops: number
  }
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
  }
}

export class PerformanceMonitor {
  private lastTime = performance.now()
  private frameCount = 0
  private fps = 60
  private frameTime = 16.67
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    entities: {
      dragons: 0,
      bullets: 0,
      particles: 0,
      floatTexts: 0,
      coinDrops: 0
    }
  }
  private showDebug = false
  private debugElement: HTMLDivElement | null = null

  constructor() {
    // 检查是否支持内存API
    if ('memory' in performance) {
      this.metrics.memory = {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0
      }
    }
  }

  /**
   * 更新性能指标
   */
  update(entityCounts: {
    dragons: number
    bullets: number
    particles: number
    floatTexts: number
    coinDrops: number
  }): void {
    const now = performance.now()
    this.frameCount++

    // 每秒更新一次FPS
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime))
      this.frameTime = Math.round(1000 / this.fps)
      this.frameCount = 0
      this.lastTime = now

      // 更新内存信息（如果支持）
      if (this.metrics.memory && 'memory' in performance) {
        const mem = (performance as any).memory
        this.metrics.memory.usedJSHeapSize = mem.usedJSHeapSize
        this.metrics.memory.totalJSHeapSize = mem.totalJSHeapSize
      }
    }

    // 更新实体计数
    this.metrics.fps = this.fps
    this.metrics.frameTime = this.frameTime
    this.metrics.entities = { ...entityCounts }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 显示/隐藏调试信息
   */
  toggleDebug(): void {
    this.showDebug = !this.showDebug
    
    if (this.showDebug) {
      this.createDebugOverlay()
    } else {
      this.removeDebugOverlay()
    }
  }

  /**
   * 创建调试覆盖层
   */
  private createDebugOverlay(): void {
    if (this.debugElement) return

    this.debugElement = document.createElement('div')
    this.debugElement.id = 'dragon-shooter-debug'
    this.debugElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      border-radius: 5px;
      min-width: 200px;
    `
    
    document.body.appendChild(this.debugElement)
    this.updateDebugDisplay()
  }

  /**
   * 移除调试覆盖层
   */
  private removeDebugOverlay(): void {
    if (this.debugElement) {
      document.body.removeChild(this.debugElement)
      this.debugElement = null
    }
  }

  /**
   * 更新调试显示
   */
  private updateDebugDisplay(): void {
    if (!this.debugElement || !this.showDebug) return

    const m = this.metrics
    let html = `
      <div><strong>🎮 性能监控</strong></div>
      <div>FPS: ${m.fps}</div>
      <div>帧时间: ${m.frameTime}ms</div>
      <div>龙: ${m.entities.dragons}</div>
      <div>子弹: ${m.entities.bullets}</div>
      <div>粒子: ${m.entities.particles}</div>
      <div>文字: ${m.entities.floatTexts}</div>
      <div>金币: ${m.entities.coinDrops}</div>
    `

    if (m.memory) {
      const usedMB = (m.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
      const totalMB = (m.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
      html += `
        <div>内存: ${usedMB}MB / ${totalMB}MB</div>
      `
    }

    this.debugElement.innerHTML = html
  }

  /**
   * 每帧更新调试显示
   */
  render(): void {
    if (this.showDebug) {
      this.updateDebugDisplay()
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.removeDebugOverlay()
  }
}

// 创建全局单例
export const performanceMonitor = new PerformanceMonitor()
