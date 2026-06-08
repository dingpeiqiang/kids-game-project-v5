import { GameState } from '../types';

export class HUD {
  private container: HTMLDivElement;
  private levelElement: HTMLDivElement | null = null;
  private timeElement: HTMLDivElement | null = null;
  private keysElement: HTMLDivElement | null = null;
  private scoreElement: HTMLDivElement | null = null;
  private pauseButton: HTMLButtonElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private minimapButton: HTMLButtonElement | null = null;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.createElements();
  }

  private createElements(): void {
    const hud = document.createElement('div');
    hud.style.position = 'absolute';
    hud.style.top = '0';
    hud.style.left = '0';
    hud.style.right = '0';
    hud.style.padding = '10px';
    hud.style.display = 'flex';
    hud.style.justifyContent = 'space-between';
    hud.style.alignItems = 'flex-start';
    hud.style.pointerEvents = 'none';
    this.container.appendChild(hud);

    const leftPanel = document.createElement('div');
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.gap = '5px';
    hud.appendChild(leftPanel);

    this.levelElement = document.createElement('div');
    this.levelElement.style.color = '#ffffff';
    this.levelElement.style.fontSize = '18px';
    this.levelElement.style.fontWeight = 'bold';
    this.levelElement.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    leftPanel.appendChild(this.levelElement);

    this.timeElement = document.createElement('div');
    this.timeElement.style.color = '#ffffff';
    this.timeElement.style.fontSize = '16px';
    this.timeElement.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    leftPanel.appendChild(this.timeElement);

    this.keysElement = document.createElement('div');
    this.keysElement.style.color = '#fbbf24';
    this.keysElement.style.fontSize = '16px';
    this.keysElement.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    leftPanel.appendChild(this.keysElement);

    const rightPanel = document.createElement('div');
    rightPanel.style.display = 'flex';
    rightPanel.style.flexDirection = 'column';
    rightPanel.style.gap = '5px';
    hud.appendChild(rightPanel);

    this.scoreElement = document.createElement('div');
    this.scoreElement.style.color = '#34d399';
    this.scoreElement.style.fontSize = '18px';
    this.scoreElement.style.fontWeight = 'bold';
    this.scoreElement.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    rightPanel.appendChild(this.scoreElement);

    const buttonsPanel = document.createElement('div');
    buttonsPanel.style.display = 'flex';
    buttonsPanel.style.gap = '5px';
    buttonsPanel.style.pointerEvents = 'auto';
    rightPanel.appendChild(buttonsPanel);

    this.pauseButton = document.createElement('button');
    this.pauseButton.textContent = '⏸';
    this.pauseButton.style.width = '32px';
    this.pauseButton.style.height = '32px';
    this.pauseButton.style.border = 'none';
    this.pauseButton.style.borderRadius = '50%';
    this.pauseButton.style.background = 'rgba(255, 255, 255, 0.2)';
    this.pauseButton.style.color = '#ffffff';
    this.pauseButton.style.fontSize = '16px';
    this.pauseButton.style.cursor = 'pointer';
    this.pauseButton.style.transition = 'background 0.2s';
    this.pauseButton.addEventListener('click', () => {
      this.onPauseClick?.();
    });
    buttonsPanel.appendChild(this.pauseButton);

    this.resetButton = document.createElement('button');
    this.resetButton.textContent = '🔄';
    this.resetButton.style.width = '32px';
    this.resetButton.style.height = '32px';
    this.resetButton.style.border = 'none';
    this.resetButton.style.borderRadius = '50%';
    this.resetButton.style.background = 'rgba(255, 255, 255, 0.2)';
    this.resetButton.style.color = '#ffffff';
    this.resetButton.style.fontSize = '16px';
    this.resetButton.style.cursor = 'pointer';
    this.resetButton.style.transition = 'background 0.2s';
    this.resetButton.addEventListener('click', () => {
      this.onResetClick?.();
    });
    buttonsPanel.appendChild(this.resetButton);

    this.minimapButton = document.createElement('button');
    this.minimapButton.textContent = '🗺';
    this.minimapButton.style.width = '32px';
    this.minimapButton.style.height = '32px';
    this.minimapButton.style.border = 'none';
    this.minimapButton.style.borderRadius = '50%';
    this.minimapButton.style.background = 'rgba(255, 255, 255, 0.2)';
    this.minimapButton.style.color = '#ffffff';
    this.minimapButton.style.fontSize = '16px';
    this.minimapButton.style.cursor = 'pointer';
    this.minimapButton.style.transition = 'background 0.2s';
    this.minimapButton.addEventListener('click', () => {
      this.onMinimapToggle?.();
    });
    buttonsPanel.appendChild(this.minimapButton);
  }

  update(state: GameState): void {
    if (this.levelElement) {
      this.levelElement.textContent = `关卡 ${state.currentLevel}`;
    }
    
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = Math.floor(state.timeRemaining % 60);
    if (this.timeElement) {
      this.timeElement.textContent = `时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      this.timeElement.style.color = state.timeRemaining < 10 ? '#ef4444' : '#ffffff';
    }

    if (this.keysElement) {
      this.keysElement.textContent = `钥匙: ${state.keysCollected}/${state.totalKeys}`;
    }
    if (this.scoreElement) {
      this.scoreElement.textContent = `得分: ${state.score}`;
    }

    if (this.pauseButton) {
      this.pauseButton.textContent = state.isPaused ? '▶' : '⏸';
    }
  }

  showModal(type: 'victory' | 'gameover' | 'start', options?: { level?: number; time?: number; score?: number; highLevel?: number }): void {
    const modal = document.createElement('div');
    modal.style.position = 'absolute';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '100';
    this.container.appendChild(modal);

    const title = document.createElement('h2');
    title.style.color = '#ffffff';
    title.style.fontSize = '32px';
    title.style.marginBottom = '20px';

    const subtitle = document.createElement('p');
    subtitle.style.color = '#cccccc';
    subtitle.style.fontSize = '16px';
    subtitle.style.marginBottom = '30px';

    if (type === 'victory') {
      title.textContent = '🎉 恭喜通关!';
      subtitle.textContent = `关卡 ${options?.level} | 用时 ${Math.floor(options?.time || 0)}秒 | 得分 ${options?.score}`;
    } else if (type === 'gameover') {
      title.textContent = '💀 游戏结束';
      subtitle.textContent = '时间耗尽或陷阱触发过多';
    } else {
      title.textContent = '🎮 星界迷宫探索';
      subtitle.textContent = '收集所有钥匙，找到出口！';
    }

    modal.appendChild(title);
    modal.appendChild(subtitle);

    const highLevelInfo = document.createElement('p');
    highLevelInfo.style.color = '#fbbf24';
    highLevelInfo.style.fontSize = '14px';
    highLevelInfo.style.marginBottom = '20px';
    highLevelInfo.textContent = `最高通关: ${options?.highLevel || 1} 关`;
    modal.appendChild(highLevelInfo);

    const button1 = document.createElement('button');
    button1.style.padding = '12px 30px';
    button1.style.fontSize = '18px';
    button1.style.border = 'none';
    button1.style.borderRadius = '8px';
    button1.style.background = '#34d399';
    button1.style.color = '#ffffff';
    button1.style.cursor = 'pointer';
    button1.style.marginRight = '10px';

    const button2 = document.createElement('button');
    button2.style.padding = '12px 30px';
    button2.style.fontSize = '18px';
    button2.style.border = 'none';
    button2.style.borderRadius = '8px';
    button2.style.background = 'rgba(255, 255, 255, 0.2)';
    button2.style.color = '#ffffff';
    button2.style.cursor = 'pointer';

    if (type === 'victory') {
      button1.textContent = '下一关';
      button2.textContent = '重玩本关';
      button1.addEventListener('click', () => {
        this.container.removeChild(modal);
        this.onNextLevel?.();
      });
      button2.addEventListener('click', () => {
        this.container.removeChild(modal);
        this.onResetLevel?.();
      });
    } else if (type === 'gameover') {
      button1.textContent = '重新开始';
      button2.textContent = '返回第一关';
      button1.addEventListener('click', () => {
        this.container.removeChild(modal);
        this.onResetLevel?.();
      });
      button2.addEventListener('click', () => {
        this.container.removeChild(modal);
        this.onRestartFromBeginning?.();
      });
    } else {
      button1.textContent = '开始游戏';
      button2.textContent = '操作说明';
      button1.addEventListener('click', () => {
        this.container.removeChild(modal);
        this.onStartGame?.();
      });
      button2.addEventListener('click', () => {
        this.showControls(modal);
      });
    }

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '10px';
    buttonsDiv.appendChild(button1);
    buttonsDiv.appendChild(button2);
    modal.appendChild(buttonsDiv);
  }

  private showControls(parent: HTMLElement): void {
    const controlsModal = document.createElement('div');
    controlsModal.style.position = 'absolute';
    controlsModal.style.top = '0';
    controlsModal.style.left = '0';
    controlsModal.style.right = '0';
    controlsModal.style.bottom = '0';
    controlsModal.style.background = 'rgba(0, 0, 0, 0.9)';
    controlsModal.style.display = 'flex';
    controlsModal.style.flexDirection = 'column';
    controlsModal.style.justifyContent = 'center';
    controlsModal.style.alignItems = 'center';
    this.container.appendChild(controlsModal);

    const title = document.createElement('h2');
    title.style.color = '#ffffff';
    title.style.fontSize = '28px';
    title.style.marginBottom = '30px';
    title.textContent = '操作说明';
    controlsModal.appendChild(title);

    const desktopSection = document.createElement('div');
    desktopSection.style.marginBottom = '30px';
    controlsModal.appendChild(desktopSection);

    const desktopTitle = document.createElement('h3');
    desktopTitle.style.color = '#34d399';
    desktopTitle.style.fontSize = '20px';
    desktopTitle.style.marginBottom = '15px';
    desktopTitle.textContent = '电脑端操作';
    desktopSection.appendChild(desktopTitle);

    const desktopControls = document.createElement('ul');
    desktopControls.style.color = '#cccccc';
    desktopControls.style.fontSize = '16px';
    desktopControls.style.listStyle = 'none';
    desktopControls.style.padding = '0';
    desktopControls.innerHTML = `
      <li><strong>W/A/S/D</strong> - 前后左右移动</li>
      <li><strong>鼠标移动</strong> - 旋转视角</li>
      <li><strong>R</strong> - 重置关卡</li>
      <li><strong>M</strong> - 开关小地图</li>
    `;
    desktopSection.appendChild(desktopControls);

    const mobileSection = document.createElement('div');
    controlsModal.appendChild(mobileSection);

    const mobileTitle = document.createElement('h3');
    mobileTitle.style.color = '#34d399';
    mobileTitle.style.fontSize = '20px';
    mobileTitle.style.marginBottom = '15px';
    mobileTitle.textContent = '手机端操作';
    mobileSection.appendChild(mobileTitle);

    const mobileControls = document.createElement('ul');
    mobileControls.style.color = '#cccccc';
    mobileControls.style.fontSize = '16px';
    mobileControls.style.listStyle = 'none';
    mobileControls.style.padding = '0';
    mobileControls.innerHTML = `
      <li><strong>滑动屏幕</strong> - 旋转视角</li>
      <li><strong>虚拟摇杆</strong> - 控制移动</li>
      <li><strong>按钮</strong> - 重置/小地图</li>
    `;
    mobileSection.appendChild(mobileControls);

    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.padding = '12px 40px';
    closeButton.style.fontSize = '18px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '8px';
    closeButton.style.background = '#34d399';
    closeButton.style.color = '#ffffff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.marginTop = '30px';
    closeButton.addEventListener('click', () => {
      this.container.removeChild(controlsModal);
    });
    controlsModal.appendChild(closeButton);
  }

  onPauseClick?: () => void;
  onResetClick?: () => void;
  onMinimapToggle?: () => void;
  onNextLevel?: () => void;
  onResetLevel?: () => void;
  onRestartFromBeginning?: () => void;
  onStartGame?: () => void;

  dispose(): void {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}