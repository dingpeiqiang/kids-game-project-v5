/**
 * 统一道具系统管理器
 * 为所有游戏提供标准化的道具生成、激活、显示功能
 */

import { getGamePowerups, getUnlockedPowerups, getRandomPowerup } from '../data/powerups'
import { audioService } from './audio'

export interface PowerupState {
  type: string
  remaining: number // 剩余时间（秒），0表示即时生效
  config: any
}

export interface ActivePowerup {
  x: number
  y: number
  type: string
  icon: string
  color: string
  vy: number
  rotation: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export class PowerupManager {
  private gameId: string
  private activeEffects: Map<string, PowerupState> = new Map()
  private particles: Particle[] = []
  private gameTime: number = 0
  
  constructor(gameId: string) {
    this.gameId = gameId
  }
  
  /**
   * 更新游戏时间
   */
  updateGameTime(deltaTime: number) {
    this.gameTime += deltaTime
  }
  
  /**
   * 生成道具
   */
  spawnPowerup(x: number, y: number, vy: number = 1.5): ActivePowerup | null {
    const powerup = getRandomPowerup(this.gameId, this.gameTime * 1000)
    if (!powerup) return null
    
    return {
      x,
      y,
      type: powerup.id,
      icon: powerup.icon,
      color: powerup.color,
      vy,
      rotation: 0
    }
  }
  
  /**
   * 激活道具效果
   */
  activatePowerup(powerup: ActivePowerup, callback?: (type: string, config: any) => void): boolean {
    const powerups = getGamePowerups(this.gameId)
    const config = powerups.find(p => p.id === powerup.type)
    
    if (!config) return false
    
    // 播放音效
    audioService.win()
    
    // 创建粒子特效
    this.createExplosion(powerup.x, powerup.y, config.color, 25)
    
    // 激活效果
    if (config.duration > 0) {
      // 持续型道具
      const existing = this.activeEffects.get(powerup.type)
      if (existing) {
        existing.remaining += config.duration
      } else {
        this.activeEffects.set(powerup.type, {
          type: powerup.type,
          remaining: config.duration,
          config
        })
      }
    } else {
      // 即时型道具
      if (callback) {
        callback(powerup.type, config)
      }
    }
    
    return true
  }
  
  /**
   * 更新道具状态
   */
  update(deltaTime: number) {
    // 更新持续时间
    for (const [type, state] of this.activeEffects) {
      state.remaining -= deltaTime / 1000
      if (state.remaining <= 0) {
        this.activeEffects.delete(type)
      }
    }
    
    // 更新粒子
    this.particles = this.particles.filter(p => {
      p.life -= 0.025
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.2
      
      return p.life > 0
    })
  }
  
  /**
   * 创建爆炸粒子效果
   */
  createExplosion(x: number, y: number, color: string, count: number = 25) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color,
        size: 4 + Math.random() * 4
      })
    }
  }
  
  /**
   * 检查是否有某个道具效果激活
   */
  hasEffect(type: string): boolean {
    return this.activeEffects.has(type)
  }
  
  /**
   * 获取道具效果剩余时间
   */
  getEffectRemaining(type: string): number {
    return this.activeEffects.get(type)?.remaining || 0
  }
  
  /**
   * 获取所有激活的效果
   */
  getActiveEffects(): PowerupState[] {
    return Array.from(this.activeEffects.values())
  }
  
  /**
   * 获取粒子数组
   */
  getParticles(): Particle[] {
    return this.particles
  }
  
  /**
   * 清除所有效果
   */
  clearAll() {
    this.activeEffects.clear()
    this.particles = []
  }
  
  /**
   * 绘制道具
   */
  drawPowerup(ctx: CanvasRenderingContext2D, powerup: ActivePowerup) {
    const floatY = Math.sin(Date.now() * 0.005 + powerup.x) * 5
    const pulse = Math.sin(Date.now() * 0.008) * 2 + 15
    
    ctx.save()
    
    // 光晕效果
    ctx.shadowBlur = 15
    ctx.shadowColor = powerup.color
    ctx.fillStyle = powerup.color
    ctx.beginPath()
    ctx.arc(powerup.x, powerup.y + floatY, pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    
    // 白色边框
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(powerup.x, powerup.y + floatY, pulse + 2, 0, Math.PI * 2)
    ctx.stroke()
    
    // 图标
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(powerup.icon, powerup.x, powerup.y + floatY + 6)
    
    ctx.restore()
  }
  
  /**
   * 绘制粒子
   */
  drawParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
  }
  
  /**
   * 绘制UI - 激活的道具效果
   */
  drawUI(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const effects = this.getActiveEffects()
    
    effects.forEach((effect, i) => {
      ctx.fillStyle = effect.config.color
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(
        `${effect.config.icon} ${effect.config.name} ${effect.remaining.toFixed(1)}s`,
        x,
        y + i * 20
      )
    })
  }
}

// 导出单例工厂函数
export function createPowerupManager(gameId: string): PowerupManager {
  return new PowerupManager(gameId)
}
