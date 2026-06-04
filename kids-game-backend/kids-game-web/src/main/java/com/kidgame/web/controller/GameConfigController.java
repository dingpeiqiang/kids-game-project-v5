package com.kidgame.web.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.GameConfigEntity;
import com.kidgame.dao.mapper.GameConfigMapper;
import com.kidgame.dao.mapper.GameMapper;
import com.kidgame.service.GameConfigService;
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
    
    @Autowired
   private GameConfigService gameConfigService;

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
    
    // ========== 管理端 API（/admin 前缀）==========
    
    /**
     * 【管理端】获取游戏所有配置
     * @param gameId 游戏 ID
     * @return 配置列表
     */
    @GetMapping("/admin/{gameId}/configs")
    public Result<Map<String, String>> getAllConfigs(@PathVariable Long gameId) {
        log.info("[管理端] 获取游戏配置，gameId: {}", gameId);
        
        Map<String, String> configs = gameConfigService.getAllGameConfigs(gameId);
        return Result.success(configs);
    }
    
    /**
     * 【管理端】保存或更新配置
     * @param gameId 游戏 ID
     * @param configKey 配置键
     * @param configValue 配置值
     * @param description 配置描述
     * @return 操作结果
     */
    @PostMapping("/admin/{gameId}/config")
    public Result<Void> saveConfig(@PathVariable Long gameId,
                                   @RequestParam String configKey,
                                   @RequestParam String configValue,
                                   @RequestParam(required = false) String description) {
        log.info("[管理端] 保存配置，gameId: {}, key: {}, value: {}", gameId, configKey, configValue);
        
        gameConfigService.saveGameConfig(gameId, configKey, configValue, description);
        return Result.success();
    }
    
    /**
     * 【管理端】批量保存配置
     * @param gameId 游戏 ID
     * @param configs 配置 Map
     * @return 操作结果
     */
    @PostMapping("/admin/{gameId}/configs")
    public Result<Void> batchSaveConfigs(@PathVariable Long gameId,
                                         @RequestBody Map<String, String> configs) {
        log.info("[管理端] 批量保存配置，gameId: {}, count: {}", gameId, configs.size());
        
        gameConfigService.batchSaveGameConfig(gameId, configs);
        return Result.success();
    }
    
    /**
     * 【管理端】删除配置
     * @param gameId 游戏 ID
     * @param configKey 配置键
     * @return 操作结果
     */
    @DeleteMapping("/admin/{gameId}/config/{configKey}")
    public Result<Void> deleteConfig(@PathVariable Long gameId,
                                     @PathVariable String configKey) {
        log.info("[管理端] 删除配置，gameId: {}, key: {}", gameId, configKey);
        
        gameConfigService.deleteGameConfig(gameId, configKey);
        return Result.success();
    }
    
    /**
     * 【管理端】按前缀查询配置
     * @param gameId 游戏 ID
     * @param prefix 前缀（如：screenshot_）
     * @return 配置列表
     */
    @GetMapping("/admin/{gameId}/configs/by-prefix")
    public Result<List<GameConfigEntity>> getConfigsByPrefix(@PathVariable Long gameId,
                                                              @RequestParam String prefix) {
        log.info("[管理端] 按前缀查询配置，gameId: {}, prefix: {}", gameId, prefix);
        
        List<GameConfigEntity> configs = gameConfigService.getConfigsByPrefix(gameId, prefix);
        return Result.success(configs);
    }
}
