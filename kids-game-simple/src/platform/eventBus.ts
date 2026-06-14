type Handler<T = unknown> = (payload: T) => void

class EventBus {
  private listeners = new Map<string, Set<Handler>>()

  on<E extends string>(event: E, handler: Handler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as Handler)
    return () => this.off(event, handler)
  }

  once<E extends string>(event: E, handler: Handler): () => void {
    const wrap: Handler = payload => {
      this.off(event, wrap)
      handler(payload)
    }
    return this.on(event, wrap)
  }

  off<E extends string>(event: E, handler: Handler): void {
    this.listeners.get(event)?.delete(handler as Handler)
  }

  emit<E extends string>(event: E, payload?: unknown): void {
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