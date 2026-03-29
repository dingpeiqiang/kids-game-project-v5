/**
 * 严格校验器 - 确保所有资源符合 GDD 要求，且 GTRS.json 符合 v1.0.0 规范
 * 原则：不允许降级方案，缺失就报错
 */

import fs from 'fs/promises';
import { join } from 'path';

export class StrictValidator {
  
  /**
   * 验证资源需求完整性
   */
  static validateRequirements(requirements) {
    const errors = [];
    
    // 检查图片需求
    if (requirements.images.length === 0) {
      errors.push('❌ GDD 中未定义任何图片资源需求');
    }
    
    requirements.images.forEach((req, index) => {
      if (!req.name || req.name.trim() === '') {
        errors.push(`❌ 第${index + 1}个图片资源缺少名称`);
      }
      if (!req.priority || req.priority !== '必需') {
        console.warn(`⚠️  警告：图片资源"${req.name}"标记为可选，建议改为必需`);
      }
    });
    
    // 检查音频需求
    if (requirements.audio.length === 0) {
      console.warn('⚠️  警告：GDD 中未定义任何音频资源需求');
    }
    
    if (errors.length > 0) {
      throw new Error('资源需求验证失败:\n' + errors.join('\n'));
    }
  }
  
  /**
   * 验证生成的资源
   */
  static validateGeneratedResources(result) {
    const failures = [];
    
    // 检查图片生成 - 严格要求
    if (result.images.required > 0 && result.images.generated < result.images.required) {
      failures.push({
        name: '图片资源',
        reason: `应生成${result.images.required}个，实际生成${result.images.generated}个`
      });
    }
    
    // 检查音频生成 - 严格要求（不允许占位符）
    if (result.audio.required > 0 && result.audio.generated < result.audio.required) {
      failures.push({
        name: '音频资源',
        reason: `应生成${result.audio.required}个，实际生成${result.audio.generated}个`
      });
    }
    
    // 检查是否有空文件（严格模式）
    if (result.hasEmptyFiles) {
      failures.push({
        name: '空文件检查',
        reason: '发现空文件（占位符），不符合无降级交付要求'
      });
    }
    
    return {
      passed: failures.length === 0,
      failures
    };
  }
  
  /**
   * 验证现有资源文件
   * 注意：生成器现在将图片存放在 resourcesDir/images/，音频存放在 resourcesDir/audio/
   */
  static async validateExistingResources(requirements, resourcesDir) {
    const missing = [];
    const present = [];
    
    // 检查所有图片资源（在 images/ 子目录中）
    for (const req of requirements.images) {
      const filename = `${req.name}.png`;
      const filepath = join(resourcesDir, 'images', filename);
      
      try {
        await fs.access(filepath);
        present.push(`images/${filename}`);
      } catch {
        missing.push(`images/${filename}`);
      }
    }
    
    // 检查所有音频资源（在 audio/ 子目录中）
    for (const req of requirements.audio) {
      const filename = `${req.name}.mp3`;
      const filepath = join(resourcesDir, 'audio', filename);
      
      try {
        await fs.access(filepath);
        present.push(`audio/${filename}`);
      } catch {
        missing.push(`audio/${filename}`);
      }
    }
    
    // 检查 GTRS.json 是否存在
    const gtrsPath = join(resourcesDir, 'GTRS.json');
    try {
      await fs.access(gtrsPath);
      present.push('GTRS.json');
    } catch {
      missing.push('GTRS.json');
    }
    
    return {
      allPresent: missing.length === 0,
      missing,
      present,
      stats: {
        total: requirements.images.length + requirements.audio.length + 1,
        presentCount: present.length,
        missingCount: missing.length
      }
    };
  }
  
  /**
   * 验证 GTRS.json 是否符合 v1.0.0 规范
   * - 必须有 specMeta / themeInfo / globalStyle / resources 四大顶级字段
   * - resources 必须有 images / audio / video
   * - images 必须有 scene / ui / icon / effect 子分类
   * - audio 必须有 bgm / effect / voice 子分类
   * - 所有 src 路径必须以 /themes/{themeCode}/ 开头（不含 /public/ 前缀）
   * @param {string} gtrsPath - GTRS.json 文件路径
   * @returns {{ passed: boolean, errors: string[], warnings: string[] }}
   */
  static async validateGTRSSpec(gtrsPath) {
    const errors = [];
    const warnings = [];
    
    let config;
    try {
      const content = await fs.readFile(gtrsPath, 'utf-8');
      config = JSON.parse(content);
    } catch (e) {
      return { passed: false, errors: [`❌ 无法解析 GTRS.json：${e.message}`], warnings: [] };
    }
    
    // 1. 顶级字段检查
    const requiredTopFields = ['specMeta', 'themeInfo', 'globalStyle', 'resources'];
    for (const field of requiredTopFields) {
      if (!config[field]) {
        errors.push(`❌ 缺少顶级字段：${field}`);
      }
    }
    if (errors.length > 0) return { passed: false, errors, warnings };
    
    // 2. specMeta 检查
    const { specMeta } = config;
    if (specMeta.specName !== 'GTRS') errors.push('❌ specMeta.specName 应为 "GTRS"');
    if (specMeta.specVersion !== '1.0.0') errors.push('❌ specMeta.specVersion 应为 "1.0.0"');
    
    // 3. themeInfo 必要字段
    const { themeInfo } = config;
    for (const f of ['themeCode', 'themeName', 'ownerType', 'ownerId']) {
      if (!themeInfo[f]) warnings.push(`⚠️  themeInfo.${f} 未填写`);
    }
    if (themeInfo.ownerType && themeInfo.ownerType !== 'GAME') {
      warnings.push(`⚠️  themeInfo.ownerType 应为 "GAME"，当前为 "${themeInfo.ownerType}"`);
    }
    
    // 4. resources 结构检查
    const { resources } = config;
    if (!resources.images) errors.push('❌ resources.images 缺失');
    if (!resources.audio)  errors.push('❌ resources.audio 缺失');
    if (!resources.video && resources.video !== undefined) warnings.push('⚠️  resources.video 未定义，建议设为 {}');
    
    if (resources.images) {
      for (const sub of ['scene', 'ui', 'icon', 'effect']) {
        if (resources.images[sub] === undefined) {
          warnings.push(`⚠️  resources.images.${sub} 未定义，建议设为 {}`);
        }
      }
    }
    if (resources.audio) {
      for (const sub of ['bgm', 'effect', 'voice']) {
        if (resources.audio[sub] === undefined) {
          warnings.push(`⚠️  resources.audio.${sub} 未定义，建议设为 {}`);
        }
      }
    }
    
    // 5. 路径规范检查 - 所有 src 必须以 /themes/ 开头，不能含 /public/
    const themeCode = themeInfo.themeCode || '';
    const pathPrefix = themeCode ? `/themes/${themeCode}/` : '/themes/';
    
    const checkSrcs = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, val] of Object.entries(obj)) {
        if (val && typeof val === 'object') {
          if (typeof val.src === 'string') {
            const src = val.src;
            if (src.includes('/public/')) {
              errors.push(`❌ ${path}.${key}.src 包含 "/public/" 前缀（应去掉）：${src}`);
            }
            if (!src.startsWith('/themes/')) {
              errors.push(`❌ ${path}.${key}.src 不以 "/themes/" 开头：${src}`);
            } else if (themeCode && !src.startsWith(pathPrefix)) {
              warnings.push(`⚠️  ${path}.${key}.src 主题代码与 themeInfo.themeCode 不一致：${src}`);
            }
          } else {
            checkSrcs(val, path ? `${path}.${key}` : key);
          }
        }
      }
    };
    checkSrcs(resources, 'resources');
    
    return {
      passed: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * 严格模式：检查资源质量（零容忍降级）
   */
  static async validateResourceQuality(resourcePath, requirements) {
    const errors = [];
    
    try {
      const stats = await fs.stat(resourcePath);
      
      // 严格检查：文件大小为 0 直接报错（不允许占位符）
      if (stats.size === 0) {
        errors.push('❌ 文件大小为 0（占位符/空文件，违反无降级交付原则）');
      }
      
      // 检查最小文件大小（防止过小的伪资源）
      const minSizeMap = {
        '.png': 100,      // PNG 至少 100 字节
        '.jpg': 100,      // JPG 至少 100 字节
        '.jpeg': 100,
        '.mp3': 1000,     // MP3 至少 1KB
        '.wav': 1000      // WAV 至少 1KB
      };
      
      const ext = '.' + resourcePath.split('.').pop().toLowerCase();
      const minSize = minSizeMap[ext] || 0;
      
      if (stats.size < minSize) {
        errors.push(`❌ 文件过小 (${stats.size} bytes)，最小应为 ${minSize} bytes（疑似降级方案）`);
      }
      
      // 检查文件扩展名
      if (!['png', 'jpg', 'jpeg', 'mp3', 'wav'].includes(ext.replace('.', ''))) {
        errors.push(`❌ 不支持的文件格式：${ext.replace('.', '')}`);
      }
      
      // TODO: 添加更多质量检查
      // - 图片尺寸检查（最小宽度/高度）
      // - 音频时长检查（最小时长）
      // - 颜色模式检查
      // - 透明度检查
      
    } catch (error) {
      errors.push(`❌ 无法访问文件：${error.message}`);
    }
    
    return {
      passed: errors.length === 0,
      errors
    };
  }
}

