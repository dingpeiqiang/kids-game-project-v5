import { CloudRunnerGame } from './game';

export function initCloudRunner(containerId: string = 'game-container'): CloudRunnerGame | null {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with id "${containerId}" not found`);
    return null;
  }

  const game = new CloudRunnerGame(container);
  return game;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    if (container) {
      initCloudRunner('game-container');
    }
  });
}