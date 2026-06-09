import type { SkillInstance } from '../types'
import { CLASS_CONFIGS } from './classes'

// 根据职业和等级创建技能实例
export function createSkillsForClass(classType: string, level: number): SkillInstance[] {
  const config = CLASS_CONFIGS[classType]
  if (!config) return []

  return config.skills
    .filter(s => level >= s.unlockLevel)
    .map(s => ({
      id: s.id,
      name: s.name,
      level: 1,
      maxLevel: s.maxLevel,
      cooldown: s.baseCooldown,
      currentCooldown: 0,
      mpCost: s.baseMpCost,
      damage: s.baseDamage,
      range: s.baseRange,
      knockback: s.baseKnockback,
      launchHeight: s.launchHeight,
      aoeRadius: s.aoeRadius,
      duration: s.duration,
      spCost: s.spCost,
      description: s.description,
      icon: s.icon,
      unlockLevel: s.unlockLevel,
    }))
}

// 技能升级
export function upgradeSkill(skill: SkillInstance, skillDef: { damagePerLevel: number; rangePerLevel: number; cooldownPerLevel: number }): SkillInstance {
  if (skill.level >= skill.maxLevel) return skill
  const newLevel = skill.level + 1
  return {
    ...skill,
    level: newLevel,
    damage: skill.damage + skillDef.damagePerLevel,
    range: skill.range + skillDef.rangePerLevel,
    cooldown: Math.max(500, skill.cooldown + skillDef.cooldownPerLevel),
  }
}

// 计算技能伤害（考虑等级加成）
export function calcSkillDamage(baseDamage: number, skillLevel: number, playerAttack: number): number {
  const levelMult = 1 + (skillLevel - 1) * 0.15
  return Math.round((baseDamage + playerAttack * 0.5) * levelMult)
}

// 技能冷却缩减（每秒）
export function tickSkillCooldowns(skills: SkillInstance[], dt: number): SkillInstance[] {
  return skills.map(s => ({
    ...s,
    currentCooldown: Math.max(0, s.currentCooldown - dt),
  }))
}