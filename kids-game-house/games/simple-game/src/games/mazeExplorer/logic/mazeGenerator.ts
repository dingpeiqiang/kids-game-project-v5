import { Cell, Position, Key, Trap, MazeConfig } from '../types';

export class MazeGenerator {
  private size: number;
  private cellSize: number;
  private maze: Cell[][];

  constructor(config: MazeConfig) {
    this.size = config.size;
    this.cellSize = config.cellSize;
    this.maze = this.createGrid();
  }

  private createGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let y = 0; y < this.size; y++) {
      grid[y] = [];
      for (let x = 0; x < this.size; x++) {
        grid[y][x] = {
          x,
          y,
          walls: {
            north: true,
            south: true,
            east: true,
            west: true,
          },
          visited: false,
        };
      }
    }
    return grid;
  }

  private getUnvisitedNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const { x, y } = cell;

    if (y > 0 && !this.maze[y - 1][x].visited) {
      neighbors.push(this.maze[y - 1][x]);
    }
    if (y < this.size - 1 && !this.maze[y + 1][x].visited) {
      neighbors.push(this.maze[y + 1][x]);
    }
    if (x > 0 && !this.maze[y][x - 1].visited) {
      neighbors.push(this.maze[y][x - 1]);
    }
    if (x < this.size - 1 && !this.maze[y][x + 1].visited) {
      neighbors.push(this.maze[y][x + 1]);
    }

    return neighbors;
  }

  private removeWall(current: Cell, next: Cell): void {
    const xDiff = next.x - current.x;
    const yDiff = next.y - current.y;

    if (xDiff === 1) {
      current.walls.east = false;
      next.walls.west = false;
    } else if (xDiff === -1) {
      current.walls.west = false;
      next.walls.east = false;
    } else if (yDiff === 1) {
      current.walls.south = false;
      next.walls.north = false;
    } else if (yDiff === -1) {
      current.walls.north = false;
      next.walls.south = false;
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generate(): Cell[][] {
    const startCell = this.maze[0][0];
    startCell.visited = true;

    const stack: Cell[] = [startCell];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current);

      if (neighbors.length > 0) {
        const next = this.shuffle(neighbors)[0];
        next.visited = true;
        this.removeWall(current, next);
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    return this.maze;
  }

  getMaze(): Cell[][] {
    return this.maze;
  }

  getCenterPosition(): Position {
    const centerX = (this.size * this.cellSize) / 2 - this.cellSize / 2;
    const centerZ = (this.size * this.cellSize) / 2 - this.cellSize / 2;
    return { x: centerX, y: 0, z: centerZ };
  }

  getStartPosition(): Position {
    return {
      x: this.cellSize / 2,
      y: 0,
      z: this.cellSize / 2,
    };
  }

  getExitPosition(): Position {
    return {
      x: (this.size - 1) * this.cellSize + this.cellSize / 2,
      y: 0,
      z: (this.size - 1) * this.cellSize + this.cellSize / 2,
    };
  }

  generateRandomPositions(count: number, excludePositions: Position[] = []): Position[] {
    const positions: Position[] = [];
    const availableCells: { x: number; y: number }[] = [];

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const pos = { x: x * this.cellSize + this.cellSize / 2, y: 0, z: y * this.cellSize + this.cellSize / 2 };
        const isExcluded = excludePositions.some(
          ep => Math.abs(ep.x - pos.x) < this.cellSize && Math.abs(ep.z - pos.z) < this.cellSize
        );
        if (!isExcluded) {
          availableCells.push({ x, y });
        }
      }
    }

    const shuffled = this.shuffle(availableCells);
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const cell = shuffled[i];
      positions.push({
        x: cell.x * this.cellSize + this.cellSize / 2,
        y: 0,
        z: cell.y * this.cellSize + this.cellSize / 2,
      });
    }

    return positions;
  }

  generateKeys(count: number, exitPosition: Position): Key[] {
    const excludePositions = [this.getStartPosition(), exitPosition];
    const positions = this.generateRandomPositions(count, excludePositions);

    return positions.map((pos, index) => ({
      id: index,
      position: pos,
      collected: false,
    }));
  }

  generateTraps(count: number, exitPosition: Position, keyPositions: Position[]): Trap[] {
    const excludePositions = [this.getStartPosition(), exitPosition, ...keyPositions];
    const positions = this.generateRandomPositions(count, excludePositions);
    const trapTypes: ('slow' | 'fog' | 'time')[] = ['slow', 'fog', 'time'];

    return positions.map((pos, index) => ({
      id: index,
      position: pos,
      type: trapTypes[index % trapTypes.length],
      active: true,
    }));
  }
}