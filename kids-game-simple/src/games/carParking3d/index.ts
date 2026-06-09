import { CarParkingGame } from './game';

export function initCarParking3D(container: HTMLDivElement): CarParkingGame {
  return new CarParkingGame(container);
}

export { CarParkingGame } from './game';
export { LEVELS } from './config';
export type { GameState, CameraMode, Level } from './types';
