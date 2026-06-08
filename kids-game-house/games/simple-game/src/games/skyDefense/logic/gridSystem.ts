import * as THREE from 'three'
import type { GridCell, GridPoint } from '../types'
import { GAME_CONFIG, PATH_POINTS } from '../config'

const { GRID_SIZE, CELL_SIZE } = GAME_CONFIG

export function initializeGrid(): GridCell[][] {
  const grid: GridCell[][] = []
  const halfSize = (GRID_SIZE * CELL_SIZE) / 2
  
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    grid[gy] = []
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const x = (gx - GRID_SIZE / 2 + 0.5) * CELL_SIZE
      const y = (gy - GRID_SIZE / 2 + 0.5) * CELL_SIZE
      let cellType: GridCell['type'] = 'buildable'
      
      if (isOnRoad(x, y)) {
        cellType = 'road'
      } else if (isBaseLocation(x, y)) {
        cellType = 'base'
      }
      
      grid[gy][gx] = {
        gx,
        gy,
        x,
        y,
        type: cellType,
        towerId: null
      }
    }
  }
  
  return grid
}

function isOnRoad(x: number, y: number): boolean {
  const roadWidth = 1.2
  
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const p1 = PATH_POINTS[i]
    const p2 = PATH_POINTS[i + 1]
    
    const minX = Math.min(p1.x, p2.x) - roadWidth / 2
    const maxX = Math.max(p1.x, p2.x) + roadWidth / 2
    const minY = Math.min(p1.y, p2.y) - roadWidth / 2
    const maxY = Math.max(p1.y, p2.y) + roadWidth / 2
    
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return true
    }
  }
  
  return false
}

function isBaseLocation(x: number, y: number): boolean {
  const basePos = PATH_POINTS[PATH_POINTS.length - 1]
  const baseRadius = 0.8
  const dx = x - basePos.x
  const dy = y - basePos.y
  return Math.sqrt(dx * dx + dy * dy) <= baseRadius
}

export function screenToGrid(screenX: number, screenY: number, camera: THREE.Camera, scene: THREE.Scene): GridPoint | null {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  
  mouse.x = (screenX / window.innerWidth) * 2 - 1
  mouse.y = -(screenY / window.innerHeight) * 2 + 1
  
  raycaster.setFromCamera(mouse, camera)
  
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const intersection = new THREE.Vector3()
  
  if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
    const halfSize = (GRID_SIZE * CELL_SIZE) / 2
    const gx = Math.floor((intersection.x + halfSize) / CELL_SIZE)
    const gy = Math.floor((intersection.z + halfSize) / CELL_SIZE)
    
    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
      return { gx, gy }
    }
  }
  
  return null
}

export function canPlaceTower(grid: GridCell[][], gx: number, gy: number): boolean {
  if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) {
    return false
  }
  
  const cell = grid[gy][gx]
  return cell.type === 'buildable' && cell.towerId === null
}

export function getCellCenter(gx: number, gy: number): { x: number; y: number } {
  const halfSize = (GRID_SIZE * CELL_SIZE) / 2
  return {
    x: (gx - GRID_SIZE / 2 + 0.5) * CELL_SIZE,
    y: (gy - GRID_SIZE / 2 + 0.5) * CELL_SIZE
  }
}