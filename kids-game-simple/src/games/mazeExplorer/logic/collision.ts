import { Position, Cell } from '../types';
import { GAME_CONFIG } from '../config';

export class CollisionDetector {
  private maze: Cell[][];
  private cellSize: number;
  private playerRadius: number;

  constructor(maze: Cell[][], cellSize: number) {
    this.maze = maze;
    this.cellSize = cellSize;
    this.playerRadius = GAME_CONFIG.PLAYER_RADIUS;
  }

  private getCellFromPosition(position: Position): Cell | null {
    const cellX = Math.floor(position.x / this.cellSize);
    const cellZ = Math.floor(position.z / this.cellSize);

    if (cellX < 0 || cellX >= this.maze[0].length || cellZ < 0 || cellZ >= this.maze.length) {
      return null;
    }

    return this.maze[cellZ][cellX];
  }

  private getNeighboringCells(position: Position): Cell[] {
    const cells: Cell[] = [];
    const cellX = Math.floor(position.x / this.cellSize);
    const cellZ = Math.floor(position.z / this.cellSize);

    const offsets = [
      { dx: 0, dz: 0 },
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 },
    ];

    for (const offset of offsets) {
      const nx = cellX + offset.dx;
      const nz = cellZ + offset.dz;

      if (nx >= 0 && nx < this.maze[0].length && nz >= 0 && nz < this.maze.length) {
        cells.push(this.maze[nz][nx]);
      }
    }

    return cells;
  }

  private checkWallCollision(position: Position, deltaX: number, deltaZ: number): boolean {
    const cells = this.getNeighboringCells(position);

    for (const cell of cells) {
      const cellCenterX = cell.x * this.cellSize + this.cellSize / 2;
      const cellCenterZ = cell.y * this.cellSize + this.cellSize / 2;

      if (cell.walls.north) {
        const wallZ = cellCenterZ - this.cellSize / 2;
        if (
          Math.abs(position.x + deltaX - cellCenterX) < this.cellSize / 2 + this.playerRadius &&
          Math.abs(position.z + deltaZ - wallZ) < this.playerRadius
        ) {
          return true;
        }
      }

      if (cell.walls.south) {
        const wallZ = cellCenterZ + this.cellSize / 2;
        if (
          Math.abs(position.x + deltaX - cellCenterX) < this.cellSize / 2 + this.playerRadius &&
          Math.abs(position.z + deltaZ - wallZ) < this.playerRadius
        ) {
          return true;
        }
      }

      if (cell.walls.east) {
        const wallX = cellCenterX + this.cellSize / 2;
        if (
          Math.abs(position.x + deltaX - wallX) < this.playerRadius &&
          Math.abs(position.z + deltaZ - cellCenterZ) < this.cellSize / 2 + this.playerRadius
        ) {
          return true;
        }
      }

      if (cell.walls.west) {
        const wallX = cellCenterX - this.cellSize / 2;
        if (
          Math.abs(position.x + deltaX - wallX) < this.playerRadius &&
          Math.abs(position.z + deltaZ - cellCenterZ) < this.cellSize / 2 + this.playerRadius
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private checkBoundaryCollision(position: Position, deltaX: number, deltaZ: number): boolean {
    const mazeWidth = this.maze[0].length * this.cellSize;
    const mazeHeight = this.maze.length * this.cellSize;

    const newX = position.x + deltaX;
    const newZ = position.z + deltaZ;

    if (newX - this.playerRadius < 0 || newX + this.playerRadius > mazeWidth) {
      return true;
    }

    if (newZ - this.playerRadius < 0 || newZ + this.playerRadius > mazeHeight) {
      return true;
    }

    return false;
  }

  checkCollision(position: Position, deltaX: number, deltaZ: number): boolean {
    return (
      this.checkBoundaryCollision(position, deltaX, deltaZ) ||
      this.checkWallCollision(position, deltaX, deltaZ)
    );
  }

  checkItemCollision(playerPos: Position, itemPos: Position, itemRadius: number = 0.5): boolean {
    const dx = playerPos.x - itemPos.x;
    const dz = playerPos.z - itemPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < this.playerRadius + itemRadius;
  }
}