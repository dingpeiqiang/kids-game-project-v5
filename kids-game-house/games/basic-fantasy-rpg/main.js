import 'phaser';

import PreloadScene from './src/scripts/scenes/PreloadScene';
import AuthenticationScene from './src/scripts/scenes/AuthenticationScene';
import CharacterSelectionScene from './src/scripts/scenes/CharacterSelectionScene';
import DungeonScene from './src/scripts/scenes/DungeonScene';
import UIScene from './src/scripts/scenes/UIScene';

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

const config = {
  backgroundColor: '#1c1117',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.DOM.CENTER_BOTH,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT
  },
  scene: [
    PreloadScene,
    AuthenticationScene,
    CharacterSelectionScene,
    DungeonScene,
    UIScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  }
};

window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
  
  // 支持 Vite 热更新
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('Game hot reloaded');
    });
  }
});