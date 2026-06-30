/**
 * 地下城视觉主题：按房间配色 / 类型区分（格兰之森、废墟、Boss 等）
 */

import type { DungeonRoom } from '../types'

export interface DungeonVisualTheme {
  id: 'forest' | 'cave' | 'ruins' | 'boss' | 'treasure' | 'rest' | 'secret'
  wallTop: string
  wallMid: string
  wallBottom: string
  pillarLight: string
  pillarDark: string
  brickStroke: string
  groundTop: string
  groundMid: string
  groundBottom: string
  slabStroke: string
  groundHighlight: string
  archStroke: string
  fogColor: string
}

function hexLuma(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function isGreenish(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return g > r + 15 && g > b
}

function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, Math.floor(parseInt(hex.slice(1, 3), 16) * (1 - amount)))
  const g = Math.max(0, Math.floor(parseInt(hex.slice(3, 5), 16) * (1 - amount)))
  const b = Math.max(0, Math.floor(parseInt(hex.slice(5, 7), 16) * (1 - amount)))
  return `rgb(${r},${g},${b})`
}

function lightenHex(hex: string, amount: number): string {
  const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * amount))
  const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * amount))
  const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * amount))
  return `rgb(${r},${g},${b})`
}

export function getDungeonTheme(room: DungeonRoom): DungeonVisualTheme {
  if (room.roomType === 'boss') {
    return {
      id: 'boss',
      wallTop: '#1a0808',
      wallMid: '#3d1515',
      wallBottom: '#4a2020',
      pillarLight: '#8a5555',
      pillarDark: '#5a3030',
      brickStroke: 'rgba(90, 30, 30, 0.45)',
      groundTop: '#4a3530',
      groundMid: '#3a2520',
      groundBottom: '#1a100c',
      slabStroke: 'rgba(100, 50, 40, 0.35)',
      groundHighlight: 'rgba(180, 80, 60, 0.45)',
      archStroke: 'rgba(120, 40, 40, 0.55)',
      fogColor: 'rgba(120, 0, 0, 0.06)',
    }
  }
  if (room.roomType === 'treasure') {
    return {
      id: 'treasure',
      wallTop: darkenHex(room.bgColor, 0.5),
      wallMid: room.bgColor,
      wallBottom: lightenHex(room.bgColor, 0.08),
      pillarLight: '#9a7a4a',
      pillarDark: '#6a5030',
      brickStroke: 'rgba(120, 90, 40, 0.4)',
      groundTop: '#5a4a38',
      groundMid: room.groundColor,
      groundBottom: darkenHex(room.groundColor, 0.35),
      slabStroke: 'rgba(140, 110, 60, 0.35)',
      groundHighlight: 'rgba(255, 200, 100, 0.5)',
      archStroke: 'rgba(180, 140, 60, 0.4)',
      fogColor: 'rgba(255, 200, 80, 0.05)',
    }
  }
  if (room.roomType === 'rest') {
    return {
      id: 'rest',
      wallTop: '#0f1a22',
      wallMid: '#1a3040',
      wallBottom: '#243848',
      pillarLight: '#6a8a9a',
      pillarDark: '#3a5560',
      brickStroke: 'rgba(60, 100, 120, 0.35)',
      groundTop: '#3a4a48',
      groundMid: '#2a3835',
      groundBottom: '#1a2420',
      slabStroke: 'rgba(80, 120, 100, 0.3)',
      groundHighlight: 'rgba(100, 220, 200, 0.35)',
      archStroke: 'rgba(80, 140, 160, 0.4)',
      fogColor: 'rgba(74, 222, 128, 0.04)',
    }
  }
  if (room.roomType === 'secret') {
    return {
      id: 'secret',
      wallTop: '#1a0a28',
      wallMid: '#2d1545',
      wallBottom: '#3a1a55',
      pillarLight: '#8a60aa',
      pillarDark: '#5a3080',
      brickStroke: 'rgba(120, 60, 160, 0.4)',
      groundTop: '#4a3a58',
      groundMid: '#352845',
      groundBottom: '#201528',
      slabStroke: 'rgba(160, 100, 200, 0.3)',
      groundHighlight: 'rgba(200, 120, 255, 0.35)',
      archStroke: 'rgba(180, 100, 220, 0.45)',
      fogColor: 'rgba(180, 80, 255, 0.06)',
    }
  }

  const forest = isGreenish(room.bgColor)
  const ruins = hexLuma(room.bgColor) > 45 && !forest

  if (forest) {
    return {
      id: 'forest',
      wallTop: '#0a1808',
      wallMid: room.bgColor,
      wallBottom: lightenHex(room.bgColor, 0.12),
      pillarLight: '#5a7050',
      pillarDark: '#2a4030',
      brickStroke: 'rgba(40, 70, 45, 0.45)',
      groundTop: lightenHex(room.groundColor, 0.05),
      groundMid: room.groundColor,
      groundBottom: darkenHex(room.groundColor, 0.4),
      slabStroke: 'rgba(60, 90, 50, 0.35)',
      groundHighlight: 'rgba(120, 180, 90, 0.45)',
      archStroke: 'rgba(50, 90, 55, 0.5)',
      fogColor: 'rgba(40, 80, 50, 0.08)',
    }
  }

  if (ruins) {
    return {
      id: 'ruins',
      wallTop: '#1a1810',
      wallMid: room.bgColor,
      wallBottom: lightenHex(room.bgColor, 0.1),
      pillarLight: '#7a7060',
      pillarDark: '#4a4540',
      brickStroke: 'rgba(70, 65, 55, 0.45)',
      groundTop: '#5a5048',
      groundMid: room.groundColor,
      groundBottom: darkenHex(room.groundColor, 0.35),
      slabStroke: 'rgba(90, 80, 70, 0.35)',
      groundHighlight: 'rgba(160, 150, 120, 0.4)',
      archStroke: 'rgba(90, 85, 70, 0.5)',
      fogColor: 'rgba(80, 70, 50, 0.06)',
    }
  }

  return {
    id: 'cave',
    wallTop: darkenHex(room.bgColor, 0.55),
    wallMid: room.bgColor,
    wallBottom: lightenHex(room.bgColor, 0.08),
    pillarLight: '#7a5555',
    pillarDark: '#5a4040',
    brickStroke: 'rgba(60, 30, 30, 0.4)',
    groundTop: lightenHex(room.groundColor, 0.05),
    groundMid: room.groundColor,
    groundBottom: darkenHex(room.groundColor, 0.4),
    slabStroke: 'rgba(80, 60, 40, 0.3)',
    groundHighlight: 'rgba(120, 100, 80, 0.4)',
    archStroke: 'rgba(80, 40, 40, 0.5)',
    fogColor: 'rgba(0, 0, 0, 0.08)',
  }
}