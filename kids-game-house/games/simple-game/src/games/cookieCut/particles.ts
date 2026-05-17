/**
 * 切饼干游戏 - 粒子效果
 */

import type { Particle } from './types'
import { PARTICLE_COLORS } from './config'

/**
 * 创建饼干碎屑粒子（性能优化版）
 * 包含：大碎片、中碎屑、小粉末、微尘四种类型，总数量控制在60个以内
 */
export function createCookieParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = []
  
  // 1. 大碎片 (5个) - 显眼的大碎片，慢速、大尺寸、长生命周期
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.3
    const speed = 2 + Math.random() * 3
    particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      life: 1,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: 12 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2
    })
  }
  
  // 2. 中等碎屑 (12个) - 中速、中等尺寸
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 4 + Math.random() * 5
    particles.push({
      x: x + (Math.random() - 0.5) * 18,
      y: y + (Math.random() - 0.5) * 18,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: 4 + Math.random() * 3,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3
    })
  }
  
  // 3. 小粉末 (20个) - 快速、小尺寸
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 6 + Math.random() * 9
    particles.push({
      x: x + (Math.random() - 0.5) * 22,
      y: y + (Math.random() - 0.5) * 22,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: 1.5 + Math.random() * 2,
      rotation: 0,
      rotSpeed: 0
    })
  }
  
  // 4. 微尘/面包屑 (15个) - 超快、极小
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 10 + Math.random() * 12
    particles.push({
      x: x + (Math.random() - 0.5) * 25,
      y: y + (Math.random() - 0.5) * 25,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 1,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: 0.8 + Math.random() * 1.2,
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
 * 更新粒子状态（支持旋转和更真实的物理）
 */
export function updateParticles(particles: Particle[]): void {
  const canvasHeight = 600 // 画布高度
  
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    
    // 对于掉落粒子，使用特殊的生命周期管理
    if (p.isFalling) {
      // 掉落粒子不随时间衰减，而是根据位置
      // 只有当接近底部时才开始淡出
      const distanceToBottom = canvasHeight - p.y
      if (distanceToBottom < 100) {
        // 距离底部100像素内开始淡出
        p.life = distanceToBottom / 100
      } else {
        p.life = 1 // 保持完全不透明
      }
    } else {
      // 普通粒子根据大小调整衰减速度
      let decayRate: number
      if (p.size > 8) {
        decayRate = 0.012  // 大碎片：很慢
      } else if (p.size > 4) {
        decayRate = 0.018  // 中碎屑：中等
      } else if (p.size > 2) {
        decayRate = 0.025  // 小粉末：较快
      } else {
        decayRate = 0.035  // 微尘：很快
      }
      p.life -= decayRate
    }
    
    p.x += p.vx
    p.y += p.vy
    
    // 增强的重力效果（不同大小的粒子受重力影响不同）
    const gravity = p.size > 6 ? 0.35 : (p.size > 3 ? 0.3 : 0.25)
    p.vy += gravity
    
    // 空气阻力（微尘阻力更大，飘得更久）
    const drag = p.size < 2 ? 0.96 : 0.98
    p.vx *= drag
    p.vy *= drag
    
    // 旋转（只有大碎片和中碎屑旋转）
    if (p.rotation !== undefined && p.rotSpeed) {
      p.rotation += p.rotSpeed
      // 旋转也会逐渐减慢
      p.rotSpeed *= 0.99
    }
    
    // 移除条件：
    // 1. 普通粒子：life <= 0
    // 2. 掉落粒子：超出底部边界
    if (!p.isFalling && p.life <= 0) {
      particles.splice(i, 1)
    } else if (p.isFalling && p.y > canvasHeight + 20) {
      // 掉落粒子掉出底部后才移除
      particles.splice(i, 1)
    }
  }
}
