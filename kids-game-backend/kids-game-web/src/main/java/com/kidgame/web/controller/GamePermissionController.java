package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.GamePermission;
import com.kidgame.service.GamePermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 游戏权限控制器（支持所有用户类型）
 */
@Tag(name = "游戏权限管理", description = "游戏细粒度权限控制接口，支持所有用户类型")
@RestController
@RequestMapping("/api/game-permission")
public class GamePermissionController {

    @Autowired
    private GamePermissionService gamePermissionService;

    @Operation(summary = "设置游戏权限")
    @PostMapping("/set")
    public Result<GamePermission> setPermission(@RequestBody GamePermission permission) {
        GamePermission result = gamePermissionService.setPermission(permission);
        return Result.success(result);
    }

    @Operation(summary = "批量设置游戏权限")
    @PostMapping("/batch")
    public Result<List<GamePermission>> batchSetPermissions(@RequestBody List<GamePermission> permissions) {
        List<GamePermission> results = gamePermissionService.batchSetPermissions(permissions);
        return Result.success(results);
    }

    @Operation(summary = "获取用户对游戏的权限（支持所有用户类型）")
    @GetMapping("/get")
    public Result<GamePermission> getPermission(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        GamePermission permission = gamePermissionService.getPermission(userId, userType, gameId);
        return Result.success(permission);
    }

    @Operation(summary = "获取用户所有游戏权限（支持所有用户类型）")
    @GetMapping("/user/{userId}")
    public Result<List<GamePermission>> getUserPermissions(
            @Parameter(description = "用户ID") @PathVariable Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType) {
        List<GamePermission> permissions = gamePermissionService.getUserPermissions(userId, userType);
        return Result.success(permissions);
    }

    @Operation(summary = "获取游戏的所有用户权限")
    @GetMapping("/game/{gameId}")
    public Result<List<GamePermission>> getGamePermissions(
            @Parameter(description = "游戏ID") @PathVariable Long gameId) {
        List<GamePermission> permissions = gamePermissionService.getGamePermissions(gameId);
        return Result.success(permissions);
    }

    @Operation(summary = "删除游戏权限（支持所有用户类型）")
    @DeleteMapping("/delete")
    public Result<Void> deletePermission(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        gamePermissionService.deletePermission(userId, userType, gameId);
        return Result.success();
    }

    @Operation(summary = "更新权限类型")
    @PutMapping("/update-type")
    public Result<Void> updatePermissionType(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId,
            @Parameter(description = "权限类型：ALLOW/BLOCK/LIMIT_TIME/LIMIT_COUNT") @RequestParam String permissionType) {
        gamePermissionService.updatePermissionType(userId, userType, gameId, permissionType);
        return Result.success();
    }

    @Operation(summary = "更新时间限制")
    @PutMapping("/update-time-limit")
    public Result<Void> updateTimeLimit(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId,
            @Parameter(description = "限制时长（分钟）") @RequestParam Integer timeLimitMinutes) {
        gamePermissionService.updateTimeLimit(userId, userType, gameId, timeLimitMinutes);
        return Result.success();
    }

    @Operation(summary = "更新次数限制")
    @PutMapping("/update-count-limit")
    public Result<Void> updateCountLimit(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId,
            @Parameter(description = "限制次数") @RequestParam Integer countLimit) {
        gamePermissionService.updateCountLimit(userId, userType, gameId, countLimit);
        return Result.success();
    }

    @Operation(summary = "检查是否允许启动游戏（支持所有用户类型）")
    @GetMapping("/check-start")
    public Result<Boolean> checkGameStart(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        boolean allowed = gamePermissionService.checkGameStart(userId, userType, gameId);
        return Result.success(allowed);
    }

    @Operation(summary = "检查游戏是否被屏蔽（支持所有用户类型）")
    @GetMapping("/is-blocked")
    public Result<Boolean> isGameBlocked(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        boolean blocked = gamePermissionService.isGameBlocked(userId, userType, gameId);
        return Result.success(blocked);
    }

    @Operation(summary = "屏蔽游戏（支持所有用户类型）")
    @PostMapping("/block")
    public Result<Void> blockGame(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        gamePermissionService.blockGame(userId, userType, gameId);
        return Result.success();
    }

    @Operation(summary = "取消屏蔽游戏（支持所有用户类型）")
    @PostMapping("/unblock")
    public Result<Void> unblockGame(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        gamePermissionService.unblockGame(userId, userType, gameId);
        return Result.success();
    }

    @Operation(summary = "批量屏蔽游戏（支持所有用户类型）")
    @PostMapping("/block/batch")
    public Result<Void> batchBlockGames(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID列表") @RequestBody List<Long> gameIds) {
        gamePermissionService.batchBlockGames(userId, userType, gameIds);
        return Result.success();
    }

    @Operation(summary = "批量取消屏蔽游戏（支持所有用户类型）")
    @PostMapping("/unblock/batch")
    public Result<Void> batchUnblockGames(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID列表") @RequestBody List<Long> gameIds) {
        gamePermissionService.batchUnblockGames(userId, userType, gameIds);
        return Result.success();
    }

    @Operation(summary = "设置限时权限（支持所有用户类型）")
    @PostMapping("/limit-time")
    public Result<Void> setLimitTimePermission(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId,
            @Parameter(description = "最大时长（分钟）") @RequestParam Integer maxMinutes) {
        gamePermissionService.setLimitTimePermission(userId, userType, gameId, maxMinutes);
        return Result.success();
    }

    @Operation(summary = "设置限次权限（支持所有用户类型）")
    @PostMapping("/limit-count")
    public Result<Void> setLimitCountPermission(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童，1-家长，2-管理员") @RequestParam(required = false, defaultValue = "0") Integer userType,
            @Parameter(description = "游戏ID") @RequestParam Long gameId,
            @Parameter(description = "最大次数") @RequestParam Integer maxCount) {
        gamePermissionService.setLimitCountPermission(userId, userType, gameId, maxCount);
        return Result.success();
    }
}
