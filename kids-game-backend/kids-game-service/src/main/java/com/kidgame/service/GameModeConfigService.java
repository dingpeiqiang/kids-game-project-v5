package com.kidgame.service;

import com.kidgame.dao.entity.GameModeConfig;
import java.util.List;
import java.util.Map;

/**
 * 游戏模式配置服务
 */
public interface GameModeConfigService {
    
    /**
     * 根据游戏 ID 获取模式配置列表
     */
   List<GameModeConfig> getModeConfigsByGameId(Long gameId);
    
    /**
     * 获取游戏支持的模式类型列表
     */
   List<String> getSupportedModes(Long gameId);
    
    /**
     * 获取指定模式的配置
     */
  GameModeConfig getModeConfig(Long gameId, String modeType);
    
    /**
     * 更新游戏模式配置
     */
    void updateModeConfig(GameModeConfig config);
    
    /**
     * 保存游戏模式配置
     */
    void saveModeConfig(GameModeConfig config);
    
    /**
     * 删除游戏模式配置
     */
    void deleteModeConfig(Long gameId, String modeType);
    
    /**
     * 获取所有游戏模式配置（用于管理后台）
     */
   Map<Long, List<GameModeConfig>> getAllGameModeConfigs();
}
