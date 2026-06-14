import { Vector3 } from '@babylonjs/core'
import type { GameEngine } from '../../services/gameEngine'
import { createEngine3d } from '../../engine3d/createEngine3d'
import {
  BLOCK_PALETTE,
  GAME_CONFIG,
  pickRandomBiome,
  pickRandomTheme,
} from './config'
import { createInputController } from './input'
import { applyJump, movePlayer } from './logic/collision'
import { spawnCreatures, updateCreatures } from './logic/creatures'
import { raycastBlocks } from './logic/raycast'
import {
  canUseBlockInCompete,
  casualPointsForAction,
  competeTimeExpired,
  scoreTerrainRace,
  scoreThemeBuild,
} from './logic/scoring'
import { loadSave, restoreGrid, writeSave } from './logic/storage'
import { generateTerrain, groundHeightAt } from './logic/terrain'
import { VoxelGrid } from './logic/voxelGrid'
import { VoxelSceneView } from './render/scene'
import { createVoxelHud } from './render/ui'
import type {
  BlockType,
  CompeteKind,
  CompeteState,
  GameState,
  PlayMode,
} from './types'

let activeDispose: (() => void) | null = null

function emptyCompete(): CompeteState {
  return {
    kind: 'themeBuild',
    themeId: '',
    timeLeft: 0,
    running: false,
    placedCount: 0,
    digCount: 0,
    raceStartTime: 0,
    raceDone: false,
    raceElapsed: 0,
  }
}

function createInitialState(
  mode: PlayMode,
  seed: number,
  biome: ReturnType<typeof pickRandomBiome>,
  competeKind?: CompeteKind,
): GameState {
  const theme = pickRandomTheme(seed)
  const hotbar: BlockType[] =
    mode === 'compete' && competeKind === 'themeBuild'
      ? [...theme.blocks]
      : [...BLOCK_PALETTE.slice(0, 8)]

  const compete: CompeteState = { ...emptyCompete() }
  if (mode === 'compete' && competeKind === 'themeBuild') {
    compete.kind = 'themeBuild'
    compete.themeId = theme.id
    compete.timeLeft = GAME_CONFIG.competeBuildSec
    compete.running = true
  } else if (mode === 'compete' && competeKind === 'terrainRace') {
    compete.kind = 'terrainRace'
    compete.running = true
    compete.raceStartTime = performance.now()
  }

  return {
    mode,
    meta: { seed, biome, dayPhase: 0, isNight: false },
    player: { x: GAME_CONFIG.worldSizeX / 2, y: 12, z: GAME_CONFIG.worldSizeZ / 2, vy: 0, onGround: false },
    selectedBlock: hotbar[0]!,
    hotbar,
    hotbarIndex: 0,
    creatures: [],
    compete,
    sessionScore: 0,
    blocksPlaced: 0,
    blocksBroken: 0,
    eggFound: false,
    worldReady: false,
  }
}

export function destroyVoxelRealm(): void {
  activeDispose?.()
  activeDispose = null
}

export async function initVoxelRealm(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyVoxelRealm()
  engine.start()
  engine.setOrientation('landscape')

  const parent = document.getElementById('gameCanvas')
  if (!parent) {
    onEnd()
    return
  }

  parent.innerHTML = ''
  parent.style.width = '100%'
  parent.style.height = '100%'
  parent.style.display = 'block'

  const isMobile =
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const ctx3d = createEngine3d({
    parent,
    antialias: !isMobile,
    hardwareScalingLevel: isMobile ? 1.25 : 1,
  })

  const hud = createVoxelHud(parent)
  const grid = new VoxelGrid()
  const view = new VoxelSceneView(ctx3d.scene)
  const input = createInputController(ctx3d.canvas)

  ctx3d.camera.attachControl(ctx3d.canvas, true)
  ctx3d.camera.keysUp = []
  ctx3d.camera.keysDown = []
  ctx3d.camera.keysLeft = []
  ctx3d.camera.keysRight = []

  let bestBuild = 0
  let bestRaceMs = 999999
  const saved = loadSave()
  let seed = saved?.seed ?? (Date.now() % 100000)
  let biome = saved?.biome ?? pickRandomBiome(seed)
  if (saved) {
    bestBuild = saved.bestBuild
    bestRaceMs = saved.bestRaceMs
  }

  const { mode, competeKind } = await hud.openModeMenu(seed)
  hud.setMode(mode)

  let state = createInitialState(mode, seed, biome, competeKind)

  if (saved?.blocks?.length) {
    restoreGrid(grid, saved.blocks)
  } else {
    generateTerrain(grid, biome, seed)
  }

  const spawnY = groundHeightAt(grid, state.player.x, state.player.z) + 1.05
  state.player.y = spawnY
  state.creatures = spawnCreatures(biome, seed, 10)
  state.worldReady = true
  view.rebuildTerrain(grid)

  const sessionPlaced = new Map<BlockType, number>()
  let lastHotbarNext = false
  let lastHotbarPrev = false
  let lastBreakHeld = false
  let lastPlaceHeld = false
  let dayAccum = 0
  let autosaveTimer = 0
  let ended = false

  const finish = (finalScore: number) => {
    if (ended) return
    ended = true
    engine.setScore(finalScore)
    engine.setGameStats({
      placed: state.blocksPlaced,
      broken: state.blocksBroken,
      bestBuild,
      bestRaceMs: bestRaceMs < 999999 ? bestRaceMs : 0,
    })
    activeDispose?.()
    activeDispose = null
    onEnd()
  }

  hud.onToolbar(action => {
    if (ended) return
    if (action === 'toggleDay') {
      state.meta.isNight = !state.meta.isNight
      if (state.meta.isNight) state.meta.dayPhase = 0.7
      else state.meta.dayPhase = 0.25
      dayAccum = state.meta.dayPhase * GAME_CONFIG.dayCycleSec
    }
    if (action === 'resetWorld' && state.mode === 'casual') {
      const newSeed = (Date.now() % 100000) | 0
      const newBiome = pickRandomBiome(newSeed)
      seed = newSeed
      biome = newBiome
      state.meta.seed = newSeed
      state.meta.biome = newBiome
      generateTerrain(grid, newBiome, newSeed)
      state.creatures = spawnCreatures(newBiome, newSeed, 10)
      state.player.y = groundHeightAt(grid, state.player.x, state.player.z) + 1.05
      view.rebuildTerrain(grid)
      writeSave(grid, newSeed, newBiome, bestBuild, bestRaceMs)
      hud.setHint('世界已重置，新的随机地貌已生成')
    }
    if (action === 'saveExit') {
      writeSave(grid, seed, biome, bestBuild, bestRaceMs)
      finish(state.sessionScore)
    }
  })

  const allowedCompeteBlocks =
    state.mode === 'compete' && state.compete.kind === 'themeBuild'
      ? state.hotbar
      : null

  const syncHud = () => {
    hud.setMeta(state.meta)
    hud.setHotbar(state.hotbar, state.hotbarIndex)
    hud.setStats(state.sessionScore, state.blocksPlaced, state.blocksBroken)
    hud.setCompete(state.mode === 'compete' ? state.compete : null)
  }
  syncHud()

  const onUpdate = () => {
    if (ended || !state.worldReady) return
    if (engine.isPaused()) return

    const dt = Math.min(0.05, ctx3d.engine.getDeltaTime() / 1000)
    input.tick()
    const snap = input.snapshot

    if (snap.hotbarNext && !lastHotbarNext) {
      state.hotbarIndex = (state.hotbarIndex + 1) % state.hotbar.length
      state.selectedBlock = state.hotbar[state.hotbarIndex]!
    }
    if (snap.hotbarPrev && !lastHotbarPrev) {
      state.hotbarIndex = (state.hotbarIndex - 1 + state.hotbar.length) % state.hotbar.length
      state.selectedBlock = state.hotbar[state.hotbarIndex]!
    }
    lastHotbarNext = snap.hotbarNext
    lastHotbarPrev = snap.hotbarPrev

    dayAccum += dt
    const cycle = GAME_CONFIG.dayCycleSec
    state.meta.dayPhase = (dayAccum % cycle) / cycle
    state.meta.isNight = state.meta.dayPhase > 0.55 && state.meta.dayPhase < 0.92
    view.setDayNight(state.meta.dayPhase, state.meta.isNight)

    const cam = ctx3d.camera
    const forward = cam.getDirection(Vector3.Forward())
    forward.y = 0
    forward.normalize()
    const right = Vector3.Cross(forward, Vector3.Up()).normalize()

    let moveX = 0
    let moveZ = 0
    if (snap.forward) {
      moveX += forward.x
      moveZ += forward.z
    }
    if (snap.back) {
      moveX -= forward.x
      moveZ -= forward.z
    }
    if (snap.left) {
      moveX -= right.x
      moveZ -= right.z
    }
    if (snap.right) {
      moveX += right.x
      moveZ += right.z
    }

    const len = Math.hypot(moveX, moveZ)
    if (len > 0.01) {
      moveX /= len
      moveZ /= len
    }
    const speed = GAME_CONFIG.moveSpeed * (snap.sprint ? GAME_CONFIG.sprintMul : 1)
    movePlayer(grid, state.player, moveX * speed, moveZ * speed, dt)
    if (snap.jump) applyJump(state.player)

    cam.position.x = state.player.x
    cam.position.y = state.player.y + 1.6
    cam.position.z = state.player.z - 0.01

    const lookDir = cam.getDirection(Vector3.Forward())
    const hit = raycastBlocks(
      grid,
      cam.position.x,
      cam.position.y,
      cam.position.z,
      lookDir.x,
      lookDir.y,
      lookDir.z,
      GAME_CONFIG.reach,
    )

    const breakEdge = snap.breakBlock && !lastBreakHeld
    const placeEdge = snap.placeBlock && !lastPlaceHeld
    lastBreakHeld = snap.breakBlock
    lastPlaceHeld = snap.placeBlock

    if (hit && breakEdge) {
      if (grid.remove(hit.x, hit.y, hit.z)) {
        state.blocksBroken++
        state.compete.digCount++
        const pts = casualPointsForAction(true)
        state.sessionScore += pts
        engine.addScore(pts, window.innerWidth / 2, window.innerHeight / 2)
        view.rebuildTerrain(grid)
      }
    } else if (hit && placeEdge) {
      const block = state.selectedBlock
      if (
        canUseBlockInCompete(state.mode, block, allowedCompeteBlocks) &&
        grid.inBounds(hit.placeX, hit.placeY, hit.placeZ) &&
        !grid.get(hit.placeX, hit.placeY, hit.placeZ)
      ) {
        grid.set(hit.placeX, hit.placeY, hit.placeZ, block)
        state.blocksPlaced++
        state.compete.placedCount++
        sessionPlaced.set(block, (sessionPlaced.get(block) ?? 0) + 1)
        const pts = casualPointsForAction(false, block)
        state.sessionScore += pts
        engine.addScore(pts, window.innerWidth / 2, window.innerHeight / 2)
        view.rebuildTerrain(grid)
      }
    }

    updateCreatures(state.creatures, dt, state.player.x, state.player.z)
    view.syncCreatures(state.creatures)

    if (state.mode === 'compete' && state.compete.running) {
      if (state.compete.kind === 'themeBuild') {
        state.compete.timeLeft -= dt
        if (competeTimeExpired(state.compete)) {
          state.compete.running = false
          const { score } = scoreThemeBuild(
            state.compete.placedCount,
            state.compete.themeId,
            sessionPlaced,
          )
          bestBuild = Math.max(bestBuild, score)
          writeSave(grid, seed, biome, bestBuild, bestRaceMs)
          hud.setHint(`建造结束！得分 ${score}`)
          finish(score)
        }
      } else if (state.compete.kind === 'terrainRace') {
        if (
          !state.compete.raceDone &&
          state.compete.digCount >= GAME_CONFIG.raceTargetDigs
        ) {
          state.compete.raceDone = true
          state.compete.raceElapsed = performance.now() - state.compete.raceStartTime
          state.compete.running = false
          const score = scoreTerrainRace(
            state.compete.raceElapsed,
            state.compete.digCount,
            GAME_CONFIG.raceTargetDigs,
          )
          bestRaceMs = Math.min(bestRaceMs, state.compete.raceElapsed)
          writeSave(grid, seed, biome, bestBuild, bestRaceMs)
          hud.setHint(`竞速完成！得分 ${score}`)
          finish(score)
        }
      }
    }

    autosaveTimer += dt
    if (autosaveTimer > 8 && state.mode === 'casual') {
      autosaveTimer = 0
      writeSave(grid, seed, biome, bestBuild, bestRaceMs)
    }

    syncHud()
  }

  ctx3d.scene.onBeforeRenderObservable.add(onUpdate)

  activeDispose = () => {
    ctx3d.scene.onBeforeRenderObservable.removeCallback(onUpdate)
    input.dispose()
    view.dispose()
    hud.dispose()
    ctx3d.dispose()
  }
}