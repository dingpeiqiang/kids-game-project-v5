/**
 * Canvas 局内 HUD 辅助（得分由 GamePlayShellHeader 展示，勿在画布重复画分）
 */
import type { GameEngine } from '@shell/services/gameEngine';

export function shouldGameTick(engine: GameEngine): boolean {
  return engine.canTick();
}

/** 局内顶条：仅倒计时等，不含分数 */
export function drawCountdownBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  label: string,
  y = 28,
  urgent = false,
) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  const barW = Math.min(w - 24, 320);
  const x = (w - barW) / 2;
  ctx.roundRect(x, 8, barW, 36, 10);
  ctx.fill();
  ctx.fillStyle = urgent ? '#FF4757' : '#FFD700';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, y);
}