import { GameLogic } from './logic/gameLogic';
import { MazeScene } from './render/scene';
import { HUD } from './ui/hud';
import { MiniMap } from './ui/miniMap';
import { VirtualJoystick } from './ui/joystick';
import { InputHandler } from './input';
import { GAME_CONFIG, LEVEL_CONFIGS } from './config';

export class MazeExplorerGame {
  private container: HTMLDivElement;
  private gameLogic: GameLogic;
  private scene: MazeScene;
  private hud: HUD;
  private minimap: MiniMap;
  private joystick: VirtualJoystick;
  private inputHandler: InputHandler;
  private isGameStarted: boolean;
  private lastTime: number;
  private animationId: number | null = null;
  private joystickX: number;
  private joystickY: number;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.overflow = 'hidden';

    this.gameLogic = new GameLogic();
    this.scene = new MazeScene(container);
    this.hud = new HUD(container);
    this.minimap = new MiniMap(container);
    this.joystick = new VirtualJoystick(container);
    this.inputHandler = new InputHandler(container);

    this.isGameStarted = false;
    this.lastTime = 0;
    this.joystickX = 0;
    this.joystickY = 0;

    this.setupEventListeners();
    this.showStartScreen();
  }

  private setupEventListeners(): void {
    this.hud.onPauseClick = () => this.gameLogic.togglePause();
    this.hud.onResetClick = () => this.resetLevel();
    this.hud.onMinimapToggle = () => this.toggleMinimap();
    this.hud.onNextLevel = () => this.nextLevel();
    this.hud.onResetLevel = () => this.resetLevel();
    this.hud.onRestartFromBeginning = () => this.restartFromBeginning();
    this.hud.onStartGame = () => this.startGame();

    this.inputHandler.onReset = () => this.resetLevel();
    this.inputHandler.onMinimapToggle = () => this.toggleMinimap();
    this.inputHandler.onPause = () => this.gameLogic.togglePause();

    this.joystick.onMove = (x, y) => {
      this.joystickX = x / 60;
      this.joystickY = y / 60;
    };
  }

  private showStartScreen(): void {
    this.hud.showModal('start', {
      highLevel: this.gameLogic.getSavedHighLevel(),
    });
  }

  private startGame(): void {
    this.isGameStarted = true;
    this.gameLogic.initLevel(1);
    this.setupScene();
    this.scene.animate();
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private setupScene(): void {
    const levelConfig = this.gameLogic.getLevelConfig();
    const maze = this.gameLogic.getMaze();
    const keys = this.gameLogic.getKeys();
    const traps = this.gameLogic.getTraps();
    const exitPosition = this.gameLogic.getExitPosition();

    this.scene.createMaze(maze, levelConfig.cellSize, GAME_CONFIG.WALL_HEIGHT);
    this.scene.createKeys(keys);
    this.scene.createTraps(traps);
    this.scene.createExit(exitPosition);
    this.scene.setFogEnabled(levelConfig.hasFog);
    this.scene.setFogRadius(levelConfig.fogRadius);
  }

  private gameLoop(): void {
    this.animationId = requestAnimationFrame(() => this.gameLoop());

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.gameLogic.update(deltaTime);
    this.handleInput(deltaTime);
    this.updateScene();
    this.updateUI();
    this.checkGameState();
  }

  private handleInput(deltaTime: number): void {
    if (this.inputHandler.isKeyPressed('w') || this.joystickY < -0.2) {
      this.gameLogic.movePlayer('forward', deltaTime);
    }
    if (this.inputHandler.isKeyPressed('s') || this.joystickY > 0.2) {
      this.gameLogic.movePlayer('backward', deltaTime);
    }
    if (this.inputHandler.isKeyPressed('a') || this.joystickX < -0.2) {
      this.gameLogic.movePlayer('left', deltaTime);
    }
    if (this.inputHandler.isKeyPressed('d') || this.joystickX > 0.2) {
      this.gameLogic.movePlayer('right', deltaTime);
    }

    const mouseDelta = this.inputHandler.getMouseDelta();
    const touchDelta = this.inputHandler.getTouchDelta();

    const rotation = mouseDelta.x * GAME_CONFIG.ROTATION_SPEED + 
                     touchDelta.x * GAME_CONFIG.TOUCH_ROTATION_SENSITIVITY;
    this.gameLogic.rotatePlayer(rotation);
  }

  private updateScene(): void {
    const playerPosition = this.gameLogic.getPlayerPosition();
    const playerRotation = this.gameLogic.getPlayerRotation();
    const playerStats = this.gameLogic.getPlayerStats();

    this.scene.updateCamera(playerPosition, playerRotation);
    this.scene.setFogRadius(playerStats.visionRadius);

    const keys = this.gameLogic.getKeys();
    keys.forEach(key => {
      this.scene.updateKey(key.id, key.collected);
    });

    const traps = this.gameLogic.getTraps();
    traps.forEach(trap => {
      this.scene.updateTrap(trap.id, trap.active);
    });

    this.minimap.draw(
      this.gameLogic.getMaze(),
      playerPosition,
      keys,
      traps,
      this.gameLogic.getExitPosition(),
      this.gameLogic.getLevelConfig().cellSize
    );
  }

  private updateUI(): void {
    const gameState = this.gameLogic.getGameState();
    this.hud.update(gameState);
  }

  private checkGameState(): void {
    const gameState = this.gameLogic.getGameState();

    if (gameState.isVictory) {
      this.scene.stop();
      this.hud.showModal('victory', {
        level: gameState.currentLevel,
        time: this.gameLogic.getLevelConfig().timeLimit - gameState.timeRemaining,
        score: gameState.score,
        highLevel: this.gameLogic.getSavedHighLevel(),
      });
    } else if (gameState.isGameOver) {
      this.scene.stop();
      this.hud.showModal('gameover', {
        highLevel: this.gameLogic.getSavedHighLevel(),
      });
    }
  }

  private toggleMinimap(): void {
    const isVisible = this.minimap.getVisible();
    this.minimap.setVisible(!isVisible);
  }

  private resetLevel(): void {
    this.gameLogic.resetLevel();
    this.setupScene();
    this.scene.animate();
  }

  private nextLevel(): void {
    this.gameLogic.nextLevel();
    this.setupScene();
    this.scene.animate();
  }

  private restartFromBeginning(): void {
    this.gameLogic.initLevel(1);
    this.setupScene();
    this.scene.animate();
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.scene.dispose();
    this.hud.dispose();
    this.minimap.dispose();
    this.joystick.dispose();
    this.inputHandler.dispose();
  }
}