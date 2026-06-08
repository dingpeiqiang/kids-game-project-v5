export class VirtualJoystick {
  private container: HTMLDivElement;
  private joystick: HTMLDivElement | null = null;
  private base: HTMLDivElement | null = null;
  private isActive: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private baseX: number = 0;
  private baseY: number = 0;
  private maxDistance: number = 60;
  private deadZone: number = 5;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.createElements();
    this.setupEvents();
  }

  private createElements(): void {
    this.base = document.createElement('div');
    this.base.style.position = 'absolute';
    this.base.style.bottom = '30px';
    this.base.style.left = '30px';
    this.base.style.width = '120px';
    this.base.style.height = '120px';
    this.base.style.borderRadius = '50%';
    this.base.style.background = 'rgba(255, 255, 255, 0.2)';
    this.base.style.display = 'none';
    this.container.appendChild(this.base);

    this.joystick = document.createElement('div');
    this.joystick.style.position = 'absolute';
    this.joystick.style.width = '60px';
    this.joystick.style.height = '60px';
    this.joystick.style.borderRadius = '50%';
    this.joystick.style.background = 'rgba(255, 255, 255, 0.5)';
    this.joystick.style.left = '30px';
    this.joystick.style.top = '30px';
    this.joystick.style.touchAction = 'none';
    this.container.appendChild(this.joystick);
  }

  private setupEvents(): void {
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    const rect = this.container.getBoundingClientRect();
    
    if (touch.clientX < rect.width / 2) {
      this.isActive = true;
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.baseX = touch.clientX - rect.left;
      this.baseY = touch.clientY - rect.top;

      if (this.base) {
        this.base.style.left = `${this.baseX - 60}px`;
        this.base.style.top = `${this.baseY - 60}px`;
        this.base.style.display = 'block';
      }

      if (this.joystick) {
        this.joystick.style.left = `${this.baseX - 30}px`;
        this.joystick.style.top = `${this.baseY - 30}px`;
      }
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isActive) return;

    const touch = e.touches[0];
    const rect = this.container.getBoundingClientRect();
    
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let x = dx;
    let y = dy;

    if (distance > this.maxDistance) {
      x = (dx / distance) * this.maxDistance;
      y = (dy / distance) * this.maxDistance;
    }

    if (this.joystick) {
      this.joystick.style.left = `${this.baseX - 30 + x}px`;
      this.joystick.style.top = `${this.baseY - 30 + y}px`;
    }

    this.onMove?.(x, y);
  }

  private onTouchEnd(): void {
    if (!this.isActive) return;

    this.isActive = false;
    if (this.base) {
      this.base.style.display = 'none';
    }
    
    if (this.joystick) {
      this.joystick.style.left = `${this.baseX - 30}px`;
      this.joystick.style.top = `${this.baseY - 30}px`;
    }

    this.onMove?.(0, 0);
  }

  getValues(): { x: number; y: number } {
    if (!this.joystick) {
      return { x: 0, y: 0 };
    }
    const rect = this.joystick.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    const x = rect.left + rect.width / 2 - (this.baseX);
    const y = rect.top + rect.height / 2 - (this.baseY);

    return { x, y };
  }

  onMove?: (x: number, y: number) => void;

  dispose(): void {
    this.container.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.removeEventListener('touchend', this.onTouchEnd.bind(this));
    
    if (this.base) {
      this.container.removeChild(this.base);
    }
    if (this.joystick) {
      this.container.removeChild(this.joystick);
    }
  }
}