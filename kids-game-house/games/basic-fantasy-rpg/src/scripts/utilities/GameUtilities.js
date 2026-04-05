/**
 * GameUtilities - 通用游戏工具函数
 * 提供常用的辅助功能
 */

/**
 * 生成唯一ID
 * @param {string} prefix - ID前缀
 * @returns {string} 唯一ID
 */
export function generateUniqueId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 限制数值在指定范围内
 * @param {number} value - 要限制的数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的数值
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 线性插值
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} t - 插值因子 (0-1)
 * @returns {number} 插值结果
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * 计算两点之间的距离
 * @param {number} x1 - 点1的X坐标
 * @param {number} y1 - 点1的Y坐标
 * @param {number} x2 - 点2的X坐标
 * @param {number} y2 - 点2的Y坐标
 * @returns {number} 距离
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点之间的角度（弧度）
 * @param {number} x1 - 点1的X坐标
 * @param {number} y1 - 点1的Y坐标
 * @param {number} x2 - 点2的X坐标
 * @param {number} y2 - 点2的Y坐标
 * @returns {number} 角度（弧度）
 */
export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * 将角度转换为度数
 * @param {number} radians - 弧度
 * @returns {number} 度数
 */
export function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * 将度数转换为弧度
 * @param {number} degrees - 度数
 * @returns {number} 弧度
 */
export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * 随机整数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} 随机整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 随机浮点数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机浮点数
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 从数组中随机选择一个元素
 * @param {Array} array - 源数组
 * @returns {any} 随机选择的元素
 */
export function randomChoice(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 洗牌算法（Fisher-Yates）
 * @param {Array} array - 要洗牌的数组
 * @returns {Array} 洗牌后的数组（原地修改）
 */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 格式化时间（毫秒转为可读格式）
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * 检查点是否在矩形内
 * @param {number} px - 点的X坐标
 * @param {number} py - 点的Y坐标
 * @param {number} rx - 矩形的X坐标
 * @param {number} ry - 矩形的Y坐标
 * @param {number} rw - 矩形的宽度
 * @param {number} rh - 矩形的高度
 * @returns {boolean} 是否在矩形内
 */
export function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * 检查两个矩形是否相交
 * @param {Object} rect1 - 矩形1 {x, y, width, height}
 * @param {Object} rect2 - 矩形2 {x, y, width, height}
 * @returns {boolean} 是否相交
 */
export function rectsIntersect(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  );
}

/**
 * 缓动函数集合
 */
export const Easing = {
  // 线性
  Linear: t => t,
  
  // 二次方
  Quadratic: {
    In: t => t * t,
    Out: t => t * (2 - t),
    InOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  },
  
  // 三次方
  Cubic: {
    In: t => t * t * t,
    Out: t => (--t) * t * t + 1,
    InOut: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  },
  
  // 正弦
  Sinusoidal: {
    In: t => 1 - Math.cos(t * Math.PI / 2),
    Out: t => Math.sin(t * Math.PI / 2),
    InOut: t => 0.5 * (1 - Math.cos(Math.PI * t))
  },
  
  // 弹性
  Elastic: {
    Out: t => {
      const p = 0.3;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    }
  },
  
  // 弹跳
  Bounce: {
    Out: t => {
      if (t < (1 / 2.75)) {
        return 7.5625 * t * t;
      } else if (t < (2 / 2.75)) {
        return 7.5625 * (t -= (1.5 / 2.75)) * t + 0.75;
      } else if (t < (2.5 / 2.75)) {
        return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375;
      } else {
        return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375;
      }
    }
  }
};

/**
 * 颜色工具
 */
export const Color = {
  /**
   * HEX转RGB
   * @param {string} hex - HEX颜色值
   * @returns {Object} RGB对象 {r, g, b}
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * RGB转HEX
   * @param {number} r - 红色 (0-255)
   * @param {number} g - 绿色 (0-255)
   * @param {number} b - 蓝色 (0-255)
   * @returns {string} HEX颜色值
   */
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  /**
   * 混合两种颜色
   * @param {string} color1 - 颜色1 (HEX)
   * @param {string} color2 - 颜色2 (HEX)
   * @param {number} factor - 混合因子 (0-1)
   * @returns {string} 混合后的颜色 (HEX)
   */
  mixColors(color1, color2, factor = 0.5) {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return this.rgbToHex(r, g, b);
  }
};

/**
 * 存储工具（localStorage封装）
 */
export const Storage = {
  /**
   * 保存数据
   * @param {string} key - 键名
   * @param {any} value - 值
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  /**
   * 获取数据
   * @param {string} key - 键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },

  /**
   * 删除数据
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  /**
   * 清空所有数据
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }
};
