package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.GameModeConfig;
import com.kidgame.service.GameModeConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 游戏模式配置控制器
 */
@Tag(name = "游戏模式管理", description = "游戏模式配置相关接口")
@RestController
@RequestMapping("/api/game/mode")
public class GameModeConfigController {
    
    @Autowired
  private GameModeConfigService gameModeConfigService;
    
    @Operation(summary = "获取游戏支持的模式列表")
    @GetMapping("/supported/{gameId}")
    public Result<List<String>> getSupportedModes(
            @Parameter(description= "游戏 ID") @PathVariable Long gameId) {
        return Result.success(gameModeConfigService.getSupportedModes(gameId));
    }
    
    @Operation(summary = "获取游戏模式配置列表")
    @GetMapping("/list/{gameId}")
    public Result<List<GameModeConfig>> getModeConfigs(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId) {
        return Result.success(gameModeConfigService.getModeConfigsByGameId(gameId));
    }
    
    @Operation(summary = "获取指定模式配置")
    @GetMapping("/{gameId}/{modeType}")
    public Result<GameModeConfig> getModeConfig(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description= "模式类型") @PathVariable String modeType) {
        return Result.success(gameModeConfigService.getModeConfig(gameId, modeType));
    }
    
    @Operation(summary = "保存/更新模式配置")
    @PostMapping("/save")
    public Result<Void> saveModeConfig(
            @RequestBody GameModeConfig config) {
        gameModeConfigService.saveModeConfig(config);
        return Result.success();
    }
    
    @Operation(summary = "删除模式配置")
    @DeleteMapping("/{gameId}/{modeType}")
    public Result<Void> deleteModeConfig(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "模式类型") @PathVariable String modeType) {
        gameModeConfigService.deleteModeConfig(gameId, modeType);
        return Result.success();
    }
    
    @Operation(summary = "获取所有游戏模式配置（管理后台使用）")
    @GetMapping("/admin/all")
    public Result<Map<Long, List<GameModeConfig>>> getAllConfigs() {
        return Result.success(gameModeConfigService.getAllGameModeConfigs());
    }
}
