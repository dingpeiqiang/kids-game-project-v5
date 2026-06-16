import type { Tower, Enemy, Bullet, Particle, FloatingText, GameEngine as GameEngineType } from './types'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import { createLifecycleContext } from '../../platform/frameworkSession'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { W, H, GRID, CELL, HUD_H, PATH_POINTS, TOWER_TYPES, INFINITE_WAVE_CONFIG, WAVE_INTERVAL_BASE, SPECIAL_SKILL_MAX_CHARGE, LEVEL_CONFIGS } from './config'
import { gridToPixel, createTower, upgradeTower, findTarget } from './towers'
import { getWaveConfig, createEnemy, createEnemyByLevel, damageEnemy as damageEnemyFunc } from './enemies'
import { createBullet, updateBullet, getAoeEnemies } from './bullets'
import { createParticles, updateParticle } from './particles'
import { drawBackground, drawHUD, drawGameOver } from './HUD'
import { drawPath, drawTowers, drawEnemies, drawBullets, drawParticles, drawFloats, drawWaveCountdown, drawInstructions, drawFlashEffect } from './renderer'
import { pixelToGrid, isInHUD, isInGameArea, getTowerTypeAt, getTowerAt, isOnPath, getSpecialSkillButtonBounds } from './input'
import { audioService } from '../../services/audio'
import { app } from '../../services/appBridge'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '../../utils/canvasMobileUtils'
import { userService } from '../../services/userService'
import { apiSubmitGameResult, apiStartGameSession } from '../../services/apiClient'

let activeHost: GameLifecycle | null = null

export function destroyTowerDefense(): void {
  activeHost?.destroy()
  activeHost = null
}

export function initTowerDefense(engine: GameEngineType, onEnd: () => void) {
  destroyTowerDefense()
  const lifecycleCtx = createLifecycleContext('towerDefense', engine as import('../../services/gameEngine').GameEngine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }

  const canvas = lifecycleCtx.canvas
  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    onEnd()
    return
  }

  const pathPixels = PATH_POINTS.map(p => ({
    x: p.gx * CELL + CELL / 2,
    y: p.gy * CELL + HUD_H + CELL / 2
  }))

  const grid = Array.from({ length: GRID }, () => Array(GRID).fill(0))
  PATH_POINTS.forEach(p => {
    const prev = PATH_POINTS[PATH_POINTS.indexOf(p) - 1]
    if (!prev) return
    const dx = Math.sign(p.gx - prev.gx)
    const dy = Math.sign(p.gy - prev.gy)
    let cx = prev.gx, cy = prev.gy
    for (let i = 0; i < Math.abs(p.gx - prev.gx) + Math.abs(p.gy - prev.gy); i++) {
      if (cx >= 0 && cx < GRID && cy >= 0 && cy < GRID) grid[cy][cx] = 1
      cx += dx; cy += dy
    }
    if (p.gx >= 0 && p.gx < GRID && p.gy >= 0 && p.gy < GRID) grid[p.gy][p.gx] = 1
  })

  const entryPoint = PATH_POINTS[0]
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const gx = entryPoint.gx + dx
      const gy = entryPoint.gy + dy
      if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) {
        if (dx * dx + dy * dy <= 5) {
          grid[gy][gx] = 1
        }
      }
    }
  }

  const exitPoint = PATH_POINTS[PATH_POINTS.length - 1]
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const gx = exitPoint.gx + dx
      const gy = exitPoint.gy + dy
      if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) {
        if (dx * dx + dy * dy <= 5) {
          grid[gy][gx] = 1
        }
      }
    }
  }

  let gold = 200
  let lives = 50
  let level = 0
  let levelTimer = 240
  let enemiesToSpawn = 0
  let spawnCounter = 0
  let score = 0
  let combo = 0
  let maxCombo = 0
  let lastKillTime = 0
  let selectedTowerType = 0
  let frameCount = 0
  let screenShake = 0
  let floatingTexts: FloatingText[] = []
  let flashEffect = 0
  let slowMotion = 0
  let isGameOver = false
  let isVictory = false

  let gameStartTime = Date.now()
  let sessionId: number | null = null
  let sessionToken: string | null = null

  let totalLevelsCompleted = 0
  let highestLevel = 0

  let specialSkillCharge = 0
  let showSpecialSkillButton = false

  let inventory: string[] = []

  const MAX_LEVELS = LEVEL_CONFIGS.length

  const towers: Tower[] = []
  const enemies: Enemy[] = []
  const bullets: Bullet[] = []
  const particles: Particle[] = []

  const sfx = {
    place: () => audioService.click(),
    shoot: () => audioService.pop(),
    kill: () => audioService.combo(),
    hit: () => audioService.pop(),
  }

  function addFloat(x: number, y: number, text: string, color: string) {
    const margin = 30
    const clampedX = Math.max(margin, Math.min(W - margin, x))
    const clampedY = Math.max(HUD_H + margin, Math.min(H - margin, y))
    floatingTexts.push({ x: clampedX, y: clampedY, text, color, life: 50 })
  }

  function activateSpecialSkill() {
    if (specialSkillCharge < SPECIAL_SKILL_MAX_CHARGE) return

    enemies.forEach(enemy => {
      const result = damageEnemyFunc(enemy, 8)
      if (result.killed) {
        gold += enemy.reward
        particles.push(...createParticles(enemy.x, enemy.y, '#FFD700', 15, 6, 'explosion'))
        addFloat(enemy.x, enemy.y - 10, `+${enemy.reward} 💰`, '#FFD700')
      }
    })

    specialSkillCharge = 0
    showSpecialSkillButton = false

    screenShake = 18
    flashEffect = 15
    addFloat(W / 2, H / 2, '💥 全屏爆炸! 💥', '#FFD700')

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        particles.push(...createParticles(W / 2 + (Math.random() - 0.5) * 100, H / 2 + (Math.random() - 0.5) * 100, ['#FFD700', '#FF6B6B', '#00E5FF'][i % 3], 20, 8, 'explosion'))
      }, i * 100)
    }

    audioService.crit()
  }

  function handleClick(px: number, py: number) {
    if (isGameOver) {
      window.location.reload()
      return
    }

    if (isInHUD(py)) {
      const towerIdx = getTowerTypeAt(px)
      if (towerIdx !== null) {
        selectedTowerType = towerIdx
      }

      if (showSpecialSkillButton) {
        const skillBtn = getSpecialSkillButtonBounds()
        const distToSkill = Math.hypot(px - skillBtn.x, py - skillBtn.y)
        if (distToSkill < skillBtn.radius) {
          activateSpecialSkill()
          return
        }
      }
      return
    }

    const { gx, gy } = pixelToGrid(px, py)
    if (!isInGameArea(gx, gy)) return

    const existingTower = getTowerAt(towers, gx, gy)
    if (existingTower) {
      const upgradeResult = upgradeTower(existingTower, gold)
      if (upgradeResult.success) {
        gold = upgradeResult.newGold
        
        const particleColors = ['#FFD700', '#FF6B6B', '#00E5FF', '#9C27B0', '#FFFFFF']
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            particles.push(...createParticles(
              existingTower.x + (Math.random() - 0.5) * 10,
              existingTower.y + (Math.random() - 0.5) * 10,
              particleColors[i],
              20 + existingTower.level * 2,
              4 + Math.min(existingTower.level * 0.3, 8),
              'explosion'
            ))
          }, i * 50)
        }

        const ringCount = Math.min(3 + Math.floor(existingTower.level / 10), 6)
        for (let ring = 0; ring < ringCount; ring++) {
          setTimeout(() => {
            particles.push(...createParticles(existingTower.x, existingTower.y, existingTower.type.color, 15 + existingTower.level, 6 + ring * 3, 'spark'))
          }, ring * 80)
        }

        const sparkCount = 30 + existingTower.level * 2
        particles.push(...createParticles(existingTower.x, existingTower.y - 20, '#FFD700', sparkCount, 5 + existingTower.level * 0.2, 'spark'))

        screenShake = Math.min(6 + existingTower.level * 0.5, 25)
        flashEffect = Math.min(0.3 + existingTower.level * 0.02, 0.8)
        slowMotion = Math.min(6 + existingTower.level * 0.3, 20)

        if (existingTower.level === 5) {
          setTimeout(() => {
            particles.push(...createParticles(existingTower.x, existingTower.y, '#00E5FF', 40, 7, 'explosion'))
            particles.push(...createParticles(existingTower.x, existingTower.y, '#FFFFFF', 20, 6, 'spark'))
            screenShake = 12
            flashEffect = 0.5
            slowMotion = 12
            audioService.win()
          }, 400)
        } else if (existingTower.level === 10) {
          setTimeout(() => {
            particles.push(...createParticles(existingTower.x, existingTower.y, '#9C27B0', 50, 8, 'explosion'))
            particles.push(...createParticles(existingTower.x, existingTower.y, '#FFD700', 30, 6, 'spark'))
            particles.push(...createParticles(existingTower.x, existingTower.y, '#00E5FF', 25, 7, 'explosion'))
            screenShake = 15
            flashEffect = 0.6
            slowMotion = 15
            audioService.win()
          }, 400)
        } else if (existingTower.level === 20) {
          setTimeout(() => {
            particles.push(...createParticles(existingTower.x, existingTower.y, '#FFA502', 60, 9, 'explosion'))
            particles.push(...createParticles(existingTower.x, existingTower.y, '#FF6B6B', 40, 7, 'spark'))
            particles.push(...createParticles(existingTower.x, existingTower.y, '#FFD700', 35, 8, 'explosion'))
            screenShake = 18
            flashEffect = 0.7
            slowMotion = 18
            audioService.win()
          }, 400)
        } else if (existingTower.level === 50) {
          setTimeout(() => {
            for (let i = 0; i < 15; i++) {
              setTimeout(() => {
                particles.push(...createParticles(
                  existingTower.x + (Math.random() - 0.5) * 80,
                  existingTower.y + (Math.random() - 0.5) * 80,
                  ['#FFD700', '#FF6B6B', '#00E5FF', '#9C27B0'][Math.floor(Math.random() * 4)],
                  30,
                  8,
                  'explosion'
                ))
              }, i * 60)
            }
            particles.push(...createParticles(existingTower.x, existingTower.y, '#FFD700', 60, 10, 'spark'))
            particles.push(...createParticles(existingTower.x, existingTower.y, '#FFFFFF', 40, 8, 'explosion'))
            screenShake = 22
            flashEffect = 0.8
            slowMotion = 22
            audioService.win()
            setTimeout(() => audioService.combo(), 300)
          }, 400)
        }

        setTimeout(() => audioService.combo(), 200)
      } else {
        particles.push(...createParticles(existingTower.x, existingTower.y, '#E74C3C', 12, 3, 'spark'))
        screenShake = 2
        flashEffect = 0.2
      }
      return
    }

    if (isOnPath(grid, gx, gy)) {
      addFloat(px, py, '不能在此建造', '#E74C3C')
      return
    }

    const createResult = createTower(gx, gy, selectedTowerType, gold)
    if (createResult.tower) {
      gold = createResult.newGold
      towers.push(createResult.tower)
      grid[gy][gx] = 2
      particles.push(...createParticles(createResult.tower.x, createResult.tower.y, createResult.tower.type.color, 12, 3))
      sfx.place()
    } else {
      addFloat(px, py, '金币不足!', '#E74C3C')
    }
  }

  let unbindPointer: (() => void) | null = null

  function teardownInput() {
    unbindPointer?.()
    unbindPointer = null
  }
  let ending = false

  async function endGame(isWinParam: boolean = false) {
    if (ending) return
    ending = true
    isGameOver = true
    isVictory = isWinParam
    teardownInput()

    const duration = Math.floor((Date.now() - gameStartTime) / 1000)

    if (userService.isLoggedIn && userService.current && sessionId && sessionToken) {
      try {
        const result = await apiSubmitGameResult({
          sessionId: sessionId,
          sessionToken: sessionToken,
          score: score,
          duration: duration,
          lives: lives,
          level: level + 1,
          isWin: isWinParam,
          details: {
            wave: level + 1,
            maxCombo: maxCombo,
            totalWavesCompleted: totalLevelsCompleted,
            highestWave: highestLevel,
          }
        })

        if (!result.ok) {
          console.warn('[塔防] 分数提交失败:', result.msg)
        }
      } catch (error) {
        console.error('[塔防] 提交分数异常:', error)
      }
    }

    gameActions.gameOver({
      victory: isWinParam,
      score,
      stats: {
        wave: level + 1,
        maxCombo,
        totalWavesCompleted: totalLevelsCompleted,
        highestWave: highestLevel,
        lives,
      },
    })
  }

  function update() {
    if (isGameOver) return
    frameCount++

    if (slowMotion > 0) {
      slowMotion--
    }

    if (flashEffect > 0) {
      flashEffect *= 0.9
      if (flashEffect < 0.1) flashEffect = 0
    }

    if (enemiesToSpawn > 0) {
      spawnCounter--
      if (spawnCounter <= 0) {
        const currentLevelConfig = LEVEL_CONFIGS[level]
        const enemy = createEnemyByLevel(currentLevelConfig, enemiesToSpawn)
        if (enemy) {
          enemies.push(enemy)
        }
        enemiesToSpawn--
        spawnCounter = currentLevelConfig.spawnInterval
      }
    } else if (enemies.length === 0) {
      levelTimer--
      if (levelTimer <= 0) {
        level++
        totalLevelsCompleted++
        if (level > highestLevel) highestLevel = level

        if (level >= MAX_LEVELS) {
          endGame(true)
          return
        }

        const currentLevelConfig = LEVEL_CONFIGS[level]
        enemiesToSpawn = currentLevelConfig.enemyCount
        spawnCounter = 0
        levelTimer = Math.max(180, WAVE_INTERVAL_BASE - level * 4)

        addFloat(W / 2, H / 2, `第${level + 1}关 - ${currentLevelConfig.name}`, '#FFD700')

        if (currentLevelConfig.hasBoss) {
          setTimeout(() => addFloat(W / 2, H / 2 - 40, '👹 BOSS即将到来!', '#FF4757'), 500)
        }
        if (currentLevelConfig.specialEnemyChance > 0 && level >= 2) {
          setTimeout(() => addFloat(W / 2, H / 2 - 40, '⚡ 特殊敌人出现!', '#00E5FF'), 500)
        }
        if (currentLevelConfig.eliteEnemyChance > 0 && level >= 4) {
          setTimeout(() => addFloat(W / 2, H / 2 - 60, '👑 精英敌人出现!', '#FFD700'), 800)
        }

        sfx.place()
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      if (e.pathIdx >= pathPixels.length - 1) {
        lives--
        enemies.splice(i, 1)
        screenShake = 6
        flashEffect = 4
        addFloat(pathPixels[pathPixels.length - 1].x, pathPixels[pathPixels.length - 1].y, '-1 ❤️', '#E74C3C')
        if (lives <= 0) {
          endGame()
          return
        }
        continue
      }

      const target = pathPixels[e.pathIdx + 1]
      const speed = e.slowTimer > 0 ? e.speed * 0.4 : e.speed
      if (e.slowTimer > 0) e.slowTimer--

      const dx = target.x - e.x
      const dy = target.y - e.y
      const d = Math.hypot(dx, dy)
      if (d < speed) {
        e.x = target.x
        e.y = target.y
        e.pathIdx++
      } else {
        e.x += (dx / d) * speed
        e.y += (dy / d) * speed
      }
    }

    towers.forEach(t => {
      t.fireTimer--
      if (t.fireTimer > 0) return

      const bestEnemy = findTarget(t, enemies)
      if (bestEnemy) {
        t.angle = Math.atan2(bestEnemy.y - t.y, bestEnemy.x - t.x)
        bullets.push(createBullet(t, bestEnemy))
        t.fireTimer = t.type.fireRate
        sfx.shoot()

        particles.push(...createParticles(
          t.x + Math.cos(t.angle) * 16,
          t.y + Math.sin(t.angle) * 16,
          t.type.bulletColor,
          5,
          2,
          'spark'
        ))
      }
    })

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      if (!enemies.includes(b.target)) {
        bullets.splice(i, 1)
        continue
      }

      const { hit, target } = updateBullet(b)
      if (hit && target) {
        if (b.aoe) {
          const aoeEnemies = getAoeEnemies(b, enemies)
          aoeEnemies.forEach(e => {
            const result = damageEnemyFunc(e, b.damage * 0.6)
            if (result.killed) {
              killEnemy(e)
            }
          })
          particles.push(...createParticles(b.x, b.y, b.color, 15, 5, 'explosion'))
        } else {
          const result = damageEnemyFunc(target, b.damage)
          if (result.killed) {
            killEnemy(target)
          } else {
            particles.push(...createParticles(target.x, target.y, target.color, 4, 2))
            addFloat(target.x, target.y - 15, `-${b.damage.toFixed(1)}`, '#FF6B6B')
          }
        }

        if (b.slow && b.slowDur) {
          target.slowTimer = b.slowDur
        }
        sfx.hit()
        bullets.splice(i, 1)
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      if (!updateParticle(particles[i])) {
        particles.splice(i, 1)
      }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      floatingTexts[i].y -= 0.8
      floatingTexts[i].life--
      if (floatingTexts[i].life <= 0 || floatingTexts[i].y < HUD_H || floatingTexts[i].y > H || floatingTexts[i].x < 0 || floatingTexts[i].x > W) {
        floatingTexts.splice(i, 1)
      }
    }

    if (screenShake > 0) screenShake *= 0.85
    if (screenShake < 0.3) screenShake = 0
  }

  function killEnemy(enemy: Enemy) {
    const idx = enemies.indexOf(enemy)
    if (idx < 0) return
    enemies.splice(idx, 1)

    gold += enemy.reward

    specialSkillCharge = Math.min(specialSkillCharge + (enemy.isBoss ? 20 : 5), SPECIAL_SKILL_MAX_CHARGE)
    if (specialSkillCharge >= SPECIAL_SKILL_MAX_CHARGE) {
      showSpecialSkillButton = true
    }

    const particleCount = enemy.isBoss ? 50 : 25
    particles.push(...createParticles(enemy.x, enemy.y, enemy.color, particleCount, enemy.isBoss ? 8 : 5, 'explosion'))
    particles.push(...createParticles(enemy.x, enemy.y, '#FFFFFF', enemy.isBoss ? 25 : 12, enemy.isBoss ? 6 : 4, 'spark'))

    if (enemy.isBoss) {
      particles.push(...createParticles(enemy.x, enemy.y, '#FFD700', 30, 7, 'explosion'))
    }

    addFloat(enemy.x, enemy.y - 10, `+${enemy.reward} 💰`, '#FFD700')

    const now = Date.now()
    if (now - lastKillTime < 3000) {
      combo++
      if (combo > maxCombo) maxCombo = combo

      if (combo >= 2) {
        gameActions.addScore(combo * 10, W / 2, H / 2)

        if (combo % 2 === 0) {
          addFloat(W / 2, H / 2, `${combo} 连击!`, combo >= 10 ? '#FF4757' : combo >= 5 ? '#FFA502' : '#FFD700')
          screenShake = Math.min(combo * 1.2, 18)
          flashEffect = Math.min(combo * 0.08, 0.7)

          if (combo >= 5 && combo % 5 === 0) {
            gold += 25
            addFloat(W / 2, H / 2 - 40, `+25 💰 连击奖励!`, '#FFD700')
            audioService.win()
          }

          if (combo >= 15) {
            slowMotion = 18
            flashEffect = 0.85
            addFloat(W / 2, H / 2 - 60, '🔥 超神连击! 🔥', '#FF4757')
          }
        }
      }
      if (combo >= 8 && combo % 8 === 0) {
        engine.triggerRandomBuff()
        addFloat(W / 2, H / 2 - 30, '获得增益!', '#00E5FF')
        screenShake = 12
        flashEffect = 0.5
        audioService.win()
      }
    } else {
      combo = 1
    }
    lastKillTime = now

    const pts = enemy.isBoss ? 200 : 35
    engine.addScore(pts, enemy.x, enemy.y)
    sfx.kill()

    if (enemy.isBoss) {
      screenShake = 20
      flashEffect = 0.85
      slowMotion = 22

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          particles.push(...createParticles(
            enemy.x + (Math.random() - 0.5) * 40,
            enemy.y + (Math.random() - 0.5) * 40,
            ['#FFD700', '#FF6B6B', '#00E5FF', '#9C27B0'][Math.floor(Math.random() * 4)],
            15,
            6,
            'explosion'
          ))
        }, i * 80)
      }

      addFloat(W / 2, H / 2 - 80, '👑 BOSS击败! 👑', '#FFD700')
      audioService.win()
    }
  }

  function renderFrame() {
    ctx.save()
    if (screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * screenShake,
        (Math.random() - 0.5) * screenShake
      )
    }

    drawBackground(ctx)
    drawPath(ctx, pathPixels)
    drawTowers(ctx, towers, selectedTowerType)
    drawEnemies(ctx, enemies)
    drawBullets(ctx, bullets, enemies)
    drawParticles(ctx, particles)
    drawFloats(ctx, floatingTexts)
    const currentLevelName = level < LEVEL_CONFIGS.length ? LEVEL_CONFIGS[level].name : '最终关卡'
    drawHUD(ctx, gold, lives, level, MAX_LEVELS, currentLevelName, combo, maxCombo, specialSkillCharge, showSpecialSkillButton, selectedTowerType, highestLevel)
    drawWaveCountdown(ctx, levelTimer, enemiesToSpawn, enemies)
    drawInstructions(ctx, frameCount)
    drawFlashEffect(ctx, flashEffect)

    if (isGameOver) {
      drawGameOver(ctx, score, level, maxCombo, isVictory)
    }

    ctx.restore()
  }

  async function initGameSession() {
    if (userService.isLoggedIn && userService.current) {
      try {
        const GAME_ID = 1
        const result = await apiStartGameSession(GAME_ID)

        if (result.ok && result.data) {
          sessionId = result.data.sessionId
          sessionToken = result.data.sessionToken
        } else {
          console.warn('[塔防] 创建游戏会话失败:', result.msg)
        }
      } catch (error) {
        console.error('[塔防] 创建游戏会话异常:', error)
      }
    }
  }

  activeHost = hostCanvas2D(lifecycleCtx, {
    onInit() {
      applyCanvasMobileStyles(canvas)
      unbindPointer = bindCanvasPointerInput(canvas, (x, y) => {
        handleClick(x, y)
      })
      void initGameSession()
    },
    onUpdate(_dt) {
      if (!ending) update()
    },
    onRender() {
      renderFrame()
    },
    onDestroy() {
      teardownInput()
    },
  })
}
