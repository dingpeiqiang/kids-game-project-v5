import type { InputState } from './types';

export class InputHandler {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private hasMoved: boolean = false;
  private callbacks: Record<string, () => void> = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.inputState = {
      left: false,
      right: false,
      jump: false,
      crouch: false,
      reset: false,
    };
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.canvas.addEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.inputState.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.inputState.right = true;
        break;
      case ' ':
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        this.inputState.jump = true;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.inputState.crouch = true;
        break;
      case 'r':
      case 'R':
        this.inputState.reset = true;
        this.callbacks['reset']?.();
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.inputState.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.inputState.right = false;
        break;
      case ' ':
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.inputState.jump = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.inputState.crouch = false;
        break;
      case 'r':
      case 'R':
        this.inputState.reset = false;
        break;
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.hasMoved = false;
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      this.hasMoved = true;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) {
          this.inputState.right = true;
          this.inputState.left = false;
        } else if (dx < -30) {
          this.inputState.left = true;
          this.inputState.right = false;
        }
      } else {
        if (dy < -30) {
          this.inputState.jump = true;
        } else if (dy > 30) {
          this.inputState.crouch = true;
        }
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    
    if (!this.hasMoved && Date.now() - this.touchStartTime < 300) {
      const touch = e.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      if (x < rect.width / 2) {
        this.inputState.left = true;
      } else {
        this.inputState.right = true;
      }
      
      setTimeout(() => {
        this.inputState.left = false;
        this.inputState.right = false;
      }, 100);
    }

    this.inputState.jump = false;
    this.inputState.crouch = false;
    this.hasMoved = false;
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      this.inputState.left = true;
    } else {
      this.inputState.right = true;
    }
  }

  private handleMouseUp(): void {
    this.inputState.left = false;
    this.inputState.right = false;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!e.buttons) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      this.inputState.left = true;
      this.inputState.right = false;
    } else {
      this.inputState.right = true;
      this.inputState.left = false;
    }
  }

  getInput(): InputState {
    return { ...this.inputState };
  }

  setCallback(event: string, callback: () => void): void {
    this.callbacks[event] = callback;
  }

  cleanup(): void {
    this.canvas.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.canvas.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}