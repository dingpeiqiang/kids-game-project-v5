import type { GameEngine } from '../../services/gameEngine'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import type { GameLifecycleContext } from '../../platform/GameLifecycle'
import { createLifecycleContext } from '../../platform/frameworkSession'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { audioService } from '../../services/audio'
import { VirtualJoystick } from '../contraRpg/joystick'
import { MARIO_CONFIG } from './config'
import { getLevel } from './levels'
import {
  bindMarioInput,
  createInputState,
  applyJoystickToInput,
  drawTouchControls,
  type MarioInput,
} from './input'
import { aabb, resolvePlayerBlocks, resolveEnemyBlocks, stompTest } from './physics'
import { drawWorld, drawHud, drawOverlay } from './render'
import type { Block, Coin, Enemy, LevelData, MarioGameState, Player, Powerup } from './types'

let activeHost: GameLifecycle | null = null
let enemyId = 0
let powerupId = 0

export function destroySuperMario(): void {
  activeHost?.destroy()
  activeHost = null
}

function cloneBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) => ({ ...b }))
}

function cloneCoins(coins: Coin[]): Coin[] {
  return coins.map((c) => ({ ...c }))
}

function spawnEnemies(level: LevelData): Enemy[] {
  return level.enemies.map((e) => ({
    ...e,
    id: ++enemyId,
    alive: true,
    shell: false,
    shellMoving: false,
    vy: 0,
  }))
}

function createPlayer(level: LevelData): Player {
  return {
    x: level.spawnX,
    y: level.spawnY,
    w: MARIO_CONFIG.PLAYER_W,
    h: MARIO_CONFIG.PLAYER_H,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    big: false,
    fire: false,
    invincible: 90,
    jumpHeld: false,
    coyote: 0,
    jumpBuffer: 0,
    anim: 0,
    dead: false,
    win: false,
  }
}

function loadLevelState(levelIndex: number, lives: number, score: number, coins: number): MarioGameState {
  const level = getLevel(levelIndex)
  return {
    levelIndex,
    lives,
    score,
    coins: coins + level.coins.length,
    timeLeft: level.timeLimit,
    cameraX: 0,
    player: createPlayer(level),
    blocks: cloneBlocks(level.blocks),
    pipes: level.pipes.map((p) => ({ ...p })),
    coinObjects: cloneCoins(level.coins),
    enemies: spawnEnemies(level),
    powerups: [],
    particles: [],
    floatTexts: [],
    phase: 'playing',
    levelCompleteTimer: 0,
    message: '',
  }
}

function spawnParticles(state: MarioGameState, x: number, y: number, color: string, n = 6) {
  for (let i = 0; i < n; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 25 + Math.random() * 10,
      color,
      size: 4 + Math.random() * 4,
    })
  }
}

function addFloat(state: MarioGameState, x: number, y: number, text: string, color = '#fff') {
  state.floatTexts.push({ x, y, text, life: 45, color })
}

const BRICK_COLOR = '#b85c38'

function bumpBlockFixed(state: MarioGameState, b: Block, engine: GameEngine) {
  if (b.kind === 'question' && !b.hit) {
    b.hit = true
    b.kind = 'used'
    const spawn = b.spawn || 'coin'
    if (spawn === 'coin') {
      state.coins += 1
      state.score += MARIO_CONFIG.COIN_SCORE
      engine.addScore(MARIO_CONFIG.COIN_SCORE, b.x, b.y)
      audioService.collect()
      addFloat(state, b.x, b.y - 10, '+100')
    } else {
      state.powerups.push({
        id: ++powerupId,
        x: b.x,
        y: b.y - 24,
        w: 20,
        h: 20,
        vx: 1.5,
        vy: 0,
        type: spawn === '1up' ? '1up' : spawn,
        collected: false,
      })
    }
  } else if (b.kind === 'brick' && state.player.big) {
    b.y += 1000
    spawnParticles(state, b.x, b.y, BRICK_COLOR)
    audioService.collect()
  }
}

function applyPowerup(state: MarioGameState, type: Powerup['type'], engine: GameEngine) {
  const p = state.player
  switch (type) {
    case 'mushroom':
      if (!p.big) {
        p.big = true
        p.h = MARIO_CONFIG.BIG_PLAYER_H
        p.y -= MARIO_CONFIG.BIG_PLAYER_H - MARIO_CONFIG.PLAYER_H
      }
      state.score += 500
      engine.addScore(500, p.x, p.y)
      break
    case 'flower':
      p.big = true
      p.fire = true
      p.h = MARIO_CONFIG.BIG_PLAYER_H
      state.score += 800
      engine.addScore(800, p.x, p.y)
      break
    case 'star':
      p.invincible = 600
      state.score += 1000
      engine.addScore(1000, p.x, p.y)
      break
    case '1up':
      state.lives += 1
      addFloat(state, p.x, p.y - 20, '1UP', '#0f0')
      break
  }
  audioService.win()
}

function hurtPlayer(state: MarioGameState, engine: GameEngine) {
  const p = state.player
  if (p.invincible > 0 || p.dead || p.win) return
  if (p.big || p.fire) {
    p.big = false
    p.fire = false
    p.h = MARIO_CONFIG.PLAYER_H
    p.invincible = 120
    audioService.lose()
    return
  }
  state.lives -= 1
  if (state.lives <= 0) {
    state.phase = 'gameOver'
    engine.setGameStats({ grade: 'lose', score: state.score, level: state.levelIndex + 1 })
    audioService.lose()
  } else {
    const level = getLevel(state.levelIndex)
    Object.assign(p, createPlayer(level))
    p.invincible = 120
    state.cameraX = Math.max(0, p.x - MARIO_CONFIG.VIEW_W * 0.3)
    audioService.lose()
  }
}

function updatePlayer(
  state: MarioGameState,
  level: LevelData,
  input: MarioInput,
  engine: GameEngine,
  dt: number,
) {
  const p = state.player
  if (p.dead || p.win || state.phase !== 'playing') return

  const speed = input.run ? MARIO_CONFIG.RUN_SPEED : MARIO_CONFIG.WALK_SPEED
  p.vx = 0
  if (input.left) {
    p.vx = -speed
    p.facing = -1
  }
  if (input.right) {
    p.vx = speed
    p.facing = 1
  }

  if (p.onGround) p.coyote = MARIO_CONFIG.COYOTE_FRAMES
  else if (p.coyote > 0) p.coyote -= 1

  if (input.jumpPressed) p.jumpBuffer = MARIO_CONFIG.JUMP_BUFFER_FRAMES
  if (input.jumpPressed) input.jumpPressed = false

  if (p.jumpBuffer > 0 && (p.onGround || p.coyote > 0)) {
    p.vy = MARIO_CONFIG.JUMP_VEL
    p.onGround = false
    p.jumpBuffer = 0
    p.coyote = 0
    audioService.collect()
  } else if (p.jumpBuffer > 0) {
    p.jumpBuffer -= 1
  }

  p.jumpHeld = input.jump
  const grav = p.jumpHeld && p.vy < 0 ? MARIO_CONFIG.JUMP_HOLD_GRAVITY : MARIO_CONFIG.GRAVITY
  const prevVy = p.vy
  p.vy += grav
  if (p.vy > MARIO_CONFIG.MAX_FALL) p.vy = MARIO_CONFIG.MAX_FALL

  resolvePlayerBlocks(p, state.blocks)

  if (prevVy < 0) {
    for (const b of state.blocks) {
      if (aabb(p, b) && p.y >= b.y + b.h - 2) {
        bumpBlockFixed(state, b, engine)
      }
    }
  }

  if (p.y > level.groundY + 120) {
    hurtPlayer(state, engine)
    if (state.phase === 'playing') {
      const lv = getLevel(state.levelIndex)
      Object.assign(p, createPlayer(lv))
    }
  }

  if (p.invincible > 0) p.invincible -= 1

  const maxCam = Math.max(0, level.width - MARIO_CONFIG.VIEW_W)
  const targetCam = Math.max(0, Math.min(maxCam, p.x - MARIO_CONFIG.VIEW_W * 0.35))
  state.cameraX += (targetCam - state.cameraX) * Math.min(1, dt * 8)

  if (p.x + p.w >= level.flagX && !p.win) {
    p.win = true
    state.phase = 'levelComplete'
    state.levelCompleteTimer = 2.5
    state.score += MARIO_CONFIG.FLAG_SCORE
    engine.addScore(MARIO_CONFIG.FLAG_SCORE, p.x, p.y)
    audioService.win()
  }

  p.anim += 1
}

function updateEnemies(state: MarioGameState, level: LevelData, engine: GameEngine) {
  const p = state.player
  for (const e of state.enemies) {
    if (!e.alive) continue
    if (e.type === 'fly') {
      e.flyPhase = (e.flyPhase ?? 0) + 0.05
      e.y = level.groundY - 22 - 60 - Math.sin(e.flyPhase) * 40
    } else if (!e.shell) {
      e.vy = e.vy ?? 0
      resolveEnemyBlocks(e, state.blocks)
    } else if (e.shellMoving) {
      e.x += e.vx
      for (const o of state.enemies) {
        if (o.id !== e.id && o.alive && aabb(e, o)) {
          o.alive = false
          state.score += MARIO_CONFIG.ENEMY_SCORE
          engine.addScore(MARIO_CONFIG.ENEMY_SCORE, o.x, o.y)
        }
      }
    }

    if (stompTest(p, e)) {
      if (e.type === 'koopa' && !e.shell) {
        e.shell = true
        e.shellMoving = false
        e.vx = 0
        e.h = 14
        p.vy = MARIO_CONFIG.STOMP_BOUNCE
      } else {
        e.alive = false
        p.vy = MARIO_CONFIG.STOMP_BOUNCE
        state.score += MARIO_CONFIG.ENEMY_SCORE
        engine.addScore(MARIO_CONFIG.ENEMY_SCORE, e.x, e.y)
        spawnParticles(state, e.x, e.y, '#9c4a00')
        audioService.collect()
      }
      continue
    }

    if (aabb(p, e) && e.alive) {
      if (e.shell && !e.shellMoving) {
        e.shellMoving = true
        e.vx = p.facing * 6
      } else if (!e.shell) {
        hurtPlayer(state, engine)
      }
    }
  }
}

function updateCoinsAndPowerups(state: MarioGameState, engine: GameEngine) {
  const p = state.player
  for (const c of state.coinObjects) {
    if (!c.collected && aabb(p, c)) {
      c.collected = true
      state.coins += 1
      state.score += MARIO_CONFIG.COIN_SCORE
      engine.addScore(MARIO_CONFIG.COIN_SCORE, c.x, c.y)
      if (state.coins >= 100) {
        state.coins = 0
        state.lives += 1
      }
      audioService.collect()
    }
  }
  for (const pu of state.powerups) {
    if (pu.collected) continue
    pu.vy = (pu.vy ?? 0) + MARIO_CONFIG.GRAVITY
    pu.x += pu.vx
    pu.y += pu.vy
    for (const b of state.blocks) {
      if (!aabb(pu, b)) continue
      if (pu.vy > 0) {
        pu.y = b.y - pu.h
        pu.vy = 0
      }
    }
    if (aabb(p, pu)) {
      pu.collected = true
      applyPowerup(state, pu.type, engine)
    }
  }
}

function updateFx(state: MarioGameState, dt: number) {
  state.particles = state.particles.filter((p) => {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.2
    p.life -= 1
    return p.life > 0
  })
  state.floatTexts = state.floatTexts.filter((t) => {
    t.y -= 0.8
    t.life -= 1
    return t.life > 0
  })
}

function updateSimulation(state: MarioGameState, level: LevelData, input: MarioInput, engine: GameEngine, dt: number) {
  if (state.phase === 'playing') {
    state.timeLeft -= dt
    if (state.timeLeft <= 0) {
      state.timeLeft = 0
      state.phase = 'timeUp'
      hurtPlayer(state, engine)
      if (state.lives <= 0) state.phase = 'gameOver'
      else state.phase = 'playing'
    }
    updatePlayer(state, level, input, engine, dt)
    updateEnemies(state, level, engine)
    updateCoinsAndPowerups(state, engine)
  } else if (state.phase === 'levelComplete') {
    state.levelCompleteTimer -= dt
    state.player.x += 2
    if (state.levelCompleteTimer <= 0) {
      if (state.levelIndex >= MARIO_CONFIG.TOTAL_LEVELS - 1) {
        state.phase = 'victory'
        engine.setScore(state.score)
        engine.setGameStats({
          grade: 'win',
          score: state.score,
          level: 5,
          stars: 3,
        })
      } else {
        const next = loadLevelState(state.levelIndex + 1, state.lives, state.score, state.coins)
        Object.assign(state, next)
      }
    }
  }
  updateFx(state, dt)
}

export async function initSuperMario(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroySuperMario()
  engine.setOrientation('portrait')

  const lifecycleCtx = createLifecycleContext('superMario', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }

  const canvas = lifecycleCtx.canvas
  canvas.width = MARIO_CONFIG.VIEW_W
  canvas.height = MARIO_CONFIG.VIEW_H

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    onEnd()
    return
  }
  ctx.imageSmoothingEnabled = false

  let state = loadLevelState(0, MARIO_CONFIG.START_LIVES, 0, 0)
  const input = createInputState()
  const keyboardActive = { left: false, right: false }

  const joystick = new VirtualJoystick({
    x: 72,
    y: MARIO_CONFIG.VIEW_H - 88,
    radius: 52,
    knobRadius: 22,
    deadZone: 0.15,
  })

  let ended = false
  let frame = 0
  let lastTs = performance.now()
  let unbind: (() => void) | null = null
  let kd: (e: KeyboardEvent) => void
  let ku: (e: KeyboardEvent) => void
  let onTap: () => void

  const finishFromOverlay = () => {
    if (ended) return
    ended = true
    engine.setScore(state.score)
    const victory = state.phase === 'victory'
    gameActions.gameOver({
      victory,
      score: state.score,
      stats: { level: state.levelIndex + 1, lives: state.lives, coins: state.coins },
    })
  }

  const onJumpTap = () => {
    audioService.collect()
  }

  activeHost = hostCanvas2D(lifecycleCtx, {
    onInit() {
      unbind = bindMarioInput(canvas, input, joystick, onJumpTap)
      const keyTrack = (e: KeyboardEvent, down: boolean) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyboardActive.left = down
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keyboardActive.right = down
      }
      kd = (e: KeyboardEvent) => keyTrack(e, true)
      ku = (e: KeyboardEvent) => keyTrack(e, false)
      window.addEventListener('keydown', kd)
      window.addEventListener('keyup', ku)
      onTap = () => {
        if (state.phase === 'gameOver' || state.phase === 'victory') {
          finishFromOverlay()
        } else if (state.phase === 'levelComplete' && state.levelCompleteTimer <= 0) {
          state.levelCompleteTimer = 0
        }
      }
      canvas.addEventListener('click', onTap)
      lastTs = performance.now()
    },
    onUpdate(dt) {
      if (ended) return
      const capped = Math.min(0.05, dt)
      frame++
      applyJoystickToInput(joystick, input, keyboardActive)
      const level = getLevel(state.levelIndex)
      updateSimulation(state, level, input, engine, capped)
      engine.setScore(state.score)
    },
    onRender() {
      const level = getLevel(state.levelIndex)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawWorld(ctx, state, level, frame)
      drawHud(ctx, state, level)
      drawTouchControls(ctx, joystick)
      if (state.phase === 'gameOver') {
        drawOverlay(ctx, '游戏结束', `得分 ${state.score}`, true)
      } else if (state.phase === 'victory') {
        drawOverlay(ctx, '通关恭喜！', `5 关全部完成 · 得分 ${state.score}`, true)
      } else if (state.phase === 'levelComplete' && state.levelCompleteTimer > 0.5) {
        drawOverlay(ctx, '关卡完成！', level.name, false)
      }
    },
    onDestroy() {
      unbind?.()
      unbind = null
      window.removeEventListener('keydown', kd!)
      window.removeEventListener('keyup', ku!)
      canvas.removeEventListener('click', onTap!)
    },
  })
}