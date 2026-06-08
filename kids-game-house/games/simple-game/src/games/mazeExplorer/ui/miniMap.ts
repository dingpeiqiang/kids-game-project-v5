import { Cell, Key, Trap, Position } from '../types';
import { UI_CONFIG } from '../config';

export class MiniMap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private container: HTMLDivElement;
  private visible: boolean;

  constructor(container: HTMLDivElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = UI_CONFIG.MINIMAP_SIZE;
    this.canvas.height = UI_CONFIG.MINIMAP_SIZE;
    this.ctx = this.canvas.getContext('2d');
    
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = `${UI_CONFIG.MINIMAP_PADDING}px`;
    this.canvas.style.right = `${UI_CONFIG.MINIMAP_PADDING}px`;
    this.canvas.style.border = `${UI_CONFIG.MINIMAP_BORDER_WIDTH}px solid ${UI_CONFIG.MINIMAP_BORDER_COLOR}`;
    this.canvas.style.borderRadius = '4px';
    this.canvas.style.background = 'rgba(0, 0, 0, 0.7)';
    
    this.container = container;
    this.container.appendChild(this.canvas);
    
    this.visible = true;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.canvas.style.display = visible ? 'block' : 'none';
  }

  getVisible(): boolean {
    return this.visible;
  }

  draw(maze: Cell[][], playerPosition: Position, keys: Key[], traps: Trap[], exitPosition: Position, cellSize: number): void {
    if (!this.visible || !this.ctx) return;

    const ctx = this.ctx;
    const size = UI_CONFIG.MINIMAP_SIZE;
    const padding = 5;
    const mazeWidth = maze[0].length * cellSize;
    const mazeHeight = maze.length * cellSize;
    const scale = (size - padding * 2) / Math.max(mazeWidth, mazeHeight);

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 1;

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const cell = maze[y][x];
        const px = padding + x * cellSize * scale;
        const py = padding + y * cellSize * scale;
        const cellPxSize = cellSize * scale;

        if (cell.walls.north) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + cellPxSize, py);
          ctx.stroke();
        }

        if (cell.walls.south) {
          ctx.beginPath();
          ctx.moveTo(px, py + cellPxSize);
          ctx.lineTo(px + cellPxSize, py + cellPxSize);
          ctx.stroke();
        }

        if (cell.walls.east) {
          ctx.beginPath();
          ctx.moveTo(px + cellPxSize, py);
          ctx.lineTo(px + cellPxSize, py + cellPxSize);
          ctx.stroke();
        }

        if (cell.walls.west) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + cellPxSize);
          ctx.stroke();
        }
      }
    }

    keys.forEach(key => {
      if (!key.collected) {
        const px = padding + key.position.x * scale;
        const py = padding + key.position.z * scale;
        
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px, py, UI_CONFIG.KEY_ICON_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    traps.forEach(trap => {
      if (trap.active) {
        const px = padding + trap.position.x * scale;
        const py = padding + trap.position.z * scale;
        
        let color: string;
        switch (trap.type) {
          case 'slow':
            color = '#f97316';
            break;
          case 'fog':
            color = '#8b5cf6';
            break;
          case 'time':
            color = '#ef4444';
            break;
          default:
            color = '#f97316';
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, UI_CONFIG.TRAP_ICON_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const exitPx = padding + exitPosition.x * scale;
    const exitPy = padding + exitPosition.z * scale;
    
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(exitPx, exitPy, UI_CONFIG.EXIT_ICON_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    const playerPx = padding + playerPosition.x * scale;
    const playerPy = padding + playerPosition.z * scale;
    
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(playerPx, playerPy, UI_CONFIG.PLAYER_ICON_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerPx, playerPy, UI_CONFIG.PLAYER_ICON_SIZE / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  dispose(): void {
    this.container.removeChild(this.canvas);
  }
}