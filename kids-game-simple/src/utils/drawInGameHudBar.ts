/**
 * Canvas 局内 HUD 条（不含得分，得分由 GamePlayShellHeader 展示）
 */
export interface InGameHudBarOptions {
  width: number;
  /** 条高度，默认 44 */
  height?: number;
  /** 距顶偏移，默认 8 */
  top?: number;
  /** 水平内边距，默认 10 */
  padX?: number;
}

export function drawInGameHudBar(
  ctx: CanvasRenderingContext2D,
  opts: InGameHudBarOptions,
): { barY: number; barH: number; centerY: number; leftX: number; rightX: number } {
  const height = opts.height ?? 44;
  const top = opts.top ?? 8;
  const padX = opts.padX ?? 10;
  const barW = opts.width - padX * 2;
  const barY = top;
  const centerY = barY + height / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, padX, barY, barW, height, 12);
  ctx.fill();

  return {
    barY,
    barH: height,
    centerY,
    leftX: padX + 14,
    rightX: opts.width - padX - 14,
  };
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}