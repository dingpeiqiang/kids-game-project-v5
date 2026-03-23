package com.kidgame.service;

import com.kidgame.dao.entity.GameConfigEntity;

import java.util.List;
import java.util.Map;

/**
 * 游戏配置服务接口
 */
public interface GameConfigService {
    
    /**
     * 保存或更新游戏配置
     * @param gameId 游戏 ID
     * @param configKey 配置键
     * @param configValue 配置值
     * @param description 配置描述
     */
    void saveGameConfig(Long gameId, String configKey, String configValue, String description);
    
    /**
     * 获取游戏配置值
     * @param gameId 游戏 ID
     * @param configKey 配置键
     * @return 配置值，不存在返回 null
     */
    String getGameConfig(Long gameId, String configKey);
    
    /**
     * 删除游戏配置
     * @param gameId 游戏 ID
     * @param configKey 配置键
     */
    void deleteGameConfig(Long gameId, String configKey);
    
    /**
     * 批量保存游戏配置
     * @param gameId 游戏 ID
     * @param configs 配置 Map
     */
    void batchSaveGameConfig(Long gameId, Map<String, String> configs);
    
    /**
     * 获取游戏所有配置
     * @param gameId 游戏 ID
     * @return 配置 Map
     */
    Map<String, String> getAllGameConfigs(Long gameId);
    
    /**
     * 根据前缀获取配置（如获取所有 screenshot_*）
     * @param gameId 游戏 ID
     * @param keyPrefix 键前缀
     * @return 配置列表
     */
    List<GameConfigEntity> getConfigsByPrefix(Long gameId, String keyPrefix);
}
