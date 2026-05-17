/**
 * PerformanceMonitor - 游戏性能监控工具
 * 监控FPS、内存使用、对象数量等关键指标
 */
export default class PerformanceMonitor {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.enabled = options.enabled !== false;
    this.showOverlay = options.showOverlay || false;
    
    // 性能数据
    this.stats = {
      fps: 0,
      fpsMin: 60,
      fpsMax: 0,
      frameCount: 0,
      lastTime: performance.now(),
      updateTime: 0,
      memoryUsed: 0,
      objectCount: 0,
      activeSprites: 0,
      drawCalls: 0
    };
    
    // 历史数据（用于图表）
    this.history = {
      fps: [],
      memory: [],
      objects: []
    };
    
    this.maxHistoryLength = 100;
    
    // UI元素
    this.textElement = null;
    this.overlayGraphics = null;
    
    if (this.enabled) {
      this._init();
    }
  }

  /**
   * 初始化监控器
   * @private
   */
  _init() {
    // 创建显示文本
    if (this.showOverlay) {
      this.textElement = this.scene.add.text(10, 10, '', {
        font: '14px monospace',
        fill: '#00ff00',
        backgroundColor: '#000000aa'
      });
      this.textElement.setScrollFactor(0);
      this.textElement.depth = 1000000;
    }
    
    // 定期更新统计信息（每秒一次）
    this.scene.time.addEvent({
      delay: 1000,
      callback: this._updateStats.bind(this),
      loop: true
    });
  }

  /**
   * 更新统计数据
   * @private
   */
  _updateStats() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    // 计算FPS
    this.stats.fps = Math.round(1000 / deltaTime);
    this.stats.fpsMin = Math.min(this.stats.fpsMin, this.stats.fps);
    this.stats.fpsMax = Math.max(this.stats.fpsMax, this.stats.fps);
    this.stats.updateTime = deltaTime;
    
    // 获取内存使用情况（如果支持）
    if (performance.memory) {
      this.stats.memoryUsed = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    
    // 统计游戏对象
    this.stats.activeSprites = this.scene.children.list.filter(
      child => child instanceof Phaser.GameObjects.Sprite
    ).length;
    
    this.stats.objectCount = this.scene.children.list.length;
    
    // 更新历史记录
    this._updateHistory();
    
    // 更新显示
    if (this.showOverlay && this.textElement) {
      this._updateDisplay();
    }
    
    // 重置计时器
    this.lastTime = currentTime;
    this.stats.frameCount = 0;
  }

  /**
   * 更新历史记录
   * @private
   */
  _updateHistory() {
    this.history.fps.push(this.stats.fps);
    this.history.memory.push(this.stats.memoryUsed);
    this.history.objects.push(this.stats.objectCount);
    
    // 限制历史长度
    if (this.history.fps.length > this.maxHistoryLength) {
      this.history.fps.shift();
      this.history.memory.shift();
      this.history.objects.shift();
    }
  }

  /**
   * 更新显示文本
   * @private
   */
  _updateDisplay() {
    const text = [
      `FPS: ${this.stats.fps} (${this.stats.fpsMin}-${this.stats.fpsMax})`,
      `Memory: ${this.stats.memoryUsed} MB`,
      `Objects: ${this.stats.objectCount}`,
      `Sprites: ${this.stats.activeSprites}`,
      `Frame Time: ${this.stats.updateTime.toFixed(2)} ms`
    ].join('\n');
    
    this.textElement.setText(text);
  }

  /**
   * 记录帧开始（用于手动FPS计算）
   */
  beginFrame() {
    this.stats.frameCount++;
  }

  /**
   * 获取当前统计数据
   * @returns {Object} 统计数据
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 获取历史数据
   * @returns {Object} 历史数据
   */
  getHistory() {
    return { ...this.history };
  }

  /**
   * 计算平均FPS
   * @returns {number} 平均FPS
   */
  getAverageFPS() {
    if (this.history.fps.length === 0) return 0;
    const sum = this.history.fps.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.history.fps.length);
  }

  /**
   * 计算平均内存使用
   * @returns {number} 平均内存（MB）
   */
  getAverageMemory() {
    if (this.history.memory.length === 0) return 0;
    const sum = this.history.memory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.history.memory.length);
  }

  /**
   * 重置统计数据
   */
  reset() {
    this.stats.fpsMin = 60;
    this.stats.fpsMax = 0;
    this.stats.frameCount = 0;
    this.history.fps = [];
    this.history.memory = [];
    this.history.objects = [];
  }

  /**
   * 启用/禁用监控
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.textElement) {
      this.textElement.setVisible(enabled && this.showOverlay);
    }
  }

  /**
   * 显示/隐藏覆盖层
   * @param {boolean} show - 是否显示
   */
  setShowOverlay(show) {
    this.showOverlay = show;
    if (this.textElement) {
      this.textElement.setVisible(show && this.enabled);
    }
  }

  /**
   * 导出性能报告
   * @returns {Object} 完整的性能报告
   */
  exportReport() {
    return {
      current: this.getStats(),
      average: {
        fps: this.getAverageFPS(),
        memory: this.getAverageMemory()
      },
      history: this.getHistory(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 销毁监控器
   */
  destroy() {
    if (this.textElement) {
      this.textElement.destroy();
    }
    if (this.overlayGraphics) {
      this.overlayGraphics.destroy();
    }
  }
}
