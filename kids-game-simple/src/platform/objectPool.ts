/**
 * 轻量对象池（粒子、飘字、通用对象），减少频繁 new 带来的 GC
 */
export class ObjectPool<T> {
  private free: T[] = []
  private factory: () => T
  private reset?: (item: T) => void
  private maxSize: number

  constructor(factory: () => T, options?: { reset?: (item: T) => void; maxSize?: number }) {
    this.factory = factory
    this.reset = options?.reset
    this.maxSize = options?.maxSize ?? 512
  }

  acquire(): T {
    return this.free.pop() ?? this.factory()
  }

  release(item: T): void {
    if (this.free.length >= this.maxSize) return
    this.reset?.(item)
    this.free.push(item)
  }

  clear(): void {
    this.free.length = 0
  }

  get size(): number {
    return this.free.length
  }
}

/** 2D 画布常用：临时对象池注册表（按 gameId 或全局） */
const pools = new Map<string, ObjectPool<unknown>>()

export function getPool<T>(key: string, factory: () => T, reset?: (item: T) => void): ObjectPool<T> {
  let p = pools.get(key) as ObjectPool<T> | undefined
  if (!p) {
    p = new ObjectPool(factory, { reset, maxSize: 256 })
    pools.set(key, p)
  }
  return p
}

export function clearAllPools(): void {
  pools.forEach(p => p.clear())
  pools.clear()
}