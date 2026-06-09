import type { BlockType } from '../types'
import { GAME_CONFIG } from '../config'

function key(x: number, y: number, z: number): string {
  return `${x}|${y}|${z}`
}

export class VoxelGrid {
  private blocks = new Map<string, BlockType>()

  clear(): void {
    this.blocks.clear()
  }

  inBounds(x: number, y: number, z: number): boolean {
    const { worldSizeX, worldSizeZ, chunkHeight } = GAME_CONFIG
    return (
      x >= 0 &&
      x < worldSizeX &&
      z >= 0 &&
      z < worldSizeZ &&
      y >= 0 &&
      y < chunkHeight
    )
  }

  get(x: number, y: number, z: number): BlockType | undefined {
    return this.blocks.get(key(x, y, z))
  }

  set(x: number, y: number, z: number, type: BlockType): void {
    if (!this.inBounds(x, y, z)) return
    this.blocks.set(key(x, y, z), type)
  }

  remove(x: number, y: number, z: number): boolean {
    return this.blocks.delete(key(x, y, z))
  }

  hasSolid(x: number, y: number, z: number): boolean {
    const t = this.get(x, y, z)
    return t !== undefined && t !== 'water'
  }

  forEach(fn: (x: number, y: number, z: number, type: BlockType) => void): void {
    for (const [k, type] of this.blocks) {
      const [xs, ys, zs] = k.split('|')
      fn(Number(xs), Number(ys), Number(zs), type)
    }
  }

  count(): number {
    return this.blocks.size
  }

  exportTuples(): Array<[number, number, number, BlockType]> {
    const out: Array<[number, number, number, BlockType]> = []
    this.forEach((x, y, z, type) => out.push([x, y, z, type]))
    return out
  }

  importTuples(rows: Array<[number, number, number, BlockType]>): void {
    this.clear()
    for (const [x, y, z, type] of rows) {
      this.set(x, y, z, type)
    }
  }
}