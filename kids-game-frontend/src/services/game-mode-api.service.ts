/**
 * 游戏模式配置 API 服务
 */
import { BaseApiService } from './base-api.service';
import type { GameModeConfiguration } from '@/modules/game/types/game.types';

export class GameModeApiService extends BaseApiService {
  private static instance: GameModeApiService;

  private constructor() {
    super();
  }

  static getInstance(): GameModeApiService {
  if (!GameModeApiService.instance) {
    GameModeApiService.instance = new GameModeApiService();
    }
    return GameModeApiService.instance;
  }

  /**
   * 获取游戏支持的模式列表
   */
  async getSupportedModes(gameId: number): Promise<string[]> {
    return this.get<string[]>(`/api/game/mode/supported/${gameId}`);
  }

  /**
   * 获取游戏模式配置列表
   */
  async getModeConfigs(gameId: number): Promise<GameModeConfiguration[]> {
    return this.get<GameModeConfiguration[]>(`/api/game/mode/list/${gameId}`);
  }

  /**
   * 获取指定模式配置
   */
  async getModeConfig(gameId: number, modeType: string): Promise<GameModeConfiguration> {
    return this.get<GameModeConfiguration>(`/api/game/mode/${gameId}/${modeType}`);
  }

  /**
   * 保存/更新模式配置
   */
  async saveModeConfig(config: GameModeConfiguration): Promise<void> {
    await this.post('/api/game/mode/save', config);
  }

  /**
   * 删除模式配置
   */
  async deleteModeConfig(gameId: number, modeType: string): Promise<void> {
    await this.delete(`/api/game/mode/${gameId}/${modeType}`);
  }

  /**
   * 获取所有游戏模式配置（管理后台）
   */
  async getAllModeConfigs(): Promise<Map<number, GameModeConfiguration[]>> {
    return this.get<Map<number, GameModeConfiguration[]>>('/api/game/mode/admin/all');
  }
}

export const gameModeApi = GameModeApiService.getInstance();
export default gameModeApi;
