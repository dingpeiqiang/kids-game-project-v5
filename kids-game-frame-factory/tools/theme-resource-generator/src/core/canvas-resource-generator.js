/**
 * Canvas 资源生成器 - 使用 @napi-rs/canvas 绘制高质量游戏资源
 */

import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';
import fs from 'fs/promises';
import { join } from 'path';

export class CanvasResourceGenerator {
  constructor(options) {
    this.outputDir = options.outputDir;
    this.themeName = options.themeName;
    this.style = options.style || 'cartoon';
    this.canvasSize = 256;
  }

  /**
   * 使用 Canvas 生成玩家飞机
   */
  async generatePlayer(filename) {
    const filepath = join(this.outputDir, filename);
    
    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const canvas = createCanvas(this.canvasSize, this.canvasSize);
    const ctx = canvas.getContext('2d');

    // 清空画布（透明）
    ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

    // 根据风格选择颜色
    const colors = this.getColorsForStyle('player');

    // 绘制飞机主体（流线型）
    ctx.save();
    ctx.translate(this.canvasSize / 2, this.canvasSize / 2);

    // 机身
    this.drawFuselage(ctx, colors.primary, colors.secondary);
    
    // 机翼
    this.drawWings(ctx, colors.primary, colors.accent);
    
    // 尾翼
    this.drawTail(ctx, colors.primary);
    
    // 驾驶舱
    this.drawCockpit(ctx, colors.glass);
    
    // 引擎喷口
    this.drawEngineNozzle(ctx, colors.engine);

    ctx.restore();

    // 转换为 PNG
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(filepath, buffer);
    console.log(`  ✅ 生成图片：${filename} (Canvas)`);
  }

  /**
   * 使用 Canvas 生成敌机
   */
  async generateEnemy(filename, enemyType) {
    const filepath = join(this.outputDir, filename);
    
    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const canvas = createCanvas(this.canvasSize, this.canvasSize);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
    const colors = this.getColorsForStyle(enemyType);

    ctx.save();
    ctx.translate(this.canvasSize / 2, this.canvasSize / 2);

    // 根据类型绘制不同敌机
    if (enemyType.includes('small')) {
      this.drawSmallEnemy(ctx, colors);
    } else if (enemyType.includes('medium')) {
      this.drawMediumEnemy(ctx, colors);
    } else if (enemyType.includes('large')) {
      this.drawLargeEnemy(ctx, colors);
    }

    ctx.restore();

    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(filepath, buffer);
    console.log(`  ✅ 生成图片：${filename} (Canvas)`);
  }

  /**
   * 使用 Canvas 生成子弹
   */
  async generateBullet(filename, bulletType) {
    const filepath = join(this.outputDir, filename);
    
    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const canvas = createCanvas(this.canvasSize, this.canvasSize);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
    const isPlayer = bulletType.includes('player');
    const colors = isPlayer ? 
      { primary: '#60a5fa', glow: '#3b82f6' } : 
      { primary: '#f87171', glow: '#ef4444' };

    ctx.save();
    ctx.translate(this.canvasSize / 2, this.canvasSize / 2);

    // 子弹发光效果
    this.drawBulletWithGlow(ctx, colors, isPlayer);

    ctx.restore();

    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(filepath, buffer);
    console.log(`  ✅ 生成图片：${filename} (Canvas)`);
  }

  /**
   * 使用 Canvas 生成道具
   */
  async generatePowerup(filename, powerupType) {
    const filepath = join(this.outputDir, filename);
    
    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const canvas = createCanvas(this.canvasSize, this.canvasSize);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
    const colors = this.getColorsForStyle(powerupType);

    ctx.save();
    ctx.translate(this.canvasSize / 2, this.canvasSize / 2);

    // 绘制道具图标
    this.drawPowerupIcon(ctx, colors, powerupType);

    ctx.restore();

    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(filepath, buffer);
    console.log(`  ✅ 生成图片：${filename} (Canvas)`);
  }

  // ========== 绘图方法 ==========

  /**
   * 绘制飞机机身
   */
  drawFuselage(ctx, primaryColor, secondaryColor) {
    // 渐变填充
    const gradient = ctx.createLinearGradient(-30, 0, 30, 0);
    gradient.addColorStop(0, this.shadeColor(primaryColor, -20));
    gradient.addColorStop(0.5, primaryColor);
    gradient.addColorStop(1, this.shadeColor(primaryColor, -20));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -100);  // 机头
    ctx.bezierCurveTo(20, -60, 25, 0, 20, 60);  // 右侧
    ctx.bezierCurveTo(15, 80, -15, 80, -20, 60);  // 机尾
    ctx.bezierCurveTo(-25, 0, -20, -60, 0, -100);  // 左侧
    ctx.fill();

    // 机身线条
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * 绘制机翼
   */
  drawWings(ctx, primaryColor, accentColor) {
    const gradient = ctx.createLinearGradient(-80, 0, 80, 0);
    gradient.addColorStop(0, this.shadeColor(primaryColor, -30));
    gradient.addColorStop(0.5, primaryColor);
    gradient.addColorStop(1, this.shadeColor(primaryColor, -30));

    ctx.fillStyle = gradient;
    
    // 左翼
    ctx.beginPath();
    ctx.moveTo(-10, 20);
    ctx.lineTo(-80, 60);
    ctx.lineTo(-80, 80);
    ctx.lineTo(-10, 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右翼
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.lineTo(80, 60);
    ctx.lineTo(80, 80);
    ctx.lineTo(10, 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 翼尖装饰
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(-80, 70, 5, 0, Math.PI * 2);
    ctx.arc(80, 70, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制尾翼
   */
  drawTail(ctx, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = this.shadeColor(color, -30);
    ctx.lineWidth = 2;

    // 垂直尾翼
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.lineTo(-15, 100);
    ctx.lineTo(0, 95);
    ctx.lineTo(15, 100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 水平尾翼
    ctx.beginPath();
    ctx.moveTo(-40, 85);
    ctx.lineTo(0, 95);
    ctx.lineTo(40, 85);
    ctx.lineTo(0, 90);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 绘制驾驶舱
   */
  drawCockpit(ctx, glassColor) {
    // 舱盖
    const gradient = ctx.createRadialGradient(0, -30, 5, 0, -30, 25);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, glassColor);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, -30, 15, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 舱盖边框
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 反光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-5, -35, 5, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制引擎喷口
   */
  drawEngineNozzle(ctx, color) {
    ctx.fillStyle = color;
    
    // 左喷口
    ctx.beginPath();
    ctx.ellipse(-25, 85, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 右喷口
    ctx.beginPath();
    ctx.ellipse(25, 85, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 火焰效果（可选）
    ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(-25, 95);
    ctx.lineTo(-25, 110 + Math.random() * 10);
    ctx.lineTo(-15, 95);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(25, 95);
    ctx.lineTo(25, 110 + Math.random() * 10);
    ctx.lineTo(35, 95);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 绘制小型敌机
   */
  drawSmallEnemy(ctx, colors) {
    // 椭圆形身体
    const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(1, this.shadeColor(colors.primary, -40));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // 大眼睛
    this.drawEnemyEye(ctx, -25, -10, 20);
    this.drawEnemyEye(ctx, 25, -10, 20);

    // 小翅膀
    ctx.fillStyle = colors.secondary;
    ctx.beginPath();
    ctx.moveTo(-40, 10);
    ctx.lineTo(-70, 30);
    ctx.lineTo(-40, 40);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(70, 30);
    ctx.lineTo(40, 40);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 绘制敌机眼睛
   */
  drawEnemyEye(ctx, x, y, size) {
    // 眼白
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(x + 5, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 眼神光
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 8, y - 5, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制中型敌机
   */
  drawMediumEnemy(ctx, colors) {
    // 更复杂的形状
    const gradient = ctx.createLinearGradient(-50, -60, 50, 60);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(1, this.shadeColor(colors.primary, -30));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(40, -30);
    ctx.lineTo(60, 20);
    ctx.lineTo(40, 60);
    ctx.lineTo(-40, 60);
    ctx.lineTo(-60, 20);
    ctx.lineTo(-40, -30);
    ctx.closePath();
    ctx.fill();

    // 装甲板细节
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 武器
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.arc(-30, 40, 10, 0, Math.PI * 2);
    ctx.arc(30, 40, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制大型敌机
   */
  drawLargeEnemy(ctx, colors) {
    // 大型复杂敌机
    const gradient = ctx.createRadialGradient(0, 0, 30, 0, 0, 100);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(0.7, this.shadeColor(colors.primary, -20));
    gradient.addColorStop(1, this.shadeColor(colors.primary, -50));

    ctx.fillStyle = gradient;
    
    // 主体
    ctx.beginPath();
    ctx.ellipse(0, 0, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // 外层装甲
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 5;
    ctx.stroke();

    // 多个眼睛/传感器
    for (let i = -2; i <= 2; i++) {
      this.drawEnemyEye(ctx, i * 30, -20, 15);
    }

    // 大型武器系统
    ctx.fillStyle = '#374151';
    ctx.fillRect(-70, 40, 40, 30);
    ctx.fillRect(30, 40, 40, 30);
  }

  /**
   * 绘制带发光的子弹
   */
  drawBulletWithGlow(ctx, colors, isPlayer) {
    // 发光效果
    ctx.shadowBlur = 20;
    ctx.shadowColor = colors.glow;

    // 子弹主体
    const gradient = ctx.createLinearGradient(0, -60, 0, 60);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(0.5, this.lightenColor(colors.primary, 30));
    gradient.addColorStop(1, colors.primary);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    if (isPlayer) {
      // 玩家子弹：细长型
      ctx.ellipse(0, 0, 15, 60, 0, 0, Math.PI * 2);
    } else {
      // 敌机子弹：圆形
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
    }
    
    ctx.fill();

    // 移除阴影，绘制内部细节
    ctx.shadowBlur = 0;
    
    // 核心
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    if (isPlayer) {
      ctx.ellipse(0, 0, 8, 40, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  /**
   * 绘制道具图标
   */
  drawPowerupIcon(ctx, colors, powerupType) {
    // 外圆
    const gradient = ctx.createRadialGradient(0, 0, 30, 0, 0, 90);
    gradient.addColorStop(0, this.lightenColor(colors.primary, 20));
    gradient.addColorStop(1, colors.primary);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 90, 0, Math.PI * 2);
    ctx.fill();

    // 边框
    ctx.strokeStyle = this.shadeColor(colors.primary, 30);
    ctx.lineWidth = 6;
    ctx.stroke();

    // 字母标识
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const letter = powerupType.charAt(0).toUpperCase();
    ctx.fillText(letter, 0, 5);

    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-30, -30, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // ========== 辅助方法 ==========

  /**
   * 根据风格获取颜色
   */
  getColorsForStyle(type) {
    const styleConfigs = {
      player: {
        primary: '#4ade80',
        secondary: '#22c55e',
        accent: '#86efac',
        glass: '#0ea5e9',
        engine: '#f97316'
      },
      small: {
        primary: '#ef4444',
        secondary: '#dc2626',
        accent: '#fca5a5'
      },
      medium: {
        primary: '#f97316',
        secondary: '#ea580c',
        accent: '#fdba74'
      },
      large: {
        primary: '#dc2626',
        secondary: '#b91c1c',
        accent: '#f87171'
      },
      speed: { primary: '#3b82f6' },
      spread: { primary: '#8b5cf6' },
      shield: { primary: '#10b981' },
      life: { primary: '#ec4899' },
      bomb: { primary: '#f59e0b' }
    };

    return styleConfigs[type] || { primary: '#6b7280' };
  }

  /**
   * 调整颜色亮度
   */
  shadeColor(color, percent) {
    // 简化的颜色调整实现
    return color; // TODO: 实现完整的颜色调整
  }

  /**
   * 提亮颜色
   */
  lightenColor(color, percent) {
    return this.shadeColor(color, percent);
  }
}
