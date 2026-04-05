import ObjectPool from '../../utilities/ObjectPool';

/**
 * FloatingTextManager - 使用对象池管理浮动文本
 * 优化性能，减少垃圾回收
 */
export default class FloatingTextManager {
  constructor(scene) {
    this.scene = scene;
    
    // 创建浮动文本对象池
    this.pool = new ObjectPool(
      // 创建函数
      () => {
        const text = scene.add.dynamicBitmapText(0, 0, 'font', '', 8)
          .setOrigin(0.5)
          .setVisible(false);
        text.depth = 100000;
        return text;
      },
      // 重置函数
      (text, options) => {
        this._resetText(text, options);
      },
      20 // 初始池大小
    );
    
    // 活动的文本列表
    this.activeTexts = [];
  }

  /**
   * 显示浮动文本
   * @param {Object} options - 文本选项
   * @returns {Object} 文本对象
   */
  show(options = {}) {
    const text = this.pool.get(options);
    
    // 设置可见
    text.setVisible(true);
    
    // 添加到活动列表
    this.activeTexts.push(text);
    
    // 播放动画
    this._animateText(text);
    
    // 设置自动销毁定时器
    const ttl = options.timeToLive || 2000;
    this.scene.time.delayedCall(ttl, () => {
      this.hide(text);
    });
    
    return text;
  }

  /**
   * 隐藏并释放文本对象
   * @param {Object} text - 要隐藏的文本对象
   */
  hide(text) {
    const index = this.activeTexts.indexOf(text);
    if (index > -1) {
      this.activeTexts.splice(index, 1);
    }
    
    text.setVisible(false);
    text.setAlpha(1);
    text.setScale(1);
    this.pool.release(text);
  }

  /**
   * 重置文本对象的状态
   * @private
   */
  _resetText(text, options) {
    const _text = options.text || "";
    const _x = options.x || null;
    const _y = options.y || null;
    const _position = options.position || null;
    const _parentObj = options.parentObj || null;
    const _size = (4 + (options.size || 0)) || 8;
    const _color = options.color || this._getTextColor(options.combatObject);
    const _fixedToCamera = options.fixedToCamera || false;

    // 重置文本属性
    text.setText(_text);
    text.setFontSize(_size);
    text.setTint(_color);
    text.setAlpha(1);
    text.setScale(1);
    
    // 设置位置
    if (_x && _y) {
      text.x = _x;
      text.y = _y;
    } else if (_parentObj) {
      text.x = _parentObj.x;
      text.y = _parentObj.y;
    } else {
      text.x = this.scene.cameras.main.midPoint.x;
      text.y = this.scene.cameras.main.midPoint.y;
    }

    // 位置偏移
    if (_position === 'above') {
      text.y -= 40;
    } else if (_position === 'below') {
      text.y += 40;
    }

    // 保存动画参数
    text._animation = options.animation || "fade";
    text._distance = options.distance || 40;
    text._easing = options.easing || Phaser.Math.Easing.Quintic.Out;
  }

  /**
   * 播放文本动画
   * @private
   */
  _animateText(text) {
    const animation = text._animation;
    const distance = text._distance;
    const easing = text._easing;

    switch (animation) {
      case 'up':
        this.scene.tweens.add({
          targets: text,
          y: text.y - distance,
          alpha: 0,
          duration: 1000,
          ease: easing,
          onComplete: () => {
            if (this.activeTexts.includes(text)) {
              this.hide(text);
            }
          }
        });
        break;

      case 'fade':
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 1000,
          delay: 500,
          ease: easing,
          onComplete: () => {
            if (this.activeTexts.includes(text)) {
              this.hide(text);
            }
          }
        });
        break;

      case 'explode':
        this.scene.tweens.add({
          targets: text,
          scale: 1.5,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            if (this.activeTexts.includes(text)) {
              this.hide(text);
            }
          }
        });
        break;

      default:
        // 默认淡出
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 1000,
          delay: 500,
          onComplete: () => {
            if (this.activeTexts.includes(text)) {
              this.hide(text);
            }
          }
        });
    }
  }

  /**
   * 根据战斗对象获取文本颜色
   * @private
   */
  _getTextColor(combatObject) {
    if (!combatObject) return 0xd04648;
    
    const type = combatObject.type ? combatObject.type() : '';
    const damageType = combatObject.damageType ? combatObject.damageType() : '';
    
    switch (type) {
      case 'magic':
      case 'wand':
        switch (damageType) {
          case 'fire': return 0xbf7b3f;
          case 'frost': return 0x8ebbd1;
          case 'arcane': return 0x5ba3c7;
          case 'shadow': return 0x944a9c;
          case 'holy': return 0xe4da99;
        }
        break;
      case 'dot':
      case 'special':
        return 0xccaa44;
      case 'eat':
      case 'heal':
        return 0x649438;
      case 'drink':
        return 0x337799;
      case 'autoAttack':
        return 0xc8dae3;
    }
    
    return 0xd04648;
  }

  /**
   * 清理所有活动文本
   */
  clearAll() {
    while (this.activeTexts.length > 0) {
      this.hide(this.activeTexts[0]);
    }
  }

  /**
   * 获取管理器状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      pool: this.pool.getStatus(),
      active: this.activeTexts.length
    };
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.clearAll();
    this.pool.destroy();
  }
}
