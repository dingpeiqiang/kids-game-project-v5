import { GAME_CONFIG } from '../config'
import type { Player, Platform, Particle, Bullet } from '../types'

export function updatePlayer(
  player: Player,
  input: { left: boolean; right: boolean; jump: boolean; shoot: boolean; crouch: boolean; shootUp: boolean; shootDown: boolean },
  platforms: Platform[],
  now: number,
  canDoubleJump: boolean,
  particles: Particle[],
  bullets: Bullet[],
  rapidFireTimer: number,
  spreadShotTimer: number,
  transformTimer: number,
  analogX: number,
): { shootTriggered: boolean; meleeTriggered: boolean } {
  let shootTriggered = false
  let meleeTriggered = false

  const targetVx = analogX * player.speed * (player.isCrouching ? 0.6 : 1)
  const accel = 0.45
  const friction = 0.82

  if (Math.abs(targetVx - player.vx) > 0.3) {
    player.vx += Math.sign(targetVx - player.vx) * accel
  } else {
    player.vx = targetVx
  }

  if (analogX === 0) {
    player.vx *= friction
    if (Math.abs(player.vx) < 0.2) player.vx = 0
  }

  player.x += player.vx
  if (player.vx > 0.5) player.facingRight = true
  else if (player.vx < -0.5) player.facingRight = false

  const wantsToCrouch = input.crouch && player.isGrounded
  const wasCrouching = player.isCrouching

  if (wantsToCrouch && !player.isCrouching) {
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
  let collisionDetected = false
  let debugPlatformInfo = null
  
  for (const platform of platforms) {
    if (checkPlatformCollision(player, platform)) {
      collisionDetected = true
      debugPlatformInfo = {
        platformX: platform.x,
        platformY: platform.y,
        platformWidth: platform.width,
        platformHeight: platform.height,
        playerX: player.x,
        playerY: player.y,
        playerWidth: player.width,
        playerHeight: player.height,
        playerVy: player.vy
      }
      player.isGrounded = true
      player.vy = 0
      player.y = platform.y - player.height
      player.canDoubleJump = canDoubleJump
    }
  }
  
  // 如果玩家靠近地面但没有检测到碰撞，输出调试信息
  const groundLevel = GAME_CONFIG.CANVAS_HEIGHT - 40
  if (!player.isGrounded && player.y > groundLevel - player.height - 20 && player.y < groundLevel + 50) {
    console.log('[Player] ⚠️ 靠近地面但未检测到碰撞:', {
      playerY: player.y,
      playerHeight: player.height,
      playerBottom: player.y + player.height,
      groundLevel: groundLevel,
      playerVy: player.vy,
      platformCount: platforms.length,
      collisionDetected: collisionDetected,
      platformInfo: debugPlatformInfo
    })
  }

  if (input.jump && player.isGrounded) {
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
      playerShoot(player, bullets, rapidFireTimer, spreadShotTimer, transformTimer, input.shootUp, input.shootDown)
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

  return { shootTriggered, meleeTriggered: false }
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
  
  // 当靠近地面但碰撞失败时，输出详细信息
  if (!horizontalCheck || !verticalCheck) {
    const groundLevel = GAME_CONFIG.CANVAS_HEIGHT - 40
    if (platform.y === groundLevel && player.y > groundLevel - player.height - 30) {
      console.log('[Collision] 🚧 平台碰撞检测失败:', {
        playerLeft: playerLeft.toFixed(2),
        playerRight: playerRight.toFixed(2),
        playerBottom: playerBottom.toFixed(2),
        playerVy: player.vy.toFixed(2),
        platformLeft: platformLeft,
        platformRight: platformRight,
        platformTop: platformTop,
        platformBottom: platformBottom,
        horizontalCheck: horizontalCheck,
        verticalCheck: verticalCheck,
        condition1: playerLeft < platformRight,
        condition2: playerRight > platformLeft,
        condition3: playerBottom >= platformTop,
        condition4: playerBottom <= platformBottom + player.vy + 1
      })
    }
  }
  
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
  shootUp: boolean = false,
  shootDown: boolean = false,
) {
  const bulletSpeed = GAME_CONFIG.BULLET_SPEED
  const bulletY = player.y + player.height * 0.45
  const isTransformed = transformTimer > 0
  const damage = isTransformed ? player.attackLevel + 2 : player.attackLevel
  const bulletColor = isTransformed ? '#FFD700' : '#00E5FF'

  let baseAngle = 0
  if (shootUp) {
    baseAngle = -Math.PI / 3 // 向上30度
  } else if (shootDown) {
    baseAngle = Math.PI / 3 // 向下30度
  }

  if (spreadShotTimer > 0) {
    for (let i = -1; i <= 1; i++) {
      const spreadAngle = baseAngle + i * 0.15 * (player.facingRight ? 1 : -1)
      const direction = player.facingRight ? 1 : -1
      bullets.push({
        x: player.x + player.width / 2 - GAME_CONFIG.BULLET_WIDTH / 2,
        y: bulletY,
        vx: Math.cos(spreadAngle) * bulletSpeed * direction,
        vy: Math.sin(spreadAngle) * bulletSpeed * direction,
        width: GAME_CONFIG.BULLET_WIDTH,
        height: GAME_CONFIG.BULLET_HEIGHT,
        damage: damage,
        isPlayerBullet: true,
        color: bulletColor,
      })
    }
  } else {
    const direction = player.facingRight ? 1 : -1
    bullets.push({
      x: player.x + player.width / 2 - GAME_CONFIG.BULLET_WIDTH / 2,
      y: bulletY,
      vx: Math.cos(baseAngle) * bulletSpeed * direction,
      vy: Math.sin(baseAngle) * bulletSpeed * direction,
      width: GAME_CONFIG.BULLET_WIDTH,
      height: GAME_CONFIG.BULLET_HEIGHT,
      damage: damage,
      isPlayerBullet: true,
      color: bulletColor,
    })
  }
}