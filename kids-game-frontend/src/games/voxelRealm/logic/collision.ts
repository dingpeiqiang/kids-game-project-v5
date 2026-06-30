import { GAME_CONFIG } from '../config'
import type { PlayerState } from '../types'
import type { VoxelGrid } from './voxelGrid'

const PLAYER_W = 0.55
const PLAYER_H = 1.75

function solidAt(grid: VoxelGrid, x: number, y: number, z: number): boolean {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  return grid.hasSolid(ix, iy, iz)
}

export function movePlayer(
  grid: VoxelGrid,
  player: PlayerState,
  dx: number,
  dz: number,
  dt: number,
): void {
  const stepX = dx * dt
  const stepZ = dz * dt
  let nx = player.x + stepX
  let nz = player.z + stepZ

  const minY = player.y
  const maxY = player.y + PLAYER_H

  const tryX = (x: number) => {
    for (let y = minY; y < maxY; y += 0.5) {
      if (
        solidAt(grid, x - PLAYER_W, y, player.z) ||
        solidAt(grid, x + PLAYER_W, y, player.z) ||
        solidAt(grid, x - PLAYER_W, y, player.z + PLAYER_W) ||
        solidAt(grid, x + PLAYER_W, y, player.z - PLAYER_W)
      ) {
        return false
      }
    }
    return true
  }

  const tryZ = (z: number) => {
    for (let y = minY; y < maxY; y += 0.5) {
      if (
        solidAt(grid, player.x, y, z - PLAYER_W) ||
        solidAt(grid, player.x, y, z + PLAYER_W) ||
        solidAt(grid, player.x + PLAYER_W, y, z) ||
        solidAt(grid, player.x - PLAYER_W, y, z)
      ) {
        return false
      }
    }
    return true
  }

  if (tryX(nx)) player.x = nx
  else nx = player.x

  if (tryZ(nz)) player.z = nz

  player.vy += GAME_CONFIG.gravity * dt
  let ny = player.y + player.vy * dt
  player.onGround = false

  if (player.vy <= 0) {
    const foot = ny
    if (solidAt(grid, player.x, foot, player.z)) {
      ny = Math.floor(foot) + 1
      player.vy = 0
      player.onGround = true
    }
  } else {
    if (solidAt(grid, player.x, ny + PLAYER_H, player.z)) {
      ny = Math.floor(ny + PLAYER_H) - PLAYER_H - 0.01
      player.vy = 0
    }
  }

  player.y = Math.max(1, ny)
}

export function applyJump(player: PlayerState): void {
  if (player.onGround) {
    player.vy = GAME_CONFIG.jumpSpeed
    player.onGround = false
  }
}