import { UnifiedModeManager } from '../manager/UnifiedModeManager';
import { GameModeType } from '../interfaces';

/**
 * 游戏状态面板配置
 */
export interface GameStatePanelConfig {
  container: HTMLElement;
  modeType: GameModeType;
  showPlayerInfo?: boolean;
  showScore?: boolean;
  showLives?: boolean;
  showTime?: boolean;
  showComparison?: boolean; // 对抗模式下显示对比
  refreshInterval?: number; // 刷新间隔（毫秒）
}

/**
 * 游戏状态面板
 * 
 * 功能：
 * - 显示单人/多人/对战游戏状态
 * - 实时更新
 * - 自定义显示内容
 * - 支持不同模式的状态展示
 */
export class GameStatePanel {
  private config: GameStatePanelConfig;
  private modeManager: UnifiedModeManager | null = null;
  private refreshTimer: number | null = null;

  // 面板元素
  private panelElement: HTMLElement;
  private playerInfoSection: HTMLElement;
  private scoreSection: HTMLElement;
  private livesSection: HTMLElement;
  private timeSection: HTMLElement;
  private comparisonSection: HTMLElement;

  constructor(config: GameStatePanelConfig) {
    this.config = {
      showPlayerInfo: true,
      showScore: true,
      showLives: true,
      showTime: true,
      showComparison: true,
      refreshInterval: 1000,
      ...config,
    };

    this.panelElement = this.createPanel();
    this.playerInfoSection = this.createSection('玩家信息');
    this.scoreSection = this.createSection('得分');
    this.livesSection = this.createSection('生命值');
    this.timeSection = this.createSection('时间');
    this.comparisonSection = this.createSection('对战状态');

    this.setupPanel();
  }

  /**
   * 创建面板
   */
  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'game-state-panel';
    panel.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 280px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-family: 'Arial', sans-serif;
      z-index: 1000;
      backdrop-filter: blur(10px);
    `;

    // 标题
    const title = document.createElement('div');
    title.className = 'panel-title';
    title.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #4CAF50;
      text-align: center;
    `;
    title.textContent = '游戏状态';
    panel.appendChild(title);

    return panel;
  }

  /**
   * 创建面板区域
   */
  private createSection(title: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'panel-section';
    section.style.cssText = `
      margin-bottom: 12px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
    `;

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 6px;
      color: #4CAF50;
    `;
    sectionTitle.textContent = title;

    section.appendChild(sectionTitle);
    return section;
  }

  /**
   * 设置面板
   */
  private setupPanel(): void {
    const container = this.config.container;
    container.appendChild(this.panelElement);

    // 根据配置添加区域
    if (this.config.showPlayerInfo) {
      this.panelElement.appendChild(this.playerInfoSection);
    }

    if (this.config.showScore) {
      this.panelElement.appendChild(this.scoreSection);
    }

    if (this.config.showLives) {
      this.panelElement.appendChild(this.livesSection);
    }

    if (this.config.showTime) {
      this.panelElement.appendChild(this.timeSection);
    }

    if (this.config.showComparison && this.isBattleMode()) {
      this.panelElement.appendChild(this.comparisonSection);
    }

    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      line-height: 24px;
    `;
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
      this.destroy();
    };
    this.panelElement.appendChild(closeBtn);
  }

  /**
   * 绑定模式管理器
   */
  bindModeManager(modeManager: UnifiedModeManager): void {
    this.modeManager = modeManager;

    // 监听模式管理器事件
    modeManager.on('game_state_changed', () => {
      this.update();
    });

    modeManager.on('score_changed', () => {
      this.update();
    });

    modeManager.on('game_ended', () => {
      this.update();
    });

    modeManager.on('battle_ended', () => {
      this.update();
    });

    // 启动定时刷新
    this.startRefresh();
  }

  /**
   * 启动定时刷新
   */
  private startRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = window.setInterval(() => {
      this.update();
    }, this.config.refreshInterval || 1000);
  }

  /**
   * 停止定时刷新
   */
  private stopRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 更新面板
   */
  update(): void {
    if (!this.modeManager) {
      return;
    }

    // 更新标题
    const title = this.panelElement.querySelector('.panel-title') as HTMLElement;
    if (title) {
      const modeNames: Record<GameModeType, string> = {
        [GameModeType.SINGLE_PLAYER]: '单人游戏',
        [GameModeType.TEAM]: '组队游戏',
        [GameModeType.MULTIPLAYER]: '多人游戏',
        [GameModeType.LOCAL_BATTLE]: '本地对抗',
        [GameModeType.ONLINE_BATTLE]: '网络对抗',
      };
      title.textContent = `${modeNames[this.config.modeType]}状态`;
    }

    // 更新各个区域
    if (this.config.showPlayerInfo) {
      this.updatePlayerInfo();
    }

    if (this.config.showScore) {
      this.updateScore();
    }

    if (this.config.showLives) {
      this.updateLives();
    }

    if (this.config.showTime) {
      this.updateTime();
    }

    if (this.config.showComparison && this.isBattleMode()) {
      this.updateComparison();
    }
  }

  /**
   * 更新玩家信息
   */
  private updatePlayerInfo(): void {
    if (!this.modeManager) return;

    const players = this.modeManager.getAllPlayers();
    const content = players
      .map((player, index) => {
        const color = index === 0 ? '#FF69B4' : index === 1 ? '#00FFFF' : '#4CAF50';
        return `
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; margin-right: 8px;"></span>
            <span style="flex: 1;">${player.name}</span>
            ${player.teamId ? `<span style="font-size: 12px; color: #888;">[队伍${player.teamId.replace('team', '')}]</span>` : ''}
          </div>
        `;
      })
      .join('');

    this.updateSectionContent(this.playerInfoSection, content);
  }

  /**
   * 更新分数
   */
  private updateScore(): void {
    if (!this.modeManager) return;

    const players = this.modeManager.getAllPlayers();
    const content = players
      .map((player, index) => {
        const color = index === 0 ? '#FF69B4' : index === 1 ? '#00FFFF' : '#4CAF50';
        return `
          <div style="display: flex; justify-content: space-between; margin: 4px 0;">
            <span style="color: ${color};">${player.name}</span>
            <span style="font-size: 18px; font-weight: bold;">${player.score}分</span>
          </div>
        `;
      })
      .join('');

    this.updateSectionContent(this.scoreSection, content);
  }

  /**
   * 更新生命值
   */
  private updateLives(): void {
    if (!this.modeManager) return;

    const players = this.modeManager.getAllPlayers();
    const content = players
      .map((player, index) => {
        const color = index === 0 ? '#FF69B4' : index === 1 ? '#00FFFF' : '#4CAF50';
        const hearts = '❤️'.repeat(player.lives);
        const emptyHearts = '🖤'.repeat(3 - player.lives);
        return `
          <div style="display: flex; justify-content: space-between; margin: 4px 0;">
            <span style="color: ${color};">${player.name}</span>
            <span style="font-size: 14px;">${hearts}${emptyHearts}</span>
          </div>
        `;
      })
      .join('');

    this.updateSectionContent(this.livesSection, content);
  }

  /**
   * 更新时间
   */
  private updateTime(): void {
    if (!this.modeManager) return;

    const stats = this.modeManager.getStatistics();
    const ruleConfig = stats.ruleConfig;

    let timeText = '无限制';
    if (ruleConfig?.timeLimit) {
      timeText = `${ruleConfig.timeLimit}秒`;
    }

    const content = `
      <div style="text-align: center; font-size: 18px; font-weight: bold; color: #4CAF50;">
        ${timeText}
      </div>
    `;

    this.updateSectionContent(this.timeSection, content);
  }

  /**
   * 更新对战状态（仅对抗模式）
   */
  private updateComparison(): void {
    if (!this.modeManager || !this.isBattleMode()) return;

    // 尝试使用 getLocalBattleData 获取对抗模式数据
    const battleData = (this.modeManager as any).getLocalBattleData?.();

    if (battleData) {
      // 使用本地对抗模式的实时数据
      const { player1, player2, isRunning } = battleData;

      if (!isRunning) {
        this.updateSectionContent(
          this.comparisonSection,
          '<div style="text-align: center; color: #888;">游戏未开始</div>'
        );
        return;
      }

      const scoreDiff = player1.score - player2.score;
      const livesDiff = player1.lives - player2.lives;

      // 判断领先玩家
      let leaderText = '势均力敌';
      let leaderColor = '#4CAF50';

      if (scoreDiff > 0) {
        leaderText = `${player1.name} 领先`;
        leaderColor = '#FF69B4';
      } else if (scoreDiff < 0) {
        leaderText = `${player2.name} 领先`;
        leaderColor = '#00FFFF';
      }

      const content = `
        <div style="margin-bottom: 8px; text-align: center; font-weight: bold; color: ${leaderColor};">${leaderText}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
          <div style="text-align: center; background: rgba(255, 105, 180, 0.1); padding: 8px; border-radius: 4px;">
            <div style="color: #FF69B4; font-weight: bold; margin-bottom: 4px;">${player1.name}</div>
            <div>🎯 得分: <span style="font-weight: bold;">${player1.score}</span></div>
            <div>❤️ 生命: <span style="font-weight: bold;">${player1.lives}</span></div>
          </div>
          <div style="text-align: center; background: rgba(0, 255, 255, 0.1); padding: 8px; border-radius: 4px;">
            <div style="color: #00FFFF; font-weight: bold; margin-bottom: 4px;">${player2.name}</div>
            <div>🎯 得分: <span style="font-weight: bold;">${player2.score}</span></div>
            <div>❤️ 生命: <span style="font-weight: bold;">${player2.lives}</span></div>
          </div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); text-align: center; font-size: 12px;">
          <div style="margin-bottom: 4px;">
            分数差: <span style="font-weight: bold; color: ${scoreDiff > 0 ? '#FF69B4' : scoreDiff < 0 ? '#00FFFF' : '#4CAF50'};">${scoreDiff > 0 ? '+' : ''}${scoreDiff}</span>
          </div>
          <div>
            生命差: <span style="font-weight: bold; color: ${livesDiff > 0 ? '#FF69B4' : livesDiff < 0 ? '#00FFFF' : '#4CAF50'};">${livesDiff > 0 ? '+' : ''}${livesDiff}</span>
          </div>
        </div>
      `;

      this.updateSectionContent(this.comparisonSection, content);
      return;
    }

    // 降级到使用游戏状态数据
    const gameStates = this.modeManager.getAllGameStates();
    const stateArray = Array.from(gameStates.entries());

    if (stateArray.length < 2) {
      this.updateSectionContent(
        this.comparisonSection,
        '<div style="text-align: center; color: #888;">等待对方...</div>'
      );
      return;
    }

    const [id1, state1] = stateArray[0];
    const [id2, state2] = stateArray[1];

    const score1 = state1?.score || 0;
    const score2 = state2?.score || 0;
    const lives1 = state1?.lives || 0;
    const lives2 = state2?.lives || 0;

    const scoreDiff = score1 - score2;
    const livesDiff = lives1 - lives2;

    // 判断领先玩家
    let leaderText = '势均力敌';
    if (scoreDiff > 0) {
      leaderText = '<span style="color: #FF69B4;">玩家1领先</span>';
    } else if (scoreDiff < 0) {
      leaderText = '<span style="color: #00FFFF;">玩家2领先</span>';
    }

    const content = `
      <div style="margin-bottom: 8px; text-align: center; font-weight: bold;">${leaderText}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
        <div style="text-align: center;">
          <div style="color: #FF69B4; font-weight: bold;">玩家1</div>
          <div>得分: ${score1}</div>
          <div>生命: ${lives1}</div>
        </div>
        <div style="text-align: center;">
          <div style="color: #00FFFF; font-weight: bold;">玩家2</div>
          <div>得分: ${score2}</div>
          <div>生命: ${lives2}</div>
        </div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); text-align: center; font-size: 12px;">
        分数差: <span style="font-weight: bold; color: ${scoreDiff > 0 ? '#FF69B4' : scoreDiff < 0 ? '#00FFFF' : '#4CAF50'};">${Math.abs(scoreDiff)}</span>
        生命差: <span style="font-weight: bold; color: ${livesDiff > 0 ? '#FF69B4' : livesDiff < 0 ? '#00FFFF' : '#4CAF50'};">${Math.abs(livesDiff)}</span>
      </div>
    `;

    this.updateSectionContent(this.comparisonSection, content);
  }

  /**
   * 更新区域内容
   */
  private updateSectionContent(section: HTMLElement, content: string): void {
    const contentDiv = section.querySelector('.section-content') as HTMLElement;
    if (contentDiv) {
      contentDiv.innerHTML = content;
    } else {
      const newContentDiv = document.createElement('div');
      newContentDiv.className = 'section-content';
      newContentDiv.innerHTML = content;
      section.appendChild(newContentDiv);
    }
  }

  /**
   * 判断是否是对抗模式
   */
  private isBattleMode(): boolean {
    return (
      this.config.modeType === GameModeType.LOCAL_BATTLE ||
      this.config.modeType === GameModeType.ONLINE_BATTLE
    );
  }

  /**
   * 显示面板
   */
  show(): void {
    this.panelElement.style.display = 'block';
  }

  /**
   * 隐藏面板
   */
  hide(): void {
    this.panelElement.style.display = 'none';
  }

  /**
   * 销毁面板
   */
  destroy(): void {
    this.stopRefresh();

    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<GameStatePanelConfig>): void {
    this.config = { ...this.config, ...config };

    // 重新设置面板
    if (config.showPlayerInfo !== undefined || config.showScore !== undefined ||
        config.showLives !== undefined || config.showTime !== undefined ||
        config.showComparison !== undefined) {
      this.panelElement.innerHTML = '';
      this.panelElement.appendChild(this.createTitle());
      this.setupPanel();
      this.update();
    }

    if (config.refreshInterval !== undefined) {
      this.startRefresh();
    }
  }

  /**
   * 创建标题
   */
  private createTitle(): HTMLElement {
    const title = document.createElement('div');
    title.className = 'panel-title';
    title.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #4CAF50;
      text-align: center;
    `;
    title.textContent = '游戏状态';
    return title;
  }
}
