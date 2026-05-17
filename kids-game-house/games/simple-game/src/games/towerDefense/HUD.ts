import type { Tower, TowerType } from './types'
import { W, H, HUD_H, GRID, CELL, PATH_COLOR, TOWER_TYPES } from './config'

export function drawBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0a0a1a')
  grad.addColorStop(0.5, '#0d1b2a')
  grad.addColorStop(1, '#1a1a2e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath()
    ctx.moveTo(i * CELL, HUD_H)
    ctx.lineTo(i * CELL, HUD_H + GRID * CELL)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * CELL + HUD_H)
    ctx.lineTo(GRID * CELL, i * CELL + HUD_H)
    ctx.stroke()
  }
}

export function drawHUD(ctx: CanvasRenderingContext2D, gold: number, lives: number, level: number, maxLevels: number, levelName: string, combo: number, maxCombo: number, specialSkillCharge: number, showSpecialSkillButton: boolean, selectedTowerType: number, highestLevel: number) {
  ctx.fillStyle = 'rgba(10,10,26,0.92)'
  ctx.fillRect(0, 0, W, HUD_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, HUD_H)
  ctx.lineTo(W, HUD_H)
  ctx.stroke()

  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFD700'
  ctx.fillText(`💰 ${gold}`, 10, 20)

  ctx.fillStyle = lives > 5 ? '#2ECC71' : '#E74C3C'
  ctx.fillText(`❤️ ${lives}`, 10, 40)

  ctx.fillStyle = '#ddd'
  ctx.textAlign = 'center'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText(`关卡 ${level + 1}/${maxLevels}`, W / 2, 20)

  ctx.font = '11px sans-serif'
  ctx.fillStyle = '#00E5FF'
  ctx.fillText(`${levelName}`, W / 2, 38)

  if (highestLevel > 0) {
    ctx.font = '10px sans-serif'
    ctx.fillStyle = '#FFD700'
    ctx.fillText(`最高 ${highestLevel + 1}`, W / 2, 52)
  }

  if (combo >= 2) {
    const comboColor = combo >= 15 ? '#FF4757' : combo >= 10 ? '#FF6B6B' : combo >= 5 ? '#FFA502' : '#FFD700'
    ctx.fillStyle = comboColor
    ctx.font = `bold ${Math.min(14 + combo, 24)}px sans-serif`
    ctx.fillText(`${combo}x`, W / 2 - 50, 45)
    ctx.font = '12px sans-serif'
    ctx.fillText('连击', W / 2 - 25, 45)

    const barWidth = 80
    const barHeight = 4
    const barX = W / 2 - 85
    const barY = 52
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(barX, barY, barWidth, barHeight)
    ctx.fillStyle = comboColor
    ctx.fillRect(barX, barY, barWidth * Math.min(combo / 20, 1), barHeight)
  }

  if (showSpecialSkillButton || specialSkillCharge > 0) {
    const skillBtnX = W - 60
    const skillBtnY = HUD_H - 50
    const skillBtnSize = 40

    ctx.fillStyle = specialSkillCharge >= 80 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    ctx.strokeStyle = specialSkillCharge >= 80 ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(skillBtnX, skillBtnY, skillBtnSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = specialSkillCharge >= 80 ? '#FFD700' : '#AAA'
    ctx.fillText('💥', skillBtnX, skillBtnY + 7)

    ctx.font = '10px sans-serif'
    ctx.fillStyle = specialSkillCharge >= 80 ? '#FFF' : '#888'
    ctx.fillText(specialSkillCharge >= 80 ? '点击释放' : `${Math.floor(specialSkillCharge / 80 * 100)}%`, skillBtnX, skillBtnY + 25)

    const barWidth = 30
    const barHeight = 3
    const barX = skillBtnX - barWidth / 2
    const barY = skillBtnY + 30
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(barX, barY, barWidth, barHeight)
    ctx.fillStyle = specialSkillCharge >= 80 ? '#FFD700' : '#00E5FF'
    ctx.fillRect(barX, barY, barWidth * (specialSkillCharge / 80), barHeight)
  }

  const startX = W - TOWER_TYPES.length * 55 - 10
  TOWER_TYPES.forEach((t, i) => {
    const bx = startX + i * 55
    const selected = i === selectedTowerType
    const affordable = gold >= t.cost

    ctx.fillStyle = selected ? t.color + '33' : 'rgba(255,255,255,0.06)'
    ctx.strokeStyle = selected ? t.color : 'rgba(255,255,255,0.15)'
    ctx.lineWidth = selected ? 2 : 1
    ctx.beginPath()
    ctx.moveTo(bx + 6, 6)
    ctx.lineTo(bx + 42, 6)
    ctx.lineTo(bx + 42, 48)
    ctx.lineTo(bx + 6, 48)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.font = '18px sans-serif'
    ctx.textAlign = 'center'
    ctx.globalAlpha = affordable ? 1 : 0.4
    ctx.fillText(t.icon, bx + 24, 28)

    ctx.font = '9px sans-serif'
    ctx.fillStyle = affordable ? '#ccc' : '#666'
    ctx.fillText(t.name, bx + 24, 42)
    ctx.fillStyle = affordable ? '#FFD700' : '#666'
    ctx.fillText(`${t.cost}`, bx + 24, 52)
    ctx.globalAlpha = 1
  })
}

export function drawGameOver(ctx: CanvasRenderingContext2D, score: number, level: number, maxCombo: number, isVictory: boolean = false) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(0, H / 2 - 80, W, 160)
  
  if (isVictory) {
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 15
    ctx.fillText('🎉 胜利! 🎉', W / 2, H / 2 - 40)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#00E5FF'
    ctx.font = '18px sans-serif'
    ctx.fillText('恭喜通关所有关卡!', W / 2, H / 2 - 10)
  } else {
    ctx.fillStyle = '#FF6B6B'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#FF6B6B'
    ctx.shadowBlur = 10
    ctx.fillText('💀 游戏结束', W / 2, H / 2 - 40)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
    ctx.font = '18px sans-serif'
    ctx.fillText('基地被敌人突破了', W / 2, H / 2 - 10)
  }
  
  ctx.fillStyle = '#FFD700'
  ctx.fillText(`最终得分 ${score}`, W / 2, H / 2 + 20)
  ctx.fillStyle = '#fff'
  ctx.fillText(`到达关卡: ${level + 1}`, W / 2, H / 2 + 45)
  ctx.fillText(`最高连击 ${maxCombo}x`, W / 2, H / 2 + 65)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '14px sans-serif'
  ctx.fillText('点击重新开始', W / 2, H / 2 + 90)
}
