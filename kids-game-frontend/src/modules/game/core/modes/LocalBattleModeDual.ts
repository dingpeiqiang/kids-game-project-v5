import { BaseGameMode } from './BaseGameMode';
import { GameModeConfig, GameModeType, Player } from '../interfaces';
import { IGameCore } from '../interfaces';

/**
 * 本地对抗模式 - 双独立实例版本
 * 
 * 核心设计：
 * 1. 创建两个完全隔离的游戏实例
 * 2. 模式层只负责：
 *    - 容器分割（物理切屏）
 *    - 游戏实例创建和销毁
 *    - 数据收集（从两个游戏获取结果）
 *    - 规则控制（判定胜负、协调回合）
 * 3. 游戏实例之间完全隔离，互不干扰
 */
export class LocalBattleModeDual extends BaseGameMode {
  // ==================== 游戏实例（完全隔离） ====================
  private gameInstance1: IGameCore | null = null;
  private gameInstance2: IGameCore | null = null;

  // ==================== 容器（物理切屏） ====================
  private parentContainer: HTMLElement | null = null;
  private container1: HTMLElement | null = null;
  private container2: HTMLElement | null = null;

  // ==================== 配置 ====================
  private splitType: 'horizontal' | 'vertical' = 'vertical';

  // ==================== 数据收集 ====================
  private gameState1: any = null;
  private gameState2: any = null;

  // ==================== 状态 ====================
  private game1Active: boolean = false;
  private game2Active: boolean = false;

  constructor(config?: Partial<GameModeConfig> & { splitType?: 'horizontal' | 'vertical' }) {
    super({
      ...config,
      modeType: GameModeType.LOCAL_BATTLE,
      modeName: 'Local Battle (Dual)',
      maxPlayers: 2,
      supportAI: false,
    });

    this.splitType = config?.splitType || 'vertical';
  }

  /**
   * 初始化模式
   */
  async initialize(
    config: GameModeConfig,
    container?: HTMLElement
  ): Promise<void> {
    await super.initialize(config);

    if (container) {
      this.parentContainer = container;
      this.setupSplitScreen(container);
    }

    this.log('LocalBattleModeDual initialized', {
      splitType: this.splitType,
    });
  }

  /**
   * 设置物理切屏（只负责容器分割）
   */
  private setupSplitScreen(parentContainer: HTMLElement): void {
    parentContainer.innerHTML = '';
    parentContainer.style.position = 'relative';
    parentContainer.style.width = '100%';
    parentContainer.style.height = '100%';
    parentContainer.style.overflow = 'hidden';

    // 创建两个独立容器
    this.container1 = document.createElement('div');
    this.container2 = document.createElement('div');

    this.container1.id = 'player1-container';
    this.container2.id = 'player2-container';

    // 基础样式
    const baseStyle: any = {
      position: 'absolute',
      top: '0',
      width: this.splitType === 'vertical' ? '50%' : '100%',
      height: this.splitType === 'vertical' ? '100%' : '50%',
      overflow: 'hidden',
    };

    Object.assign(this.container1.style, baseStyle);
    Object.assign(this.container1.style, {
      left: '0',
      backgroundColor: 'rgba(255, 182, 193, 0.1)', // 粉色背景（玩家1）
    });

    Object.assign(this.container2.style, baseStyle);
    Object.assign(this.container2.style, {
      left: this.splitType === 'vertical' ? '50%' : '0',
      top: this.splitType === 'vertical' ? '0' : '50%',
      backgroundColor: 'rgba(0, 255, 255, 0.1)', // 青色背景（玩家2）
      borderLeft: this.splitType === 'vertical' ? '2px solid #fff' : 'none',
      borderTop: this.splitType === 'horizontal' ? '2px solid #fff' : 'none',
    });

    // 玩家标识（仅用于显示，不影响游戏逻辑）
    this.container1.innerHTML = `
      <div class="player-label" style="position:absolute; top:10px; left:10px; z-index:1000;
                  background:rgba(255,182,193,0.9); padding:8px 16px; border-radius:8px;
                  font-weight:bold; color:#333; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
        玩家 1
      </div>
    `;

    this.container2.innerHTML = `
      <div class="player-label" style="position:absolute; top:10px; right:10px; z-index:1000;
                  background:rgba(0,255,255,0.9); padding:8px 16px; border-radius:8px;
                  font-weight:bold; color:#333; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
        玩家 2
      </div>
    `;

    parentContainer.appendChild(this.container1);
    parentContainer.appendChild(this.container2);

    this.log('Split screen setup completed');
  }

  /**
   * 创建并启动两个独立游戏实例
   * 
   * @param gameCreator 游戏创建函数（每次调用创建新实例）
   * @param config1 玩家1的游戏配置
   * @param config2 玩家2的游戏配置
   */
  async createAndStartGames(
    gameCreator: (container: HTMLElement) => IGameCore,
    config1: any,
    config2: any
  ): Promise<void> {
    if (!this.container1 || !this.container2) {
      throw new Error('Containers not initialized');
    }

    this.log('Creating two independent game instances...');

    // 创建游戏1（独立实例）
    this.gameInstance1 = gameCreator(this.container1);
    await this.gameInstance1.initialize(config1);
    
    // 监听游戏1事件（数据收集）
    this.gameInstance1.on('state_change', (state: any) => {
      this.gameState1 = state;
      this.log('Game1 state updated', state);
    });
    
    this.gameInstance1.on('game_start', () => {
      this.game1Active = true;
      this.log('Game1 started');
    });
    
    this.gameInstance1.on('game_end', (result: any) => {
      this.game1Active = false;
      this.log('Game1 ended', result);
      this.collectGameData(1, result);
    });

    // 创建游戏2（独立实例）
    this.gameInstance2 = gameCreator(this.container2);
    await this.gameInstance2.initialize(config2);
    
    // 监听游戏2事件（数据收集）
    this.gameInstance2.on('state_change', (state: any) => {
      this.gameState2 = state;
      this.log('Game2 state updated', state);
    });
    
    this.gameInstance2.on('game_start', () => {
      this.game2Active = true;
      this.log('Game2 started');
    });
    
    this.gameInstance2.on('game_end', (result: any) => {
      this.game2Active = false;
      this.log('Game2 ended', result);
      this.collectGameData(2, result);
    });

    // 启动两个游戏
    this.gameInstance1.start();
    this.gameInstance2.start();

    this.log('Both games started independently');
  }

  /**
   * 收集游戏数据（数据整合）
   */
  private collectGameData(gameId: number, result: any): void {
    const playerKey = `player${gameId}`;
    
    // 更新玩家数据
    const player = this.getPlayer(playerKey);
    if (player) {
      player.score = result.score || 0;
      player.lives = result.lives || player.lives;
    }

    // 检查两个游戏是否都结束
    if (this.gameState1?.ended && this.gameState2?.ended) {
      this.applyGameRules();
    }
  }

  /**
   * 应用游戏规则（规则控制）
   */
  private applyGameRules(): void {
    if (!this.gameState1 || !this.gameState2) {
      return;
    }

    const score1 = this.gameState1.score || 0;
    const score2 = this.gameState2.score || 0;

    let winner: string;
    if (score1 > score2) {
      winner = 'player1';
    } else if (score2 > score1) {
      winner = 'player2';
    } else {
      winner = 'draw';
    }

    // 触发规则判定事件
    this.emit('battle_end', {
      winner,
      player1: {
        score: score1,
        state: this.gameState1,
      },
      player2: {
        score: score2,
        state: this.gameState2,
      },
    });

    this.log('Battle rules applied', { winner, score1, score2 });
  }

  /**
   * 获取两个游戏的状态（数据整合）
   */
  getCombinedState(): {
    game1: any;
    game2: any;
    comparison: any;
  } {
    return {
      game1: this.gameState1,
      game2: this.gameState2,
      comparison: this.compareGames(),
    };
  }

  /**
   * 对比两个游戏的状态
   */
  private compareGames(): any {
    if (!this.gameState1 || !this.gameState2) {
      return null;
    }

    return {
      scoreDifference: (this.gameState1.score || 0) - (this.gameState2.score || 0),
      livesDifference: (this.gameState1.lives || 0) - (this.gameState2.lives || 0),
      player1Active: this.game1Active,
      player2Active: this.game2Active,
    };
  }

  /**
   * 暂停两个游戏
   */
  pauseGames(): void {
    this.gameInstance1?.pause();
    this.gameInstance2?.pause();
    this.log('Both games paused');
  }

  /**
   * 恢复两个游戏
   */
  resumeGames(): void {
    this.gameInstance1?.resume();
    this.gameInstance2?.resume();
    this.log('Both games resumed');
  }

  /**
   * 重启两个游戏
   */
  restartGames(): void {
    this.gameState1 = null;
    this.gameState2 = null;
    this.game1Active = false;
    this.game2Active = false;
    
    this.gameInstance1?.restart();
    this.gameInstance2?.restart();
    
    this.log('Both games restarted');
  }

  /**
   * 销毁游戏实例
   */
  async destroyGames(): Promise<void> {
    this.log('Destroying game instances...');

    if (this.gameInstance1) {
      await this.gameInstance1.stop();
      this.gameInstance1 = null;
    }

    if (this.gameInstance2) {
      await this.gameInstance2.stop();
      this.gameInstance2 = null;
    }

    this.gameState1 = null;
    this.gameState2 = null;
    this.game1Active = false;
    this.game2Active = false;

    // 清理容器
    if (this.parentContainer) {
      this.parentContainer.innerHTML = '';
    }

    this.log('Game instances destroyed');
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    return {
      ...super.getStatistics(),
      game1Active: this.game1Active,
      game2Active: this.game2Active,
      splitType: this.splitType,
      combinedState: this.getCombinedState(),
    };
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.destroyGames();
    super.cleanup();
  }
}
