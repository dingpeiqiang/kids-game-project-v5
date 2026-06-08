export { MazeExplorerGame } from './game';

export function initMazeExplorer(container: HTMLElement): void {
  const gameContainer = document.createElement('div');
  gameContainer.style.width = '100%';
  gameContainer.style.height = '100%';
  gameContainer.style.position = 'relative';
  container.appendChild(gameContainer);

  const { MazeExplorerGame } = require('./game');
  const game = new MazeExplorerGame(gameContainer);

  const cleanup = () => {
    game.destroy();
    container.removeChild(gameContainer);
    window.removeEventListener('beforeunload', cleanup);
  };

  window.addEventListener('beforeunload', cleanup);
}