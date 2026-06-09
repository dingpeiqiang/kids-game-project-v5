import { GameState, PlayerRecord } from '../types';

export function createUI(container: HTMLDivElement): {
  level: HTMLElement;
  score: HTMLElement;
  time: HTMLElement;
  hint: HTMLElement;
  feedback: HTMLElement;
  resultModal: HTMLElement;
  restartBtn: HTMLElement;
} {
  const uiContainer = document.createElement('div');
  uiContainer.style.position = 'absolute';
  uiContainer.style.top = '0';
  uiContainer.style.left = '0';
  uiContainer.style.width = '100%';
  uiContainer.style.height = '100%';
  uiContainer.style.pointerEvents = 'none';
  uiContainer.style.userSelect = 'none';
  container.appendChild(uiContainer);

  const topBar = document.createElement('div');
  topBar.style.position = 'absolute';
  topBar.style.top = '10px';
  topBar.style.left = '10px';
  topBar.style.right = '10px';
  topBar.style.display = 'flex';
  topBar.style.justifyContent = 'space-between';
  topBar.style.alignItems = 'center';
  uiContainer.appendChild(topBar);

  const level = document.createElement('div');
  level.style.fontSize = '18px';
  level.style.fontWeight = 'bold';
  level.style.color = '#333';
  level.style.background = 'rgba(255,255,255,0.8)';
  level.style.padding = '8px 16px';
  level.style.borderRadius = '20px';
  level.textContent = '关卡: 1';
  topBar.appendChild(level);

  const score = document.createElement('div');
  score.style.fontSize = '18px';
  score.style.fontWeight = 'bold';
  score.style.color = '#3498db';
  score.style.background = 'rgba(255,255,255,0.8)';
  score.style.padding = '8px 16px';
  score.style.borderRadius = '20px';
  score.textContent = '得分: 0';
  topBar.appendChild(score);

  const time = document.createElement('div');
  time.style.fontSize = '18px';
  time.style.fontWeight = 'bold';
  time.style.color = '#e74c3c';
  time.style.background = 'rgba(255,255,255,0.8)';
  time.style.padding = '8px 16px';
  time.style.borderRadius = '20px';
  time.textContent = '时间: 60s';
  topBar.appendChild(time);

  const hintContainer = document.createElement('div');
  hintContainer.style.position = 'absolute';
  hintContainer.style.top = '50%';
  hintContainer.style.left = '50%';
  hintContainer.style.transform = 'translate(-50%, -50%)';
  hintContainer.style.textAlign = 'center';
  uiContainer.appendChild(hintContainer);

  const hint = document.createElement('div');
  hint.style.fontSize = '24px';
  hint.style.fontWeight = 'bold';
  hint.style.color = '#333';
  hint.style.background = 'rgba(255,255,255,0.9)';
  hint.style.padding = '16px 32px';
  hint.style.borderRadius = '12px';
  hint.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
  hint.textContent = '点击地图标记目标位置';
  hintContainer.appendChild(hint);

  const feedback = document.createElement('div');
  feedback.style.position = 'absolute';
  feedback.style.bottom = '100px';
  feedback.style.left = '50%';
  feedback.style.transform = 'translateX(-50%)';
  feedback.style.fontSize = '20px';
  feedback.style.fontWeight = 'bold';
  feedback.style.color = '#333';
  feedback.style.background = 'rgba(255,255,255,0.9)';
  feedback.style.padding = '12px 24px';
  feedback.style.borderRadius = '20px';
  feedback.style.opacity = '0';
  feedback.style.transition = 'opacity 0.3s';
  uiContainer.appendChild(feedback);

  const resultModal = document.createElement('div');
  resultModal.style.position = 'absolute';
  resultModal.style.top = '0';
  resultModal.style.left = '0';
  resultModal.style.width = '100%';
  resultModal.style.height = '100%';
  resultModal.style.background = 'rgba(0,0,0,0.7)';
  resultModal.style.display = 'flex';
  resultModal.style.justifyContent = 'center';
  resultModal.style.alignItems = 'center';
  resultModal.style.opacity = '0';
  resultModal.style.pointerEvents = 'none';
  resultModal.style.transition = 'opacity 0.3s';
  uiContainer.appendChild(resultModal);

  const modalContent = document.createElement('div');
  modalContent.style.background = 'white';
  modalContent.style.padding = '30px';
  modalContent.style.borderRadius = '16px';
  modalContent.style.textAlign = 'center';
  modalContent.style.maxWidth = '400px';
  modalContent.style.maxHeight = '80%';
  modalContent.style.overflow = 'auto';
  resultModal.appendChild(modalContent);

  const resultTitle = document.createElement('h2');
  resultTitle.style.fontSize = '28px';
  resultTitle.style.marginBottom = '20px';
  resultTitle.textContent = '游戏结束';
  modalContent.appendChild(resultTitle);

  const resultScore = document.createElement('div');
  resultScore.style.fontSize = '24px';
  resultScore.style.color = '#3498db';
  resultScore.style.marginBottom = '15px';
  modalContent.appendChild(resultScore);

  const resultRating = document.createElement('div');
  resultRating.style.fontSize = '18px';
  resultRating.style.marginBottom = '20px';
  modalContent.appendChild(resultRating);

  const knowledgeSection = document.createElement('div');
  knowledgeSection.style.background = '#f8f9fa';
  knowledgeSection.style.padding = '16px';
  knowledgeSection.style.borderRadius = '8px';
  knowledgeSection.style.marginBottom = '20px';
  knowledgeSection.style.textAlign = 'left';
  knowledgeSection.style.display = 'none';
  modalContent.appendChild(knowledgeSection);

  const knowledgeTitle = document.createElement('h3');
  knowledgeTitle.style.fontSize = '16px';
  knowledgeTitle.style.color = '#2ecc71';
  knowledgeTitle.style.marginBottom = '8px';
  knowledgeTitle.textContent = '地理小知识';
  knowledgeSection.appendChild(knowledgeTitle);

  const knowledgeText = document.createElement('p');
  knowledgeText.style.fontSize = '14px';
  knowledgeText.style.color = '#666';
  knowledgeText.style.lineHeight = '1.6';
  knowledgeSection.appendChild(knowledgeText);

  const buttonGroup = document.createElement('div');
  buttonGroup.style.display = 'flex';
  buttonGroup.style.gap = '12px';
  buttonGroup.style.justifyContent = 'center';
  modalContent.appendChild(buttonGroup);

  const restartBtn = document.createElement('button');
  restartBtn.style.fontSize = '16px';
  restartBtn.style.padding = '12px 32px';
  restartBtn.style.border = 'none';
  restartBtn.style.borderRadius = '25px';
  restartBtn.style.background = '#3498db';
  restartBtn.style.color = 'white';
  restartBtn.style.cursor = 'pointer';
  restartBtn.style.fontWeight = 'bold';
  restartBtn.style.pointerEvents = 'auto';
  restartBtn.textContent = '重新开始';
  buttonGroup.appendChild(restartBtn);

  const nextBtn = document.createElement('button');
  nextBtn.style.fontSize = '16px';
  nextBtn.style.padding = '12px 32px';
  nextBtn.style.border = 'none';
  nextBtn.style.borderRadius = '25px';
  nextBtn.style.background = '#2ecc71';
  nextBtn.style.color = 'white';
  nextBtn.style.cursor = 'pointer';
  nextBtn.style.fontWeight = 'bold';
  nextBtn.style.pointerEvents = 'auto';
  nextBtn.textContent = '下一关';
  buttonGroup.appendChild(nextBtn);

  const onNextClick = () => {
    resultModal.style.opacity = '0';
    resultModal.style.pointerEvents = 'none';
  };

  const onRestartClick = () => {
    resultModal.style.opacity = '0';
    resultModal.style.pointerEvents = 'none';
  };

  nextBtn.addEventListener('click', onNextClick);
  restartBtn.addEventListener('click', onRestartClick);

  (nextBtn as HTMLButtonElement).dataset.onClick = 'next';
  (restartBtn as HTMLButtonElement).dataset.onClick = 'restart';

  return {
    level,
    score,
    time,
    hint,
    feedback,
    resultModal,
    restartBtn,
  };
}

export function updateUI(ui: ReturnType<typeof createUI>, state: GameState): void {
  ui.level.textContent = `关卡: ${state.currentLevel}`;
  ui.score.textContent = `得分: ${state.score}`;
  ui.time.textContent = `时间: ${Math.ceil(state.timeRemaining)}s`;
  
  if (state.currentQuestion) {
    ui.hint.textContent = state.currentQuestion.hint;
  }
}

export function showFeedback(ui: ReturnType<typeof createUI>, message: string, color: string): void {
  ui.feedback.textContent = message;
  ui.feedback.style.color = color;
  ui.feedback.style.opacity = '1';
  setTimeout(() => {
    ui.feedback.style.opacity = '0';
  }, 2000);
}

export function showResult(
  ui: ReturnType<typeof createUI>,
  success: boolean,
  score: number,
  rating: string,
  knowledge: string,
  hasNextLevel: boolean
): void {
  const modalContent = ui.resultModal.querySelector('div') as HTMLElement;
  const resultTitle = modalContent.querySelector('h2') as HTMLElement;
  const resultScore = modalContent.querySelector('div:nth-child(2)') as HTMLElement;
  const resultRating = modalContent.querySelector('div:nth-child(3)') as HTMLElement;
  const knowledgeSection = modalContent.querySelector('div:nth-child(4)') as HTMLElement;
  const knowledgeText = knowledgeSection.querySelector('p') as HTMLElement;
  const nextBtn = modalContent.querySelector('button:last-child') as HTMLButtonElement;

  if (success) {
    resultTitle.textContent = '通关成功！';
    resultTitle.style.color = '#2ecc71';
  } else {
    resultTitle.textContent = '挑战失败';
    resultTitle.style.color = '#e74c3c';
  }

  resultScore.textContent = `最终得分: ${score}分`;
  resultRating.textContent = `评级: ${rating}`;

  if (knowledge) {
    knowledgeText.textContent = knowledge;
    knowledgeSection.style.display = 'block';
  } else {
    knowledgeSection.style.display = 'none';
  }

  nextBtn.style.display = hasNextLevel ? 'block' : 'none';

  ui.resultModal.style.opacity = '1';
  ui.resultModal.style.pointerEvents = 'auto';
}

export function updateRecordsDisplay(records: PlayerRecord): void {
  console.log('Records updated:', records);
}