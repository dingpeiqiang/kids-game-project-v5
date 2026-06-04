/**
 * Phaser 全局类型声明
 * 当使用 CDN 加载时，Phaser 作为全局变量存在
 */
declare global {
  const Phaser: typeof import('phaser');
}

export {};
