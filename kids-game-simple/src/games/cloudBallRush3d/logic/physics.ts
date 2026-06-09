import { GAME_CONFIG } from '../config'
import type { BallState, GameState, InputSnapshot, TrackSegment } from '../types'

function groundYAt(segments: TrackSegment[], x: number, z: number): number | null {
  let best: number | null = null
  for (const s of segments) {
    if (Math.abs(x - s.x) <= s.halfW && Math.abs(z - s.z) <= s.halfD) {
      if (best == null || s.y > best) best = s.y
    }
  }
  return best
}

function onIce(segments: TrackSegment[], x: number, z: number): boolean {
  for (const s of segments) {
    if (s.ice && Math.abs(x - s.x) <= s.halfW && Math.abs(z - s.z) <= s.halfD) return true
  }
  return false
}

export function tickBallPhysics(
  state: GameState,
  input: InputSnapshot,
  dt: number,
  timeSec: number,
): void {
  const { ball, level } = state
  const r = GAME_CONFIG.ballRadius

  let ax = input.moveX
  let az = input.moveZ
  const len = Math.hypot(ax, az)
  if (len > 1) {
    ax /= len
    az /= len
  }

  const accel = GAME_CONFIG.baseAccel * (ball.speedBoostT > 0 ? 1.35 : 1)
  const control = ball.onGround ? 1 : GAME_CONFIG.airControl

  ball.vx += ax * accel * control * dt
  ball.vz += az * accel * control * dt

  let maxSp = GAME_CONFIG.maxSpeed * (ball.speedBoostT > 0 ? 1.45 : 1)
  if (ball.shieldT <= 0) {
    for (const z of level.slowZones) {
      if (
        Math.abs(ball.x - z.x) <= z.halfW + r &&
        Math.abs(ball.z - z.z) <= z.halfD + r
      ) {
        maxSp *= 0.55
      }
    }
  }

  const sp = Math.hypot(ball.vx, ball.vz)
  if (sp > maxSp) {
    ball.vx = (ball.vx / sp) * maxSp
    ball.vz = (ball.vz / sp) * maxSp
  }

  const ice = onIce(level.segments, ball.x, ball.z)
  const fric = ice ? 0.985 : GAME_CONFIG.friction
  if (ball.onGround) {
    ball.vx *= fric
    ball.vz *= fric
  }

  if (input.jump && ball.onGround) {
    ball.vy = GAME_CONFIG.jumpImpulse
    ball.onGround = false
  }

  ball.vy -= GAME_CONFIG.gravity * dt
  ball.x += ball.vx * dt
  ball.z += ball.vz * dt
  ball.y += ball.vy * dt

  for (const pad of level.bouncePads) {
    if (
      Math.abs(ball.x - pad.x) <= pad.halfW + r &&
      Math.abs(ball.z - pad.z) <= pad.halfD + r &&
      ball.y <= r + 0.15 &&
      ball.vy <= 0
    ) {
      ball.vy = pad.impulse
      ball.onGround = false
    }
  }

  for (const b of level.barriers) {
    const ox = b.axis === 'x' ? Math.sin(timeSec * b.speed + b.phase) * b.amp : 0
    const oz = b.axis === 'z' ? Math.sin(timeSec * b.speed + b.phase) * b.amp : 0
    const bx = b.x + ox
    const bz = b.z + oz
    if (
      Math.abs(ball.x - bx) <= b.halfW + r &&
      Math.abs(ball.z - bz) <= b.halfD + r
    ) {
      const pushX = ball.x - bx
      const pushZ = ball.z - bz
      const pl = Math.hypot(pushX, pushZ) || 1
      ball.vx += (pushX / pl) * 8 * dt
      ball.vz += (pushZ / pl) * 8 * dt
    }
  }

  const gy = groundYAt(level.segments, ball.x, ball.z)
  if (gy != null) {
    const targetY = gy + r
    if (ball.y <= targetY) {
      ball.y = targetY
      ball.vy = 0
      ball.onGround = true
    }
  } else {
    ball.onGround = false
  }

  if (ball.y < GAME_CONFIG.fallY) {
    state.phase = 'fallen'
    state.falls += 1
    state.flawlessRun = false
  }

  if (ball.shieldT > 0) ball.shieldT -= dt
  if (ball.speedBoostT > 0) ball.speedBoostT -= dt
  if (ball.guideT > 0) ball.guideT -= dt
}