package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.service.FatiguePointsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 统一用户疲劳值控制器
 * 支持所有用户类型（儿童、家长、管理员）
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Tag(name = "用户疲劳值管理", description = "统一用户疲劳值相关接口")
@RestController
@RequestMapping("/api/user/fatigue")
public class UserFatigueController {

    @Autowired
    private FatiguePointsService fatiguePointsService;

    @Operation(summary = "获取用户疲劳点数")
    @GetMapping("/points")
    public Result<Integer> getFatiguePoints(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN") @RequestParam Integer userType) {
        Integer points = fatiguePointsService.getFatiguePoints(userId, userType);
        return Result.success(points);
    }

    @Operation(summary = "检查疲劳点数是否足够")
    @GetMapping("/check")
    public Result<Boolean> hasEnoughFatiguePoints(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN") @RequestParam Integer userType,
            @Parameter(description = "需要的点数") @RequestParam(required = false, defaultValue = "1") Integer requiredPoints) {
        boolean hasEnough = fatiguePointsService.hasEnoughFatiguePoints(userId, userType, requiredPoints);
        return Result.success(hasEnough);
    }

    @Operation(summary = "消耗疲劳点数（游戏启动时调用）")
    @PostMapping("/consume")
    public Result<Boolean> consumeFatiguePoints(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN") @RequestParam Integer userType,
            @Parameter(description = "消耗的点数") @RequestParam(required = false, defaultValue = "1") Integer points,
            @Parameter(description = "关联的游戏会话ID") @RequestParam(required = false) Long relatedId) {
        boolean success = fatiguePointsService.consumeFatiguePoints(userId, userType, points, relatedId);
        return Result.success(success);
    }

    @Operation(summary = "增加疲劳点数（答题奖励）")
    @PostMapping("/add")
    public Result<Integer> addFatiguePoints(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN") @RequestParam Integer userType,
            @Parameter(description = "增加的点数") @RequestParam(required = false, defaultValue = "1") Integer points,
            @Parameter(description = "关联的题目ID") @RequestParam(required = false) Long relatedId) {
        Integer newPoints = fatiguePointsService.addFatiguePoints(userId, userType, points, relatedId);
        return Result.success(newPoints);
    }

    @Operation(summary = "重置每日疲劳点数")
    @PostMapping("/reset")
    public Result<Integer> resetDailyFatiguePoints(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN") @RequestParam Integer userType) {
        Integer newPoints = fatiguePointsService.resetDailyFatiguePoints(userId, userType);
        return Result.success(newPoints);
    }

    @Operation(summary = "初始化用户疲劳点数（用户注册时调用）")
    @PostMapping("/initialize")
    public Result<Void> initializeFatiguePoints(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN") @RequestParam Integer userType,
            @Parameter(description = "初始疲劳点数") @RequestParam(required = false, defaultValue = "10") Integer initialPoints) {
        fatiguePointsService.initializeFatiguePoints(userId, userType, initialPoints);
        return Result.success();
    }
}
