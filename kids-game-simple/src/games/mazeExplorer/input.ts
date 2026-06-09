export class InputHandler {
  private keys: Set<string>;
  private mouseDeltaX: number;
  private mouseDeltaY: number;
  private isMouseLocked: boolean;
  private container: HTMLDivElement;
  private touchStartX: number;
  private touchStartY: number;
  private touchDeltaX: number;
  private touchDeltaY: number;
  private isTouching: boolean;

  constructor(container: HTMLDivElement) {
    this.keys = new Set();
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.isMouseLocked = false;
    this.container = container;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchDeltaX = 0;
    this.touchDeltaY = 0;
    this.isTouching = false;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key.toLowerCase());
    
    if (e.key === 'r' || e.key === 'R') {
      this.onReset?.();
    }
    
    if (e.key === 'm' || e.key === 'M') {
      this.onMinimapToggle?.();
    }
    
    if (e.key === 'Escape') {
      this.onPause?.();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isMouseLocked) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    }
  }

  private onMouseDown(): void {
    this.isMouseLocked = true;
    this.container.requestPointerLock?.();
  }

  private onMouseUp(): void {
    this.isMouseLocked = false;
    document.exitPointerLock?.();
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.container.getBoundingClientRect();
      
      if (touch.clientX > rect.width / 2) {
        this.isTouching = true;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
      }
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (this.isTouching && e.touches.length === 1) {
      const touch = e.touches[0];
      this.touchDeltaX = touch.clientX - this.touchStartX;
      this.touchDeltaY = touch.clientY - this.touchStartY;
      
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      
      e.preventDefault();
    }
  }

  private onTouchEnd(): void {
    this.isTouching = false;
    this.touchDeltaX = 0;
    this.touchDeltaY = 0;
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  getMouseDelta(): { x: number; y: number } {
    const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return delta;
  }

  getTouchDelta(): { x: number; y: number } {
    const delta = { x: this.touchDeltaX, y: this.touchDeltaY };
    this.touchDeltaX = 0;
    this.touchDeltaY = 0;
    return delta;
  }

  onReset?: () => void;
  onMinimapToggle?: () => void;
  onPause?: () => void;

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
}