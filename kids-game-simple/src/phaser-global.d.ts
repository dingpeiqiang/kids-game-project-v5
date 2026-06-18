/**
 * Phaser 全局类型（index.html CDN 加载，勿 import 'phaser'）
 */
declare global {
  const Phaser: typeof import('phaser')
}

export {}