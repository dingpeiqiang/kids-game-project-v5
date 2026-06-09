import { BlockType } from '../types';
import { BLOCK_COLORS } from '../config';

export function createCrosshair(container: HTMLDivElement): HTMLDivElement {
  const crosshair = document.createElement('div');
  crosshair.style.position = 'absolute';
  crosshair.style.left = '50%';
  crosshair.style.top = '50%';
  crosshair.style.transform = 'translate(-50%, -50%)';
  crosshair.style.pointerEvents = 'none';
  crosshair.style.zIndex = '100';
  
  crosshair.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20">
      <line x1="10" y1="0" x2="10" y2="8" stroke="#ffffff" stroke-width="2" />
      <line x1="10" y1="12" x2="10" y2="20" stroke="#ffffff" stroke-width="2" />
      <line x1="0" y1="10" x2="8" y2="10" stroke="#ffffff" stroke-width="2" />
      <line x1="12" y1="10" x2="20" y2="10" stroke="#ffffff" stroke-width="2" />
    </svg>
  `;
  
  container.appendChild(crosshair);
  return crosshair;
}

export function createHUD(container: HTMLDivElement): { 
  blockBar: HTMLDivElement; 
  statusBar: HTMLDivElement;
  updateBlockBar: (currentBlock: BlockType) => void;
  updateStatus: (time: number, isDay: boolean) => void;
} {
  const hud = document.createElement('div');
  hud.style.position = 'absolute';
  hud.style.bottom = '20px';
  hud.style.left = '50%';
  hud.style.transform = 'translateX(-50%)';
  hud.style.pointerEvents = 'none';
  hud.style.zIndex = '100';

  const blockBar = document.createElement('div');
  blockBar.style.display = 'flex';
  blockBar.style.gap = '10px';
  blockBar.style.padding = '10px 20px';
  blockBar.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  blockBar.style.borderRadius = '10px';

  const blockTypes: BlockType[] = ['grass', 'dirt', 'stone', 'wood', 'sand', 'snow'];
  const blockNames: Record<BlockType, string> = {
    grass: '草地',
    dirt: '泥土',
    stone: '石头',
    wood: '木头',
    sand: '沙子',
    snow: '雪地',
  };

  blockTypes.forEach((type, index) => {
    const blockSlot = document.createElement('div');
    blockSlot.style.width = '40px';
    blockSlot.style.height = '40px';
    blockSlot.style.borderRadius = '5px';
    blockSlot.style.backgroundColor = `#${BLOCK_COLORS[type].top.toString(16).padStart(6, '0')}`;
    blockSlot.style.border = '2px solid transparent';
    blockSlot.style.display = 'flex';
    blockSlot.style.alignItems = 'center';
    blockSlot.style.justifyContent = 'center';
    blockSlot.style.fontSize = '12px';
    blockSlot.style.fontWeight = 'bold';
    blockSlot.style.color = '#ffffff';
    blockSlot.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
    blockSlot.innerHTML = `<span style="position: absolute; font-size: 10px; top: 2px; left: 2px;">${index + 1}</span>`;
    blockSlot.title = blockNames[type];
    
    if (index === 0) {
      blockSlot.style.borderColor = '#ffffff';
      blockSlot.style.transform = 'scale(1.1)';
    }
    
    blockBar.appendChild(blockSlot);
  });

  const statusBar = document.createElement('div');
  statusBar.style.position = 'absolute';
  statusBar.style.top = '20px';
  statusBar.style.right = '20px';
  statusBar.style.color = '#ffffff';
  statusBar.style.fontFamily = 'Arial, sans-serif';
  statusBar.style.fontSize = '14px';
  statusBar.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
  statusBar.style.padding = '10px';
  statusBar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  statusBar.style.borderRadius = '5px';

  hud.appendChild(blockBar);
  hud.appendChild(statusBar);
  container.appendChild(hud);

  function updateBlockBar(currentBlock: BlockType): void {
    const slots = blockBar.children;
    blockTypes.forEach((type, index) => {
      const slot = slots[index] as HTMLElement;
      if (type === currentBlock) {
        slot.style.borderColor = '#ffffff';
        slot.style.transform = 'scale(1.1)';
      } else {
        slot.style.borderColor = 'transparent';
        slot.style.transform = 'scale(1)';
      }
    });
  }

  function updateStatus(time: number, isDay: boolean): void {
    const hours = Math.floor((time / 1000 / 60) % 24);
    const minutes = Math.floor((time / 1000) % 60);
    const period = isDay ? '白天' : '夜晚';
    statusBar.innerHTML = `时间: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} | ${period}`;
  }

  return { blockBar, statusBar, updateBlockBar, updateStatus };
}

export function createStartScreen(container: HTMLDivElement, onStart: () => void, onLoad: () => void): HTMLDivElement {
  const startScreen = document.createElement('div');
  startScreen.style.position = 'absolute';
  startScreen.style.top = '0';
  startScreen.style.left = '0';
  startScreen.style.width = '100%';
  startScreen.style.height = '100%';
  startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  startScreen.style.display = 'flex';
  startScreen.style.flexDirection = 'column';
  startScreen.style.alignItems = 'center';
  startScreen.style.justifyContent = 'center';
  startScreen.style.zIndex = '200';

  const title = document.createElement('h1');
  title.style.color = '#4CAF50';
  title.style.fontSize = '48px';
  title.style.fontFamily = 'Arial, sans-serif';
  title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
  title.style.marginBottom = '20px';
  title.textContent = '方块沙盒世界';

  const subtitle = document.createElement('p');
  subtitle.style.color = '#ffffff';
  subtitle.style.fontSize = '18px';
  subtitle.style.marginBottom = '40px';
  subtitle.textContent = '3D Voxel Sandbox World';

  const startButton = document.createElement('button');
  startButton.style.padding = '15px 40px';
  startButton.style.fontSize = '20px';
  startButton.style.fontWeight = 'bold';
  startButton.style.color = '#ffffff';
  startButton.style.backgroundColor = '#4CAF50';
  startButton.style.border = 'none';
  startButton.style.borderRadius = '8px';
  startButton.style.cursor = 'pointer';
  startButton.style.marginBottom = '15px';
  startButton.addEventListener('click', onStart);
  startButton.textContent = '🎮 开始新游戏';

  const loadButton = document.createElement('button');
  loadButton.style.padding = '15px 40px';
  loadButton.style.fontSize = '20px';
  loadButton.style.fontWeight = 'bold';
  loadButton.style.color = '#ffffff';
  loadButton.style.backgroundColor = '#2196F3';
  loadButton.style.border = 'none';
  loadButton.style.borderRadius = '8px';
  loadButton.style.cursor = 'pointer';
  loadButton.addEventListener('click', onLoad);
  loadButton.textContent = '📁 加载存档';

  const controlsInfo = document.createElement('div');
  controlsInfo.style.color = '#cccccc';
  controlsInfo.style.fontSize = '14px';
  controlsInfo.style.marginTop = '40px';
  controlsInfo.style.textAlign = 'center';
  controlsInfo.innerHTML = `
    <p><strong>操作说明：</strong></p>
    <p>WASD / 方向键 - 移动</p>
    <p>空格 - 跳跃 | Shift - 加速</p>
    <p>左键 - 破坏方块 | 右键 - 放置方块</p>
    <p>1-6 - 切换方块</p>
    <p>O - 切换昼夜 | R - 重置世界</p>
    <p>ESC - 解锁鼠标</p>
  `;

  startScreen.appendChild(title);
  startScreen.appendChild(subtitle);
  startScreen.appendChild(startButton);
  startScreen.appendChild(loadButton);
  startScreen.appendChild(controlsInfo);

  container.appendChild(startScreen);
  return startScreen;
}

export function showMessage(container: HTMLDivElement, message: string): void {
  const messageDiv = document.createElement('div');
  messageDiv.style.position = 'absolute';
  messageDiv.style.top = '50%';
  messageDiv.style.left = '50%';
  messageDiv.style.transform = 'translate(-50%, -50%)';
  messageDiv.style.padding = '20px 40px';
  messageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  messageDiv.style.color = '#ffffff';
  messageDiv.style.fontSize = '20px';
  messageDiv.style.borderRadius = '10px';
  messageDiv.style.zIndex = '300';
  
  container.appendChild(messageDiv);
  messageDiv.textContent = message;

  setTimeout(() => {
    container.removeChild(messageDiv);
  }, 2000);
}