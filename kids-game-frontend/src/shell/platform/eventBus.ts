import type { GameEventName, GameEventPayloadMap } from './gameEvents'

type Handler<T = unknown> = (payload: T) => void

class EventBus {
  private listeners = new Map<string, Set<Handler>>()

  on<E extends GameEventName>(event: E, handler: (payload: GameEventPayloadMap[E]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as Handler)
    return () => this.off(event, handler as Handler)
  }

  once<E extends GameEventName>(event: E, handler: (payload: GameEventPayloadMap[E]) => void): () => void {
    const wrap = (payload: GameEventPayloadMap[E]) => {
      this.off(event, wrap as Handler)
      handler(payload)
    }
    return this.on(event, wrap)
  }

  off<E extends GameEventName>(event: E, handler: Handler): void {
    this.listeners.get(event)?.delete(handler)
  }

  emit<E extends GameEventName>(event: E, payload: GameEventPayloadMap[E]): void {
    const set = this.listeners.get(event)
    if (!set) return
    set.forEach(fn => {
      try {
        fn(payload)
      } catch (e) {
        console.error(`[eventBus] ${event}`, e)
      }
    })
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()