package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.SystemConfig;
import com.kidgame.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 系统配置控制器
 */
@Tag(name = "配置管理", description = "系统配置相关接口")
@RestController
@RequestMapping("/api/config")
public class SystemConfigController {

    @Autowired
    private SystemConfigService systemConfigService;

    @Operation(summary = "获取所有配置")
    @GetMapping("/all")
    public Result<List<SystemConfig>> getAllConfigs() {
        return Result.success(systemConfigService.getAllConfigs());
    }

    @Operation(summary = "获取配置分组")
    @GetMapping("/group/{group}")
    public Result<List<SystemConfig>> getConfigGroup(
            @Parameter(description = "配置分组") @PathVariable String group) {
        return Result.success(systemConfigService.getConfigGroup(group));
    }

    @Operation(summary = "获取疲劳点配置")
    @GetMapping("/fatigue")
    public Result<Map<String, Object>> getFatigueConfig() {
        return Result.success(systemConfigService.getFatigueConfig());
    }

    @Operation(summary = "获取游戏配置")
    @GetMapping("/game")
    public Result<Map<String, Object>> getGameConfig() {
        return Result.success(systemConfigService.getGameConfig());
    }

    @Operation(summary = "获取答题配置")
    @GetMapping("/answer")
    public Result<Map<String, Object>> getAnswerConfig() {
        return Result.success(systemConfigService.getAnswerConfig());
    }

    @Operation(summary = "更新配置")
    @PutMapping
    public Result<Void> updateConfig(
            @Parameter(description = "配置键") @RequestParam String configKey,
            @Parameter(description = "配置值") @RequestParam String configValue) {
        systemConfigService.updateConfig(configKey, configValue);
        return Result.success();
    }

    @Operation(summary = "初始化默认配置")
    @PostMapping("/init")
    public Result<Void> initDefaultConfigs() {
        systemConfigService.initDefaultConfigs();
        return Result.success();
    }
}
