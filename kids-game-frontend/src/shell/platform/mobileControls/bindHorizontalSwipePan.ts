import { bindCanvasHorizontalDrag } from '../../utils/canvasMobileUtils'
import { bindDesktopControls } from './bindDesktop'
import { mergeLayout } from './layout'
import type { MobileControlHandler } from './types'

export interface BindHorizontalSwipePanOptions {
  canvas: HTMLCanvasElement
  viewWidth: number
  viewHeight: number
  /** 每帧/每次拖拽的横向位移（逻辑像素） */
  onHorizontalDelta: (deltaX: number) => void
  /** PC 方向键每 tick 位移系数（与 stickX * speed 配合） */
  keyboardMoveSpeed?: number
  onAction?: MobileControlHandler
}

/**
 * dodge 等「横向跟手 + 方向键」混合接入（设计 §5.2）。
 * 返回单一 dispose，须在对局结束/销毁时调用。
 */
export function bindHorizontalSwipePan(options: BindHorizontalSwipePanOptions): () => void {
  const {
    canvas,
    viewWidth,
    viewHeight,
    onHorizontalDelta,
    keyboardMoveSpeed = 7,
    onAction,
  } = options

  const layout = mergeLayout(viewWidth, viewHeight, {
    viewWidth,
    viewHeight,
    buttons: [],
  })

  const unbindDesktop = bindDesktopControls({
    canvas,
    preset: 'swipe_pan',
    layout,
    enablePointer: false,
    onAction: (action, payload) => {
      onAction?.(action, payload)
      if (action === 'move' && payload.source === 'keyboard') {
        const sx = payload.stickX ?? 0
        if (sx !== 0) onHorizontalDelta(sx * keyboardMoveSpeed)
      }
    },
  })

  const unbindDrag = bindCanvasHorizontalDrag(canvas, deltaX => {
    onHorizontalDelta(deltaX)
  })

  return () => {
    unbindDrag()
    unbindDesktop()
  }
}