import LoadingScene from "./scenes/LoadingScene";
import MainScene from "./scenes/MainScene";
import PlayingScene from "./scenes/PlayingScene";
import GameoverScene from "./scenes/GameoverScene";

const Config = {
  width: 800,
  height: 600,
  backgroundColor: 0x000000,
  scene: [LoadingScene, MainScene, PlayingScene, GameoverScene],
  pixelArt: true,
  // 自适应全屏配置
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: import.meta.env.DEV && import.meta.env.VITE_DEBUG === "true",
    },
  },
};

export default Config;