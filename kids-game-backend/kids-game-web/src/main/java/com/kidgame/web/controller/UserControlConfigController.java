package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.UserControlConfig;
import com.kidgame.service.UserControlConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 用户管控配置控制器
 */
@Tag(name = "用户管控配置", description = "用户全局管控配置接口")
@RestController
@RequestMapping("/api/user-control-config")
public class UserControlConfigController {

    @Autowired
    private UserControlConfigService userControlConfigService;

    @Operation(summary = "创建或更新管控配置")
    @PostMapping("/save")
    public Result<UserControlConfig> saveConfig(@RequestBody UserControlConfig config) {
        UserControlConfig result = userControlConfigService.saveConfig(config);
        return Result.success(result);
    }

    @Operation(summary = "新增管控配置")
    @PostMapping("/add")
    public Result<Long> addConfig(@RequestBody UserControlConfig config) {
        Long configId = userControlConfigService.createConfig(config);
        return Result.success(configId);
    }

    @Operation(summary = "更新管控配置")
    @PutMapping("/update")
    public Result<Void> updateConfig(@RequestBody UserControlConfig config) {
        if (config.getConfigId() == null) {
            throw new IllegalArgumentException("配置 ID 不能为空");
        }
        userControlConfigService.updateConfig(config);
        return Result.success();
    }

    @Operation(summary = "获取用户管控配置")
    @GetMapping("/user/{userId}")
    public Result<UserControlConfig> getConfig(
            @Parameter(description = "用户ID（儿童）") @PathVariable Long userId) {
        UserControlConfig config = userControlConfigService.getConfigByUserId(userId);
        return Result.success(config);
    }

    @Operation(summary = "更新全局时间限制")
    @PutMapping("/update-time-limit")
    public Result<Void> updateTimeLimit(
            @Parameter(description = "用户ID（儿童）") @RequestParam Long userId,
            @Parameter(description = "每日总时长（分钟）") @RequestParam Integer dailyTimeLimitMinutes) {
        userControlConfigService.updateTimeLimit(userId, dailyTimeLimitMinutes);
        return Result.success();
    }

    @Operation(summary = "更新游学币设置")
    @PutMapping("/update-fatigue-point")
    public Result<Void> updateFatiguePoint(
            @Parameter(description = "用户ID（儿童）") @RequestParam Long userId,
            @Parameter(description = "游学币阈值（分钟）") @RequestParam Integer fatiguePointMinutes,
            @Parameter(description = "强制休息时长（分钟）") @RequestParam Integer restDurationMinutes) {
        userControlConfigService.updateFatiguePoint(userId, fatiguePointMinutes, restDurationMinutes);
        return Result.success();
    }

    @Operation(summary = "更新时间范围限制")
    @PutMapping("/update-time-range")
    public Result<Void> updateTimeRange(
            @Parameter(description = "用户ID（儿童）") @RequestParam Long userId,
            @Parameter(description = "允许开始时间 HH:mm:ss") @RequestParam String allowedStartTime,
            @Parameter(description = "允许结束时间 HH:mm:ss") @RequestParam String allowedEndTime) {
        userControlConfigService.updateTimeRange(userId, allowedStartTime, allowedEndTime);
        return Result.success();
    }

    @Operation(summary = "更新游学币控制模式")
    @PutMapping("/update-fatigue-mode")
    public Result<Void> updateFatigueMode(
            @Parameter(description = "用户ID（儿童）") @RequestParam Long userId,
            @Parameter(description = "游学币控制模式：SOFT/HARD/OFF") @RequestParam String fatigueControlMode) {
        userControlConfigService.updateFatigueMode(userId, fatigueControlMode);
        return Result.success();
    }

    @Operation(summary = "检查是否在允许时间范围内")
    @GetMapping("/check-time-range")
    public Result<Boolean> checkTimeRange(
            @Parameter(description = "用户ID（儿童）") @RequestParam Long userId) {
        boolean inRange = userControlConfigService.checkTimeRange(userId);
        return Result.success(inRange);
    }

    @Operation(summary = "检查是否超过每日时间限制")
    @GetMapping("/check-daily-limit")
    public Result<Boolean> checkDailyLimit(
            @Parameter(description = "用户ID（儿童）") @RequestParam Long userId) {
        boolean exceeded = userControlConfigService.checkDailyLimit(userId);
        return Result.success(exceeded);
    }

    @Operation(summary = "检查是否触发游学币")
    @GetMapping("/check-fatigue")
    public Result<Boolean> checkFatigue(
            @Parameter(description = "用户ID（儿童）") @RequestParam Long userId,
            @Parameter(description = "已玩游戏时长（分钟）") @RequestParam Integer playedMinutes) {
        boolean triggered = userControlConfigService.checkFatigue(userId, playedMinutes);
        return Result.success(triggered);
    }

    @Operation(summary = "删除管控配置")
    @DeleteMapping("/user/{userId}")
    public Result<Void> deleteConfig(
            @Parameter(description = "用户 ID（儿童）") @PathVariable Long userId) {
        userControlConfigService.deleteByUserId(userId);
        return Result.success();
    }

    @Operation(summary = "删除管控配置（按配置 ID）")
    @DeleteMapping("/delete")
    public Result<Void> deleteConfigById(
            @Parameter(description = "配置 ID") @RequestParam Long configId) {
        userControlConfigService.deleteConfig(configId);
        return Result.success();
    }

    @Operation(summary = "分页查询管控配置列表")
    @GetMapping("/list")
    public Result<java.util.Map<String, Object>> listConfigs(
            @Parameter(description = "儿童 ID（可选）") @RequestParam(required = false) Long kidId,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size) {
        com.baomidou.mybatisplus.extension.plugins.pagination.Page<UserControlConfig> mpPage = 
            userControlConfigService.listConfigs(kidId, page, size);
        
        // 转换为标准分页格式
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("records", mpPage.getRecords());
        result.put("total", mpPage.getTotal());
        result.put("size", mpPage.getSize());
        result.put("current", mpPage.getCurrent());
        result.put("pages", mpPage.getPages());
        
        return Result.success(result);
    }
}
