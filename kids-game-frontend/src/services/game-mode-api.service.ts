/**
 * 游戏模式配置 API
 */
import { apiClient } from './api-client.service';
import type { GameModeConfiguration } from '@/modules/game/types/game.types';

export const gameModeApi = {
  getSupportedModes(gameId: number): Promise<string[]> {
    return apiClient.get<string[]>(`/api/game/mode/supported/${gameId}`);
  },

  getModeConfigs(gameId: number): Promise<GameModeConfiguration[]> {
    return apiClient.get<GameModeConfiguration[]>(`/api/game/mode/list/${gameId}`);
  },

  getModeConfig(gameId: number, modeType: string): Promise<GameModeConfiguration> {
    return apiClient.get<GameModeConfiguration>(`/api/game/mode/${gameId}/${modeType}`);
  },

  async saveModeConfig(config: GameModeConfiguration): Promise<void> {
    await apiClient.post('/api/game/mode/save', config);
  },

  async deleteModeConfig(gameId: number, modeType: string): Promise<void> {
    await apiClient.delete(`/api/game/mode/${gameId}/${modeType}`);
  },

  getAllModeConfigs(): Promise<Map<number, GameModeConfiguration[]>> {
    return apiClient.get<Map<number, GameModeConfiguration[]>>('/api/game/mode/admin/all');
  },
};

export default gameModeApi;