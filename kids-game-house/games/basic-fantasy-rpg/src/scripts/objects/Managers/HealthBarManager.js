/**
 * HealthBarManager - 优化的血条管理系统
 * 只在数值变化时更新渲染，减少不必要的绘制调用
 */
export default class HealthBarManager {
  constructor(scene) {
    this.scene = scene;
    
    // 缓存的血条对象
    this.bars = new Map();
    
    // 待更新的队列（批量处理）
    this.updateQueue = [];
    
    // 是否正在批量更新
    this.isBatchUpdating = false;
  }

  /**
   * 创建或获取血条
   * @param {string} id - 唯一标识符
   * @param {Object} config - 血条配置
   * @returns {Object} 血条对象
   */
  createBar(id, config = {}) {
    if (this.bars.has(id)) {
      return this.bars.get(id);
    }

    const bar = {
      id: id,
      graphics: this.scene.add.graphics(),
      currentValue: config.maxValue || 100,
      maxValue: config.maxValue || 100,
      x: config.x || 0,
      y: config.y || 0,
      width: config.width || 32,
      height: config.height || 4,
      color: config.color || 0x00ff00,
      backgroundColor: config.backgroundColor || 0x333333,
      visible: config.visible !== false,
      needsUpdate: true, // 标记需要更新
      lastValue: null,   // 上次更新的值
      lastMaxValue: null // 上次更新的最大值
    };

    this.bars.set(id, bar);
    this._renderBar(bar);
    
    return bar;
  }

  /**
   * 更新血条值
   * @param {string} id - 血条ID
   * @param {number} value - 当前值
   * @param {number} maxValue - 最大值（可选）
   */
  updateValue(id, value, maxValue = null) {
    const bar = this.bars.get(id);
    if (!bar) return;

    let needsUpdate = false;

    // 检查值是否变化
    if (bar.currentValue !== value) {
      bar.currentValue = value;
      needsUpdate = true;
    }

    // 检查最大值是否变化
    if (maxValue !== null && bar.maxValue !== maxValue) {
      bar.maxValue = maxValue;
      needsUpdate = true;
    }

    // 标记需要更新
    if (needsUpdate) {
      bar.needsUpdate = true;
      
      // 如果不在批量更新模式，立即更新
      if (!this.isBatchUpdating) {
        this._renderBar(bar);
      }
    }
  }

  /**
   * 设置血条位置
   * @param {string} id - 血条ID
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  setPosition(id, x, y) {
    const bar = this.bars.get(id);
    if (!bar) return;

    if (bar.x !== x || bar.y !== y) {
      bar.x = x;
      bar.y = y;
      bar.needsUpdate = true;
      
      if (!this.isBatchUpdating) {
        this._renderBar(bar);
      }
    }
  }

  /**
   * 设置血条可见性
   * @param {string} id - 血条ID
   * @param {boolean} visible - 是否可见
   */
  setVisible(id, visible) {
    const bar = this.bars.get(id);
    if (!bar) return;

    if (bar.visible !== visible) {
      bar.visible = visible;
      bar.graphics.setVisible(visible);
      
      if (!visible) {
        bar.graphics.clear();
      } else {
        bar.needsUpdate = true;
        this._renderBar(bar);
      }
    }
  }

  /**
   * 删除血条
   * @param {string} id - 血条ID
   */
  removeBar(id) {
    const bar = this.bars.get(id);
    if (bar) {
      bar.graphics.destroy();
      this.bars.delete(id);
    }
  }

  /**
   * 开始批量更新（性能优化）
   */
  beginBatchUpdate() {
    this.isBatchUpdating = true;
    this.updateQueue = [];
  }

  /**
   * 结束批量更新并应用所有更改
   */
  endBatchUpdate() {
    this.isBatchUpdating = false;
    
    // 只更新标记为需要的血条
    for (const bar of this.bars.values()) {
      if (bar.needsUpdate && bar.visible) {
        this._renderBar(bar);
        bar.needsUpdate = false;
      }
    }
  }

  /**
   * 渲染单个血条
   * @private
   */
  _renderBar(bar) {
    const graphics = bar.graphics;
    graphics.clear();

    if (!bar.visible) return;

    // 计算填充比例
    const percent = Math.max(0, Math.min(1, bar.currentValue / bar.maxValue));
    const fillWidth = bar.width * percent;

    // 根据血量百分比选择颜色
    let color = bar.color;
    if (percent < 0.25) {
      color = 0xff0000; // 红色 - 危险
    } else if (percent < 0.5) {
      color = 0xffaa00; // 橙色 - 警告
    }

    // 绘制背景
    graphics.fillStyle(bar.backgroundColor, 1);
    graphics.fillRect(bar.x, bar.y, bar.width, bar.height);

    // 绘制填充
    graphics.fillStyle(color, 1);
    graphics.fillRect(bar.x, bar.y, fillWidth, bar.height);

    // 绘制边框
    graphics.lineStyle(1, 0x000000, 0.5);
    graphics.strokeRect(bar.x, bar.y, bar.width, bar.height);
  }

  /**
   * 清除所有血条
   */
  clearAll() {
    for (const bar of this.bars.values()) {
      bar.graphics.destroy();
    }
    this.bars.clear();
  }

  /**
   * 获取管理器状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      totalBars: this.bars.size,
      visibleBars: Array.from(this.bars.values()).filter(b => b.visible).length
    };
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.clearAll();
  }
}
