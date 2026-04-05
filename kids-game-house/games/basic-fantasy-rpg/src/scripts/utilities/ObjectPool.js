/**
 * ObjectPool - 通用对象池实现
 * 用于复用游戏对象，减少垃圾回收压力
 */
export default class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;  // 创建新对象的函数
    this.resetFn = resetFn;    // 重置对象的函数
    this.pool = [];            // 空闲对象池
    this.active = [];          // 正在使用的对象
    
    // 预创建初始对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * 从池中获取一个对象
   * @param {...any} args - 传递给重置函数的参数
   * @returns {any} 可用的对象
   */
  get(...args) {
    let obj;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn();
    }
    
    // 重置对象状态
    if (this.resetFn) {
      this.resetFn(obj, ...args);
    }
    
    this.active.push(obj);
    return obj;
  }

  /**
   * 释放对象回池中
   * @param {any} obj - 要释放的对象
   */
  release(obj) {
    const index = this.active.indexOf(obj);
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(obj);
    }
  }

  /**
   * 释放所有活动对象
   */
  releaseAll() {
    while (this.active.length > 0) {
      this.release(this.active[0]);
    }
  }

  /**
   * 获取池的状态信息
   * @returns {Object} 池状态
   */
  getStatus() {
    return {
      poolSize: this.pool.length,
      activeSize: this.active.length,
      totalSize: this.pool.length + this.active.length
    };
  }

  /**
   * 预分配更多对象
   * @param {number} count - 要创建的对象数量
   */
  preAllocate(count) {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * 清理池中的所有对象
   */
  destroy() {
    this.releaseAll();
    this.pool.forEach(obj => {
      if (obj.destroy && typeof obj.destroy === 'function') {
        obj.destroy();
      }
    });
    this.pool = [];
  }
}
