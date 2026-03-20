package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.kidgame.dao.entity.GameModeConfig;
import com.kidgame.dao.mapper.GameModeConfigMapper;
import com.kidgame.service.GameModeConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 游戏模式配置服务实现
 */
@Slf4j
@Service
public class GameModeConfigServiceImpl implements GameModeConfigService {
    
    @Autowired
  private GameModeConfigMapper gameModeConfigMapper;
    
    @Override
    public List<GameModeConfig> getModeConfigsByGameId(Long gameId) {
        return gameModeConfigMapper.selectByGameId(gameId);
    }
    
    @Override
    public List<String> getSupportedModes(Long gameId) {
       List<GameModeConfig> configs = getModeConfigsByGameId(gameId);
        return configs.stream()
                .filter(GameModeConfig::getEnabled)
                .map(GameModeConfig::getModeType)
                .collect(Collectors.toList());
    }
    
    @Override
    public GameModeConfig getModeConfig(Long gameId, String modeType) {
        return gameModeConfigMapper.selectByGameIdAndModeType(gameId, modeType);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateModeConfig(GameModeConfig config) {
      config.setUpdateTime(System.currentTimeMillis());
        gameModeConfigMapper.updateById(config);
        log.info("游戏模式配置已更新：gameId={}, modeType={}", 
              config.getGameId(), config.getModeType());
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveModeConfig(GameModeConfig config) {
        long now = System.currentTimeMillis();
      if (config.getId() == null) {
          config.setCreateTime(now);
            gameModeConfigMapper.insert(config);
        } else {
            updateModeConfig(config);
        }
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteModeConfig(Long gameId, String modeType) {
       QueryWrapper<GameModeConfig> wrapper= new QueryWrapper<>();
        wrapper.eq("game_id", gameId)
               .eq("mode_type", modeType);
        
      GameModeConfig config = gameModeConfigMapper.selectOne(wrapper);
      if (config != null) {
          config.setDeleted(1);
          config.setUpdateTime(System.currentTimeMillis());
            gameModeConfigMapper.updateById(config);
            log.info("游戏模式配置已删除：gameId={}, modeType={}", gameId, modeType);
        }
    }
    
    @Override
    public Map<Long, List<GameModeConfig>> getAllGameModeConfigs() {
       QueryWrapper<GameModeConfig> wrapper= new QueryWrapper<>();
        wrapper.eq("deleted", 0).orderByAsc("game_id", "sort_order");
        
       List<GameModeConfig> allConfigs = gameModeConfigMapper.selectList(wrapper);
        
        return allConfigs.stream()
                .collect(Collectors.groupingBy(GameModeConfig::getGameId));
    }
}
