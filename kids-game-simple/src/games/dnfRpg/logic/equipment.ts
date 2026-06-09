import type { DropItem, Equipment, Player } from '../types'
import * as C from '../config'
import { getEquipmentByLevel } from '../data/equipment'

let dropIdCounter = 0

export function generateDrops(x: number, y: number, level: number, playerLevel: number): DropItem[] {
  const drops: DropItem[] = []

  // 金币掉落
  if (Math.random() < C.GOLD_DROP_CHANCE) {
    dropIdCounter++
    const goldAmount = Math.round(5 + level * 3 + Math.random() * 10)
    drops.push({
      id: dropIdCounter,
      x: x + (Math.random() - 0.5) * 30,
      y: y,
      width: 12,
      height: 12,
      vy: -3,
      type: 'gold',
      value: goldAmount,
      life: C.DROP_LIFE,
    })
  }

  // HP药水
  if (Math.random() < 0.25) {
    dropIdCounter++
    drops.push({
      id: dropIdCounter,
      x: x + (Math.random() - 0.5) * 30,
      y: y,
      width: 14,
      height: 14,
      vy: -3,
      type: 'hpPotion',
      value: C.HP_POTION_HEAL,
      life: C.DROP_LIFE,
    })
  }

  // MP药水
  if (Math.random() < 0.15) {
    dropIdCounter++
    drops.push({
      id: dropIdCounter,
      x: x + (Math.random() - 0.5) * 30,
      y: y,
      width: 14,
      height: 14,
      vy: -3,
      type: 'mpPotion',
      value: C.MP_POTION_RESTORE,
      life: C.DROP_LIFE,
    })
  }

  // 装备掉落
  if (Math.random() < 0.1) {
    dropIdCounter++
    drops.push({
      id: dropIdCounter,
      x: x + (Math.random() - 0.5) * 30,
      y: y,
      width: 16,
      height: 16,
      vy: -3,
      type: 'equipment',
      equipment: getEquipmentByLevel(playerLevel),
      life: C.DROP_LIFE,
    })
  }

  return drops
}

export function pickupDrops(drops: DropItem[], player: Player): { drops: DropItem[]; player: Player; dropsPicked: DropItem[]; goldGained: number; equipmentGained: Equipment | null } {
  const remaining: DropItem[] = []
  const picked: DropItem[] = []
  let p = { ...player }
  let goldGained = 0
  let equipmentGained: Equipment | null = null

  drops.forEach(drop => {
    const dx = drop.x - (p.x + p.width / 2)
    const dy = drop.y - (p.y + p.height / 2)
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > C.PICKUP_RANGE) {
      remaining.push(drop)
      return
    }

    picked.push(drop)
    switch (drop.type) {
      case 'gold':
        goldGained += drop.value || 0
        break
      case 'hpPotion':
        p.hp = Math.min(p.maxHp, p.hp + (drop.value || C.HP_POTION_HEAL))
        break
      case 'mpPotion':
        p.mp = Math.min(p.maxMp, p.mp + (drop.value || C.MP_POTION_RESTORE))
        break
      case 'equipment':
        if (drop.equipment) equipmentGained = drop.equipment
        break
    }
  })

  return { drops: remaining, player: p, dropsPicked: picked, goldGained, equipmentGained }
}

// 装备强化
export function enhanceEquipment(equip: Equipment): { equipment: Equipment; success: boolean } {
  if (equip.enhanceLevel >= C.ENHANCE_MAX) {
    return { equipment: equip, success: false }
  }

  const chance = C.ENHANCE_CHANCE(equip.enhanceLevel)
  const success = Math.random() < chance

  if (success) {
    return {
      equipment: { ...equip, enhanceLevel: equip.enhanceLevel + 1 },
      success: true,
    }
  }

  // 强化失败
  if (equip.enhanceLevel >= 4 && Math.random() < 0.5) {
    // 高等级强化失败可能掉级
    return {
      equipment: { ...equip, enhanceLevel: Math.max(0, equip.enhanceLevel - 1) },
      success: false,
    }
  }

  return { equipment: equip, success: false }
}

// 应用装备属性到玩家
export function applyEquipment(player: Player, equip: Equipment): Player {
  return {
    ...player,
    maxHp: player.maxHp + (equip.hpBonus || 0),
    hp: Math.min(player.hp + (equip.hpBonus || 0), player.maxHp + (equip.hpBonus || 0)),
    maxMp: player.maxMp + (equip.mpBonus || 0),
    mp: Math.min(player.mp + (equip.mpBonus || 0), player.maxMp + (equip.mpBonus || 0)),
    attackPower: player.attackPower + (equip.attackBonus || 0),
    moveSpeed: player.moveSpeed + (equip.speedBonus || 0) * 0.1,
    attackSpeed: player.attackSpeed + (equip.speedBonus || 0) * 0.05,
  }
}

// 从玩家身上移除装备（减去加成）
export function removeEquipment(player: Player, equip: Equipment): Player {
  return {
    ...player,
    maxHp: player.maxHp - (equip.hpBonus || 0),
    hp: Math.min(player.hp, player.maxHp - (equip.hpBonus || 0)),
    maxMp: player.maxMp - (equip.mpBonus || 0),
    mp: Math.min(player.mp, player.maxMp - (equip.mpBonus || 0)),
    attackPower: player.attackPower - (equip.attackBonus || 0),
    moveSpeed: player.moveSpeed - (equip.speedBonus || 0) * 0.1,
    attackSpeed: player.attackSpeed - (equip.speedBonus || 0) * 0.05,
  }
}