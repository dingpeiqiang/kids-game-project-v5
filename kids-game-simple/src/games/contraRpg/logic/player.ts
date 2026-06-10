import { GAME_CONFIG, getDefaultPlayerSpawnY } from '../config'
import type { Player, Platform, Particle, Bullet } from '../types'

/** 将玩家脚底对齐到主地面，避免出生悬空穿地 */
export function snapPlayerToGround(player: Player, platforms: Platform[]) {
  const groundY = getDefaultPlayerSpawnY()
  player.y = groundY
  player.vy = 0
  player.isGrounded = true
  for (const platform of platforms) {
    if (
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width &&
      platform.y <= GAME_CONFIG.CANVAS_HEIGHT - 30
    ) {
      player.y = platform.y - player.height
      break
    }
  }
}

export function updatePlayer(
  player: Player,
  input: { left: boolean; right: boolean; jump: boolean; shoot: boolean; crouch: boolean; melee: boolean; shootUp: boolean; shootDown: boolean; stickX: number; stickY: number },
  platforms: Platform[],
  now: number,
  canDoubleJump: boolean,
  particles: Particle[],
  bullets: Bullet[],
  rapidFireTimer: number,
  spreadShotTimer: number,
  transformTimer: number,
  analogX: number,
  touchShootAngle: number = 0, // 触摸控制的射击角度
): { shootTriggered: boolean; meleeTriggered: boolean; shootAngle: number } {
  let shootTriggered = false
  let meleeTriggered = false
  let shootAngle = 0

  if (player.slideTimer > 0) {
    player.slideTimer -= 16
    player.isSliding = true
    player.isCrouching = false
    player.height = GAME_CONFIG.PLAYER_HEIGHT * 0.45
    const slideDir = player.facingRight ? 1 : -1
    player.vx = slideDir * GAME_CONFIG.SLIDE_SPEED
    player.vy = 0
    player.x += player.vx
    player.isGrounded = true
    for (const platform of platforms) {
      if (checkPlatformCollision(player, platform)) {
        player.y = platform.y - player.height
      }
    }
    if (player.slideTimer <= 0) {
      player.isSliding = false
      player.height = GAME_CONFIG.PLAYER_HEIGHT
      player.y -= GAME_CONFIG.PLAYER_HEIGHT * 0.45
      player.vx *= 0.3
    }
    player.x = Math.max(0, player.x)
    shootAngle = player.facingRight ? 0 : Math.PI
    return { shootTriggered: false, meleeTriggered: false, shootAngle }
  }

  player.isSliding = false

  // 遥感控制逻辑
  const stickX = input.stickX
  const stickY = input.stickY
  const stickMagnitude = Math.sqrt(stickX * stickX + stickY * stickY)
  
  // 计算遥感角度（弧度）
  let stickAngle = 0
  if (stickMagnitude > 0.1) {
    stickAngle = Math.atan2(stickY, stickX)
  }

  // 判断是否为水平移动（±20度范围内）
  const horizontalThreshold = Math.PI / 9 // 20度
  const isHorizontal = Math.abs(stickAngle) < horizontalThreshold || Math.abs(stickAngle - Math.PI) < horizontalThreshold || Math.abs(stickAngle + Math.PI) < horizontalThreshold

  // 移动控制：只有水平方向时才允许移动
  let effectiveAnalogX = analogX
  
  if (stickMagnitude > 0.1 && isHorizontal) {
    // 使用遥感的X分量作为移动输入
    effectiveAnalogX = stickX / stickMagnitude
  }

  const targetVx = effectiveAnalogX * player.speed * (player.isCrouching ? 0.6 : 1)
  const accel = 0.45
  const friction = 0.82

  if (Math.abs(targetVx - player.vx) > 0.3) {
    player.vx += Math.sign(targetVx - player.vx) * accel
  } else {
    player.vx = targetVx
  }

  if (effectiveAnalogX === 0) {
    player.vx *= friction
    if (Math.abs(player.vx) < 0.2) player.vx = 0
  }

  player.x += player.vx
  if (player.vx > 0.5) player.facingRight = true
  else if (player.vx < -0.5) player.facingRight = false

  // 确定射击角度：优先使用触摸控制的射击角度
  if (touchShootAngle !== 0) {
    // 使用触摸滑动控制的射击角度
    shootAngle = touchShootAngle
  } else if (stickMagnitude > 0.1) {
    // 使用遥感角度
    shootAngle = stickAngle
  } else {
    // 默认使用玩家面向方向
    shootAngle = player.facingRight ? 0 : Math.PI
  }

  const wantsToCrouch = input.crouch && player.isGrounded && !player.isSliding
  const wantsSlide =
  player.isGrounded &&
  input.crouch &&
  (input.left || input.right || Math.abs(effectiveAnalogX) > 0.35)

  if (wantsSlide && player.slideTimer <= 0) {
    if (input.left || effectiveAnalogX < -0.35) player.facingRight = false
    else if (input.right || effectiveAnalogX > 0.35) player.facingRight = true
    player.slideTimer = GAME_CONFIG.SLIDE_DURATION
    player.isCrouching = false
    if (player.height >= GAME_CONFIG.PLAYER_HEIGHT * 0.9) {
      player.y += GAME_CONFIG.PLAYER_HEIGHT * 0.55
      player.height = GAME_CONFIG.PLAYER_HEIGHT * 0.45
    }
    addSlideParticles(player.x + player.width / 2, player.y + player.height, particles, player.facingRight)
    return { shootTriggered: false, meleeTriggered: false, shootAngle: player.facingRight ? 0 : Math.PI }
  }

  if (wantsToCrouch && !player.isCrouching && !player.isSliding) {
    player.isCrouching = true
    player.height = GAME_CONFIG.PLAYER_HEIGHT * 0.55
    player.y += GAME_CONFIG.PLAYER_HEIGHT * 0.45
  } else if (!wantsToCrouch && player.isCrouching) {
    player.isCrouching = false
    player.y -= GAME_CONFIG.PLAYER_HEIGHT * 0.45
    player.height = GAME_CONFIG.PLAYER_HEIGHT
  }

  player.vy += GAME_CONFIG.GRAVITY
  player.y += player.vy

  player.isGrounded = false

  for (const platform of platforms) {
    if (checkPlatformCollision(player, platform)) {
      player.isGrounded = true
      player.vy = 0
      player.y = platform.y - player.height
      player.canDoubleJump = canDoubleJump
    }
  }

  if (input.jump && player.isGrounded && !player.isSliding) {
    player.isCrouching = false
    player.height = GAME_CONFIG.PLAYER_HEIGHT
    player.vy = player.jumpForce
    player.isGrounded = false
    addJumpParticles(player.x + player.width / 2, player.y + player.height, particles)
  } else if (input.jump && player.canDoubleJump && !player.isGrounded) {
    player.vy = player.jumpForce * 0.8
    player.canDoubleJump = false
    addJumpParticles(player.x + player.width / 2, player.y + player.height, particles)
  }

  player.x = Math.max(0, player.x)

  const wantsToShoot = input.shoot || input.shootUp || input.shootDown
  const timeSinceLastShotKeyUp = now - player.lastShotKeyUp

  if (!wantsToShoot && timeSinceLastShotKeyUp < 100) {
    player.consecutiveShots = 0
    player.lastShotKeyUp = now
  }

  // 限制长按射击时的最大子弹生成速率
  const maxBulletsPerSecond = 15
  const minShotInterval = 1000 / maxBulletsPerSecond

  if (now - player.lastShot > player.shootCooldown && now - player.lastShot > minShotInterval) {
    if (wantsToShoot) {
      playerShoot(player, bullets, rapidFireTimer, spreadShotTimer, transformTimer, shootAngle)
      player.lastShot = now
      shootTriggered = true
      player.consecutiveShots++

      const baseCooldown = GAME_CONFIG.SHOOT_COOLDOWN
      const rapidFireCooldown = baseCooldown * 0.6

      if (rapidFireTimer > 0) {
        player.shootCooldown = rapidFireCooldown
      } else {
        // 预热机制：连续射击会使射速略微提升，但幅度很小
        const warmupBonus = Math.min(player.consecutiveShots - 1, 3) * 10
        player.shootCooldown = Math.max(baseCooldown - warmupBonus, baseCooldown * 0.8)
      }
    } else if (timeSinceLastShotKeyUp > 500) {
      player.consecutiveShots = 0
    }
  }

  if (input.melee && now - player.lastMelee >= GAME_CONFIG.MELEE_COOLDOWN && !player.isSliding) {
    player.lastMelee = now
    meleeTriggered = true
  }

  return { shootTriggered, meleeTriggered, shootAngle }
}

export function checkPlatformCollision(player: Player, platform: Platform): boolean {
  const playerLeft = player.x
  const playerRight = player.x + player.width
  const playerBottom = player.y + player.height
  
  const platformLeft = platform.x
  const platformRight = platform.x + platform.width
  const platformTop = platform.y
  const platformBottom = platform.y + platform.height
  
  const horizontalCheck = playerLeft < platformRight && playerRight > platformLeft
  const verticalCheck = playerBottom >= platformTop && playerBottom <= platformBottom + player.vy + 1

  return horizontalCheck && verticalCheck
}

export function addJumpParticles(x: number, y: number, particles: Particle[]) {
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.4
    const speed = Math.random() * 2 + 1
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color: '#FFD700',
      size: Math.random() * 3 + 1,
    })
  }
}

export function addSlideParticles(x: number, y: number, particles: Particle[], facingRight: boolean) {
  for (let i = 0; i < 4; i++) {
    const angle = (facingRight ? Math.PI : 0) + (Math.random() - 0.5) * Math.PI * 0.3
    const speed = Math.random() * 3 + 1
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 1,
      maxLife: 1,
      color: '#88CCFF',
      size: Math.random() * 2 + 1,
    })
  }
}

export function playerShoot(
  player: Player,
  bullets: Bullet[],
  rapidFireTimer: number,
  spreadShotTimer: number,
  transformTimer: number = 0,
  shootAngle: number = 0,
) {
  const bulletSpeed = GAME_CONFIG.BULLET_SPEED
  const bulletY = player.y + player.height * 0.45
  const isTransformed = transformTimer > 0
  const damage = isTransformed ? player.attackLevel + 2 : player.attackLevel
  const bulletColor = isTransformed ? '#FFD700' : '#00E5FF'

  // 使用遥感角度作为射击角度
  let baseAngle = shootAngle

  if (spreadShotTimer > 0) {
    for (let i = -1; i <= 1; i++) {
      const spreadAngle = baseAngle + i * 0.15
      bullets.push({
        x: player.x + player.width / 2 - GAME_CONFIG.BULLET_WIDTH / 2,
        y: bulletY,
        vx: Math.cos(spreadAngle) * bulletSpeed,
        vy: Math.sin(spreadAngle) * bulletSpeed,
        width: GAME_CONFIG.BULLET_WIDTH,
        height: GAME_CONFIG.BULLET_HEIGHT,
        damage: damage,
        isPlayerBullet: true,
        color: bulletColor,
      })
    }
  } else {
    bullets.push({
      x: player.x + player.width / 2 - GAME_CONFIG.BULLET_WIDTH / 2,
      y: bulletY,
      vx: Math.cos(baseAngle) * bulletSpeed,
      vy: Math.sin(baseAngle) * bulletSpeed,
      width: GAME_CONFIG.BULLET_WIDTH,
      height: GAME_CONFIG.BULLET_HEIGHT,
      damage: damage,
      isPlayerBullet: true,
      color: bulletColor,
    })
  }
}