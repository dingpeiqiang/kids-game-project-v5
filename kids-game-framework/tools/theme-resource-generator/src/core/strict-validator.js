/**
 * 严格校验器 - 确保所有资源符合 GDD 要求
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
   */
  static async validateExistingResources(requirements, resourcesDir) {
    const missing = [];
    const present = [];
    
    // 检查所有图片资源
    for (const req of requirements.images) {
      const filename = `${req.name}.png`;
      const filepath = join(resourcesDir, filename);
      
      try {
        await fs.access(filepath);
        present.push(filename);
      } catch {
        missing.push(filename);
      }
    }
    
    // 检查所有音频资源
    for (const req of requirements.audio) {
      const filename = `${req.name}.mp3`;
      const filepath = join(resourcesDir, filename);
      
      try {
        await fs.access(filepath);
        present.push(filename);
      } catch {
        missing.push(filename);
      }
    }
    
    return {
      allPresent: missing.length === 0,
      missing,
      present,
      stats: {
        total: requirements.images.length + requirements.audio.length,
        presentCount: present.length,
        missingCount: missing.length
      }
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
