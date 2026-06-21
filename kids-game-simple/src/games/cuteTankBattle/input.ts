import type { Dir } from './types'
import {
  bindMobileControlPreset,
  getGameControlPreset,
  portraitActionLayout,
} from '../../platform/mobileControls'

export interface InputSnapshot {
  moveDir: Dir | null
  firePressed: boolean
}

function stickToDir(sx: number, sy: number): Dir | null {
  const dead = 0.35
  if (Math.abs(sx) < dead && Math.abs(sy) < dead) return null
  if (Math.abs(sx) > Math.abs(sy)) return sx > 0 ? 'right' : 'left'
  return sy > 0 ? 'down' : 'up'
}

export function createInputController(
  canvas: HTMLCanvasElement,
  viewWidth: number,
  viewHeight: number,
) {
  let moveDir: Dir | null = null
  let fireQueued = false

  const controls = bindMobileControlPreset(canvas, {
    preset: getGameControlPreset('cuteTankBattle'),
    viewWidth,
    viewHeight,
    layout: portraitActionLayout(viewWidth, viewHeight),
    keyboardProfile: {
      buttons: { Space: 'attack' },
    },
    onAction: (action, payload) => {
      if (action === 'move') {
        moveDir = stickToDir(payload.stickX ?? 0, payload.stickY ?? 0)
      }
      if (action === 'button_down' && payload.id === 'attack') {
        fireQueued = true
      }
    },
  })

  return {
    controls,
    getSnapshot(): InputSnapshot {
      const joy = controls.getJoystick()
      if (joy?.getState().active) {
        const o = joy.getState().output
        moveDir = stickToDir(o.x, o.y)
      }
      const firePressed = fireQueued
      fireQueued = false
      return { moveDir, firePressed }
    },
    dispose() {
      controls.dispose()
    },
  }
}

export function tryVibrate(ms: number) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}