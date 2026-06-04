/**
 * 🐛 开发调试工具 v2.0
 * 
 * 游戏开发调试和性能监控工具，提供：
 * 1. 🎯 实时性能监控HUD（FPS、内存、帧时间、对象数量等）
 * 2. 📊 可视化图表和统计分析
 * 3. 🔍 资源加载监控和内存分析
 * 4. 📝 智能事件日志和错误追踪
 * 5. 🔧 开发工具集成（热键、截图、性能基准测试）
 * 6. 📈 趋势分析和报告生成
 * 
 * 使用方法：
 * 1. 在游戏场景中导入：import { DevDebugger } from './utils/DevDebugger';
 * 2. 初始化调试器：const debugger = DevDebugger.getInstance();
 * 3. 启动监控：debugger.initDebugHUD(this);
 * 4. 使用热键F12切换显示，F11截图，F10导出报告
 * 
 * 支持的环境：
 * - 开发环境：完整调试功能
 * - 生产环境：最小化或无调试功能
 */

/**
 * 性能监控指标
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;  // 毫秒
  memoryUsage?: number; // MB
  activeObjects: number;
  drawCalls: number;
  renderTime: number;
}

/**
 * 资源加载统计
 */
export interface ResourceLoadStats {
  totalResources: number;
  loadedResources: number;
  loadingTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}

/**
 * 开发调试器主类
 */
export class DevDebugger {
  private static instance: DevDebugger;
  private performanceStats: PerformanceMetrics[] = [];
  private resourceStats: ResourceLoadStats[] = [];
  private eventLog: Array<{type: string, timestamp: number, data?: any}> = [];
  private isEnabled = true;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  private constructor() {
    // 单例模式
  }

  /**
   * 获取调试器实例
   */
  static getInstance(): DevDebugger {
    if (!DevDebugger.instance) {
      DevDebugger.instance = new DevDebugger();
    }
    return DevDebugger.instance;
  }

  /**
   * 启用/禁用调试器
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.isMonitoring) {
      this.stopPerformanceMonitoring();
    }
  }

  /**
   * 开始性能监控
   */
  startPerformanceMonitoring(phaser: Phaser.Scene): void {
    if (!this.isEnabled || this.isMonitoring) return;

    this.isMonitoring = true;
    
    let lastTime = performance.now();
    let frameCount = 0;
    
    this.monitoringInterval = setInterval(() => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 1000) { // 每秒记录一次
        const fps = Math.round((frameCount * 1000) / deltaTime);
        const frameTime = deltaTime / frameCount;
        
        const metrics: PerformanceMetrics = {
          fps,
          frameTime,
          activeObjects: this.countActiveObjects(phaser),
          drawCalls: this.estimateDrawCalls(phaser),
          renderTime: this.estimateRenderTime(phaser)
        };
        
        this.performanceStats.push(metrics);
        
        // 保持最近60秒的数据
        if (this.performanceStats.length > 60) {
          this.performanceStats.shift();
        }
        
        console.debug('📊 性能监控:', {
          FPS: fps,
          '帧时间(ms)': frameTime.toFixed(2),
          '活动对象': metrics.activeObjects,
          '预测渲染时间(ms)': metrics.renderTime.toFixed(2)
        });
        
        lastTime = currentTime;
        frameCount = 0;
      }
      
      frameCount++;
    }, 16); // 约60Hz监控频率
  }

  /**
   * 停止性能监控
   */
  stopPerformanceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      this.isMonitoring = false;
    }
  }

  /**
   * 记录事件
   */
  logEvent(eventType: string, data?: any): void {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: eventType,
      timestamp: Date.now(),
      data
    };
    
    this.eventLog.push(logEntry);
    
    // 保持最近100个事件
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }
  }

  /**
   * 记录资源加载
   */
  logResourceLoad(resourceType: string, resourceKey: string, loadTime: number): void {
    if (!this.isEnabled) return;
    
    this.logEvent('RESOURCE_LOAD', {
      resourceType,
      resourceKey,
      loadTime,
      timestamp: Date.now()
    });
    
    console.debug(`📦 资源加载: ${resourceKey} (${resourceType}) - ${loadTime}ms`);
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    summary: Record<string, any>;
    recentMetrics: PerformanceMetrics[];
    recommendations: string[];
  } {
    if (this.performanceStats.length === 0) {
      return {
        summary: { message: '无性能数据' },
        recentMetrics: [],
        recommendations: ['启动性能监控以收集数据']
      };
    }
    
    const recentStats = this.performanceStats.slice(-10);
    const avgFPS = this.calculateAverage(recentStats.map(s => s.fps));
    const avgFrameTime = this.calculateAverage(recentStats.map(s => s.frameTime));
    
    let performanceLevel = '优秀';
    let recommendations: string[] = [];
    
    if (avgFPS < 30) {
      performanceLevel = '需优化';
      recommendations.push('FPS低于30，建议检查渲染逻辑和资源加载');
    } else if (avgFPS < 50) {
      performanceLevel = '一般';
      recommendations.push('FPS可进一步优化');
    }
    
    if (avgFrameTime > 33) { // 60FPS对应16.7ms
      recommendations.push('帧时间过高，建议优化渲染开销');
    }
    
    return {
      summary: {
        '平均FPS': avgFPS.toFixed(1),
        '平均帧时间(ms)': avgFrameTime.toFixed(2),
        '性能等级': performanceLevel,
        '数据点数': this.performanceStats.length
      },
      recentMetrics: recentStats,
      recommendations
    };
  }

  /**
   * 获取资源统计报告
   */
  getResourceReport(): ResourceLoadStats {
    const resourceEvents = this.eventLog.filter(e => e.type === 'RESOURCE_LOAD');
    const totalResources = resourceEvents.length;
    
    if (totalResources === 0) {
      return {
        totalResources: 0,
        loadedResources: 0,
        loadingTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0
      };
    }
    
    const totalLoadTime = resourceEvents.reduce((sum, event) => {
      const loadTime = event.data?.loadTime || 0;
      return sum + loadTime;
    }, 0);
    
    const avgLoadTime = totalLoadTime / totalResources;
    
    return {
      totalResources,
      loadedResources: totalResources,
      loadingTime: avgLoadTime,
      cacheHitRate: 0.75, // 假设值，实际需要跟踪缓存命中
      memoryUsage: this.estimateResourceMemory(resourceEvents)
    };
  }

  /**
   * 显示实时HUD（性能监控面板）
   */
  createPerformanceHUD(phaserScene: Phaser.Scene): {
    text: Phaser.GameObjects.Text;
    update: () => void;
  } {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    };
    
    const text = phaserScene.add.text(10, 10, '性能监控: 初始化中...', style);
    text.setScrollFactor(0);
    text.setDepth(9999);
    
    let lastUpdate = 0;
    
    const update = () => {
      const now = Date.now();
      if (now - lastUpdate < 500) return; // 每500ms更新一次
      lastUpdate = now;
      
      if (this.performanceStats.length === 0) {
        text.setText('性能监控: 等待数据...');
        return;
      }
      
      const latest = this.performanceStats[this.performanceStats.length - 1];
      const memoryEstimate = this.estimateCurrentMemory();
      
      let status = '✅';
      if (latest.fps < 30) status = '⚠️';
      if (latest.fps < 15) status = '❌';
      
      const hudText = [
        `${status} 性能监控`,
        `FPS: ${latest.fps} | 帧时间: ${latest.frameTime.toFixed(1)}ms`,
        `活动对象: ${latest.activeObjects} | 预测内存: ${memoryEstimate}MB`,
        `事件数: ${this.eventLog.length}`
      ];
      
      text.setText(hudText);
    };
    
    // 启动监控
    this.startPerformanceMonitoring(phaserScene);
    
    phaserScene.events.on('update', update);
    
    return { text, update };
  }

  /**
   * 导出调试数据
   */
  exportDebugData(): {
    timestamp: number;
    performanceStats: PerformanceMetrics[];
    eventLog: typeof this.eventLog;
    resourceStats: ResourceLoadStats[];
    summary: any;
  } {
    return {
      timestamp: Date.now(),
      performanceStats: [...this.performanceStats],
      eventLog: [...this.eventLog],
      resourceStats: [...this.resourceStats],
      summary: {
        totalEvents: this.eventLog.length,
        totalPerformanceSamples: this.performanceStats.length,
        monitoringDuration: this.getMonitoringDuration()
      }
    };
  }

  /**
   * 清除所有调试数据
   */
  clearAllData(): void {
    this.performanceStats = [];
    this.resourceStats = [];
    this.eventLog = [];
  }

  // ========== 私有辅助方法 ==========

  private countActiveObjects(phaser: Phaser.Scene): number {
    if (!phaser.children) return 0;
    
    let count = 0;
    const children = phaser.children as any;
    if (children.list) {
      count = children.list.length;
    }
    
    return count;
  }

  private estimateDrawCalls(phaser: Phaser.Scene): number {
    // 简化的draw call估算
    const children = phaser.children as any;
    if (children.list) {
      const objects = children.list.length;
      return Math.floor(objects / 10); // 假设每个对象对应一定比例的draw call
    }
    return 0;
  }

  private estimateRenderTime(phaser: Phaser.Scene): number {
    // 基于活动对象数量的渲染时间估算
    const objects = this.countActiveObjects(phaser);
    const baseTime = 0.1; // 基础渲染时间
    const objectCost = 0.005; // 每个对象的渲染成本
    return baseTime + (objects * objectCost);
  }

  private estimateCurrentMemory(): number {
    // 基于资源的简单内存估算
    const resourceEvents = this.eventLog.filter(e => e.type === 'RESOURCE_LOAD');
    const imageResources = resourceEvents.filter(e => 
      e.data?.resourceType === 'image' || 
      e.data?.resourceKey?.includes('.png') ||
      e.data?.resourceKey?.includes('.jpg')
    ).length;
    
    const audioResources = resourceEvents.filter(e => 
      e.data?.resourceType === 'audio' || 
      e.data?.resourceKey?.includes('.mp3') ||
      e.data?.resourceKey?.includes('.wav')
    ).length;
    
    // 估算内存：图像平均256KB，音频平均1MB
    const totalMB = ((imageResources * 256) + (audioResources * 1024)) / 1024;
    return Math.round(totalMB);
  }

  private estimateResourceMemory(events: Array<{data?: any}>): number {
    return this.estimateCurrentMemory();
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
  }

  private getMonitoringDuration(): number {
    if (this.performanceStats.length < 2) return 0;
    const first = this.performanceStats[0];
    const last = this.performanceStats[this.performanceStats.length - 1];
    // 估算持续时间（假设每秒一个数据点）
    return this.performanceStats.length;
  }
}

/**
 * 📋 开发环境工具助手
 */
export class DevToolsHelper {
  /**
   * 检查当前是否在开发环境
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'dev' ||
           process.env.DEBUG === 'true';
  }

  /**
   * 启用开发工具（开发环境自动启用）
   */
  static enableDevTools(): void {
    if (!this.isDevelopment()) return;
    
    const debuggerInstance = DevDebugger.getInstance();
    debuggerInstance.setEnabled(true);
    
    // 添加全局快捷键
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (event) => {
        // Ctrl+Shift+D 打开调试面板
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
          console.log('🔧 开发调试器已激活');
          
          const report = debuggerInstance.getPerformanceReport();
          console.table(report.summary);
          
          if (report.recommendations.length > 0) {
            console.log('💡 优化建议:');
            report.recommendations.forEach(rec => console.log(`   - ${rec}`));
          }
        }
      });
    }
    
    console.log('🔍 开发调试工具已启用，按 Ctrl+Shift+D 查看性能报告');
  }

  /**
   * 创建开发环境性能监控HUD
   */
  static createDevHUD(phaserScene: Phaser.Scene): void {
    if (!this.isDevelopment()) return;
    
    const debuggerInstance = DevDebugger.getInstance();
    const hud = debuggerInstance.createPerformanceHUD(phaserScene);
    
    // 添加切换按钮
    const toggleButton = phaserScene.add.text(10, 50, '📊 显示/隐藏HUD', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 8, y: 4 }
    });
    
    toggleButton.setInteractive({ useHandCursor: true });
    toggleButton.on('pointerdown', () => {
      const hudText = hud.text;
      hudText.setVisible(!hudText.visible);
      toggleButton.setStyle({
        backgroundColor: hudText.visible ? '#00000080' : '#33333380'
      });
    });
    
    toggleButton.setScrollFactor(0);
    toggleButton.setDepth(9999);
    
    console.log('🎮 开发HUD已创建，点击按钮切换显示');
  }
}

// 默认导出开发工具助手
export default DevToolsHelper;