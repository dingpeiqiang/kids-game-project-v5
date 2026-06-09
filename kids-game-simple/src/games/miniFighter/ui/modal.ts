import { LEVEL_CONFIG } from '../config';
import type { GameStats } from '../types';

export class GameModal {
  private container: HTMLElement;
  private modal: HTMLElement | null;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.modal = null;
  }
  
  showVictory(level: number, stats: GameStats, onNextLevel: () => void, onRestart: () => void): void {
    this.hide();
    
    const levelConfig = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)];
    
    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(20, 20, 40, 0.95);
      border: 2px solid #00ffff;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
      z-index: 200;
      backdrop-filter: blur(10px);
      animation: modalFadeIn 0.3s ease-out;
    `;
    
    const title = document.createElement('h2');
    title.style.cssText = `
      font-family: 'Arial Black', sans-serif;
      font-size: 48px;
      color: #00ff00;
      text-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00;
      margin: 0 0 20px 0;
    `;
    title.textContent = '胜利!';
    
    const levelText = document.createElement('div');
    levelText.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 24px;
      color: #ffffff;
      margin-bottom: 10px;
    `;
    levelText.textContent = `关卡 ${level} - ${levelConfig.aiName}`;
    
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = `
      display: flex;
      gap: 40px;
      justify-content: center;
      margin: 20px 0;
    `;
    
    const statItems = [
      { label: '最高关卡', value: stats.highestLevel },
      { label: '总胜利', value: stats.totalWins },
      { label: '当前连胜', value: stats.currentStreak },
      { label: '最高连胜', value: stats.bestStreak },
    ];
    
    statItems.forEach(item => {
      const stat = document.createElement('div');
      stat.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
      `;
      
      const label = document.createElement('span');
      label.style.cssText = `
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        color: #aaaaaa;
      `;
      label.textContent = item.label;
      
      const value = document.createElement('span');
      value.style.cssText = `
        font-family: 'Arial Black', sans-serif;
        font-size: 24px;
        color: #ffd700;
      `;
      value.textContent = String(item.value);
      
      stat.appendChild(label);
      stat.appendChild(value);
      statsDiv.appendChild(stat);
    });
    
    const buttons = document.createElement('div');
    buttons.style.cssText = `
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-top: 30px;
    `;
    
    const nextBtn = document.createElement('button');
    nextBtn.style.cssText = `
      padding: 15px 40px;
      font-family: 'Arial Black', sans-serif;
      font-size: 18px;
      color: #ffffff;
      background: linear-gradient(135deg, #00ff00, #00cc00);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(0, 255, 0, 0.3);
    `;
    nextBtn.textContent = '下一关';
    nextBtn.addEventListener('click', onNextLevel);
    nextBtn.addEventListener('mouseenter', () => {
      nextBtn.style.transform = 'scale(1.05)';
      nextBtn.style.boxShadow = '0 6px 20px rgba(0, 255, 0, 0.5)';
    });
    nextBtn.addEventListener('mouseleave', () => {
      nextBtn.style.transform = 'scale(1)';
      nextBtn.style.boxShadow = '0 4px 15px rgba(0, 255, 0, 0.3)';
    });
    
    const restartBtn = document.createElement('button');
    restartBtn.style.cssText = `
      padding: 15px 40px;
      font-family: 'Arial Black', sans-serif;
      font-size: 18px;
      color: #ffffff;
      background: linear-gradient(135deg, #ff4444, #cc0000);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
    `;
    restartBtn.textContent = '重新挑战';
    restartBtn.addEventListener('click', onRestart);
    restartBtn.addEventListener('mouseenter', () => {
      restartBtn.style.transform = 'scale(1.05)';
      restartBtn.style.boxShadow = '0 6px 20px rgba(255, 68, 68, 0.5)';
    });
    restartBtn.addEventListener('mouseleave', () => {
      restartBtn.style.transform = 'scale(1)';
      restartBtn.style.boxShadow = '0 4px 15px rgba(255, 68, 68, 0.3)';
    });
    
    buttons.appendChild(nextBtn);
    buttons.appendChild(restartBtn);
    
    this.modal.appendChild(title);
    this.modal.appendChild(levelText);
    this.modal.appendChild(statsDiv);
    this.modal.appendChild(buttons);
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes modalFadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(styleSheet);
    
    this.container.appendChild(this.modal);
  }
  
  showDefeat(level: number, stats: GameStats, onRestart: () => void): void {
    this.hide();
    
    const levelConfig = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)];
    
    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(40, 20, 20, 0.95);
      border: 2px solid #ff4444;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 0 30px rgba(255, 68, 68, 0.3);
      z-index: 200;
      backdrop-filter: blur(10px);
      animation: modalFadeIn 0.3s ease-out;
    `;
    
    const title = document.createElement('h2');
    title.style.cssText = `
      font-family: 'Arial Black', sans-serif;
      font-size: 48px;
      color: #ff4444;
      text-shadow: 0 0 20px #ff4444, 0 0 40px #ff4444;
      margin: 0 0 20px 0;
    `;
    title.textContent = '失败';
    
    const levelText = document.createElement('div');
    levelText.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 24px;
      color: #ffffff;
      margin-bottom: 10px;
    `;
    levelText.textContent = `关卡 ${level} - ${levelConfig.aiName}`;
    
    const message = document.createElement('div');
    message.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 18px;
      color: #aaaaaa;
      margin-bottom: 30px;
    `;
    message.textContent = '不要气馁，再来一次!';
    
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = `
      display: flex;
      gap: 40px;
      justify-content: center;
      margin: 20px 0;
    `;
    
    const statItems = [
      { label: '最高关卡', value: stats.highestLevel },
      { label: '总胜利', value: stats.totalWins },
      { label: '最高连胜', value: stats.bestStreak },
    ];
    
    statItems.forEach(item => {
      const stat = document.createElement('div');
      stat.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
      `;
      
      const label = document.createElement('span');
      label.style.cssText = `
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        color: #aaaaaa;
      `;
      label.textContent = item.label;
      
      const value = document.createElement('span');
      value.style.cssText = `
        font-family: 'Arial Black', sans-serif;
        font-size: 24px;
        color: #ffd700;
      `;
      value.textContent = String(item.value);
      
      stat.appendChild(label);
      stat.appendChild(value);
      statsDiv.appendChild(stat);
    });
    
    const restartBtn = document.createElement('button');
    restartBtn.style.cssText = `
      padding: 15px 60px;
      font-family: 'Arial Black', sans-serif;
      font-size: 20px;
      color: #ffffff;
      background: linear-gradient(135deg, #ff4444, #cc0000);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
    `;
    restartBtn.textContent = '重新挑战';
    restartBtn.addEventListener('click', onRestart);
    restartBtn.addEventListener('mouseenter', () => {
      restartBtn.style.transform = 'scale(1.05)';
      restartBtn.style.boxShadow = '0 6px 20px rgba(255, 68, 68, 0.5)';
    });
    restartBtn.addEventListener('mouseleave', () => {
      restartBtn.style.transform = 'scale(1)';
      restartBtn.style.boxShadow = '0 4px 15px rgba(255, 68, 68, 0.3)';
    });
    
    this.modal.appendChild(title);
    this.modal.appendChild(levelText);
    this.modal.appendChild(message);
    this.modal.appendChild(statsDiv);
    this.modal.appendChild(restartBtn);
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes modalFadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(styleSheet);
    
    this.container.appendChild(this.modal);
  }
  
  hide(): void {
    if (this.modal && this.container.contains(this.modal)) {
      this.container.removeChild(this.modal);
      this.modal = null;
    }
  }
  
  dispose(): void {
    this.hide();
  }
}