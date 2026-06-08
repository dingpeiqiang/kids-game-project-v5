import { RollingBallGame } from './game';

export function initRollingBall(container: HTMLElement): () => void {
  const game = new RollingBallGame(container);
  
  return () => {
    game.destroy();
  };
}
