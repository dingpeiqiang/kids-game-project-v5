import { IGameMode, GameModeType, GameModeConfig } from '../interfaces';
import {
  BaseGameMode,
  SinglePlayerMode,
  LocalBattleMode,
  TeamMode,
  OnlineBattleMode,
} from '../modes';

/**
 * 模式工厂函数类型
 */
type ModeFactory = (config?: Partial<GameModeConfig>) => IGameMode;

/**
 * 模式注册信息
 */
interface ModeRegistration {
  modeType: GameModeType;
  modeName: string;
  factory: ModeFactory;
  defaultConfig?: Partial<GameModeConfig>;
}

/**
 * 游戏与模式配置
 */
interface GameModeMapping {
  gameId: string;
  supportedModes: GameModeType[];
  modeConfigs: Record<GameModeType, Partial<GameModeConfig>>;
}

/**
 * 模式管理器
 * 负责模式的注册、加载、切换，以及游戏与模式的动态绑定
 */
export class ModeManager {
  private static instance: ModeManager;
  private modeRegistry: Map<GameModeType, ModeRegistration> = new Map();
  private gameModeMappings: Map<string, GameModeMapping> = new Map();
  private activeModes: Map<string, IGameMode> = new Map();

  private constructor() {
    this.registerBuiltInModes();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ModeManager {
    if (!ModeManager.instance) {
      ModeManager.instance = new ModeManager();
    }
    return ModeManager.instance;
  }

  /**
   * 注册内置模式
   */
  private registerBuiltInModes(): void {
    // 单机模式
    this.registerMode({
      modeType: GameModeType.SINGLE_PLAYER,
      modeName: 'Single Player',
      factory: (config) => new SinglePlayerMode(config),
    });

    // 本地对抗模式
    this.registerMode({
      modeType: GameModeType.LOCAL_BATTLE,
      modeName: 'Local Battle',
      factory: (config) => new LocalBattleMode(config),
    });

    // 组队模式
    this.registerMode({
      modeType: GameModeType.TEAM,
      modeName: 'Team Battle',
      factory: (config) => new TeamMode(config),
    });

    // 网络对抗模式
    this.registerMode({
      modeType: GameModeType.ONLINE_BATTLE,
      modeName: 'Online Battle',
      factory: (config) => new OnlineBattleMode(config),
    });
  }

  /**
   * 注册模式
   */
  registerMode(registration: ModeRegistration): void {
    this.modeRegistry.set(registration.modeType, registration);
    console.log(`[ModeManager] Registered mode: ${registration.modeName} (${registration.modeType})`);
  }

  /**
   * 注册游戏与模式的映射
   */
  registerGameModeMapping(mapping: GameModeMapping): void {
    this.gameModeMappings.set(mapping.gameId, mapping);
    console.log(`[ModeManager] Registered game mode mapping: ${mapping.gameId}`, mapping);
  }

  /**
   * 获取所有已注册的模式类型
   */
  getRegisteredModeTypes(): GameModeType[] {
    return Array.from(this.modeRegistry.keys());
  }

  /**
   * 获取所有已注册的模式信息
   */
  getRegisteredModes(): ModeRegistration[] {
    return Array.from(this.modeRegistry.values());
  }

  /**
   * 检查模式是否已注册
   */
  isModeRegistered(modeType: GameModeType): boolean {
    return this.modeRegistry.has(modeType);
  }

  /**
   * 获取模式注册信息
   */
  getModeRegistration(modeType: GameModeType): ModeRegistration | null {
    return this.modeRegistry.get(modeType) ?? null;
  }

  /**
   * 获取游戏支持的模式的配置
   */
  getGameSupportedModes(gameId: string): GameModeType[] {
    const mapping = this.gameModeMappings.get(gameId);
    return mapping ? mapping.supportedModes : [];
  }

  /**
   * 获取游戏的模式配置
   */
  getGameModeConfig(gameId: string, modeType: GameModeType): Partial<GameModeConfig> | null {
    const mapping = this.gameModeMappings.get(gameId);
    return mapping ? mapping.modeConfigs[modeType] ?? null : null;
  }

  /**
   * 创建模式实例
   */
  async createMode(modeType: GameModeType, config?: Partial<GameModeConfig>): Promise<IGameMode> {
    const registration = this.modeRegistry.get(modeType);
    if (!registration) {
      throw new Error(`Mode ${modeType} is not registered`);
    }

    // 合并默认配置
    const finalConfig = {
      ...registration.defaultConfig,
      ...config,
      modeType,
      modeName: registration.modeName,
    } as GameModeConfig;

    // 创建模式实例
    const mode = registration.factory(finalConfig);

    // 初始化模式
    await mode.initialize(finalConfig);

    console.log(`[ModeManager] Created mode instance: ${registration.modeName}`);
    return mode;
  }

  /**
   * 为游戏创建模式
   */
  async createModeForGame(gameId: string, modeType: GameModeType, customConfig?: Partial<GameModeConfig>): Promise<IGameMode> {
    const gameConfig = this.getGameModeConfig(gameId, modeType);
    const finalConfig = { ...gameConfig, ...customConfig };

    return await this.createMode(modeType, finalConfig);
  }

  /**
   * 激活模式
   */
  activateMode(gameId: string, mode: IGameMode): void {
    const key = `${gameId}:${mode.getModeType()}`;
    this.activeModes.set(key, mode);
    console.log(`[ModeManager] Activated mode for game: ${gameId}`, { modeType: mode.getModeType() });
  }

  /**
   * 停用模式
   */
  deactivateMode(gameId: string, modeType: GameModeType): void {
    const key = `${gameId}:${modeType}`;
    const mode = this.activeModes.get(key);

    if (mode) {
      mode.stop();
      mode.cleanup();
      this.activeModes.delete(key);
      console.log(`[ModeManager] Deactivated mode for game: ${gameId}`, { modeType });
    }
  }

  /**
   * 获取游戏的活动模式
   */
  getActiveMode(gameId: string, modeType: GameModeType): IGameMode | null {
    const key = `${gameId}:${modeType}`;
    return this.activeModes.get(key) ?? null;
  }

  /**
   * 获取游戏的所有活动模式
   */
  getActiveModesForGame(gameId: string): IGameMode[] {
    const modes: IGameMode[] = [];

    this.activeModes.forEach((mode, key) => {
      if (key.startsWith(`${gameId}:`)) {
        modes.push(mode);
      }
    });

    return modes;
  }

  /**
   * 停用游戏的所有模式
   */
  deactivateAllModesForGame(gameId: string): void {
    const modesToDeactivate: GameModeType[] = [];

    this.activeModes.forEach((mode, key) => {
      if (key.startsWith(`${gameId}:`)) {
        modesToDeactivate.push(mode.getModeType());
      }
    });

    modesToDeactivate.forEach(modeType => {
      this.deactivateMode(gameId, modeType);
    });

    console.log(`[ModeManager] Deactivated all modes for game: ${gameId}`);
  }

  /**
   * 切换游戏模式
   */
  async switchMode(gameId: string, currentModeType: GameModeType, newModeType: GameModeType, customConfig?: Partial<GameModeConfig>): Promise<IGameMode> {
    // 停用当前模式
    this.deactivateMode(gameId, currentModeType);

    // 创建新模式
    const newMode = await this.createModeForGame(gameId, newModeType, customConfig);

    // 激活新模式
    this.activateMode(gameId, newMode);

    console.log(`[ModeManager] Switched mode for game: ${gameId}`, {
      from: currentModeType,
      to: newModeType,
    });

    return newMode;
  }

  /**
   * 加载游戏模式配置
   */
  loadGameModeConfigurations(configurations: GameModeMapping[]): void {
    configurations.forEach(mapping => {
      this.registerGameModeMapping(mapping);
    });

    console.log(`[ModeManager] Loaded ${configurations.length} game mode configurations`);
  }

  /**
   * 保存游戏模式配置
   */
  saveGameModeConfigurations(): GameModeMapping[] {
    return Array.from(this.gameModeMappings.values());
  }

  /**
   * 清空所有注册
   */
  clearAllRegistrations(): void {
    this.modeRegistry.clear();
    this.gameModeMappings.clear();
    this.activeModes.clear();
    console.log('[ModeManager] Cleared all registrations');
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    return {
      registeredModes: this.getRegisteredModes().map(r => ({
        type: r.modeType,
        name: r.modeName,
      })),
      gameMappings: Array.from(this.gameModeMappings.keys()),
      activeModesCount: this.activeModes.size,
      activeGames: Array.from(this.activeModes.keys()).map(key => key.split(':')[0]),
    };
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 停用所有活动模式
    const gamesToClean: string[] = [];

    this.activeModes.forEach((mode, key) => {
      const gameId = key.split(':')[0];
      if (!gamesToClean.includes(gameId)) {
        gamesToClean.push(gameId);
      }
    });

    gamesToClean.forEach(gameId => {
      this.deactivateAllModesForGame(gameId);
    });

    console.log('[ModeManager] Destroyed');
  }
}
