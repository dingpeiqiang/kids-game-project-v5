export interface ModalElement extends HTMLElement {
  show: () => void;
  hide: () => void;
}

export function createUI(container: HTMLElement): {
  scoreElement: HTMLElement;
  levelElement: HTMLElement;
  timeElement: HTMLElement;
  resetButton: HTMLElement;
  victoryModal: ModalElement;
  gameOverModal: ModalElement;
  startModal: ModalElement;
  nextLevelButton: HTMLElement;
  restartButton: HTMLElement;
  startButton: HTMLElement;
} {
  const uiContainer = document.createElement('div');
  uiContainer.style.position = 'absolute';
  uiContainer.style.top = '0';
  uiContainer.style.left = '0';
  uiContainer.style.width = '100%';
  uiContainer.style.height = '100%';
  uiContainer.style.pointerEvents = 'none';
  container.appendChild(uiContainer);

  const topBar = document.createElement('div');
  topBar.style.position = 'absolute';
  topBar.style.top = '10px';
  topBar.style.left = '10px';
  topBar.style.right = '10px';
  topBar.style.display = 'flex';
  topBar.style.justifyContent = 'space-between';
  topBar.style.alignItems = 'center';
  topBar.style.pointerEvents = 'auto';
  uiContainer.appendChild(topBar);

  const levelElement = document.createElement('div');
  levelElement.style.background = 'rgba(0, 0, 0, 0.5)';
  levelElement.style.color = '#fff';
  levelElement.style.padding = '8px 16px';
  levelElement.style.borderRadius = '20px';
  levelElement.style.fontSize = '16px';
  levelElement.style.fontWeight = 'bold';
  levelElement.textContent = '关卡 1';
  topBar.appendChild(levelElement);

  const scoreElement = document.createElement('div');
  scoreElement.style.background = 'rgba(0, 0, 0, 0.5)';
  scoreElement.style.color = '#ffd700';
  scoreElement.style.padding = '8px 16px';
  scoreElement.style.borderRadius = '20px';
  scoreElement.style.fontSize = '16px';
  scoreElement.style.fontWeight = 'bold';
  scoreElement.textContent = '分数: 0';
  topBar.appendChild(scoreElement);

  const timeElement = document.createElement('div');
  timeElement.style.background = 'rgba(0, 0, 0, 0.5)';
  timeElement.style.color = '#fff';
  timeElement.style.padding = '8px 16px';
  timeElement.style.borderRadius = '20px';
  timeElement.style.fontSize = '16px';
  timeElement.style.fontWeight = 'bold';
  timeElement.textContent = '时间: 00:00';
  topBar.appendChild(timeElement);

  const resetButton = document.createElement('button');
  resetButton.textContent = '重置';
  resetButton.style.background = 'rgba(255, 100, 100, 0.8)';
  resetButton.style.color = '#fff';
  resetButton.style.border = 'none';
  resetButton.style.padding = '8px 16px';
  resetButton.style.borderRadius = '20px';
  resetButton.style.fontSize = '14px';
  resetButton.style.cursor = 'pointer';
  resetButton.style.fontWeight = 'bold';
  resetButton.style.pointerEvents = 'auto';
  resetButton.addEventListener('click', () => { });
  topBar.appendChild(resetButton);

  const createModal = (title: string, subtitle: string, buttonText: string, buttonColor: string): { modal: ModalElement; button: HTMLElement } => {
    const modal = document.createElement('div') as unknown as ModalElement;
    modal.style.position = 'absolute';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0, 0, 0, 0.7)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.pointerEvents = 'auto';
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    modal.style.transition = 'opacity 0.3s, visibility 0.3s';

    const content = document.createElement('div');
    content.style.background = '#fff';
    content.style.padding = '40px';
    content.style.borderRadius = '20px';
    content.style.textAlign = 'center';
    content.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';

    const titleElement = document.createElement('h2');
    titleElement.style.fontSize = '36px';
    titleElement.style.margin = '0 0 10px 0';
    titleElement.textContent = title;

    const subtitleElement = document.createElement('p');
    subtitleElement.style.fontSize = '18px';
    subtitleElement.style.color = '#666';
    subtitleElement.style.margin = '0 0 20px 0';
    subtitleElement.textContent = subtitle;

    const button = document.createElement('button');
    button.textContent = buttonText;
    button.style.background = buttonColor;
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.padding = '12px 40px';
    button.style.borderRadius = '30px';
    button.style.fontSize = '18px';
    button.style.fontWeight = 'bold';
    button.style.cursor = 'pointer';
    button.style.transition = 'transform 0.2s';
    button.addEventListener('mouseenter', () => { button.style.transform = 'scale(1.05)'; });
    button.addEventListener('mouseleave', () => { button.style.transform = 'scale(1)'; });

    content.appendChild(titleElement);
    content.appendChild(subtitleElement);
    content.appendChild(button);
    modal.appendChild(content);
    uiContainer.appendChild(modal);

    modal.show = () => {
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
    };

    modal.hide = () => {
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
    };

    return { modal, button };
  };

  const { modal: startModal, button: startButton } = createModal('🎱 云端滚球闯关', '使用 WASD 或方向键控制小球滚动，收集水晶到达终点！', '开始游戏', '#4169E1');
  const { modal: victoryModal, button: nextLevelButton } = createModal('🎉 通关成功！', '', '下一关', '#00ff00');
  const { modal: gameOverModal, button: restartButton } = createModal('💀 游戏失败', '小球掉落赛道了！', '重新开始', '#ff4444');

  startModal.show();

  return {
    scoreElement,
    levelElement,
    timeElement,
    resetButton,
    victoryModal,
    gameOverModal,
    startModal,
    nextLevelButton,
    restartButton,
    startButton,
  };
}

export function updateUI(
  scoreElement: HTMLElement,
  levelElement: HTMLElement,
  timeElement: HTMLElement,
  score: number,
  level: number,
  time: number,
  timeLimit?: number
): void {
  scoreElement.textContent = `分数: ${score}`;
  levelElement.textContent = `关卡 ${level}`;

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  if (timeLimit && time >= timeLimit) {
    timeElement.textContent = `时间: ${timeStr} ⚠️`;
    timeElement.style.color = '#ff4444';
  } else {
    timeElement.textContent = `时间: ${timeStr}`;
    timeElement.style.color = '#fff';
  }
}

export function showVictory(modal: ModalElement, score: number, isPerfect: boolean): void {
  const subtitle = modal.querySelector('p');
  if (subtitle) {
    subtitle.textContent = isPerfect ? `完美通关！分数: ${score} ✨` : `分数: ${score}`;
  }
  modal.show();
}

export function showGameOver(modal: ModalElement): void {
  modal.show();
}