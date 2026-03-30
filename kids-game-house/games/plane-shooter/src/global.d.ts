/// <reference types="phaser" />

declare global {
  interface Window {
    Phaser: typeof import('phaser')
  }
}

export {}
