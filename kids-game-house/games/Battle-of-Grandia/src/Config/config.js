/* eslint no-undef: 0 */
import 'phaser';

export default {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 640,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};
