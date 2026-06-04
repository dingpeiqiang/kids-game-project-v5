/**
 * 性能监控工具
 * 
 * 实时监控游戏性能指标：FPS、内存、渲染时间等
 */

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage: number
  renderTime: number
  updateTime: number
  objectCount: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  
  private fps: number = 0
  private frameCount: number = 0
  private lastTime: number = performance.now()
  private frameTime: number = 0
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    updateTime: 0,
    objectCount: 0
  }
  
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = []
  
  private constructor() {}
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  /**
   * 记录帧开始
   */
  beginFrame(): void {
    this.frameCount++
    const now = performance.now()
    
    // 每秒更新一次 FPS
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime))
      this.frameCount = 0
      this.lastTime = now
      
      // 更新内存使用
      if ('memory' in performance) {
        this.metrics.memoryUsage = Math.round(
          ((performance as any).memory.usedJSHeapSize / 1048576) * 100
        ) / 100
      }
      
      // 通知回调
      this.notifyCallbacks()
    }
  }
  
  /**
   * 记录帧结束
   */
  endFrame(): void {
    this.frameTime = performance.now() - this.lastTime
    this.metrics.frameTime = this.frameTime
  }
  
  /**
   * 设置渲染时间
   */
  setRenderTime(time: number): void {
    this.metrics.renderTime = time
  }
  
  /**
   * 设置更新时间
   */
  setUpdateTime(time: number): void {
    this.metrics.updateTime = time
  }
  
  /**
   * 设置对象数量
   */
  setObjectCount(count: number): void {
    this.metrics.objectCount = count
  }
  
  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics, fps: this.fps }
  }
  
  /**
   * 注册回调
   */
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    this.callbacks.push(callback)
  }
  
  /**
   * 移除回调
   */
  offMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }
  
  private notifyCallbacks(): void {
    const currentMetrics = this.getMetrics()
    this.callbacks.forEach(cb => cb(currentMetrics))
  }
  
  /**
   * 打印性能报告
   */
  printReport(): void {
    const m = this.getMetrics()
    console.log('📊 性能报告:')
    console.log(`  FPS: ${m.fps}`)
    console.log(`  Frame Time: ${m.frameTime.toFixed(2)}ms`)
    console.log(`  Memory: ${m.memoryUsage.toFixed(2)} MB`)
    console.log(`  Render Time: ${m.renderTime.toFixed(2)}ms`)
    console.log(`  Update Time: ${m.updateTime.toFixed(2)}ms`)
    console.log(`  Objects: ${m.objectCount}`)
  }
  
  /**
   * 检查性能问题
   */
  checkPerformanceIssues(): string[] {
    const issues: string[] = []
    const m = this.getMetrics()
    
    if (m.fps < 30) {
      issues.push(`⚠️  FPS 过低：${m.fps} (目标：60)`)
    }
    
    if (m.frameTime > 33) {
      issues.push(`⚠️  帧时间过长：${m.frameTime.toFixed(2)}ms (目标：< 16.67ms)`)
    }
    
    if (m.memoryUsage > 200) {
      issues.push(`⚠️  内存占用过高：${m.memoryUsage.toFixed(2)}MB (警告线：200MB)`)
    }
    
    if (m.renderTime > 10) {
      issues.push(`⚠️  渲染时间过长：${m.renderTime.toFixed(2)}ms`)
    }
    
    return issues
  }
}

/**
 * 性能监控 Vue 组件辅助函数
 */
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()
  
  const startMonitoring = () => {
    let animationId: number
    
    const loop = () => {
      monitor.beginFrame()
      animationId = requestAnimationFrame(loop)
      monitor.endFrame()
    }
    
    loop()
    
    return () => cancelAnimationFrame(animationId)
  }
  
  const getPerformance = () => monitor.getMetrics()
  const printReport = () => monitor.printReport()
  const checkIssues = () => monitor.checkPerformanceIssues()
  
  return {
    startMonitoring,
    getPerformance,
    printReport,
    checkIssues
  }
}
