import { GameModeType, GameModeConfig, GameModeMapping } from '../interfaces';
import { ModeManager } from '../manager';

/**
 * 游戏模式配置模板
 * 为常见游戏类型提供预配置的模式映射
 */
export const GameModeTemplates: Record<string, GameModeMapping> = {
  // 算数游戏配置
  arithmetic: {
    gameId: 'arithmetic',
    supportedModes: [
      GameModeType.SINGLE_PLAYER,
      GameModeType.LOCAL_BATTLE,
      GameModeType.ONLINE_BATTLE,
    ],
    modeConfigs: {
      [GameModeType.SINGLE_PLAYER]: {
        maxPlayers: 2,
        supportAI: true,
        timeLimit: 0,
        customConfig: {
          aiDifficulty: 'medium',
          responseDelay: 2000,
          errorRate: 0.2,
        },
      },
      [GameModeType.LOCAL_BATTLE]: {
        maxPlayers: 2,
        supportAI: false,
        timeLimit: 0,
      },
      [GameModeType.ONLINE_BATTLE]: {
        maxPlayers: 2,
        supportAI: false,
        timeLimit: 300, // 5分钟
        serverUrl: 'ws://localhost:8080',
      },
    },
  },

  // 消消乐游戏配置
  puzzle: {
    gameId: 'puzzle',
    supportedModes: [
      GameModeType.SINGLE_PLAYER,
    ],
    modeConfigs: {
      [GameModeType.SINGLE_PLAYER]: {
        maxPlayers: 1,
        supportAI: false,
        timeLimit: 0,
        customConfig: {
          levelCount: 100,
          scoreMultiplier: 1.0,
        },
      },
    },
  },

  // 对战游戏配置
  battle: {
    gameId: 'battle',
    supportedModes: [
      GameModeType.LOCAL_BATTLE,
      GameModeType.ONLINE_BATTLE,
      GameModeType.TEAM,
    ],
    modeConfigs: {
      [GameModeType.LOCAL_BATTLE]: {
        maxPlayers: 2,
        supportAI: false,
        timeLimit: 0,
        customConfig: {
          splitScreen: true,
        },
      },
      [GameModeType.ONLINE_BATTLE]: {
        maxPlayers: 2,
        supportAI: false,
        timeLimit: 600, // 10分钟
        serverUrl: 'ws://localhost:8080',
      },
      [GameModeType.TEAM]: {
        maxPlayers: 4,
        supportAI: false,
        timeLimit: 600,
        teamCount: 2,
        customConfig: {
          playersPerTeam: 2,
        },
      },
    },
  },

  // 贪吃蛇游戏配置
  'snake-vue3': {
    gameId: 'snake-vue3',
    supportedModes: [
      GameModeType.SINGLE_PLAYER,
      GameModeType.LOCAL_BATTLE,
    ],
    modeConfigs: {
      [GameModeType.SINGLE_PLAYER]: {
        maxPlayers: 1,
        supportAI: false,
        timeLimit: 0,
        customConfig: {
          difficulty: 'medium',
          gridSize: 20,
          foodTypes: ['apple', 'strawberry', 'coin'],
          speed: 150,
          scoreMultiplier: 1.5,
        },
      },
      [GameModeType.LOCAL_BATTLE]: {
        maxPlayers: 2,
        supportAI: false,
        timeLimit: 300, // 5分钟
        customConfig: {
          splitScreen: true,
          difficulty: 'medium',
          gridSize: 20,
          scoreToWin: 500,
        },
      },
    },
  },
};

/**
 * 游戏模式注册表
 * 用于管理所有游戏的模式配置
 */
export class GameModeRegistry {
  private static instance: GameModeRegistry;
  private modeManager: ModeManager;

  private constructor() {
    this.modeManager = ModeManager.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): GameModeRegistry {
    if (!GameModeRegistry.instance) {
      GameModeRegistry.instance = new GameModeRegistry();
    }
    return GameModeRegistry.instance;
  }

  /**
   * 加载所有游戏模式配置
   */
  loadAllConfigurations(): void {
    const configurations = Object.values(GameModeTemplates);
    this.modeManager.loadGameModeConfigurations(configurations);

    console.log(`[GameModeRegistry] Loaded ${configurations.length} game mode configurations`);
  }

  /**
   * 加载指定游戏的模式配置
   */
  loadConfiguration(gameId: string): void {
    const config = GameModeTemplates[gameId];
    if (config) {
      this.modeManager.registerGameModeMapping(config);
      console.log(`[GameModeRegistry] Loaded configuration for game: ${gameId}`);
    } else {
      console.warn(`[GameModeRegistry] Configuration not found for game: ${gameId}`);
    }
  }

  /**
   * 添加自定义游戏配置
   */
  addConfiguration(mapping: GameModeMapping): void {
    this.modeManager.registerGameModeMapping(mapping);
    console.log(`[GameModeRegistry] Added custom configuration for game: ${mapping.gameId}`);
  }

  /**
   * 获取游戏支持的模式
   */
  getSupportedModes(gameId: string): GameModeType[] {
    return this.modeManager.getGameSupportedModes(gameId);
  }

  /**
   * 获取游戏模式配置
   */
  getModeConfig(gameId: string, modeType: GameModeType): Partial<GameModeConfig> | null {
    return this.modeManager.getGameModeConfig(gameId, modeType);
  }

  /**
   * 创建游戏模式
   */
  async createGameMode(gameId: string, modeType: GameModeType, customConfig?: Partial<GameModeConfig>) {
    return await this.modeManager.createModeForGame(gameId, modeType, customConfig);
  }

  /**
   * 获取所有已注册的游戏
   */
  getRegisteredGames(): string[] {
    return Object.keys(GameModeTemplates);
  }
}
