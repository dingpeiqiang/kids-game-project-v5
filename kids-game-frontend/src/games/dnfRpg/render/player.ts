import type { Player } from '../types'
import * as C from '../config'
import { CLASS_CONFIGS } from '../data/classes'
import {
  drawDnfSlash,
  drawDnfSkillAura,
  slashStyleForAttack,
  getBattlePoseOffset,
  getActiveSkillSlot,
} from './dnf-combat-vfx'

const ATTACK_ANIM_MS = 280

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, now: number): void {
  const pose = getBattlePoseOffset(player)
  const sx = Math.round(player.x)
  const sy = Math.round(player.y + pose.offsetY)

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
    drawClassBody(ctx, sx - player.vx * 0.5, sy, player, cfg, 0)
    ctx.restore()
  }

  // 战斗姿态倾斜（DNF 重心）
  const pivotX = sx + player.width / 2
  const pivotY = sy + player.height * 0.55
  ctx.translate(pivotX, pivotY)
  ctx.rotate(pose.lean * (player.facingRight ? 1 : -1))
  ctx.translate(-pivotX, -pivotY)

  drawClassBody(ctx, sx, sy, player, cfg, pose.armRaise)

  const facing = player.facingRight ? 1 : -1
  const cx = sx + player.width / 2
  const cy = sy + player.height / 2

  if (player.attacking && player.attackTimer > 0) {
    const progress = 1 - player.attackTimer / ATTACK_ANIM_MS
    const style = slashStyleForAttack(player.classType, player.attackStep)
    drawDnfSlash(ctx, cx, cy, facing, progress, player.classType, style)
  }

  const skillSlot = getActiveSkillSlot(player)
  if (skillSlot >= 0 && player.skillTimer > 0) {
    const maxDur = player.skills[skillSlot]?.duration ?? 500
    const skillProgress = 1 - player.skillTimer / maxDur
    drawDnfSkillAura(ctx, cx, cy, player.classType, skillSlot, skillProgress, facing)
  }

  ctx.restore()
}

// ============ 按职业绘制不同形象 ============
function drawClassBody(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  player: Player,
  cfg: { color: string; accentColor: string; id: string },
  armRaise: number,
): void {
  const walkSwing = Math.sin(player.walkFrame * Math.PI)

  switch (cfg.id) {
    case 'swordsman':
      drawSwordsmanBody(ctx, x, y, player, cfg, walkSwing, armRaise)
      break
    case 'fighter':
      drawFighterBody(ctx, x, y, player, cfg, walkSwing, armRaise)
      break
    case 'archer':
      drawArcherBody(ctx, x, y, player, cfg, walkSwing, armRaise)
      break
    case 'mage':
      drawMageBody(ctx, x, y, player, cfg, walkSwing, armRaise)
      break
    case 'gunner':
      drawGunnerBody(ctx, x, y, player, cfg, walkSwing, armRaise)
      break
    default:
      drawGenericBody(ctx, x, y, player, cfg, walkSwing)
  }
}

// 鬼剑士 - 宽肩铠甲 + 巨剑
function drawSwordsmanBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  cfg: { color: string; accentColor: string },
  walkSwing: number,
  armRaise: number,
): void {
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

  // 巨剑（攻击时上举/前挥）
  const swordLift = armRaise + (player.attacking ? player.attackStep * 4 : 0)
  ctx.save()
  const handX = f > 0 ? x + player.width - 4 : x + 4
  const handY = y + 22 - swordLift
  ctx.translate(handX, handY)
  ctx.rotate(f * (-0.35 - (player.attacking ? 0.5 + player.attackStep * 0.15 : 0)))
  ctx.fillStyle = '#C0C0C0'
  ctx.fillRect(0, -28, 5, 34)
  ctx.fillStyle = '#E8E8E8'
  ctx.fillRect(-2, -30, 9, 7)
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(-3, -8, 11, 4)
  if (player.attacking && player.attackStep >= 2) {
    ctx.globalAlpha = 0.5
    ctx.fillStyle = cfg.accentColor
    ctx.fillRect(2, -32, 3, 30)
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

// 格斗家 - 肌肉发达 + 绑手带
function drawFighterBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  cfg: { color: string; accentColor: string },
  walkSwing: number,
  armRaise: number,
): void {
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

  const punchY = y + 18 - armRaise * 0.6 + (player.attacking && player.attackStep >= 2 ? -6 : 0)
  const punchX = f > 0 ? x + player.width + 2 + (player.attacking ? 6 + player.attackStep * 3 : 0) : x - 10 - (player.attacking ? 6 + player.attackStep * 3 : 0)
  ctx.fillStyle = '#FFF'
  ctx.fillRect(punchX, punchY, 10, 9)
  ctx.fillStyle = cfg.accentColor
  ctx.fillRect(punchX, punchY, 10, 3)
  ctx.fillRect(punchX, punchY + 5, 10, 3)
}

// 弓箭手 - 纤细身材 + 弓
function drawArcherBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  cfg: { color: string; accentColor: string },
  walkSwing: number,
  armRaise: number,
): void {
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

  const bowCx = f > 0 ? x + player.width + 6 : x - 6
  const bowCy = y + 24 - armRaise * 0.3
  const pull = player.attacking ? 10 + player.attackStep * 2 : 0
  ctx.strokeStyle = '#8B4513'
  ctx.lineWidth = 2
  ctx.beginPath()
  if (f > 0) {
    ctx.arc(bowCx, bowCy, 16, -Math.PI * 0.5, Math.PI * 0.5)
  } else {
    ctx.arc(bowCx, bowCy, 16, Math.PI * 0.5, Math.PI * 1.5)
  }
  ctx.stroke()
  ctx.strokeStyle = '#DDD'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(bowCx - f * pull, bowCy - 16)
  ctx.lineTo(bowCx - f * pull, bowCy + 16)
  ctx.stroke()
  if (player.attacking) {
    ctx.strokeStyle = '#7CFC00'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(bowCx - f * pull, bowCy)
    ctx.lineTo(bowCx + f * 35, bowCy)
    ctx.stroke()
  }
}

// 魔法师 - 长袍 + 法杖
function drawMageBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  cfg: { color: string; accentColor: string },
  walkSwing: number,
  armRaise: number,
): void {
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

  const staffX = f > 0 ? x + player.width + 2 : x - 5
  const staffTop = y - 4 - armRaise
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(staffX, staffTop, 3, 40 + armRaise * 0.2)
  ctx.fillStyle = cfg.accentColor
  const glow = player.attacking || player.usingSkill1 || player.usingSkill2 ? 14 : 6
  ctx.shadowColor = cfg.accentColor
  ctx.shadowBlur = glow
  ctx.beginPath()
  ctx.arc(staffX + 1.5, staffTop - 2, 5 + (player.attacking ? 2 : 0), 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

// 神枪手 - 皮夹克 + 枪械
function drawGunnerBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  cfg: { color: string; accentColor: string },
  walkSwing: number,
  armRaise: number,
): void {
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

  const gunY = y + 18 - armRaise * 0.4
  const gunExtend = player.attacking ? 8 : 0
  ctx.fillStyle = '#444'
  if (f > 0) {
    ctx.fillRect(x + player.width + 1 + gunExtend, gunY, 14 + gunExtend, 6)
    ctx.fillStyle = '#222'
    ctx.fillRect(x + player.width + 13 + gunExtend * 2, gunY + 2, 4, 3)
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(x + player.width + 8 + gunExtend, gunY + 6, 3, 6)
  } else {
    ctx.fillRect(x - 15 - gunExtend, gunY, 14 + gunExtend, 6)
    ctx.fillStyle = '#222'
    ctx.fillRect(x - 15 - gunExtend, gunY + 2, 4, 3)
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(x - 11 - gunExtend, gunY + 6, 3, 6)
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
