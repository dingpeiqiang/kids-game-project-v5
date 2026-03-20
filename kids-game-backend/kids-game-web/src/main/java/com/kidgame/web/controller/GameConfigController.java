package com.kidgame.web.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.GameConfigEntity;
import com.kidgame.dao.mapper.GameConfigMapper;
import com.kidgame.dao.mapper.GameMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 游戏配置控制器
 * 提供游戏参数的动态配置接口
 */
@RestController
@RequestMapping("/api/game/config")
@Slf4j
public class GameConfigController {

    @Autowired
   private GameConfigMapper gameConfigMapper;

    @Autowired
   private GameMapper gameMapper;

    /**
     * 获取指定游戏的所有配置
     * @param gameCode 游戏代码（如：snake-shooter）
     * @return 配置 Map，key 为 config_key，value 为 config_value
     */
    @GetMapping("/{gameCode}")
    public Map<String, Object> getGameConfig(@PathVariable String gameCode) {
        log.info("[游戏配置] 获取游戏配置，gameCode: {}", gameCode);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. 根据 game_code 查询 game_id
            Long gameId = getGameIdByCode(gameCode);
            if (gameId == null) {
                result.put("success", false);
                result.put("message", "游戏不存在");
                return result;
            }
            
            // 2. 查询该游戏的所有配置
            LambdaQueryWrapper<GameConfigEntity> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(GameConfigEntity::getGameId, gameId);
            List<GameConfigEntity> configs = gameConfigMapper.selectList(queryWrapper);
            
            // 3. 转换为 Map 格式
            Map<String, String> configMap = new HashMap<>();
            for (GameConfigEntity config : configs) {
               configMap.put(config.getConfigKey(), config.getConfigValue());
            }
            
            result.put("success", true);
            result.put("data", configMap);
            result.put("message", "获取成功");
            
        } catch (Exception e) {
            log.error("[游戏配置] 获取配置失败", e);
            result.put("success", false);
            result.put("message", "获取配置失败：" + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 获取指定游戏的特定配置项
     * @param gameCode 游戏代码
     * @param configKey 配置键名
     * @return 配置值
     */
    @GetMapping("/{gameCode}/{configKey}")
    public Map<String, Object> getConfigValue(@PathVariable String gameCode, 
                                               @PathVariable String configKey) {
        log.info("[游戏配置] 获取单个配置，gameCode: {}, configKey: {}", gameCode, configKey);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            Long gameId = getGameIdByCode(gameCode);
            if (gameId == null) {
                result.put("success", false);
                result.put("message", "游戏不存在");
                return result;
            }
            
            LambdaQueryWrapper<GameConfigEntity> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(GameConfigEntity::getGameId, gameId)
                       .eq(GameConfigEntity::getConfigKey, configKey);
            
            GameConfigEntity config = gameConfigMapper.selectOne(queryWrapper);
            
            if (config != null) {
                result.put("success", true);
                result.put("data", config.getConfigValue());
            } else {
                result.put("success", false);
                result.put("message", "配置项不存在");
            }
            
        } catch (Exception e) {
            log.error("[游戏配置] 获取配置失败", e);
            result.put("success", false);
            result.put("message", "获取配置失败：" + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 根据 game_code 获取 game_id
     */
   private Long getGameIdByCode(String gameCode) {
        LambdaQueryWrapper<Game> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Game::getGameCode, gameCode);
        Game game = gameMapper.selectOne(queryWrapper);
        return game != null ? game.getGameId() : null;
    }
}
