// ============================================================================
// 🎮 Phaser 全局类型声明（CDN 加载方式）
// ============================================================================
// 
// 📌 说明:
//   由于 Phaser 通过 CDN 加载，需要手动声明全局类型
//   这样 TypeScript 才能进行类型检查
// ============================================================================

/**
 * ⭐ Phaser 命名空间声明
 */
declare namespace Phaser {
  /**
   * ⭐ Scene 类
   */
  class Scene {
    /** 场景事件 emitter */
    events: EventEmitter
    
    /** 资源加载器 */
    load: LoaderPlugin
    
    /** 游戏对象工厂 */
    add: GameObjectFactory
    
    /** 场景宽度 */
    scale: ScaleManager
    
    /** 场景高度 */
    sys: SystemsPlugin
    
    /**
     * 场景生命周期 - preload 阶段
     */
    preload(): void
    
    /**
     * 场景生命周期 - create 阶段
     */
    create(): void
    
    /**
     * 场景生命周期 - update 阶段
     */
    update(time: number, delta: number): void
  }
  
  /**
   * ⭐ 事件发射器
   */
  class EventEmitter {
    emit(event: string, ...args: any[]): boolean
    on(event: string, listener: Function): this
    once(event: string, listener: Function): this
    off(event: string, listener?: Function): this
  }
  
  /**
   * ⭐ 资源加载插件
   */
  interface LoaderPlugin {
    image(key: string, url?: string): this
    audio(key: string, url?: string): this
    spritesheet(key: string, url?: string, config?: any): this
    json(key: string, url?: string): this
    start(): void
    on(event: string, callback: Function): this
  }
  
  /**
   * ⭐ 游戏对象工厂
   */
  interface GameObjectFactory {
    // 根据需要添加
  }
  
  /**
   * ⭐ 缩放管理器
   */
  interface ScaleManager {
    width: number
    height: number
  }
  
  /**
   * ⭐ 系统插件
   */
  interface SystemsPlugin {
    // 根据需要添加
  }
}

/**
 * ⭐ 导出 Scene 类型供导入使用
 */
export type Scene = Phaser.Scene

/**
 * 📦 JSON 模块声明（支持 import xxx.json）
 */
declare module '*.json' {
  const value: any
  export default value
}
