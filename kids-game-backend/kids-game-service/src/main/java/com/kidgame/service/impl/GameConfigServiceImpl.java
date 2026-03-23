package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.GameConfigEntity;
import com.kidgame.dao.mapper.GameConfigMapper;
import com.kidgame.service.GameConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 游戏配置服务实现
 */
@Slf4j
@Service
public class GameConfigServiceImpl implements GameConfigService {
    
    @Autowired
    private GameConfigMapper gameConfigMapper;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveGameConfig(Long gameId, String configKey, String configValue, String description) {
        log.debug("保存游戏配置。GameId: {}, Key: {}", gameId, configKey);
        
        // 查询是否已存在
        GameConfigEntity existing = gameConfigMapper.selectOne(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
                .eq(GameConfigEntity::getConfigKey, configKey)
        );
        
        if (existing != null) {
            // 更新
            existing.setConfigValue(configValue);
            if (description != null) {
                existing.setDescription(description);
            }
            existing.setUpdateTime(System.currentTimeMillis());
            gameConfigMapper.updateById(existing);
            log.debug("游戏配置已更新。ConfigId: {}", existing.getConfigId());
        } else {
            // 新增
            GameConfigEntity config = new GameConfigEntity();
            config.setGameId(gameId);
            config.setConfigKey(configKey);
            config.setConfigValue(configValue);
            config.setDescription(description);
            config.setCreateTime(System.currentTimeMillis());
            config.setUpdateTime(System.currentTimeMillis());
            gameConfigMapper.insert(config);
            log.debug("游戏配置已创建。ConfigId: {}", config.getConfigId());
        }
    }
    
    @Override
    public String getGameConfig(Long gameId, String configKey) {
        GameConfigEntity config = gameConfigMapper.selectOne(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
                .eq(GameConfigEntity::getConfigKey, configKey)
        );
        
        return config != null ? config.getConfigValue() : null;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteGameConfig(Long gameId, String configKey) {
        log.info("删除游戏配置。GameId: {}, Key: {}", gameId, configKey);
        
        gameConfigMapper.delete(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
                .eq(GameConfigEntity::getConfigKey, configKey)
        );
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchSaveGameConfig(Long gameId, Map<String, String> configs) {
        log.info("批量保存游戏配置。GameId: {}, Count: {}", gameId, configs.size());
        
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            saveGameConfig(gameId, entry.getKey(), entry.getValue(), null);
        }
    }
    
    @Override
    public Map<String, String> getAllGameConfigs(Long gameId) {
        List<GameConfigEntity> configs = gameConfigMapper.selectList(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
        );
        
        return configs.stream()
            .collect(Collectors.toMap(
                GameConfigEntity::getConfigKey,
                GameConfigEntity::getConfigValue
            ));
    }
    
    @Override
    public List<GameConfigEntity> getConfigsByPrefix(Long gameId, String keyPrefix) {
        return gameConfigMapper.selectList(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
                .like(GameConfigEntity::getConfigKey, keyPrefix)
        );
    }
}
