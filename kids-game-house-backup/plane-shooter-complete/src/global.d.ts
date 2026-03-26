// 全局类型声明 - Phaser 通过 CDN 引入

// 声明全局 Phaser 变量
declare const Phaser: typeof import('phaser').default

// 扩展 Window 接口，添加 Phaser 属性
interface Window {
  Phaser: typeof import('phaser').default
}
