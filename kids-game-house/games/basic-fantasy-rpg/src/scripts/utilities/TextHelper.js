/**
 * 文本渲染工具 - 支持中英文混合
 * Text Rendering Utility - Support Chinese and English
 */

import CONST from '../scenes/Const';

/**
 * 检测文本是否包含中文
 * @param {string} text - 要检测的文本
 * @returns {boolean} 是否包含中文
 */
export function hasChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * 创建文本对象（自动选择位图字体或系统字体）
 * @param {Phaser.Scene} scene - Phaser 场景
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {string} text - 文本内容
 * @param {number} size - 字体大小
 * @param {Object} options - 额外选项
 * @returns {Phaser.GameObjects.Text|Phaser.GameObjects.BitmapText}
 */
export function createText(scene, x, y, text, size = 16, options = {}) {
  // 如果包含中文，使用系统字体
  if (hasChinese(text)) {
    // 位图字体 size 到系统字体 px 的映射（根据实际效果调整）
    const fontSizeMap = {
      8: '14px',   // CONST.TXT_S
      12: '18px',  // CONST.TXT_M
      16: '24px',  // CONST.TXT_L
    };
    
    const fontSize = fontSizeMap[size] || `${size * 1.5}px`;
    
    const textStyle = {
      fontSize: fontSize,
      fontFamily: 'Microsoft YaHei, SimHei, Arial, sans-serif',
      fill: options.fill || '#ffffff',
      align: options.align || 'center',
      lineSpacing: 8,  // 增加行间距，改善中文排版
      wordWrap: {
        width: options.maxWidth || 400,  // 自动换行宽度
        useAdvancedWrap: true
      },
      ...options.style
    };
    
    const textObj = scene.add.text(x, y, text, textStyle);
    
    // 应用额外的设置
    if (options.origin) textObj.setOrigin(options.origin);
    if (options.tint) textObj.setTint(options.tint);
    
    return textObj;
  } 
  // 否则使用位图字体
  else {
    const bitmapText = scene.add.bitmapText(x, y, 'font', text, size);
    
    // 应用额外的设置
    if (options.origin) bitmapText.setOrigin(options.origin);
    if (options.tint) bitmapText.setTint(options.tint);
    if (options.align) {
      if (options.align === 'center') bitmapText.setCenterAlign();
      else if (options.align === 'left') bitmapText.setLeftAlign();
      else if (options.align === 'right') bitmapText.setRightAlign();
    }
    
    return bitmapText;
  }
}

/**
 * 创建多行文本（用于对话等）
 * @param {Phaser.Scene} scene - Phaser 场景
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {string|string[]} text - 文本内容（可以是字符串或字符串数组）
 * @param {number} size - 字体大小
 * @param {Object} options - 额外选项
 * @returns {Phaser.GameObjects.Text|Phaser.GameObjects.BitmapText}
 */
export function createMultilineText(scene, x, y, text, size = 16, options = {}) {
  // 如果 text 是数组，转换为多行字符串
  let finalText = Array.isArray(text) ? text.join('\n') : text;
  
  // 为多行文本设置默认的最大宽度（防止过宽）
  const defaultOptions = {
    maxWidth: options.maxWidth || 500,
    ...options
  };
  
  return createText(scene, x, y, finalText, size, defaultOptions);
}

export default {
  hasChinese,
  createText,
  createMultilineText,
};
