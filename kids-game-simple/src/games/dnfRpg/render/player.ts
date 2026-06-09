import type { Player } from '../types'
import * as C from '../config'
import { CLASS_CONFIGS } from '../data/classes'

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, now: number): void {
  const sx = Math.round(player.x)
  const sy = Math.round(player.y)

  ctx.save()

  // 无敌闪烁
  if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) {
    ctx.globalAlpha = 0.4
  }

  // 受击红闪
  if (player.hitStun > 0) {
    ctx.globalCompositeOperation = 'lighter'
  }

  const cfg = CLASS_CONFIGS[player.classType]
  if (!cfg) return

  // DNF风格阴影（根据角色高度动态调整）
  const isOnGround = player.y + player.height >= C.GROUND_Y - 5
  const shadowScale = isOnGround ? 1 : 0.6
  const shadowAlpha = isOnGround ? 0.35 : 0.15
  const shadowYOffset = isOnGround ? 2 : 8
  
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`
  ctx.beginPath()
  ctx.ellipse(
    sx + player.width / 2, 
    sy + player.height + shadowYOffset, 
    player.width * 0.6 * shadowScale, 
    4 * shadowScale, 
    0, 0, Math.PI * 2
  )
  ctx.fill()

  // 冲刺残影
  if (player.dashing) {
    ctx.save()
    ctx.globalAlpha = 0.3
    drawClassBody(ctx, sx - player.vx * 0.5, sy, player, cfg)
    ctx.restore()
  }

  // 角色身体（按职业绘制）
  drawClassBody(ctx, sx, sy, player, cfg)

  // 攻击特效
  if (player.attacking) {
    drawAttackEffect(ctx, sx, sy, player, cfg, now)
  }

  // 技能特效
  if (player.usingSkill1 || player.usingSkill2) {
    drawSkillEffect(ctx, sx, sy, player, cfg, now)
  }

  ctx.restore()
}

// ============ 按职业绘制不同形象 ============
function drawClassBody(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  player: Player,
  cfg: { color: string; accentColor: string; id: string },
): void {
  const f = player.facingRight ? 1 : -1
  // 走路摆动值：-1 到 1 之间交替，静止时为 0
  const walkSwing = Math.sin(player.walkFrame * Math.PI)

  switch (cfg.id) {
    case 'swordsman':
      drawSwordsmanBody(ctx, x, y, player, cfg, walkSwing)
      break
    case 'fighter':
      drawFighterBody(ctx, x, y, player, cfg, walkSwing)
      break
    case 'archer':
      drawArcherBody(ctx, x, y, player, cfg, walkSwing)
      break
    case 'mage':
      drawMageBody(ctx, x, y, player, cfg, walkSwing)
      break
    case 'gunner':
      drawGunnerBody(ctx, x, y, player, cfg, walkSwing)
      break
    default:
      drawGenericBody(ctx, x, y, player, cfg, walkSwing)
  }
}

// 鬼剑士 - 宽肩铠甲 + 巨剑
function drawSwordsmanBody(ctx: CanvasRenderingContext2D, x: number, y: number, player: Player, cfg: { color: string; accentColor: string }, walkSwing: number): void {
  const f = player.facingRight ? 1 : -1
  const legSwing = walkSwing * 3 // 腿部前后偏移像素

  // 腿（铠甲裤）- 走路摆动
  ctx.fillStyle = '#556B7A'
  ctx.fillRect(x + 7 + legSwing, y + 30, 7, 22)
  ctx.fillRect(x + player.width - 14 - legSwing, y + 30, 7, 22)

  // 身体（宽肩铠甲）
  ctx.fillStyle = cfg.color
  ctx.fillRect(x + 2, y + 13, player.width - 4, 18)
  // 肩甲
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(x - 2, y + 12, 8, 10)
  ctx.fillRect(x + player.width - 6, y + 12, 8, 10)

  // 头部
  ctx.fillStyle = '#FFD5A0'
  ctx.fillRect(x + 6, y + 2, player.width - 12, 13)

  // 眼睛（锐利）
  ctx.fillStyle = '#222'
  const eyeX = f > 0 ? 14 : 9
  ctx.fillRect(x + eyeX, y + 7, 4, 2)

  // 红色头带/发带
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(x + 4, y + 1, player.width - 8, 4)

  // 脚（战靴）- 跟随腿摆动
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(x + 5 + legSwing, y + player.height - 4, 9, 6)
  ctx.fillRect(x + player.width - 14 - legSwing, y + player.height - 4, 9, 6)

  // 巨剑（标志性武器）
  ctx.fillStyle = '#C0C0C0'
  if (f > 0) {
    ctx.fillRect(x + player.width + 2, y + 10, 4, 32)
    ctx.fillStyle = '#E8E8E8'
    ctx.fillRect(x + player.width, y + 8, 8, 6)
    // 剑格
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(x + player.width - 2, y + 20, 10, 3)
  } else {
    ctx.fillRect(x - 6, y + 10, 4, 32)
    ctx.fillStyle = '#E8E8E8'
    ctx.fillRect(x - 8, y + 8, 8, 6)
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(x - 8, y + 20, 10, 3)
  }
}

// 格斗家 - 肌肉发达 + 绑手带
function drawFighterBody(ctx: CanvasRenderingContext2D, x: number, y: number, player: Player, cfg: { color: string; accentColor: string }, walkSwing: number): void {
  const f = player.facingRight ? 1 : -1
  const legSwing = walkSwing * 3

  // 腿（粗壮）- 走路摆动
  ctx.fillStyle = '#CD853F'
  ctx.fillRect(x + 6 + legSwing, y + 30, 9, 21)
  ctx.fillRect(x + player.width - 15 - legSwing, y + 30, 9, 21)

  // 身体（肌肉型，较宽）
  ctx.fillStyle = cfg.color
  ctx.fillRect(x + 3, y + 14, player.width - 6, 17)
  // 胸肌线条
  ctx.fillStyle = '#DAA520'
  ctx.fillRect(x + 8, y + 16, 8, 8)
  ctx.fillRect(x + player.width - 16, y + 16, 8, 8)

  // 头部（稍大，方脸）
  ctx.fillStyle = '#DEB887'
  ctx.fillRect(x + 5, y + 2, player.width - 10, 14)

  // 眼睛（坚毅）
  ctx.fillStyle = '#222'
  const eyeX = f > 0 ? 14 : 9
  ctx.fillRect(x + eyeX, y + 7, 3, 3)

  // 黑色短发
  ctx.fillStyle = '#222'
  ctx.fillRect(x + 5, y, player.width - 10, 5)

  // 脚（赤足/绑腿）- 跟随腿摆动
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(x + 6 + legSwing, y + player.height - 4, 9, 6)
  ctx.fillRect(x + player.width - 15 - legSwing, y + player.height - 4, 9, 6)

  // 绑手带（拳头武器）
  ctx.fillStyle = '#FFF'
  if (f > 0) {
    ctx.fillRect(x + player.width + 2, y + 18, 8, 8)
    ctx.fillStyle = cfg.accentColor
    ctx.fillRect(x + player.width + 2, y + 18, 8, 3)
    ctx.fillRect(x + player.width + 2, y + 23, 8, 3)
  } else {
    ctx.fillRect(x - 10, y + 18, 8, 8)
    ctx.fillStyle = cfg.accentColor
    ctx.fillRect(x - 10, y + 18, 8, 3)
    ctx.fillRect(x - 10, y + 23, 8, 3)
  }
}

// 弓箭手 - 纤细身材 + 弓
function drawArcherBody(ctx: CanvasRenderingContext2D, x: number, y: number, player: Player, cfg: { color: string; accentColor: string }, walkSwing: number): void {
  const f = player.facingRight ? 1 : -1
  const legSwing = walkSwing * 3

  // 腿（修长）- 走路摆动
  ctx.fillStyle = '#6B8E6B'
  ctx.fillRect(x + 8 + legSwing, y + 31, 5, 21)
  ctx.fillRect(x + player.width - 13 - legSwing, y + 31, 5, 21)

  // 身体（纤细）
  ctx.fillStyle = cfg.color
  ctx.fillRect(x + 6, y + 15, player.width - 12, 15)
  // 披风/斗篷
  ctx.fillStyle = cfg.accentColor
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.moveTo(x + player.width / 2, y + 15)
  ctx.lineTo(x - 2, y + 38)
  ctx.lineTo(x + player.width + 2, y + 38)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // 头部（精致）
  ctx.fillStyle = '#FFE4C4'
  ctx.fillRect(x + 7, y + 2, player.width - 14, 12)

  // 眼睛（灵动）
  ctx.fillStyle = '#228B22'
  const eyeX = f > 0 ? 15 : 10
  ctx.fillRect(x + eyeX, y + 7, 3, 2)

  // 金发/马尾
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(x + 5, y + 1, player.width - 10, 4)
  // 马尾
  if (f < 0) {
    ctx.fillRect(x - 4, y + 2, 5, 12)
  } else {
    ctx.fillRect(x + player.width - 1, y + 2, 5, 12)
  }

  // 脚（轻便靴）- 跟随腿摆动
  ctx.fillStyle = '#8B6914'
  ctx.fillRect(x + 7 + legSwing, y + player.height - 3, 7, 5)
  ctx.fillRect(x + player.width - 14 - legSwing, y + player.height - 3, 7, 5)

  // 弓（标志性武器）
  ctx.strokeStyle = '#8B4513'
  ctx.lineWidth = 2
  if (f > 0) {
    ctx.beginPath()
    ctx.arc(x + player.width + 6, y + 24, 16, -Math.PI * 0.5, Math.PI * 0.5)
    ctx.stroke()
    // 弦
    ctx.strokeStyle = '#DDD'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + player.width + 6, y + 8)
    ctx.lineTo(x + player.width + 6, y + 40)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(x - 6, y + 24, 16, Math.PI * 0.5, Math.PI * 1.5)
    ctx.stroke()
    ctx.strokeStyle = '#DDD'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - 6, y + 8)
    ctx.lineTo(x - 6, y + 40)
    ctx.stroke()
  }
}

// 魔法师 - 长袍 + 法杖
function drawMageBody(ctx: CanvasRenderingContext2D, x: number, y: number, player: Player, cfg: { color: string; accentColor: string }, walkSwing: number): void {
  const f = player.facingRight ? 1 : -1
  const legSwing = walkSwing * 2 // 长袍摆幅小一些

  // 腿（长袍下摆遮住）- 走路时下摆微微摆动
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(x + 5 + legSwing * 0.5, y + 28, player.width - 10, 26)
  // 长袍褶皱
  ctx.fillStyle = cfg.color
  ctx.fillRect(x + 4, y + 14, player.width - 8, 18)
  // 星星图案
  ctx.fillStyle = cfg.accentColor
  ctx.globalAlpha = 0.4
  ctx.font = '8px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('★', x + player.width / 2, y + 26)
  ctx.globalAlpha = 1

  // 头部（尖帽）
  ctx.fillStyle = '#FFE4C4'
  ctx.fillRect(x + 7, y + 6, player.width - 14, 11)

  // 眼睛（神秘）
  ctx.fillStyle = cfg.accentColor
  const eyeX = f > 0 ? 15 : 10
  ctx.fillRect(x + eyeX, y + 10, 3, 2)

  // 尖顶巫师帽
  ctx.fillStyle = cfg.color
  ctx.beginPath()
  ctx.moveTo(x + player.width / 2, y - 10)
  ctx.lineTo(x + 3, y + 6)
  ctx.lineTo(x + player.width - 3, y + 6)
  ctx.closePath()
  ctx.fill()
  // 帽檐装饰
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(x + 5, y + 4, player.width - 10, 3)

  // 脚（魔法靴）- 跟随腿摆动
  ctx.fillStyle = '#4B0082'
  ctx.fillRect(x + 7 + legSwing, y + player.height - 3, 7, 5)
  ctx.fillRect(x + player.width - 14 - legSwing, y + player.height - 3, 7, 5)

  // 法杖（标志性武器）
  ctx.fillStyle = '#8B4513'
  if (f > 0) {
    ctx.fillRect(x + player.width + 2, y - 4, 3, 40)
    // 法杖顶部宝石
    ctx.fillStyle = cfg.accentColor
    ctx.shadowColor = cfg.accentColor
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(x + player.width + 3.5, y - 6, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  } else {
    ctx.fillRect(x - 5, y - 4, 3, 40)
    ctx.fillStyle = cfg.accentColor
    ctx.shadowColor = cfg.accentColor
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(x - 3.5, y - 6, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

// 神枪手 - 皮夹克 + 枪械
function drawGunnerBody(ctx: CanvasRenderingContext2D, x: number, y: number, player: Player, cfg: { color: string; accentColor: string }, walkSwing: number): void {
  const f = player.facingRight ? 1 : -1
  const legSwing = walkSwing * 3

  // 腿（工装裤）- 走路摆动
  ctx.fillStyle = '#4A4A6A'
  ctx.fillRect(x + 7 + legSwing, y + 30, 7, 21)
  ctx.fillRect(x + player.width - 14 - legSwing, y + 30, 7, 21)

  // 身体（皮夹克）
  ctx.fillStyle = cfg.color
  ctx.fillRect(x + 4, y + 14, player.width - 8, 17)
  // 夹克拉链线
  ctx.fillStyle = '#333'
  ctx.fillRect(x + player.width / 2 - 1, y + 15, 2, 14)
  // 口袋
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(x + 6, y + 19, 6, 5)

  // 头部（戴护目镜）
  ctx.fillStyle = '#FFD5A0'
  ctx.fillRect(x + 6, y + 2, player.width - 12, 13)

  // 眼睛
  ctx.fillStyle = '#222'
  const eyeX = f > 0 ? 14 : 9
  ctx.fillRect(x + eyeX, y + 7, 3, 2)

  // 护目镜
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(x + 5, y + 5, player.width - 10, 4)
  ctx.fillStyle = '#87CEEB'
  ctx.globalAlpha = 0.5
  ctx.fillRect(x + 7, y + 6, player.width - 14, 2)
  ctx.globalAlpha = 1

  // 头发（短发）
  ctx.fillStyle = '#DAA520'
  ctx.fillRect(x + 6, y + 1, player.width - 12, 4)

  // 脚（军靴）- 跟随腿摆动
  ctx.fillStyle = '#333'
  ctx.fillRect(x + 6 + legSwing, y + player.height - 4, 9, 6)
  ctx.fillRect(x + player.width - 15 - legSwing, y + player.height - 4, 9, 6)

  // 双枪（标志性武器）
  ctx.fillStyle = '#444'
  if (f > 0) {
    // 主枪
    ctx.fillRect(x + player.width + 1, y + 18, 14, 6)
    ctx.fillStyle = '#222'
    ctx.fillRect(x + player.width + 13, y + 20, 4, 3)
    // 握把
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(x + player.width + 8, y + 24, 3, 6)
  } else {
    ctx.fillRect(x - 15, y + 18, 14, 6)
    ctx.fillStyle = '#222'
    ctx.fillRect(x - 15, y + 20, 4, 3)
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(x - 11, y + 24, 3, 6)
  }
}

// 默认身体（备用）
function drawGenericBody(ctx: CanvasRenderingContext2D, x: number, y: number, player: Player, cfg: { color: string; accentColor: string }, walkSwing: number): void {
  const f = player.facingRight ? 1 : -1
  const centerX = x + player.width / 2
  const legSwing = walkSwing * 3

  ctx.fillStyle = cfg.color
  ctx.fillRect(x + 4, y + 14, player.width - 8, 16)
  ctx.fillStyle = '#FFD5A0'
  ctx.fillRect(x + 6, y + 2, player.width - 12, 14)
  ctx.fillStyle = '#333'
  ctx.fillRect(x + (f > 0 ? 14 : 8), y + 7, 3, 3)
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(x + 5, y, player.width - 10, 4)
  ctx.fillStyle = '#555'
  ctx.fillRect(x + 6 + legSwing, y + 30, 6, 22)
  ctx.fillRect(x + player.width - 12 - legSwing, y + 30, 6, 22)
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(x + 5 + legSwing, y + player.height - 3, 8, 5)
  ctx.fillRect(x + player.width - 13 - legSwing, y + player.height - 3, 8, 5)
  ctx.fillStyle = '#AAA'
  if (f > 0) {
    ctx.fillRect(x + player.width, y + 18, 14, 4)
  } else {
    ctx.fillRect(x - 14, y + 18, 14, 4)
  }
}

// ============ 攻击特效 ============
function drawAttackEffect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, player: Player,
  cfg: { color: string; accentColor: string },
  now: number,
): void {
  const facing = player.facingRight ? 1 : -1
  const progress = 1 - player.attackTimer / 200
  const centerX = x + player.width / 2
  const centerY = y + player.height / 2

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  for (let layer = 0; layer < 3; layer++) {
    const offset = layer * 4
    const arcX = centerX + facing * (25 + offset + progress * 15)
    const alpha = (1 - progress) * (1 - layer * 0.25)

    ctx.globalAlpha = alpha
    ctx.strokeStyle = layer === 0 ? '#FFFFFF' : layer === 1 ? cfg.accentColor : cfg.color
    ctx.lineWidth = layer === 0 ? 4 : layer === 1 ? 3 : 2
    ctx.shadowColor = layer === 0 ? '#FFFFFF' : cfg.accentColor
    ctx.shadowBlur = 8 * alpha

    ctx.beginPath()
    ctx.arc(arcX, centerY, 22 + layer * 3, facing > 0 ? -0.6 : Math.PI - 0.6, facing > 0 ? 0.6 : Math.PI + 0.6)
    ctx.stroke()
  }

  ctx.shadowBlur = 0
  ctx.globalAlpha = 1 - progress
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(centerX + facing * (30 + progress * 15), centerY, 4, 0, Math.PI * 2)
  ctx.fill()

  const sparkCount = Math.floor((1 - progress) * 6)
  for (let i = 0; i < sparkCount; i++) {
    const angle = (i / sparkCount) * Math.PI * 0.8 - Math.PI * 0.4 + (facing > 0 ? 0 : Math.PI)
    const dist = 10 + progress * 20
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : cfg.accentColor
    ctx.globalAlpha = (1 - progress) * 0.7
    ctx.beginPath()
    ctx.arc(
      centerX + facing * 25 + Math.cos(angle) * dist,
      centerY + Math.sin(angle) * dist,
      2, 0, Math.PI * 2,
    )
    ctx.fill()
  }

  ctx.restore()
}

// ============ 技能特效 ============
function drawSkillEffect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, player: Player,
  cfg: { color: string; accentColor: string },
  now: number,
): void {
  const centerX = x + player.width / 2
  const centerY = y + player.height / 2
  const pulse = Math.sin(now / 80) * 0.3 + 0.7

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  for (let ring = 0; ring < 3; ring++) {
    const radius = 28 + ring * 8 + Math.sin(now / 120 + ring) * 4
    const alpha = (1 - ring * 0.2) * pulse

    ctx.globalAlpha = alpha
    ctx.strokeStyle = ring === 0 ? cfg.accentColor : ring === 1 ? '#FFFFFF' : cfg.color
    ctx.lineWidth = ring === 0 ? 3 : ring === 1 ? 1.5 : 2
    ctx.shadowColor = ring === 0 ? cfg.accentColor : 'transparent'
    ctx.shadowBlur = ring === 0 ? 10 : 0
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.shadowBlur = 0

  const particleCount = 8
  for (let i = 0; i < particleCount; i++) {
    const angle = (now / 300 + i * Math.PI * 2 / particleCount) % (Math.PI * 2)
    const radius = 22 + Math.sin(now / 150 + i) * 6
    const px = centerX + Math.cos(angle) * radius
    const py = centerY + Math.sin(angle) * radius

    ctx.fillStyle = cfg.accentColor
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(px, py, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const groundY = y + player.height + 2
  const groundRadius = 25 + pulse * 8
  ctx.globalAlpha = pulse * 0.4
  ctx.fillStyle = cfg.accentColor
  ctx.beginPath()
  ctx.ellipse(centerX, groundY, groundRadius, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = cfg.accentColor
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore()
}
