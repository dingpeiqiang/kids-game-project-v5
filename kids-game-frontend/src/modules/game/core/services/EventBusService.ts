import {
  IEventBusService,
  EventBusConfig,
  IEventListener,
} from '../interfaces/ServiceInterface';

/**
 * 事件总线服务实现
 * 提供事件的发布、订阅功能，实现游戏各模块之间的解耦通信
 */
export class EventBusService implements IEventBusService {
  private config: EventBusConfig;
  private listeners: Map<string, IEventListener[]> = new Map();
  private eventQueue: Array<{ eventType: string; data: any }> = [];
  private isInitialized: boolean = false;

  constructor(config?: Partial<EventBusConfig>) {
    this.config = {
      enableLogging: false,
      maxQueueSize: 1000,
      enablePriority: false,
      ...config,
    };
  }

  /**
   * 初始化事件总线
   */
  initialize(config: EventBusConfig): void {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;
    this.log('EventBus initialized', config);
  }

  /**
   * 订阅事件
   */
  on(eventType: string, callback: (data: any) => void): void {
    this.addListener(eventType, {
      eventType,
      callback,
      once: false,
      priority: 0,
    });
  }

  /**
   * 订阅一次性事件
   */
  once(eventType: string, callback: (data: any) => void): void {
    this.addListener(eventType, {
      eventType,
      callback,
      once: true,
      priority: 0,
    });
  }

  /**
   * 添加监听器
   */
  private addListener(eventType: string, listener: IEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listeners = this.listeners.get(eventType)!;
    listeners.push(listener);

    // 如果启用优先级，按优先级排序
    if (this.config.enablePriority) {
      listeners.sort((a, b) => b.priority - a.priority);
    }

    this.log(`Added listener for event: ${eventType}`, {
      listenerCount: listeners.length,
      once: listener.once,
      priority: listener.priority,
    });
  }

  /**
   * 取消订阅
   */
  off(eventType: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;

    const index = listeners.findIndex(l => l.callback === callback);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.log(`Removed listener for event: ${eventType}`);
    }

    // 如果没有监听器了，删除键
    if (listeners.length === 0) {
      this.listeners.delete(eventType);
    }
  }

  /**
   * 取消事件类型的所有订阅
   */
  offAll(eventType: string): void {
    const count = this.listenerCount(eventType);
    this.listeners.delete(eventType);
    this.log(`Removed all listeners for event: ${eventType}`, { count });
  }

  /**
   * 发送事件
   */
  emit(eventType: string, data: any): void {
    if (!this.isInitialized) {
      console.warn('[EventBus] Event emitted before initialization:', eventType);
    }

    // 添加到事件队列
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.error('[EventBus] Event queue is full, dropping event:', eventType);
      return;
    }

    this.eventQueue.push({ eventType, data });

    // 处理队列
    this.processQueue();
  }

  /**
   * 处理事件队列
   */
  private processQueue(): void {
    while (this.eventQueue.length > 0) {
      const { eventType, data } = this.eventQueue.shift()!;
      this.dispatchEvent(eventType, data);
    }
  }

  /**
   * 分发事件
   */
  private dispatchEvent(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType);
    if (!listeners || listeners.length === 0) {
      this.log(`No listeners for event: ${eventType}`);
      return;
    }

    this.log(`Dispatching event: ${eventType}`, { listenerCount: listeners.length });

    // 复制数组以避免在迭代时修改
    const listenersCopy = [...listeners];

    for (const listener of listenersCopy) {
      try {
        listener.callback(data);

        // 如果是一次性监听器，移除它
        if (listener.once) {
          this.off(eventType, listener.callback);
        }
      } catch (error) {
        console.error(`[EventBus] Error in event listener for ${eventType}:`, error);
      }
    }
  }

  /**
   * 异步发送事件
   */
  async emitAsync(eventType: string, data: any): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.emit(eventType, data);
        resolve();
      }, 0);
    });
  }

  /**
   * 清空所有订阅
   */
  clear(): void {
    const count = this.listeners.size;
    this.listeners.clear();
    this.eventQueue = [];
    this.log('Cleared all event listeners', { count });
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(eventType: string): number {
    const listeners = this.listeners.get(eventType);
    return listeners ? listeners.length : 0;
  }

  /**
   * 获取所有事件类型
   */
  eventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * 记录日志
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[EventBus] ${message}`, data ? data : '');
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    return {
      eventTypes: this.eventTypes(),
      totalListeners: Array.from(this.listeners.values()).reduce(
        (sum, listeners) => sum + listeners.length,
        0
      ),
      queueLength: this.eventQueue.length,
      queueCapacity: this.config.maxQueueSize,
      isInitialized: this.isInitialized,
    };
  }
}
