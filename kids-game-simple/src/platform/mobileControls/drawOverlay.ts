import type { MobileControlSnapshot } from './types'
import type { VirtualJoystick } from './VirtualJoystick'

export function drawMobileControlOverlay(
  ctx: CanvasRenderingContext2D,
  snapshot: MobileControlSnapshot,
  joystick?: VirtualJoystick | null,
): void {
  ctx.save()
  ctx.globalAlpha = 0.88

  if (joystick) {
    joystick.draw(ctx, {
      showIdleHint: snapshot.preset !== 'joystick_dynamic',
    })
  }

  for (const btn of snapshot.buttons) {
    ctx.fillStyle = btn.pressed ? 'rgba(78, 205, 196, 0.45)' : 'rgba(255,255,255,0.22)'
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(btn.cx, btn.cy, btn.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (btn.label) {
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.max(14, Math.round(btn.r * 0.42))}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(btn.label, btn.cx, btn.cy)
    }
  }

  ctx.restore()
}