export class PowerupSystem {
  private inventory: string[] = []
  private itemCharge: Record<string, number> = {}
  private activeEffects: Record<string, number> = {} // 激活的道具效果及其剩余时间
  
  addItem(itemId: string) {
    this.itemCharge[itemId] = (this.itemCharge[itemId] || 0) + 1
  }
  
  useItem(itemId: string): boolean {
    if (!this.itemCharge[itemId] || this.itemCharge[itemId] <= 0) {
      return false
    }
    
    this.itemCharge[itemId]--
    return true
  }
  
  activateEffect(effectId: string, duration: number) {
    this.activeEffects[effectId] = Date.now() + duration
  }
  
  isEffectActive(effectId: string): boolean {
    const effectTime = this.activeEffects[effectId]
    return effectTime !== undefined && effectTime > Date.now()
  }
  
  getItemCharge(itemId: string): number {
    return this.itemCharge[itemId] || 0
  }
  
  getInventory(): string[] {
    return [...this.inventory]
  }
  
  update() {
    // 清理过期的效果
    const now = Date.now()
    for (const effectId in this.activeEffects) {
      if (this.activeEffects[effectId] <= now) {
        delete this.activeEffects[effectId]
      }
    }
  }
  
  clear() {
    this.inventory = []
    this.itemCharge = {}
    this.activeEffects = {}
  }
}
