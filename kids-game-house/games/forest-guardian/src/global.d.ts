// 全局类型声明 - Phaser 通过 CDN 引入，不打包进 bundle

// 声明全局 Phaser 变量（CDN 加载后挂载到 window.Phaser）
declare const Phaser: typeof import('phaser').default

// 扩展 Window 接口，添加 Phaser 属性
interface Window {
  Phaser: typeof import('phaser').default
}
