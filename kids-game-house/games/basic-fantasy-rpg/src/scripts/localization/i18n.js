/**
 * 国际化 (i18n) 工具
 * Internationalization Utilities
 */

import zhCN from './zh-CN';

// 当前语言设置
let currentLanguage = 'zh-CN';

// 翻译字典
const translations = {
  'zh-CN': zhCN,
};

/**
 * 获取翻译文本
 * @param {string} key - 翻译键，使用点号分隔，如 'ui.inventory'
 * @param {Object} params - 可选的参数对象，用于替换占位符
 * @returns {string} 翻译后的文本
 */
export function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations[currentLanguage];

  // 逐级查找翻译
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  // 如果找到翻译且是字符串
  if (typeof value === 'string') {
    // 替换占位符 {paramName}
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
    }
    return result;
  }

  // 如果没有找到翻译，返回键名
  console.warn(`Translation value is not a string: ${key}`);
  return key;
}

/**
 * 设置当前语言
 * @param {string} lang - 语言代码，如 'zh-CN', 'en-US'
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    console.log(`Language changed to: ${lang}`);
  } else {
    console.warn(`Language not supported: ${lang}`);
  }
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * 添加新的语言包
 * @param {string} lang - 语言代码
 * @param {Object} translation - 翻译对象
 */
export function addTranslation(lang, translation) {
  translations[lang] = translation;
  console.log(`Translation added for: ${lang}`);
}

// 导出便捷方法
export default {
  t,
  setLanguage,
  getCurrentLanguage,
  addTranslation,
};
