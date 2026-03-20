import { GameModeType, IGameCore, Player } from '../interfaces';
import { EventEmitter } from 'events';

/**
 * 游戏实例定义
 */
export interface GameInstance {
  id: string;
  game: IGameCore;
  container: HTMLElement;
  playerIds: string[];
  config: any;
  isActive: boolean;
}

/**
 * 游戏实例配置
 */
export interface GameInstanceConfig {
  gameCreator: (container: HTMLElement) => IGameCore;
  container: HTMLElement;
  playerConfigs: Array<{ playerId: string; name: string; config: any }>;
}

/**
 * 游戏规则配置
 */
export interface GameRuleConfig {
  // 单机模式规则
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  aiResponseDelay?: number;

  // 通用规则
  timeLimit?: number;
  maxLives?: number;
  winScore?: number;
}

/**
 * 统一模式管理器
 * 
 * 核心职责：
 * 1. 根据模式类型决定游戏实例化策略
 * 2. 管理游戏实例的生命周期
 * 3. 统一收集游戏数据
 * 4. 应用模式特定的规则
 */
export class UnifiedModeManager extends EventEmitter {
  private modeType: GameModeType;
  private gameInstances: Map<string, GameInstance> = new Map();
  private players: Map<string, Player> = new Map();
  private parentContainer: HTMLElement | null = null;

  // 游戏状态收集
  private gameStates: Map<string, any> = new Map();

  // 配置
  private ruleConfig: GameRuleConfig = {};

  constructor(modeType: GameModeType) {
    super();
    this.modeType = modeType;
    this.log(`Initialized with mode: ${modeType}`);
  }

  /**
   * 设置游戏规则配置
   */
  setRuleConfig(config: GameRuleConfig): void {
    this.ruleConfig = { ...this.ruleConfig, ...config };
    this.log('Rule config updated', this.ruleConfig);
  }

  /**
   * 获取规则配置
   */
  getRuleConfig(): GameRuleConfig {
    return { ...this.ruleConfig };
  }

  /**
   * 根据模式类型创建游戏实例
   * 
   * 核心策略：
   * - 单人模式：1个游戏实例，1个玩家
   * - 组队/多人模式：1个游戏实例，多个玩家
   * - 本地对抗模式：2个游戏实例，各自独立，物理分屏
   * - 网络对抗模式：2个游戏实例，各自独立，网络同步
   */
  async createGameInstances(config: GameInstanceConfig): Promise<GameInstance[]> {
    this.log(`Creating game instances for mode: ${this.modeType}`);

    this.parentContainer = config.container;

    switch (this.modeType) {
      case GameModeType.SINGLE_PLAYER:
        return await this.createSinglePlayerInstances(config);

      case GameModeType.TEAM:
        return await this.createTeamInstances(config);

      case GameModeType.MULTIPLAYER:
        return await this.createMultiplayerInstances(config);

      case GameModeType.LOCAL_BATTLE:
        return await this.createLocalBattleInstances(config);

      case GameModeType.ONLINE_BATTLE:
        return await this.createOnlineBattleInstances(config);

      default:
        throw new Error(`Unknown mode type: ${this.modeType}`);
    }
  }

  /**
   * 阶段1: 单人模式 - 1个游戏实例 + 1个玩家
   */
  private async createSinglePlayerInstances(
    config: GameInstanceConfig
  ): Promise<GameInstance[]> {
    this.log('[SinglePlayer] Creating 1 game instance for 1 player');

    const playerConfig = config.playerConfigs[0];

    // 1. 添加玩家
    this.addPlayer({
      id: playerConfig.playerId,
      name: playerConfig.name,
      score: 0,
      lives: this.ruleConfig.maxLives || 3,
      isReady: true,
    });

    // 2. 创建游戏实例
    const gameInstance = await this.createGameInstance(
      'game_single',
      config.gameCreator,
      config.container,
      [playerConfig.playerId],
      {
        ...playerConfig.config,
        mode: 'single',
        aiDifficulty: this.ruleConfig.aiDifficulty || 'medium',
        timeLimit: this.ruleConfig.timeLimit,
      }
    );

    // 3. 设置事件监听
    this.setupGameEventListeners(gameInstance);

    this.log('[SinglePlayer] Game instance created successfully');
    return [gameInstance];
  }

  /**
   * 阶段3: 组队模式 - 1个游戏实例 + 多个玩家（同一队伍）
   */
  private async createTeamInstances(
    config: GameInstanceConfig
  ): Promise<GameInstance[]> {
    this.log('[Team] Creating 1 game instance for multiple players');

    // 1. 添加所有玩家（同一队伍）
    config.playerConfigs.forEach((playerConfig) => {
      this.addPlayer({
        id: playerConfig.playerId,
        name: playerConfig.name,
        score: 0,
        lives: this.ruleConfig.maxLives || 3,
        teamId: 'team1', // 同一队伍
        isReady: true,
      });
    });

    // 2. 创建游戏实例
    const gameInstance = await this.createGameInstance(
      'game_team',
      config.gameCreator,
      config.container,
      config.playerConfigs.map((p) => p.playerId),
      {
        mode: 'team',
        timeLimit: this.ruleConfig.timeLimit,
      }
    );

    this.setupGameEventListeners(gameInstance);
    return [gameInstance];
  }

  /**
   * 阶段4: 多人模式 - 1个游戏实例 + 多个玩家（独立）
   */
  private async createMultiplayerInstances(
    config: GameInstanceConfig
  ): Promise<GameInstance[]> {
    this.log('[Multiplayer] Creating 1 game instance for multiple players');

    // 1. 添加所有玩家（独立）
    config.playerConfigs.forEach((playerConfig) => {
      this.addPlayer({
        id: playerConfig.playerId,
        name: playerConfig.name,
        score: 0,
        lives: this.ruleConfig.maxLives || 3,
        isReady: true,
      });
    });

    // 2. 创建游戏实例
    const gameInstance = await this.createGameInstance(
      'game_multi',
      config.gameCreator,
      config.container,
      config.playerConfigs.map((p) => p.playerId),
      {
        mode: 'multiplayer',
        timeLimit: this.ruleConfig.timeLimit,
      }
    );

    this.setupGameEventListeners(gameInstance);
    return [gameInstance];
  }

  /**
   * 阶段2: 本地对抗模式 - 2个游戏实例 + 物理分屏
   */
  private async createLocalBattleInstances(
    config: GameInstanceConfig
  ): Promise<GameInstance[]> {
    this.log('[LocalBattle] Creating 2 game instances for local battle');

    if (config.playerConfigs.length !== 2) {
      throw new Error('Local battle mode requires exactly 2 players');
    }

    // 1. 设置物理分屏
    this.setupSplitScreen(config.container, 'vertical');

    // 2. 获取分屏容器
    const container1 = document.getElementById('player1-container') as HTMLElement;
    const container2 = document.getElementById('player2-container') as HTMLElement;

    if (!container1 || !container2) {
      throw new Error('Split screen containers not found');
    }

    // 3. 添加玩家
    config.playerConfigs.forEach((playerConfig, index) => {
      this.addPlayer({
        id: playerConfig.playerId,
        name: playerConfig.name,
        score: 0,
        lives: this.ruleConfig.maxLives || 3,
        isReady: true,
      });
    });

    // 4. 创建两个游戏实例
    const gameInstance1 = await this.createGameInstance(
      'game_local_p1',
      config.gameCreator,
      container1,
      [config.playerConfigs[0].playerId],
      {
        ...config.playerConfigs[0].config,
        mode: 'local_battle',
        playerIndex: 0,
      }
    );

    const gameInstance2 = await this.createGameInstance(
      'game_local_p2',
      config.gameCreator,
      container2,
      [config.playerConfigs[1].playerId],
      {
        ...config.playerConfigs[1].config,
        mode: 'local_battle',
        playerIndex: 1,
      }
    );

    // 5. 设置事件监听
    this.setupGameEventListeners(gameInstance1);
    this.setupGameEventListeners(gameInstance2);

    this.log('[LocalBattle] Game instances created successfully');
    return [gameInstance1, gameInstance2];
  }

  /**
   * 阶段5: 网络对抗模式 - 2个游戏实例 + 网络同步
   */
  private async createOnlineBattleInstances(
    config: GameInstanceConfig
  ): Promise<GameInstance[]> {
    this.log('[OnlineBattle] Creating 2 game instances for online battle');

    // 网络对抗模式需要额外的网络服务
    // 这个功能在阶段5实现
    throw new Error('Online battle mode will be implemented in Phase 5');
  }

  /**
   * 创建单个游戏实例
   */
  private async createGameInstance(
    id: string,
    gameCreator: (container: HTMLElement) => IGameCore,
    container: HTMLElement,
    playerIds: string[],
    config: any
  ): Promise<GameInstance> {
    this.log(`Creating game instance: ${id}`);

    // 1. 创建游戏实例
    const game = gameCreator(container);

    // 2. 初始化游戏
    await game.initialize(config);

    // 3. 创建游戏实例对象
    const gameInstance: GameInstance = {
      id,
      game,
      container,
      playerIds,
      config,
      isActive: false,
    };

    // 4. 存储游戏实例
    this.gameInstances.set(id, gameInstance);

    return gameInstance;
  }

  /**
   * 设置游戏事件监听
   */
  private setupGameEventListeners(gameInstance: GameInstance): void {
    const { id, game } = gameInstance;

    // 监听状态变化
    game.on('state_change', (state: any) => {
      this.gameStates.set(id, state);
      this.emit('game_state_changed', { instanceId: id, state });
      this.log(`Game ${id} state changed`, state);
    });

    // 监听游戏开始
    game.on('game_start', () => {
      gameInstance.isActive = true;
      this.emit('game_started', { instanceId: id });
      this.log(`Game ${id} started`);
    });

    // 监听游戏结束
    game.on('game_end', (result: any) => {
      gameInstance.isActive = false;
      this.handleGameEnd(id, result);
      this.log(`Game ${id} ended`, result);
    });

    // 监听游戏暂停
    game.on('game_pause', () => {
      this.emit('game_paused', { instanceId: id });
      this.log(`Game ${id} paused`);
    });

    // 监听游戏恢复
    game.on('game_resume', () => {
      this.emit('game_resumed', { instanceId: id });
      this.log(`Game ${id} resumed`);
    });

    // 监听分数变化
    game.on('score_change', (data: any) => {
      this.emit('score_changed', { instanceId: id, ...data });
      this.updatePlayerScores(id, data);
    });
  }

  /**
   * 处理游戏结束
   */
  private handleGameEnd(instanceId: string, result: any): void {
    // 更新玩家状态
    const gameInstance = this.gameInstances.get(instanceId);
    if (gameInstance) {
      gameInstance.playerIds.forEach((playerId) => {
        const player = this.players.get(playerId);
        if (player) {
          player.score = result.score || 0;
          player.lives = result.lives || 0;
        }
      });
    }

    // 触发事件
    this.emit('game_ended', { instanceId, result });

    // 根据模式应用规则
    this.applyGameRules();
  }

  /**
   * 更新玩家分数
   */
  private updatePlayerScores(instanceId: string, scoreData: any): void {
    const gameInstance = this.gameInstances.get(instanceId);
    if (gameInstance) {
      gameInstance.playerIds.forEach((playerId) => {
        const player = this.players.get(playerId);
        if (player && scoreData.playerId === playerId) {
          player.score = scoreData.score;
        }
      });
    }
  }

  /**
   * 应用游戏规则
   */
  private applyGameRules(): void {
    // 根据不同的模式应用不同的规则
    switch (this.modeType) {
      case GameModeType.SINGLE_PLAYER:
        this.applySinglePlayerRules();
        break;

      case GameModeType.LOCAL_BATTLE:
        this.applyLocalBattleRules();
        break;

      // 其他模式的规则在后续阶段实现
      default:
        this.log(`Rules for mode ${this.modeType} not implemented yet`);
    }
  }

  /**
   * 应用单人模式规则
   */
  private applySinglePlayerRules(): void {
    const gameInstance = Array.from(this.gameInstances.values())[0];
    if (!gameInstance) return;

    const state = this.gameStates.get(gameInstance.id);
    if (!state) return;

    // 判定是否获胜
    const winScore = this.ruleConfig.winScore || 100;
    const isWin = (state.score || 0) >= winScore;

    if (isWin) {
      this.emit('player_won', {
        playerId: gameInstance.playerIds[0],
        score: state.score,
      });
    }
  }

  /**
   * 应用本地对抗规则
   */
  private applyLocalBattleRules(): void {
    const instances = Array.from(this.gameInstances.values());
    if (instances.length !== 2) return;

    const state1 = this.gameStates.get(instances[0].id);
    const state2 = this.gameStates.get(instances[1].id);

    if (!state1 || !state2) return;

    // 判定胜负
    const score1 = state1.score || 0;
    const score2 = state2.score || 0;
    const lives1 = state1.lives || 3;
    const lives2 = state2.lives || 3;

    let winner: string;
    let reason: string;

    // 判定胜负规则
    if (lives1 <= 0 && lives2 > 0) {
      // 玩家1生命值耗尽，玩家2获胜
      winner = instances[1].playerIds[0];
      reason = 'player1_lives_depleted';
    } else if (lives2 <= 0 && lives1 > 0) {
      // 玩家2生命值耗尽，玩家1获胜
      winner = instances[0].playerIds[0];
      reason = 'player2_lives_depleted';
    } else if (lives1 <= 0 && lives2 <= 0) {
      // 两人都耗尽，平局
      winner = 'draw';
      reason = 'both_lives_depleted';
    } else {
      // 根据分数判定
      if (score1 > score2) {
        winner = instances[0].playerIds[0];
        reason = 'score_comparison';
      } else if (score2 > score1) {
        winner = instances[1].playerIds[0];
        reason = 'score_comparison';
      } else {
        winner = 'draw';
        reason = 'score_tie';
      }
    }

    this.emit('battle_ended', {
      winner,
      reason,
      player1: {
        id: instances[0].playerIds[0],
        score: score1,
        lives: lives1,
      },
      player2: {
        id: instances[1].playerIds[0],
        score: score2,
        lives: lives2,
      },
    });
  }

  /**
   * 获取本地对抗模式的实时数据
   */
  getLocalBattleData(): {
    player1: { id: string; name: string; score: number; lives: number };
    player2: { id: string; name: string; score: number; lives: number };
    isRunning: boolean;
  } | null {
    if (this.modeType !== GameModeType.LOCAL_BATTLE) {
      return null;
    }

    const instances = Array.from(this.gameInstances.values());
    if (instances.length !== 2) {
      return null;
    }

    const player1 = this.players.get(instances[0].playerIds[0]);
    const player2 = this.players.get(instances[1].playerIds[0]);

    if (!player1 || !player2) {
      return null;
    }

    return {
      player1: {
        id: player1.id,
        name: player1.name,
        score: player1.score,
        lives: player1.lives || 3,
      },
      player2: {
        id: player2.id,
        name: player2.name,
        score: player2.score,
        lives: player2.lives || 3,
      },
      isRunning: instances.some((inst) => inst.isActive),
    };
  }

  /**
   * 设置物理分屏
   */
  private setupSplitScreen(
    parentContainer: HTMLElement,
    splitType: 'vertical' | 'horizontal'
  ): void {
    this.log(`Setting up split screen: ${splitType}`);

    // 清空容器
    parentContainer.innerHTML = '';
    parentContainer.style.position = 'relative';
    parentContainer.style.width = '100%';
    parentContainer.style.height = '100%';
    parentContainer.style.overflow = 'hidden';

    // 创建两个子容器
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');

    container1.id = 'player1-container';
    container2.id = 'player2-container';

    // 应用分屏样式
    const baseStyle: any = {
      position: 'absolute',
      top: '0',
      width: splitType === 'vertical' ? '50%' : '100%',
      height: splitType === 'vertical' ? '100%' : '50%',
      overflow: 'hidden',
    };

    Object.assign(container1.style, baseStyle);
    Object.assign(container1.style, {
      left: '0',
      backgroundColor: 'rgba(255, 182, 193, 0.1)', // 粉色背景
    });

    Object.assign(container2.style, baseStyle);
    Object.assign(container2.style, {
      left: splitType === 'vertical' ? '50%' : '0',
      top: splitType === 'vertical' ? '0' : '50%',
      backgroundColor: 'rgba(0, 255, 255, 0.1)', // 青色背景
      borderLeft: splitType === 'vertical' ? '2px solid #fff' : 'none',
      borderTop: splitType === 'horizontal' ? '2px solid #fff' : 'none',
    });

    // 添加玩家标识
    container1.innerHTML = `
      <div class="player-label" style="position:absolute; top:10px; left:10px; z-index:1000;
                  background:rgba(255,182,193,0.9); padding:8px 16px; border-radius:8px;
                  font-weight:bold; color:#333; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
        玩家 1
      </div>
    `;

    container2.innerHTML = `
      <div class="player-label" style="position:absolute; top:10px; right:10px; z-index:1000;
                  background:rgba(0,255,255,0.9); padding:8px 16px; border-radius:8px;
                  font-weight:bold; color:#333; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
        玩家 2
      </div>
    `;

    parentContainer.appendChild(container1);
    parentContainer.appendChild(container2);

    this.log('Split screen setup completed');
  }

  /**
   * 添加玩家
   */
  addPlayer(player: Player): boolean {
    if (this.players.has(player.id)) {
      this.log(`Player ${player.id} already exists`);
      return false;
    }

    this.players.set(player.id, player);
    this.log(`Player added: ${player.id}`, player);
    return true;
  }

  /**
   * 获取玩家
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * 获取所有玩家
   */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * 获取游戏实例
   */
  getGameInstance(instanceId: string): GameInstance | undefined {
    return this.gameInstances.get(instanceId);
  }

  /**
   * 获取所有游戏实例
   */
  getAllGameInstances(): GameInstance[] {
    return Array.from(this.gameInstances.values());
  }

  /**
   * 获取游戏状态
   */
  getGameState(instanceId: string): any {
    return this.gameStates.get(instanceId);
  }

  /**
   * 获取所有游戏状态
   */
  getAllGameStates(): Map<string, any> {
    return new Map(this.gameStates);
  }

  /**
   * 启动所有游戏实例
   */
  async startAllGames(): Promise<void> {
    this.log('Starting all games');

    for (const [id, gameInstance] of this.gameInstances) {
      await gameInstance.game.start();
      this.log(`Game ${id} started`);
    }
  }

  /**
   * 暂停所有游戏实例
   */
  async pauseAllGames(): Promise<void> {
    this.log('Pausing all games');

    for (const [id, gameInstance] of this.gameInstances) {
      await gameInstance.game.pause();
      this.log(`Game ${id} paused`);
    }
  }

  /**
   * 恢复所有游戏实例
   */
  async resumeAllGames(): Promise<void> {
    this.log('Resuming all games');

    for (const [id, gameInstance] of this.gameInstances) {
      await gameInstance.game.resume();
      this.log(`Game ${id} resumed`);
    }
  }

  /**
   * 重启所有游戏实例
   */
  async restartAllGames(): Promise<void> {
    this.log('Restarting all games');

    for (const [id, gameInstance] of this.gameInstances) {
      await gameInstance.game.restart();
      this.log(`Game ${id} restarted`);
    }
  }

  /**
   * 停止所有游戏实例
   */
  async stopAllGames(): Promise<void> {
    this.log('Stopping all games');

    for (const [id, gameInstance] of this.gameInstances) {
      await gameInstance.game.stop();
      this.log(`Game ${id} stopped`);
    }
  }

  /**
   * 销毁所有游戏实例
   */
  async destroyAllGames(): Promise<void> {
    this.log('Destroying all games');

    for (const [id, gameInstance] of this.gameInstances) {
      await gameInstance.game.stop();
      this.gameStates.delete(id);
      this.log(`Game ${id} destroyed`);
    }

    this.gameInstances.clear();

    // 清理容器
    if (this.parentContainer) {
      this.parentContainer.innerHTML = '';
    }

    this.log('All games destroyed');
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    return {
      modeType: this.modeType,
      playerCount: this.players.size,
      gameInstanceCount: this.gameInstances.size,
      ruleConfig: this.ruleConfig,
      players: Array.from(this.players.values()),
      gameStates: Array.from(this.gameStates.entries()),
    };
  }

  /**
   * 日志输出
   */
  private log(message: string, data?: any): void {
    console.log(`[UnifiedModeManager] ${message}`, data || '');
  }
}
