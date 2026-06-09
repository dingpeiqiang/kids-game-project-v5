import type { GameEngine as ExternalEngine } from '../../services/gameEngine';
import { CarParkingGame } from './game';

let gameInstance: CarParkingGame | null = null;

export function initCarParking3D(engine: ExternalEngine, onEnd: () => void): void {
  destroyCarParking3D();
  const canvasHost = document.getElementById('gameCanvas');
  if (!canvasHost) {
    console.error('[carParking3d] gameCanvas not found');
    return;
  }

  canvasHost.innerHTML = '';
  canvasHost.style.position = 'relative';
  canvasHost.style.width = '100%';
  canvasHost.style.height = '100%';
  canvasHost.style.overflow = 'hidden';

  const container = document.createElement('div');
  container.id = 'carParking3dRoot';
  container.style.cssText = 'width:100%;height:100%;position:relative;touch-action:none;';
  canvasHost.appendChild(container);

  let finished = false;
  const finishOnce = (score: number, victory: boolean) => {
    if (finished) return;
    finished = true;
    engine.setScore(score);
    engine.setVictory(victory);
    engine.setGameStats({
      level: gameInstance?.getState().currentLevel ?? 1,
      won: victory,
      gameTime: 0,
    });
    destroyCarParking3D();
    onEnd();
  };

  gameInstance = new CarParkingGame(container, {
    onScore: (score, victory) => {
      engine.setScore(score);
      engine.setVictory(victory);
    },
    onExit: () => {
      const state = gameInstance?.getState();
      const score = state?.score ?? 0;
      const victory = !!state?.isCompleted;
      finishOnce(score, victory);
    },
  });
}

export function destroyCarParking3D(): void {
  if (gameInstance) {
    gameInstance.destroy();
    gameInstance = null;
  }
  document.getElementById('carParking3dRoot')?.remove();
}

export { CarParkingGame } from './game';
export { LEVELS } from './config';
export type { GameState, CameraMode, Level } from './types';