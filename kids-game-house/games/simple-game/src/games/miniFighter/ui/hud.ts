import { GAME_CONFIG, LEVEL_CONFIG } from '../config';
import type { GameState, GameStats } from '../types';

export class HUD {
  private container: HTMLElement;
  private playerHpBar!: HTMLElement;
  private playerEnergyBar!: HTMLElement;
  private aiHpBar!: HTMLElement;
  private aiEnergyBar!: HTMLElement;
  private levelText!: HTMLElement;
  private streakText!: HTMLElement;
  private hitEffects: HTMLElement[] = [];
  private comboText!: HTMLElement;
  private comboCount: number = 0;
  private lastHitTime: number = 0;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.createUI();
  }
  
  private createUI(): void {
    const hud = document.createElement('div');
    hud.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 100;
    `;
    
    const topBar = document.createElement('div');
    topBar.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    `;
    
    const playerPanel = this.createFighterPanel(true);
    const aiPanel = this.createFighterPanel(false);
    
    const centerInfo = document.createElement('div');
    centerInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    `;
    
    this.levelText = document.createElement('div');
    this.levelText.style.cssText = `
      font-family: 'Arial Black', sans-serif;
      font-size: 28px;
      color: #00ffff;
      text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
    `;
    this.levelText.textContent = '关卡 1';
    
    this.streakText = document.createElement('div');
    this.streakText.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 16px;
      color: #ffd700;
      text-shadow: 0 0 5px #ffd700;
    `;
    this.streakText.textContent = '连胜: 0';
    
    centerInfo.appendChild(this.levelText);
    centerInfo.appendChild(this.streakText);
    
    topBar.appendChild(playerPanel);
    topBar.appendChild(centerInfo);
    topBar.appendChild(aiPanel);
    
    this.comboText = document.createElement('div');
    this.comboText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Arial Black', sans-serif;
      font-size: 48px;
      color: #ff4444;
      text-shadow: 0 0 20px #ff4444, 0 0 40px #ff4444;
      opacity: 0;
      pointer-events: none;
    `;
    
    const controls = document.createElement('div');
    controls.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 20px;
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      color: #ffffff;
      background: rgba(0, 0, 0, 0.5);
      padding: 10px 20px;
      border-radius: 10px;
      backdrop-filter: blur(5px);
    `;
    
    const keys = [
      { key: 'WASD', action: '移动' },
      { key: 'J', action: '攻击' },
      { key: 'K', action: '格挡' },
      { key: 'L', action: '闪避' },
      { key: '空格', action: '必杀' },
      { key: 'R', action: '重置' },
    ];
    
    keys.forEach(k => {
      const keyBtn = document.createElement('div');
      keyBtn.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      `;
      
      const key = document.createElement('span');
      key.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 12px;
      `;
      key.textContent = k.key;
      
      const action = document.createElement('span');
      action.style.fontSize = '12px';
      action.textContent = k.action;
      
      keyBtn.appendChild(key);
      keyBtn.appendChild(action);
      controls.appendChild(keyBtn);
    });
    
    hud.appendChild(topBar);
    hud.appendChild(this.comboText);
    hud.appendChild(controls);
    
    this.container.appendChild(hud);
  }
  
  private createFighterPanel(isPlayer: boolean): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 180px;
    `;
    
    const name = document.createElement('div');
    name.style.cssText = `
      font-family: 'Arial Black', sans-serif;
      font-size: 18px;
      color: ${isPlayer ? '#ff4444' : '#4444ff'};
      text-shadow: 0 0 10px ${isPlayer ? '#ff4444' : '#4444ff'};
    `;
    name.textContent = isPlayer ? '玩家' : 'AI';
    
    const hpContainer = document.createElement('div');
    hpContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    
    const hpLabel = document.createElement('div');
    hpLabel.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      color: #ffffff;
    `;
    hpLabel.textContent = 'HP';
    
    const hpBarBg = document.createElement('div');
    hpBarBg.style.cssText = `
      height: 15px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const hpBar = document.createElement('div');
    hpBar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #ff4444, #ff8888);
      border-radius: 7px;
      transition: width 0.2s ease-out;
    `;
    hpBar.style.width = '100%';
    
    if (isPlayer) {
      this.playerHpBar = hpBar;
    } else {
      this.aiHpBar = hpBar;
    }
    
    hpBarBg.appendChild(hpBar);
    hpContainer.appendChild(hpLabel);
    hpContainer.appendChild(hpBarBg);
    
    const energyContainer = document.createElement('div');
    energyContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    
    const energyLabel = document.createElement('div');
    energyLabel.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      color: #ffffff;
    `;
    energyLabel.textContent = '能量';
    
    const energyBarBg = document.createElement('div');
    energyBarBg.style.cssText = `
      height: 10px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 5px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const energyBar = document.createElement('div');
    energyBar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #ffd700, #ffff00);
      border-radius: 4px;
      transition: width 0.2s ease-out;
    `;
    energyBar.style.width = '0%';
    
    if (isPlayer) {
      this.playerEnergyBar = energyBar;
    } else {
      this.aiEnergyBar = energyBar;
    }
    
    energyBarBg.appendChild(energyBar);
    energyContainer.appendChild(energyLabel);
    energyContainer.appendChild(energyBarBg);
    
    panel.appendChild(name);
    panel.appendChild(hpContainer);
    panel.appendChild(energyContainer);
    
    return panel;
  }
  
  update(state: GameState): void {
    const playerHpPercent = (state.player.hp / GAME_CONFIG.MAX_HP) * 100;
    const playerEnergyPercent = (state.player.energy / GAME_CONFIG.MAX_ENERGY) * 100;
    const aiHpPercent = (state.ai.hp / GAME_CONFIG.MAX_HP) * 100;
    const aiEnergyPercent = (state.ai.energy / GAME_CONFIG.MAX_ENERGY) * 100;
    
    this.playerHpBar.style.width = `${playerHpPercent}%`;
    this.playerEnergyBar.style.width = `${playerEnergyPercent}%`;
    this.aiHpBar.style.width = `${aiHpPercent}%`;
    this.aiEnergyBar.style.width = `${aiEnergyPercent}%`;
    
    const levelConfig = LEVEL_CONFIG[Math.min(state.currentLevel - 1, LEVEL_CONFIG.length - 1)];
    this.levelText.textContent = `关卡 ${state.currentLevel}`;
  }
  
  updateStats(stats: GameStats): void {
    this.streakText.textContent = `连胜: ${stats.currentStreak}`;
  }
  
  showHitEffect(type: 'hit' | 'block' | 'critical' | 'ultimate', position?: { x: number; y: number }): void {
    const effect = document.createElement('div');
    effect.style.cssText = `
      position: absolute;
      font-family: 'Arial Black', sans-serif;
      font-size: 32px;
      text-shadow: 0 0 15px currentColor;
      pointer-events: none;
      animation: hitEffect 0.6s ease-out forwards;
    `;
    
    const texts = {
      hit: { text: '命中!', color: '#ff4444' },
      block: { text: '格挡!', color: '#ffffff' },
      critical: { text: '暴击!', color: '#ffd700' },
      ultimate: { text: '必杀!', color: '#ff8800' },
    };
    
    const config = texts[type];
    effect.textContent = config.text;
    effect.style.color = config.color;
    effect.style.left = position ? `${position.x}px` : '50%';
    effect.style.top = position ? `${position.y}px` : '40%';
    effect.style.transform = position ? 'none' : 'translateX(-50%)';
    
    effect.style.animation = `hitEffect 0.6s ease-out forwards`;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes hitEffect {
        0% { opacity: 1; transform: ${position ? 'scale(1)' : 'translateX(-50%) scale(1)'}; }
        50% { opacity: 1; transform: ${position ? 'scale(1.3)' : 'translateX(-50%) scale(1.3)'}; }
        100% { opacity: 0; transform: ${position ? 'scale(1.5) translateY(-30px)' : 'translateX(-50%) scale(1.5) translateY(-30px)'}; }
      }
    `;
    document.head.appendChild(styleSheet);
    
    this.container.appendChild(effect);
    this.hitEffects.push(effect);
    
    setTimeout(() => {
      this.container.removeChild(effect);
      document.head.removeChild(styleSheet);
      this.hitEffects = this.hitEffects.filter(e => e !== effect);
    }, 600);
  }
  
  updateCombo(count: number): void {
    if (count > 1) {
      this.comboText.textContent = `${count} COMBO!`;
      this.comboText.style.opacity = '1';
      this.comboText.style.transform = 'translate(-50%, -50%) scale(1.2)';
      
      setTimeout(() => {
        this.comboText.style.opacity = '0';
        this.comboText.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 500);
    }
  }
  
  dispose(): void {
    this.hitEffects.forEach(effect => {
      if (this.container.contains(effect)) {
        this.container.removeChild(effect);
      }
    });
    this.hitEffects = [];
  }
}