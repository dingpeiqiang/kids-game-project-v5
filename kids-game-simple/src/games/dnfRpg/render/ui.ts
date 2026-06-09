import type { Player, Enemy, Equipment, SkillInstance } from '../types'
import { EQUIP_QUALITY_COLORS, EQUIP_QUALITY_NAMES } from '../types'
import * as C from '../config'
import { CLASS_CONFIGS } from '../data/classes'

// ============ 主HUD - DNF手游风格 ============
export function drawUI(ctx: CanvasRenderingContext2D, player: Player, gold: number, score: number, combo: number, roomName: string): void {
  const isMobile = C.isMobileDevice()

  // 移动端：顶部横条HUD（不占用侧边面板）
  if (isMobile) {
    drawMobileTopBar(ctx, player, gold, combo)
    return
  }

  // PC端：原有左右面板布局
  drawPCPanelUI(ctx, player, gold, score, combo, roomName)
}

// ============ 移动端顶部横条HUD ============
function drawMobileTopBar(ctx: CanvasRenderingContext2D, player: Player, gold: number, combo: number): void {
  const cfg = CLASS_CONFIGS[player.classType]
  const barH = 36
  const gameX = C.LEFT_PANEL_WIDTH

  // 半透明背景
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(gameX, 0, C.CANVAS_WIDTH, barH)

  // 职业图标 + 名称
  ctx.font = '14px Arial'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFF'
  ctx.fillText(cfg ? cfg.icon : '', gameX + 8, 24)

  // HP条
  const hpX = gameX + 32
  const hpW = C.CANVAS_WIDTH * 0.28
  const hpY = 5
  const hpH = 10
  ctx.fillStyle = '#333'
  ctx.fillRect(hpX, hpY, hpW, hpH)
  const hpRatio = Math.max(0, player.hp / player.maxHp)
  ctx.fillStyle = '#FF4444'
  ctx.fillRect(hpX, hpY, hpW * hpRatio, hpH)

  // MP条
  const mpY = hpY + hpH + 3
  ctx.fillStyle = '#333'
  ctx.fillRect(hpX, mpY, hpW * 0.7, 6)
  const mpRatio = Math.max(0, player.mp / player.maxMp)
  ctx.fillStyle = '#4488FF'
  ctx.fillRect(hpX, mpY, hpW * 0.7 * mpRatio, 6)

  // 等级
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`Lv.${player.level}`, hpX + hpW + 8, 18)

  // 金币
  ctx.fillStyle = '#FFD700'
  ctx.font = '11px Arial'
  ctx.fillText(`💰${gold}`, hpX + hpW + 8, 31)

  // 生命值（爱心）
  const heartX = gameX + C.CANVAS_WIDTH - 70
  ctx.font = '11px Arial'
  ctx.textAlign = 'left'
  let hearts = ''
  for (let i = 0; i < player.lives; i++) hearts += '❤'
  ctx.fillStyle = '#FF4444'
  ctx.fillText(hearts, heartX, 23)

  // 连击
  if (combo > 1) {
    ctx.save()
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 4
    ctx.fillText(`${combo}连击!`, gameX + C.CANVAS_WIDTH / 2, barH + 16)
    ctx.restore()
  }
}

// ============ PC端面板UI ============
function drawPCPanelUI(ctx: CanvasRenderingContext2D, player: Player, gold: number, score: number, combo: number, roomName: string): void {
  // 背景面板
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(0, 0, C.TOTAL_WIDTH, 0)

  // ===== 左侧面板 =====
  ctx.fillStyle = 'rgba(0,0,0,0.8)'
  ctx.fillRect(0, 0, C.LEFT_PANEL_WIDTH, C.CANVAS_HEIGHT)

  // 职业图标
  const cfg = CLASS_CONFIGS[player.classType]
  if (cfg) {
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(cfg.icon, C.LEFT_PANEL_WIDTH / 2, 60)
    ctx.font = '10px Arial'
    ctx.fillStyle = '#FFF'
    ctx.fillText(cfg.name, C.LEFT_PANEL_WIDTH / 2, 80)
  }

  // HP条 - DNF风格红色
  const hpBarY = 100
  const hpBarH = 14
  const hpBarW = 85
  const hpX = 8
  ctx.fillStyle = '#333'
  ctx.fillRect(hpX, hpBarY, hpBarW, hpBarH)
  const hpRatio = Math.max(0, player.hp / player.maxHp)
  const hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpBarW, 0)
  hpGrad.addColorStop(0, '#FF4444')
  hpGrad.addColorStop(1, '#CC2222')
  ctx.fillStyle = hpGrad
  ctx.fillRect(hpX, hpBarY, hpBarW * hpRatio, hpBarH)
  ctx.fillStyle = '#FFF'
  ctx.font = '8px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.ceil(player.hp)}`, hpX + hpBarW / 2, hpBarY + 10)

  // 生命值(爱心)
  const livesY = hpBarY + hpBarH + 2
  ctx.font = '12px Arial'
  ctx.textAlign = 'left'
  for (let i = 0; i < C.PLAYER_MAX_LIVES; i++) {
    if (i < player.lives) {
      ctx.fillStyle = '#FF4444'
      ctx.fillText('❤', hpX + i * 16, livesY + 11)
    } else {
      ctx.fillStyle = '#444'
      ctx.fillText('♡', hpX + i * 16, livesY + 11)
    }
  }

  // MP条 - DNF风格蓝色
  const mpBarY = livesY + 18
  ctx.fillStyle = '#333'
  ctx.fillRect(hpX, mpBarY, hpBarW, hpBarH)
  const mpRatio = Math.max(0, player.mp / player.maxMp)
  const mpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpBarW, 0)
  mpGrad.addColorStop(0, '#4488FF')
  mpGrad.addColorStop(1, '#2266DD')
  ctx.fillStyle = mpGrad
  ctx.fillRect(hpX, mpBarY, hpBarW * mpRatio, hpBarH)
  ctx.fillStyle = '#FFF'
  ctx.fillText(`${Math.ceil(player.mp)}`, hpX + hpBarW / 2, mpBarY + 10)

  // 等级和经验
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`Lv.${player.level}`, C.LEFT_PANEL_WIDTH / 2, mpBarY + hpBarH + 18)

  // 经验条
  const expBarY = mpBarY + hpBarH + 22
  ctx.fillStyle = '#333'
  ctx.fillRect(hpX, expBarY, hpBarW, 5)
  const expRatio = player.exp / player.expToNext
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(hpX, expBarY, hpBarW * expRatio, 5)

  // 金币
  ctx.fillStyle = '#FFD700'
  ctx.font = '12px Arial'
  ctx.fillText(`💰${gold}`, C.LEFT_PANEL_WIDTH / 2, expBarY + 22)

  // ===== 底部技能栏 =====
  // PC端技能栏放在底部中间
  const skillBarY = C.CANVAS_HEIGHT - 70
  const skillBarStartX = C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH / 2 - 106 // 4个技能槽的中心位置
  
  // 技能栏背景
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(skillBarStartX - 10, skillBarY - 10, 232, 70)
  
  // 技能快捷键（PC端底部技能栏）
  drawSkillSlots(ctx, player.skills, skillBarStartX, skillBarY)

  // 连击显示
  if (combo > 1) {
    ctx.save()
    ctx.fillStyle = '#FFD700'
    ctx.font = `bold ${18 + Math.min(combo, 20)}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(`${combo}连击`, C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH / 2, 30)
    ctx.restore()
  }

  // 房间名
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(C.LEFT_PANEL_WIDTH, 0, C.CANVAS_WIDTH, 20)
  ctx.fillStyle = '#CCC'
  ctx.font = '11px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(roomName, C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH / 2, 14)
}

function drawSkillSlots(ctx: CanvasRenderingContext2D, skills: SkillInstance[], startX: number, startY: number = 60): void {
  const slotSize = 50
  const gap = 6

  // 快捷键提示
  const hotkeys = ['1', '2', '3', '4']

  skills.slice(0, 4).forEach((skill, i) => {
    const sx = startX + i * (slotSize + gap)
    const sy = startY
    const isOnCooldown = skill.currentCooldown > 0
    const isReady = !isOnCooldown

    // 技能槽背景（渐变效果）
    if (isReady) {
      const slotGrad = ctx.createLinearGradient(sx, sy, sx + slotSize, sy + slotSize)
      slotGrad.addColorStop(0, '#3a3a5a')
      slotGrad.addColorStop(1, '#2a2a4a')
      ctx.fillStyle = slotGrad
    } else {
      ctx.fillStyle = '#222'
    }
    ctx.fillRect(sx, sy, slotSize, slotSize)

    // 技能槽边框（发光效果）
    if (isReady) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'
      ctx.lineWidth = 2
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 8
    } else {
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 1
      ctx.shadowBlur = 0
    }
    ctx.strokeRect(sx, sy, slotSize, slotSize)
    ctx.shadowBlur = 0

    // 技能图标（更大更清晰）
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillStyle = isReady ? '#FFF' : '#666'
    ctx.fillText(skill.icon, sx + slotSize / 2, sy + 32)

    // 快捷键标签（左下角）
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(hotkeys[i] || `${i+1}`, sx + 3, sy + slotSize - 3)

    // 技能名称（底部）
    ctx.fillStyle = isReady ? '#CCC' : '#555'
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(skill.name, sx + slotSize / 2, sy + slotSize - 3)

    // MP消耗提示
    if (isReady && skill.mpCost > 0) {
      ctx.fillStyle = '#4488FF'
      ctx.font = '7px Arial'
      ctx.fillText(`${skill.mpCost}MP`, sx + slotSize / 2, sy + 12)
    }

    // 冷却覆盖层（半透明黑色 + 剩余时间）
    if (isOnCooldown) {
      // 冷却遮罩
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
      ctx.fillRect(sx, sy, slotSize, slotSize)

      // 冷却时间（大字体居中显示）
      const cdSeconds = Math.ceil(skill.currentCooldown / 1000)
      ctx.fillStyle = '#FFF'
      ctx.font = `bold ${cdSeconds > 9 ? 16 : 20}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(`${cdSeconds}s`, sx + slotSize / 2, sy + 32)

      // 冷却进度条（底部细条）
      const cdRatio = skill.currentCooldown / skill.cooldown
      ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
      ctx.fillRect(sx, sy + slotSize - 3, slotSize * cdRatio, 3)
    }
  })

  // 如果没有技能，显示提示
  if (skills.length === 0) {
    ctx.fillStyle = '#666'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('暂无技能', startX + slotSize / 2, startY + slotSize / 2)
  }
}

// ============ 物品栏UI ============
export function drawInventoryPanel(ctx: CanvasRenderingContext2D, inventory: Equipment[], equipped: { weapon: Equipment | null; armor: Equipment | null; accessory: Equipment | null }): void {
  const panelX = 150
  const panelY = 30
  const panelW = 350
  const panelH = 320

  ctx.fillStyle = 'rgba(0,0,0,0.9)'
  ctx.fillRect(panelX, panelY, panelW, panelH)
  ctx.strokeStyle = '#888'
  ctx.strokeRect(panelX, panelY, panelW, panelH)

  ctx.fillStyle = '#FFF'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('装备背包', panelX + panelW / 2, panelY + 25)

  // 已装备
  let yOff = panelY + 40
  ctx.fillStyle = '#FFD700'
  ctx.font = '12px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('已装备:', panelX + 10, yOff)
  yOff += 18

  ;(['weapon', 'armor', 'accessory'] as const).forEach(slot => {
    const equip = equipped[slot]
    ctx.fillStyle = '#888'
    ctx.font = '11px Arial'
    ctx.fillText(`${slot === 'weapon' ? '武器' : slot === 'armor' ? '防具' : '饰品'}: `, panelX + 15, yOff)
    if (equip) {
      ctx.fillStyle = EQUIP_QUALITY_COLORS[equip.quality]
      ctx.fillText(`${equip.name}+${equip.enhanceLevel}`, panelX + 60, yOff)
    } else {
      ctx.fillStyle = '#666'
      ctx.fillText('(空)', panelX + 60, yOff)
    }
    yOff += 18
  })

  // 背包装备
  yOff += 10
  ctx.fillStyle = '#FFD700'
  ctx.font = '12px Arial'
  ctx.fillText('背包:', panelX + 10, yOff)
  yOff += 18

  inventory.forEach(equip => {
    ctx.fillStyle = EQUIP_QUALITY_COLORS[equip.quality]
    ctx.font = '11px Arial'
    const slotName = equip.slot === 'weapon' ? '武器' : equip.slot === 'armor' ? '防具' : '饰品'
    ctx.fillText(`${equip.icon} [${slotName}] ${equip.name}+${equip.enhanceLevel}`, panelX + 15, yOff)
    yOff += 16
  })
}

// ============ 角色选择 ============
export function drawCharacterSelect(ctx: CanvasRenderingContext2D, now: number, hoveredIndex: number, canvasWidth?: number): void {
  const W = canvasWidth ?? C.TOTAL_WIDTH
  const H = C.CANVAS_HEIGHT

  // DNF风格深色背景
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
  bgGrad.addColorStop(0, '#0a0a1a')
  bgGrad.addColorStop(0.5, '#12122a')
  bgGrad.addColorStop(1, '#1a1a2e')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // 背景装饰 - 光晕
  ctx.fillStyle = 'rgba(255, 215, 0, 0.03)'
  ctx.beginPath()
  ctx.arc(W / 2, H * 0.35, 200, 0, Math.PI * 2)
  ctx.fill()

  // 背景粒子
  const particleCount = 30
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 137.5
    const px = (Math.sin(now * 0.0003 + seed) * 0.5 + 0.5) * W
    const py = (Math.cos(now * 0.0005 + seed) * 0.5 + 0.5) * H * 0.6
    const alpha = 0.15 + Math.sin(now * 0.002 + i) * 0.1
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`
    ctx.beginPath()
    ctx.arc(px, py, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // 标题区域
  const titleY = 50
  // 标题光晕
  ctx.fillStyle = 'rgba(255, 215, 0, 0.08)'
  ctx.font = 'bold 60px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('DUNGEON & FIGHTER', W / 2, titleY + 60)

  // 主标题
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 32px Arial'
  ctx.fillText('选择职业', W / 2, titleY)

  // 副标题
  ctx.fillStyle = '#888'
  ctx.font = '13px Arial'
  ctx.fillText('SELECT YOUR CHARACTER', W / 2, titleY + 22)

  // 分隔线
  const lineY = titleY + 35
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2 - 120, lineY)
  ctx.lineTo(W / 2 + 120, lineY)
  ctx.stroke()

  // 中间菱形装饰
  ctx.fillStyle = '#FFD700'
  ctx.save()
  ctx.translate(W / 2, lineY)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-3, -3, 6, 6)
  ctx.restore()

  // 职业卡片
  const classes = [
    { id: 'swordsman', name: '鬼剑士', title: '剑魂', desc: '近战均衡型', icon: '⚔', color: '#FF4444', unlocked: true, unlockLevel: 0,
      stats: { hp: '■■■■□', mp: '■■□□□', atk: '■■■□□', spd: '■■■□□' } },
    { id: 'fighter', name: '格斗家', title: '武神', desc: '近战爆发型', icon: '✊', color: '#FF6B00', unlocked: true, unlockLevel: 0,
      stats: { hp: '■■■□□', mp: '■■□□□', atk: '■■■■□', spd: '■■■■□' } },
    { id: 'archer', name: '弓箭手', title: '游侠', desc: '远程速射型', icon: '🏹', color: '#4CAF50', unlocked: false, unlockLevel: 3,
      stats: { hp: '■■□□□', mp: '■■■□□', atk: '■■■□□', spd: '■■■■■' } },
    { id: 'mage', name: '魔法师', title: '元素师', desc: '远程AOE型', icon: '🔮', color: '#9C27B0', unlocked: false, unlockLevel: 3,
      stats: { hp: '■■□□□', mp: '■■■■■', atk: '■■■■□', spd: '■■□□□' } },
    { id: 'gunner', name: '神枪手', title: '枪炮师', desc: '远程暴击型', icon: '🔫', color: '#2196F3', unlocked: false, unlockLevel: 3,
      stats: { hp: '■■■□□', mp: '■■■□□', atk: '■■■■□', spd: '■■■□□' } },
  ] as const

  const cols = 5
  const cardW = 110
  const cardH = 210
  const totalCardsW = cols * cardW + (cols - 1) * 12
  const startX = (W - totalCardsW) / 2
  const startY = 100

  classes.forEach((cls, i) => {
    const cx = startX + i * (cardW + 12)
    const cy = startY
    const isHovered = i === hoveredIndex
    const isLocked = !cls.unlocked
    const pulse = Math.sin(now * 0.003 + i * 0.5) * 0.5 + 0.5

    // 选中/悬停发光效果
    if (isHovered) {
      ctx.shadowColor = cls.color
      ctx.shadowBlur = 25 + pulse * 10
      ctx.fillStyle = `rgba(${hexToRgb(cls.color)}, 0.12)`
      ctx.fillRect(cx - 4, cy - 4, cardW + 8, cardH + 8)
      ctx.shadowBlur = 0
    }

    // 卡片背景
    const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + cardH)
    cardGrad.addColorStop(0, isLocked ? '#1a1a2a' : '#1e1e38')
    cardGrad.addColorStop(0.5, isLocked ? '#151525' : '#1a1a30')
    cardGrad.addColorStop(1, isLocked ? '#101020' : '#151528')
    ctx.fillStyle = cardGrad
    ctx.fillRect(cx, cy, cardW, cardH)

    // 卡片顶部色条
    ctx.fillStyle = cls.color
    ctx.fillRect(cx, cy, cardW, 3)

    // 卡片边框
    if (isHovered) {
      ctx.strokeStyle = cls.color
      ctx.lineWidth = 2
      ctx.strokeRect(cx, cy, cardW, cardH)
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1
      ctx.strokeRect(cx, cy, cardW, cardH)
    }

    // 职业图标区域
    const iconCY = cy + 55
    const iconBgGrad = ctx.createRadialGradient(cx + cardW / 2, iconCY, 5, cx + cardW / 2, iconCY, 35)
    iconBgGrad.addColorStop(0, `rgba(${hexToRgb(cls.color)}, 0.25)`)
    iconBgGrad.addColorStop(0.7, `rgba(${hexToRgb(cls.color)}, 0.05)`)
    iconBgGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = iconBgGrad
    ctx.beginPath()
    ctx.arc(cx + cardW / 2, iconCY, 35, 0, Math.PI * 2)
    ctx.fill()

    // 图标
    ctx.font = '38px Arial'
    ctx.textAlign = 'center'
    ctx.fillStyle = isLocked ? '#555' : '#FFF'
    ctx.fillText(cls.icon, cx + cardW / 2, iconCY + 12)

    // 锁定遮罩
    if (isLocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath()
      ctx.arc(cx + cardW / 2, iconCY, 35, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#888'
      ctx.font = '20px Arial'
      ctx.fillText('🔒', cx + cardW / 2, iconCY + 8)
    }

    // 职业名称
    ctx.fillStyle = isHovered ? cls.color : (isLocked ? '#666' : '#FFF')
    ctx.font = 'bold 16px Arial'
    ctx.fillText(cls.name, cx + cardW / 2, cy + 110)

    // 称号
    ctx.fillStyle = isLocked ? '#444' : 'rgba(255,255,255,0.5)'
    ctx.font = '11px Arial'
    ctx.fillText(cls.title, cx + cardW / 2, cy + 128)

    // 描述
    ctx.fillStyle = isLocked ? '#333' : cls.color
    ctx.font = '10px Arial'
    ctx.fillText(cls.desc, cx + cardW / 2, cy + 144)

    // 属性条
    if (!isLocked || isHovered) {
      const statNames = ['HP', 'MP', 'ATK', 'SPD']
      const statValues = [cls.stats.hp, cls.stats.mp, cls.stats.atk, cls.stats.spd]
      const statStartY = cy + 158
      ctx.font = '9px Arial'
      statNames.forEach((name, si) => {
        const sy = statStartY + si * 14
        ctx.fillStyle = isLocked ? '#333' : '#888'
        ctx.textAlign = 'left'
        ctx.fillText(name, cx + 8, sy)
        ctx.fillStyle = isLocked ? '#222' : cls.color
        ctx.textAlign = 'right'
        ctx.fillText(statValues[si], cx + cardW - 8, sy)
      })
    }

    // 解锁提示
    if (isLocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(cx, cy + cardH - 28, cardW, 28)
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`🔒 Lv.${cls.unlockLevel} 解锁`, cx + cardW / 2, cy + cardH - 10)
    } else if (isHovered) {
      // 可选提示
      ctx.fillStyle = cls.color
      ctx.fillRect(cx, cy + cardH - 28, cardW, 28)
      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 11px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('点击选择', cx + cardW / 2, cy + cardH - 10)
    }
  })

  // 底部提示
  const bottomY = startY + cardH + 30
  ctx.fillStyle = '#666'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('点击卡片选择职业  |  键盘 1-5 快速选择  |  鬼剑士/格斗家初始可用', W / 2, bottomY)
  ctx.fillText('其余职业达到 Lv.3 后自动解锁', W / 2, bottomY + 18)
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// ============ 游戏结束/胜利 ============
export function drawGameOver(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.8)'
  ctx.fillRect(0, 0, C.TOTAL_WIDTH, C.CANVAS_HEIGHT)

  ctx.save()
  ctx.fillStyle = '#FF4444'
  ctx.font = 'bold 36px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('任务失败', C.TOTAL_WIDTH / 2, C.CANVAS_HEIGHT / 2 - 30)
  ctx.fillStyle = '#AAA'
  ctx.font = '16px Arial'
  ctx.fillText('点击重新开始', C.TOTAL_WIDTH / 2, C.CANVAS_HEIGHT / 2 + 20)
  ctx.restore()
}

export function drawVictory(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.8)'
  ctx.fillRect(0, 0, C.TOTAL_WIDTH, C.CANVAS_HEIGHT)

  ctx.save()
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 36px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('通关成功!', C.TOTAL_WIDTH / 2, C.CANVAS_HEIGHT / 2 - 30)
  ctx.fillStyle = '#FFF'
  ctx.font = '16px Arial'
  ctx.fillText('点击返回城镇', C.TOTAL_WIDTH / 2, C.CANVAS_HEIGHT / 2 + 20)
  ctx.restore()
}

// ============ 房间清除提示 ============
export function drawRoomClear(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fillRect(0, 0, C.TOTAL_WIDTH, C.CANVAS_HEIGHT)
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('房间清除!', C.TOTAL_WIDTH / 2, C.CANVAS_HEIGHT / 2)
  ctx.restore()
}

// ============ 城镇UI ============
export function drawTownUI(ctx: CanvasRenderingContext2D, player: Player, gold: number): void {
  // 顶部HUD
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(0, 0, C.LEFT_PANEL_WIDTH, 80)

  const cfg = CLASS_CONFIGS[player.classType]
  if (cfg) {
    ctx.font = '18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(cfg.icon, C.LEFT_PANEL_WIDTH / 2, 25)
    ctx.fillStyle = '#FFF'
    ctx.font = '10px Arial'
    ctx.fillText(cfg.name, C.LEFT_PANEL_WIDTH / 2, 40)
    ctx.fillStyle = '#FFD700'
    ctx.font = '11px Arial'
    ctx.fillText(`Lv.${player.level}`, C.LEFT_PANEL_WIDTH / 2, 55)
    ctx.fillText(`💰${gold}`, C.LEFT_PANEL_WIDTH / 2, 70)
  }
}