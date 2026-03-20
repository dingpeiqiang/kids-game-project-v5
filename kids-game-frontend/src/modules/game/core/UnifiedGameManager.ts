/**
 * 统一游戏模式管理器
 * 
 * 核心职责：
 * 1. 根据模式类型决定实例化策略
 * 2. 管理游戏实例生命周期
 * 3. 统一收集游戏数据
 * 4. 应用模式特定的规则
 */
// Phaser 从 CDN 加载为全局变量
import { BattleGameScene, BattleMode } from '../battle/BattleGameBase';
import { PlayerType } from '../battle/BattleGameBase';

// 重新导出 PlayerType 以便外部使用
export { PlayerType };

export enum GameMode {
  /** 单机模式 - 1个游戏实例 + 1个玩家 */
  SINGLE = 'single',
  /** 本地对抗 - 2个游戏实例 + 物理分屏 */
  LOCAL_BATTLE = 'local',
  /** 组队模式 - 1个游戏实例 + 多个玩家（同一队） */
  TEAM = 'team',
  /** 多人模式 - 1个游戏实例 + 多个玩家（独立） */
  MULTI = 'multi',
  /** 网络对战 - 2个游戏实例 + 网络同步 */
  ONLINE_BATTLE = 'online',
}

export interface GameConfig {
  /** 游戏 ID（从后端获取） */
  gameId?: number;
  /** 游戏类型（如 math-adventure） */
  gameType: string;
  /** 游戏模块路径（从后端配置获取，可选） */
  modulePath?: string;
  /** 游戏基础路径（默认 '../games'，可选） */
  baseGamesPath?: string;
  /** 导出类名查找顺序（默认 ['Scene', 'Game']，可选） */
  exportOrder?: string[];
  /** 游戏模式 */
  mode: GameMode;
  /** 游戏容器元素 */
  container: HTMLElement;
  /** 玩家 1 信息 */
  player1?: {
    id: number;
    username: string;
    nickname?: string;
  };
  /** 玩家 2 信息（对抗模式需要） */
  player2?: {
    id: number;
    username: string;
    nickname?: string;
  };
  /** 最大分数（可选） */
  maxScore?: number;
  /** 时间限制（秒，可选） */
  timeLimit?: number;
  /** 对战房间号（网络对战需要） */
  roomId?: string;
}

export interface GameInstance {
  /** 游戏实例ID */
  id: string;
  /** Phaser游戏实例 */
  game: Phaser.Game | null;
  /** 玩家ID */
  playerId: PlayerType;
  /** 当前状态 */
  state: {
    score: number;
    lives: number;
    questionCount: number;
  };
}

export interface GameState {
  /** 游戏模式 */
  mode: GameMode;
  /** 游戏实例列表 */
  instances: GameInstance[];
  /** 游戏是否运行中 */
  isRunning: boolean;
  /** 游戏时间（秒） */
  gameTime: number;
  /** 胜利者 */
  winner: PlayerType | null;
}

export class UnifiedGameManager {
  private gameConfig: GameConfig;
  private gameInstances: Map<string, GameInstance> = new Map();
  private isRunning: boolean = false;
  private gameTime: number = 0;
  private gameTimer: number | null = null;
  private winner: PlayerType | null = null;
  private onStateChangeCallback?: (state: GameState) => void;
  private onGameOverCallback?: (winner: PlayerType | null, finalState: GameState) => void;

  constructor(config: GameConfig) {
    this.gameConfig = config;
  }

  /**
   * 初始化游戏
   * 根据模式类型决定实例化策略
   */
  async initialize(): Promise<void> {
    console.log('[UnifiedGameManager] 初始化游戏，模式:', this.gameConfig.mode);

    // 清理旧实例
    this.destroy();

    // 根据模式类型创建游戏实例
    switch (this.gameConfig.mode) {
      case GameMode.SINGLE:
        await this.createSinglePlayerGame();
        break;
      case GameMode.LOCAL_BATTLE:
        await this.createLocalBattleGame();
        break;
      case GameMode.TEAM:
        await this.createTeamGame();
        break;
      case GameMode.MULTI:
        await this.createMultiPlayerGame();
        break;
      case GameMode.ONLINE_BATTLE:
        await this.createOnlineBattleGame();
        break;
      default:
        throw new Error(`不支持的游戏模式: ${this.gameConfig.mode}`);
    }

    console.log('[UnifiedGameManager] 游戏初始化完成，实例数:', this.gameInstances.size);
  }

  /**
   * 创建单机模式游戏（1 个实例）
   */
  private async createSinglePlayerGame(): Promise<void> {
   const sceneOrGameClass = await this.loadGameScene();

    // 判断加载的是 Game 包装类还是 Scene 类
   const gameInstance = await this.createGameInstance(this.gameConfig.container, sceneOrGameClass);
   if (!gameInstance) {
     throw new Error('Failed to create single player game instance');
   }
   const instanceId = 'game-single';

    this.gameInstances.set(instanceId, {
      id: instanceId,
      game: gameInstance,
      playerId: PlayerType.PLAYER_1,
      state: { score: 0, lives: 3, questionCount: 0 },
    });

    // 监听游戏事件
    this.setupGameEvents(instanceId, gameInstance);
  }

  /**
   * 创建本地对抗游戏（2个实例，物理分屏）
   */
  private async createLocalBattleGame(): Promise<void> {
    if (!this.gameConfig.player2) {
      throw new Error('本地对抗模式需要玩家2信息');
    }

    // 通用方案：为所有游戏加载单机场景，在分屏容器中运行
    const sceneClass = await this.loadGameScene();

    // 创建左右分屏容器
    const containers = this.createSplitContainers();

    // 创建玩家 1 游戏实例（左侧）
  const game1 = await this.createGameInstance(containers.player1, sceneClass, {
      battleConfig: {
        mode: BattleMode.LOCAL_SPLIT,
        playerRole: PlayerType.PLAYER_1,
      },
    });
    if (!game1) {
      throw new Error('Failed to create player 1 game instance');
    }

    this.gameInstances.set('game-p1', {
      id: 'game-p1',
      game: game1,
      playerId: PlayerType.PLAYER_1,
      state: { score: 0, lives: 3, questionCount: 0 },
    });

    // 创建玩家 2 游戏实例（右侧）
  const game2 = await this.createGameInstance(containers.player2, sceneClass, {
      battleConfig: {
        mode: BattleMode.LOCAL_SPLIT,
        playerRole: PlayerType.PLAYER_2,
      },
    });
    if (!game2) {
      throw new Error('Failed to create player 2 game instance');
    }

    this.gameInstances.set('game-p2', {
      id: 'game-p2',
      game: game2,
      playerId: PlayerType.PLAYER_2,
      state: { score: 0, lives: 3, questionCount: 0 },
    });

    // 监听游戏事件
    this.setupGameEvents('game-p1', game1);
    this.setupGameEvents('game-p2', game2);
  }

  /**
   * 创建组队模式游戏（1个实例）
   */
  private async createTeamGame(): Promise<void> {
    // 组队模式暂时复用单机模式逻辑
    await this.createSinglePlayerGame();
  }

  /**
   * 创建多人模式游戏（1个实例）
   */
  private async createMultiPlayerGame(): Promise<void> {
    // 多人模式暂时复用单机模式逻辑
    await this.createSinglePlayerGame();
  }

  /**
   * 创建网络对战游戏（2个实例，网络同步）
   */
  private async createOnlineBattleGame(): Promise<void> {
    if (!this.gameConfig.player2 || !this.gameConfig.roomId) {
      throw new Error('网络对战模式需要玩家2信息和房间号');
    }

    const sceneClass = await this.loadBattleGameScene();

    // 创建左右分屏容器
    const containers = this.createSplitContainers();

    // 创建玩家 1 游戏实例（左侧）
  const game1 = await this.createGameInstance(containers.player1, sceneClass, {
      battleConfig: {
        mode: BattleMode.ONLINE_MULTIPLAYER,
        playerRole: PlayerType.PLAYER_1,
        roomId: this.gameConfig.roomId,
      },
    });
    if (!game1) {
      throw new Error('Failed to create player 1 online game instance');
    }

    this.gameInstances.set('game-p1', {
      id: 'game-p1',
      game: game1,
      playerId: PlayerType.PLAYER_1,
      state: { score: 0, lives: 3, questionCount: 0 },
    });

    // 创建玩家 2 游戏实例（右侧）
  const game2 = await this.createGameInstance(containers.player2, sceneClass, {
      battleConfig: {
        mode: BattleMode.ONLINE_MULTIPLAYER,
        playerRole: PlayerType.PLAYER_2,
        roomId: this.gameConfig.roomId,
      },
    });
    if (!game2) {
      throw new Error('Failed to create player 2 online game instance');
    }

    this.gameInstances.set('game-p2', {
      id: 'game-p2',
      game: game2,
      playerId: PlayerType.PLAYER_2,
      state: { score: 0, lives: 3, questionCount: 0 },
    });

    // 监听游戏事件
    this.setupGameEvents('game-p1', game1);
    this.setupGameEvents('game-p2', game2);
  }

  /**
   * 加载游戏场景（完全配置化）
   * 所有路径和类名都从配置中读取，无硬编码
   */
  private async loadGameScene(): Promise<any> {
    const gameType = this.gameConfig.gameType;
    const modulePath = this.gameConfig.modulePath || gameType;
  
    console.log('[UnifiedGameManager] 加载游戏场景:', {
      gameType,
      modulePath,
      gameId: this.gameConfig.gameId,
    });
  
    try {
      // 1. 构建完整的模块路径（配置化）
      const actualModulePath = this.buildModulePath(modulePath);
      
      console.log('[UnifiedGameManager] 导入模块路径:', actualModulePath);
        
      // 2. 动态导入游戏模块
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
    const gameModule = await import(/* @vite-ignore */ actualModulePath);
        
      // 3. 根据配置的导出类名查找（配置化）
      const sceneClass = this.findSceneClass(gameModule, actualModulePath);
      
      if (!sceneClass) {
        throw new Error(`无法找到游戏场景类，模块：${actualModulePath}`);
      }
  
      console.log('[UnifiedGameManager] 游戏模块加载成功:', sceneClass.name || 'Anonymous');
      return sceneClass;
  
    } catch (error: any) {
      console.error('[UnifiedGameManager] 加载游戏模块失败:', {
        gameType,
        modulePath,
        error: error.message,
      });
      
      // 提供更友好的错误提示
      let friendlyMessage = `加载游戏 "${gameType}" 失败。`;
      
      if (error.message.includes('Failed to fetch dynamically imported module')) {
        friendlyMessage += `\n\n可能的原因：`;
        friendlyMessage += `\n1. 游戏模块文件不存在：请检查 ${modulePath} 目录是否存在`;
        friendlyMessage += `\n2. 文件命名不正确：应该是 ${modulePath}/${this.extractModuleName(modulePath)}Game.ts`;
        friendlyMessage += `\n3. 导出名称不正确：应该导出 Scene 或 Game 类`;
        friendlyMessage += `\n\n建议：在数据库中为该游戏配置正确的 module_path 字段。`;
      } else {
        friendlyMessage += `\n\n错误详情：${error.message}`;
      }
      
      throw new Error(friendlyMessage);
    }
  }

  /**
   * 构建模块路径（配置化）
   * 支持两种模式：
   * 1. 绝对路径：以 ../ 或 ./ 开头，直接使用
   * 2. 相对路径：使用配置的 baseGamesPath 自动拼接
   */
  private buildModulePath(modulePath: string): string {
    // 如果是绝对路径，直接使用
    if (modulePath.startsWith('../') || modulePath.startsWith('./')) {
      return modulePath;
    }

    // 使用配置的 baseGamesPath（默认 '../games'）
    const baseGamesPath = this.gameConfig.baseGamesPath || '../games';
    
    // 提取模块名的最后一部分并转换为 PascalCase
    const moduleName = this.extractModuleName(modulePath);
    
    // 拼接完整路径：../games/{modulePath}/{ModuleName}Game
    return `${baseGamesPath}/${modulePath}/${moduleName}Game`;
  }

  /**
   * 从 modulePath 提取模块名（PascalCase）
   * 例如：'snake' -> 'Snake', 'puzzle-game' -> 'PuzzleGame'
   */
  private extractModuleName(modulePath: string): string {
    const pathParts = modulePath.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // 将短横线分隔的名称转换为 PascalCase
    return lastPart.split('-').map((p: string) => 
      p.charAt(0).toUpperCase() + p.slice(1)
    ).join('');
  }

  /**
   * 查找游戏场景类（配置化）
   * 按照配置的 exportOrder 顺序查找
   */
  private findSceneClass(gameModule: any, modulePath: string): any {
    // 使用配置的导出顺序（默认优先 Scene，其次 Game）
    const exportOrder = this.gameConfig.exportOrder || [
      'Scene',  // 优先匹配 {*Scene}
      'Game',   // 其次匹配 {*Game}
    ];

    for (const exportPattern of exportOrder) {
      // 遍历模块的所有导出
      for (const [exportName, exportValue] of Object.entries(gameModule)) {
        // 如果导出名包含配置的模式（如 'Scene' 或 'Game'）
        if (typeof exportName === 'string' && exportName.includes(exportPattern)) {
          console.log(`[UnifiedGameManager] 找到匹配的导出：${exportName} (模式：${exportPattern})`);
          return exportValue;
        }
      }
    }

    // 兜底：使用第一个导出的类
    const firstExport = Object.values(gameModule)[0];
    if (firstExport) {
      console.warn(`[UnifiedGameManager] 未找到标准导出，使用第一个导出：${Object.keys(gameModule)[0]}`);
      return firstExport;
    }

    return null;
  }

  /**
   * 加载对战游戏场景（用于网络对战和本地对战）
   */
  private async loadBattleGameScene(): Promise<any> {
    // 对战模式使用通用的 BattleGameScene
    // 如果需要根据不同游戏类型加载，可以扩展为配置化
    const { BattleGameScene } = await import('../battle/BattleGameBase');
    return BattleGameScene;
  }

  /**
   * 智能创建游戏实例（支持 Scene 类和 Game 包装类）
   */
  private async createGameInstance(container: HTMLElement, sceneOrGameClass: any, extraConfig?: any): Promise<Phaser.Game | null> {
    // 检查是否是 Game 包装类（有 start 方法）
    if (sceneOrGameClass && typeof sceneOrGameClass === 'function' && sceneOrGameClass.prototype?.start) {
      try {
        // 确保容器有 ID
        if (!container.id) {
         container.id = `game-container-${Date.now()}`;
        }

        // 创建 Game 包装类实例并启动（start 是异步的）
       const gameWrapper = new sceneOrGameClass(container.id, extraConfig);
        await gameWrapper.start();

        // 返回内部的 Phaser.Game 实例
       const game = gameWrapper.getGame();
       if (!game) {
         throw new Error('Game wrapper returned null game instance');
       }
       return game;
      } catch (error) {
       console.error('[UnifiedGameManager] 使用 Game 包装类失败:', error);
        // 如果是 Game 包装类但创建失败，不应该回退到 Scene 模式
        // 直接抛出错误，因为回退会导致更严重的问题（把 Game 类当 Scene 用）
        throw new Error(`Game wrapper initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 默认：作为 Scene 类处理
   return this.createPhaserGame(container, sceneOrGameClass, extraConfig);
  }

  /**
   * 创建 Phaser 游戏实例
   */
  private createPhaserGame(
    container: HTMLElement,
    sceneClass: any,
    extraConfig?: any
  ): Phaser.Game {
    const { width, height } = this.getResolution();

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: container,
      backgroundColor: 0xf0f9ff,
      pixelArt: true,
      roundPixels: true,
      fps: 60,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width,
        height,
      },
      scene: [sceneClass], // 确保以数组形式传递场景
      ...extraConfig,
    };

    return new Phaser.Game(config);
  }

  /**
   * 创建分屏容器（对抗模式）
   */
  private createSplitContainers(): { player1: HTMLElement; player2: HTMLElement } {
    const mainContainer = this.gameConfig.container;

    // 清空容器
    mainContainer.innerHTML = '';

    // 创建玩家1容器（左侧，粉色主题）
    const container1 = document.createElement('div');
    container1.style.position = 'absolute';
    container1.style.left = '0';
    container1.style.top = '0';
    container1.style.width = '50%';
    container1.style.height = '100%';
    container1.style.background = 'linear-gradient(135deg, #fff5f8 0%, #fff 100%)';
    container1.style.borderRight = '2px solid #ff6b9d';
    mainContainer.appendChild(container1);

    // 创建玩家2容器（右侧，青色主题）
    const container2 = document.createElement('div');
    container2.style.position = 'absolute';
    container2.style.left = '50%';
    container2.style.top = '0';
    container2.style.width = '50%';
    container2.style.height = '100%';
    container2.style.background = 'linear-gradient(135deg, #f0fffe 0%, #fff 100%)';
    container2.style.borderLeft = '2px solid #4ecdc4';
    mainContainer.appendChild(container2);

    // 添加玩家标签
    this.addPlayerLabel(container1, '玩家1', '#ff6b9d');
    this.addPlayerLabel(container2, '玩家2', '#4ecdc4');

    return { player1: container1, player2: container2 };
  }

  /**
   * 添加玩家标签
   */
  private addPlayerLabel(container: HTMLElement, text: string, color: string): void {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '10px';
    label.style.left = '10px';
    label.style.padding = '5px 10px';
    label.style.background = color;
    label.style.color = 'white';
    label.style.borderRadius = '8px';
    label.style.fontSize = '14px';
    label.style.fontWeight = 'bold';
    label.style.zIndex = '100';
    label.textContent = text;
    container.appendChild(label);
  }

  /**
   * 获取最优分辨率
   */
  private getResolution(): { width: number; height: number } {
    const container = this.gameConfig.container;
    const rect = container.getBoundingClientRect();

    return {
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
    };
  }

  /**
   * 设置游戏事件监听
   */
  private setupGameEvents(instanceId: string, game: Phaser.Game | null): void {
    if (!game) {
      console.warn(`[UnifiedGameManager] ${instanceId} 游戏实例为 null，跳过事件监听设置`);
      return;
    }

    console.log(`[UnifiedGameManager] ${instanceId} 设置游戏事件监听`);

    // 等待游戏准备好
    game.events.on('ready', () => {
      console.log(`[UnifiedGameManager] ${instanceId} 游戏已准备好`);

      // 使用 Phaser 的事件总线监听场景事件
      // 注意：Phaser 的 SceneManager 有 events 属性，但 TypeScript 定义可能不完整
      const sceneManager = game.scene as any;

      if (sceneManager.events) {
        sceneManager.events.on(Phaser.Scenes.Events.CREATE, (scene: Phaser.Scene) => {
          console.log(`[UnifiedGameManager] ${instanceId} 场景创建：${scene.scene.key}`);

          // 为场景绑定自定义事件
          this.setupSceneEvents(instanceId, scene);
        });

        sceneManager.events.on(Phaser.Scenes.Events.START, (scene: Phaser.Scene) => {
          console.log(`[UnifiedGameManager] ${instanceId} 场景启动：${scene.scene.key}`);
        });
      }
    });
  }

  /**
   * 为单个场景设置事件监听
   */
  private setupSceneEvents(instanceId: string, scene: Phaser.Scene): void {
    // 检查是否是 BaseGameScene 实例
    if ('events' in scene && scene.events) {
      // 监听分数更新
      scene.events.on('score_update', (data: any) => {
        const instance = this.gameInstances.get(instanceId);
        if (instance) {
          instance.state.score = data.score;
          instance.state.questionCount = data.questionCount || instance.state.questionCount;
          console.log(`[UnifiedGameManager] ${instanceId} 分数更新:`, data);
          this.notifyStateChange();
          this.checkGameEnd();
        }
      });

      // 监听生命更新
      scene.events.on('lives_update', (data: any) => {
        const instance = this.gameInstances.get(instanceId);
        if (instance) {
          instance.state.lives = data.lives;
          console.log(`[UnifiedGameManager] ${instanceId} 生命更新:`, data);
          this.notifyStateChange();
          this.checkGameEnd();
        }
      });

      // 监听游戏结束
      scene.events.on('game_over', (data: any) => {
        console.log(`[UnifiedGameManager] ${instanceId} 游戏结束:`, data);
        this.handleInstanceGameOver(instanceId, data);
      });
    }
  }

  /**
   * 启动游戏
   */
  start(): void {
    console.log('[UnifiedGameManager] 启动游戏');
    this.isRunning = true;
    this.gameTime = 0;

    // Phaser 场景在创建后会自动启动，无需手动操作
    this.gameInstances.forEach((instance) => {
      try {
        if (!instance.game) return;
        const scenes = instance.game.scene.getScenes();
        if (scenes && scenes.length > 0) {
          const sceneKey = scenes[0].scene.key;
          console.log(`[UnifiedGameManager] ${instance.id} 场景已在运行：${sceneKey}`);
        }
      } catch (error) {
        console.error(`[UnifiedGameManager] 检查场景状态失败:`, error);
      }
    });

    // 开始计时
    this.gameTimer = window.setInterval(() => {
      this.gameTime += 1;
      this.notifyStateChange();

      // 检查时间限制
      if (this.gameConfig.timeLimit && this.gameTime >= this.gameConfig.timeLimit) {
        this.endGameByTime();
      }
    }, 1000);
  }

  /**
   * 暂停游戏
   */
  pause(): void {
    console.log('[UnifiedGameManager] 暂停游戏');
    this.isRunning = false;

    // 暂停所有游戏实例
    this.gameInstances.forEach((instance) => {
      try {
        if (!instance.game) return;
        const scenes = instance.game.scene.getScenes();
        if (scenes && scenes.length > 0) {
          const sceneKey = scenes[0].scene.key;
          console.log(`[UnifiedGameManager] ${instance.id} 暂停场景：${sceneKey}`);
          instance.game.scene.pause(sceneKey);
        }
      } catch (error) {
        console.error(`[UnifiedGameManager] 暂停场景失败:`, error);
      }
    });

    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  /**
   * 继续游戏
   */
  resume(): void {
    console.log('[UnifiedGameManager] 继续游戏');
    this.isRunning = true;

    // 继续所有游戏实例
    this.gameInstances.forEach((instance) => {
      try {
        if (!instance.game) return;
        const scenes = instance.game.scene.getScenes();
        if (scenes && scenes.length > 0) {
          const sceneKey = scenes[0].scene.key;
          console.log(`[UnifiedGameManager] ${instance.id} 继续场景：${sceneKey}`);
          instance.game.scene.resume(sceneKey);
        }
      } catch (error) {
        console.error(`[UnifiedGameManager] 继续场景失败:`, error);
      }
    });

    // 重新开始计时
    if (!this.gameTimer) {
      this.gameTimer = window.setInterval(() => {
        this.gameTime += 1;
        this.notifyStateChange();

        if (this.gameConfig.timeLimit && this.gameTime >= this.gameConfig.timeLimit) {
          this.endGameByTime();
        }
      }, 1000);
    }
  }

  /**
   * 超时结束游戏
   */
  private endGameByTime(): void {
    console.log('[UnifiedGameManager] 时间到，结束游戏');

    // 根据分数判断胜负
    const p1Instance = this.gameInstances.get('game-p1');
    const p2Instance = this.gameInstances.get('game-p2');

    if (p1Instance && p2Instance) {
      if (p1Instance.state.score > p2Instance.state.score) {
        this.winner = PlayerType.PLAYER_1;
      } else if (p2Instance.state.score > p1Instance.state.score) {
        this.winner = PlayerType.PLAYER_2;
      } else {
        this.winner = null; // 平局
      }
    } else {
      // 单人模式
      this.winner = PlayerType.PLAYER_1;
    }

    this.endGame(this.winner);
  }

  /**
   * 处理游戏实例结束
   */
  private handleInstanceGameOver(instanceId: string, data: any): void {
    console.log(`[UnifiedGameManager] 处理游戏实例 ${instanceId} 结束`);

    // 单人模式直接结束
    if (this.gameConfig.mode === GameMode.SINGLE) {
      this.endGame(PlayerType.PLAYER_1);
      return;
    }

    // 对抗模式检查两个实例是否都结束
    const p1Instance = this.gameInstances.get('game-p1');
    const p2Instance = this.gameInstances.get('game-p2');

    // 检查生命值
    if (p1Instance && p1Instance.state.lives <= 0) {
      this.winner = PlayerType.PLAYER_2;
      this.endGame(this.winner);
      return;
    }

    if (p2Instance && p2Instance.state.lives <= 0) {
      this.winner = PlayerType.PLAYER_1;
      this.endGame(this.winner);
      return;
    }

    // 检查分数
    if (this.gameConfig.maxScore) {
      if (p1Instance && p1Instance.state.score >= this.gameConfig.maxScore) {
        this.winner = PlayerType.PLAYER_1;
        this.endGame(this.winner);
        return;
      }

      if (p2Instance && p2Instance.state.score >= this.gameConfig.maxScore) {
        this.winner = PlayerType.PLAYER_2;
        this.endGame(this.winner);
        return;
      }
    }
  }

  /**
   * 检查游戏结束条件
   */
  private checkGameEnd(): void {
    if (this.gameConfig.mode === GameMode.SINGLE) {
      // 单人模式：生命值为0时结束
      const instance = Array.from(this.gameInstances.values())[0];
      if (instance.state.lives <= 0) {
        this.endGame(PlayerType.PLAYER_1);
      }
    } else if (this.gameConfig.mode === GameMode.LOCAL_BATTLE || 
               this.gameConfig.mode === GameMode.ONLINE_BATTLE) {
      // 对抗模式：任一玩家生命值为0或达到目标分数
      const p1Instance = this.gameInstances.get('game-p1');
      const p2Instance = this.gameInstances.get('game-p2');

      if (!p1Instance || !p2Instance) return;

      // 检查生命值
      if (p1Instance.state.lives <= 0) {
        this.endGame(PlayerType.PLAYER_2);
        return;
      }

      if (p2Instance.state.lives <= 0) {
        this.endGame(PlayerType.PLAYER_1);
        return;
      }

      // 检查分数
      if (this.gameConfig.maxScore) {
        if (p1Instance.state.score >= this.gameConfig.maxScore) {
          this.endGame(PlayerType.PLAYER_1);
          return;
        }

        if (p2Instance.state.score >= this.gameConfig.maxScore) {
          this.endGame(PlayerType.PLAYER_2);
          return;
        }
      }
    }
  }

  /**
   * 结束游戏
   */
  endGame(winner: PlayerType | null): void {
    console.log('[UnifiedGameManager] 结束游戏，胜利者:', winner);
    this.isRunning = false;
    this.winner = winner;

    // 停止计时
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    // 暂停所有游戏实例
    this.gameInstances.forEach((instance) => {
      try {
        if (!instance.game) return;
        const scenes = instance.game.scene.getScenes();
        if (scenes && scenes.length > 0) {
          const sceneKey = scenes[0].scene.key;
          instance.game.scene.pause(sceneKey);
        }
      } catch (error) {
        console.error(`[UnifiedGameManager] 结束游戏暂停场景失败:`, error);
      }
    });

    // 通知游戏结束
    const finalState = this.getCurrentState();
    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.winner, finalState);
    }
  }

  /**
   * 销毁游戏
   */
  destroy(): void {
    console.log('[UnifiedGameManager] 销毁游戏');

    // 停止计时
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    // 销毁所有游戏实例
    this.gameInstances.forEach((instance) => {
      try {
        if (instance.game) {
          instance.game.destroy(true);
        }
      } catch (error) {
        console.error('[UnifiedGameManager] 销毁游戏实例失败:', error);
      }
    });

    // 清空实例
    this.gameInstances.clear();

    // 重置状态
    this.isRunning = false;
    this.gameTime = 0;
    this.winner = null;
  }

  /**
   * 获取当前游戏状态
   */
  getCurrentState(): GameState {
    return {
      mode: this.gameConfig.mode,
      instances: Array.from(this.gameInstances.values()),
      isRunning: this.isRunning,
      gameTime: this.gameTime,
      winner: this.winner,
    };
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(): void {
    if (this.onStateChangeCallback) {
      const state = this.getCurrentState();
      this.onStateChangeCallback(state);
    }
  }

  /**
   * 监听状态变化
   */
  onStateChange(callback: (state: GameState) => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * 监听游戏结束
   */
  onGameOver(callback: (winner: PlayerType | null, finalState: GameState) => void): void {
    this.onGameOverCallback = callback;
  }
}
