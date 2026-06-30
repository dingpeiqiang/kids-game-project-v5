/**
 * 切饼干游戏 - 粒子效果
 */

import type { Particle } from './types'
import { PARTICLE_COLORS } from './config'

/**
 * 创建饼干碎屑粒子（解压爽快感优化版）
 * 优化：平衡视觉效果和性能，总数量约80个
 */
export function createCookieParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = []
  const EXPLOSION_COLORS = [...PARTICLE_COLORS, '#FF6B6B', '#FFD700', '#FF9F43', '#FFE66D', '#FF8C00']
  
  // 1. 超大碎片 (5个) - 显眼但减少数量
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.4
    const speed = 3 + Math.random() * 5
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      life: 1,
      color: EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
      size: 18 + Math.random() * 12,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.4
    })
  }
  
  // 2. 大碎片 (10个) - 减少数量
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 5 + Math.random() * 7
    particles.push({
      x: x + (Math.random() - 0.5) * 25,
      y: y + (Math.random() - 0.5) * 25,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      life: 1,
      color: EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
      size: 10 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.5
    })
  }
  
  // 3. 中等彩色粒子 (20个) - 减少数量
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 7 + Math.random() * 10
    particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      color: EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
      size: 5 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.6
    })
  }
  
  // 4. 小粉末 (25个) - 减少数量
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 10 + Math.random() * 14
    particles.push({
      x: x + (Math.random() - 0.5) * 35,
      y: y + (Math.random() - 0.5) * 35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      color: EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
      size: 2 + Math.random() * 3,
      rotation: 0,
      rotSpeed: 0
    })
  }
  
  // 5. 闪光粒子 (15个) - 减少数量
  const SPARKLE_COLORS = ['#FFFFFF', '#FFD700', '#FFFACD', '#FFFAF0']
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 14 + Math.random() * 18
    particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
      size: 1 + Math.random() * 2,
      rotation: 0,
      rotSpeed: 0,
      isSparkle: true
    })
  }
  
  // 6. 微尘爆炸 (15个) - 大幅减少数量
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 16 + Math.random() * 20
    particles.push({
      x: x + (Math.random() - 0.5) * 45,
      y: y + (Math.random() - 0.5) * 45,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 1,
      color: EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
      size: 0.8 + Math.random() * 1.5,
      rotation: 0,
      rotSpeed: 0
    })
  }
  
  return particles
}

/**
 * 创建持续掉落的碎屑（用于模拟饼干被切后持续掉渣）
 * 特点：向下飘落，像雪花/粉末一样，一直掉到底部
 */
export function createFallingCrumbs(x: number, y: number, count: number = 12): Particle[] {
  const particles: Particle[] = []
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 40, // 更宽的分布范围
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 1.5, // 很小的左右飘动
      vy: 1 + Math.random() * 2, // 向下的速度（更快）
      life: 1.5, // 更长的生命周期，确保能掉到底部
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: 1 + Math.random() * 2.5, // 小碎屑
      rotation: 0,
      rotSpeed: 0,
      isFalling: true // 标记为掉落粒子
    })
  }
  
  return particles
}

/**
 * 更新粒子状态（性能优化版）
 * - 更快的粒子衰减
 * - 粒子数量上限限制
 */
export function updateParticles(particles: Particle[]): void {
  const canvasHeight = 600
  const MAX_PARTICLES = 300 // 粒子数量上限
  
  // 如果超过上限，直接裁剪掉旧粒子
  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES)
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    
    // 更快的衰减速度
    if (p.isFalling) {
      const distanceToBottom = canvasHeight - p.y
      if (distanceToBottom < 100) {
        p.life = distanceToBottom / 100
      } else {
        p.life = 1
      }
    } else {
      // 更快的衰减
      let decayRate: number
      if (p.size > 8) {
        decayRate = 0.025  // 大碎片：更快消失
      } else if (p.size > 4) {
        decayRate = 0.035  // 中碎屑
      } else if (p.size > 2) {
        decayRate = 0.045  // 小粉末
      } else {
        decayRate = 0.06   // 微尘：非常快
      }
      p.life -= decayRate
    }
    
    p.x += p.vx
    p.y += p.vy
    
    // 简化重力计算
    const gravity = p.size > 4 ? 0.32 : 0.28
    p.vy += gravity
    
    // 简化空气阻力
    p.vx *= 0.975
    p.vy *= 0.975
    
    // 旋转
    if (p.rotation !== undefined && p.rotSpeed) {
      p.rotation += p.rotSpeed
      p.rotSpeed *= 0.985
    }
    
    // 更早的移除条件
    if (!p.isFalling && p.life <= 0) {
      particles.splice(i, 1)
    } else if (p.isFalling && p.y > canvasHeight + 10) {
      particles.splice(i, 1)
    } else if (!p.isFalling && p.life < 0.1) {
      // 提前移除快消失的粒子
      particles.splice(i, 1)
    }
  }
}
