import { app } from '../../App'
import { audioService } from '../../services/audio'

export class PowerupSystem {
  private inventory: string[] = []
  
  // 道具图标映射
  private readonly powerupIcons: Record<string, string> = {
    'color_bomb': '💣',     // 颜色炸弹 - 消除所有同色泡泡
    'clear_row': '🧹',      // 清除行 - 消除最底下一行
    'extra_shot': '⚡',     // 额外射击 - 额外发射机会
    'multishot': '🔫',     // 三连射 - 连续发射三个泡泡
    'time_freeze': '⏸️',   // 时间冻结 - 暂停时间5秒
    'slow_motion': '🐢',   // 慢动作 - 泡泡飞行速度减慢
    'double_score': '💎'   // 双倍分数 - 8秒内分数翻倍
  }

  // 更新 HTML 道具栏
  updateHTMLPowerupBar(onUse: (powerupId: string) => void) {
    const powerups = Object.keys(this.powerupIcons).map(id => ({
      id,
      icon: this.powerupIcons[id],
      name: id
    }))
    
    if ((app as any).setupCustomPowerupBar) {
      ;(app as any).setupCustomPowerupBar('bubbleShooter', powerups, this.inventory, (powerupId: string) => {
        if (this.usePowerup(powerupId, onUse)) {
          audioService.collect()
        }
      })
    }
  }

  // 添加道具到库存
  addPowerup(type: string) {
    if (!this.inventory.includes(type)) {
      this.inventory.push(type)
      console.log('[道具] 获得道具:', type)
    }
  }

  // 使用道具
  usePowerup(type: string, onUse: (powerupId: string) => void): boolean {
    const index = this.inventory.indexOf(type)
    if (index === -1) return false
    
    this.inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    onUse(type)
    
    return true
  }

  // 获取库存
  getInventory(): string[] {
    return this.inventory
  }

  // 清空库存
  clear() {
    this.inventory = []
  }

  // 获取道具图标
  getPowerupIcon(type: string): string {
    return this.powerupIcons[type] || '❓'
  }
}
