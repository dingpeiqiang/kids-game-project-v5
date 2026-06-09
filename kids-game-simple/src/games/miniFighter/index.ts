import { MiniFighterGame } from './game';

export function initMiniFighter(container: HTMLElement): MiniFighterGame {
  return new MiniFighterGame(container);
}

export { MiniFighterGame } from './game';