import { Jump3DGame } from './game';

export function initJump3D(container: HTMLDivElement): Jump3DGame {
  return new Jump3DGame(container);
}

export { Jump3DGame } from './game';
