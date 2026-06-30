import { GAME_CONFIG, PATH_WAYPOINTS, gridToWorld } from '../config'
import type { PathNode } from '../types'

/** 将网格路点展开为连续世界坐标路径（含拐角插值） */
export function buildWorldPath(): PathNode[] {
  const nodes: PathNode[] = []
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const a = PATH_WAYPOINTS[i]!
    const b = PATH_WAYPOINTS[i + 1]!
    const wa = gridToWorld(a.gx, a.gz)
    const wb = gridToWorld(b.gx, b.gz)
    const steps = Math.max(Math.abs(b.gx - a.gx), Math.abs(b.gz - a.gz), 1) * 4
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      nodes.push({
        x: wa.x + (wb.x - wa.x) * t,
        z: wa.z + (wb.z - wa.z) * t,
      })
    }
  }
  if (nodes.length < 2) {
    const w = gridToWorld(0, 1)
    nodes.push({ x: w.x, z: w.z })
  }
  return nodes
}

const segmentLengths: number[] = []
let totalPathLength = 0

export function initPathMetrics(path: PathNode[]): number {
  segmentLengths.length = 0
  totalPathLength = 0
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1]!.x - path[i]!.x
    const dz = path[i + 1]!.z - path[i]!.z
    const len = Math.hypot(dx, dz)
    segmentLengths.push(len)
    totalPathLength += len
  }
  return totalPathLength
}

export function getPathTotalLength(): number {
  return totalPathLength
}

/** pathT in [0,1] 沿路径前进 */
export function positionOnPath(path: PathNode[], pathT: number): { x: number; z: number; angle: number } {
  if (path.length === 0) return { x: 0, z: 0, angle: 0 }
  if (pathT <= 0) {
    const n = path[0]!
    const n2 = path[1] ?? n
    return { x: n.x, z: n.z, angle: Math.atan2(n2.z - n.z, n2.x - n.x) }
  }
  if (pathT >= 1) {
    const n = path[path.length - 1]!
    const n0 = path[path.length - 2] ?? n
    return { x: n.x, z: n.z, angle: Math.atan2(n.z - n0.z, n.x - n0.x) }
  }
  const dist = pathT * totalPathLength
  let acc = 0
  for (let i = 0; i < segmentLengths.length; i++) {
    const seg = segmentLengths[i]!
    if (acc + seg >= dist) {
      const local = (dist - acc) / (seg || 1)
      const p0 = path[i]!
      const p1 = path[i + 1]!
      return {
        x: p0.x + (p1.x - p0.x) * local,
        z: p0.z + (p1.z - p0.z) * local,
        angle: Math.atan2(p1.z - p0.z, p1.x - p0.x),
      }
    }
    acc += seg
  }
  const last = path[path.length - 1]!
  return { x: last.x, z: last.z, angle: 0 }
}

export function advancePathT(path: PathNode[], pathT: number, speed: number, dt: number): number {
  const len = totalPathLength || initPathMetrics(path)
  const delta = (speed * dt) / (len || GAME_CONFIG.cellSize)
  return pathT + delta
}