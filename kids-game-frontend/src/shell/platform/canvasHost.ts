/**
 * 2D 主画布访问（由 gameShell 创建 #mainGameCanvas）
 * 后续可扩展为单例 resize / DPR 管理
 */
export function getMainGameCanvas(): HTMLCanvasElement | null {
  return document.getElementById('mainGameCanvas') as HTMLCanvasElement | null
}

export function requireMainGameCanvas(): HTMLCanvasElement {
  const c = getMainGameCanvas()
  if (!c) throw new Error('[canvasHost] #mainGameCanvas not found — mount game shell first')
  return c
}