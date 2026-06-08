import { ChinaMap3DGame } from './game';

export function initChinaMap3D(container: HTMLDivElement): ChinaMap3DGame {
  return new ChinaMap3DGame(container);
}

export { ChinaMap3DGame } from './game';
export { GAME_CONFIG, QUESTIONS, COLORS } from './config';
export { loadRecords, resetRecords } from './logic/storage';