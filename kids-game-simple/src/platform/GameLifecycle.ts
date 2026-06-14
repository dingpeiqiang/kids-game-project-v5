import type { GameEngine } from '../services/gameEngine'
import { gameActions } from './gameBridge'

export interface GameLifecycleContext {
  engine: GameEngine
  onEnd: () => void
  canvas: HTMLCanvasElement | null
  gameId: string
}

/**
 * 统一生命周期：Init → Update/Render 循环 → Pause/Resume → GameOver → Destroy
 * 子游戏继承并实现 onInit / onUpdate / onRender；可选 onPause / onResume / onDestroy
 */
export abstract class GameLifecycle {
  protected ctx: GameLifecycleContext
  private rafId = 0
  private lastTs = 0
  private destroyed = false

  constructor(ctx: GameLifecycleContext) {
    this.ctx = ctx
  }

  /** 子类：加载资源、初始化状态 */
  abstract onInit(): void | Promise<void>

  /** 子类：逻辑步进（dt 秒） */
  abstract onUpdate(dt: number): void

  /** 子类：绘制 */
  abstract onRender(): void

  /** 子类：释放监听、WebGL 等 */
  onDestroy(): void {}

  onPause(): void {}

  onResume(): void {}

  async start(): Promise<void> {
    await this.onInit()
    this.lastTs = performance.now()
    this.scheduleFrame()
  }

  destroy(): void {
    this.destroyed = true
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.onDestroy()
  }

  protected get engine(): GameEngine {
    return this.ctx.engine
  }

  /** 推荐：结束对局走事件 */
  protected finishGame(victory: boolean, score?: number, stats?: Record<string, unknown>): void {
    this.destroy()
    gameActions.gameOver({ victory, score, stats })
  }

  private scheduleFrame = () => {
    if (this.destroyed) return
    this.rafId = requestAnimationFrame(this.loop)
  }

  private loop = (ts: number) => {
    if (this.destroyed) return
    const canvas = this.ctx.canvas ?? document.getElementById('mainGameCanvas')
    if (!canvas || !document.body.contains(canvas)) {
      this.destroy()
      return
    }

    const engine = this.ctx.engine
    if (!engine.canTick()) {
      this.onRender()
      this.scheduleFrame()
      return
    }

    const dt = Math.min(0.05, (ts - this.lastTs) / 1000)
    this.lastTs = ts
    this.onUpdate(dt)
    this.onRender()
    this.scheduleFrame()
  }
}

export interface CanvasLifecycleImpl {
  onInit(): void | Promise<void>
  onUpdate(dt: number): void
  onRender(): void
  onDestroy?(): void
}

/** 托管 RAF 的工厂（竖屏 2D 试点） */
export function runCanvasLifecycle(ctx: GameLifecycleContext, impl: CanvasLifecycleImpl): GameLifecycle {
  class Host extends GameLifecycle {
    async onInit() {
      await impl.onInit()
    }
    onUpdate(dt: number) {
      impl.onUpdate(dt)
    }
    onRender() {
      impl.onRender()
    }
    onDestroy() {
      impl.onDestroy?.()
    }
  }
  const host = new Host(ctx)
  void host.start()
  return host
}