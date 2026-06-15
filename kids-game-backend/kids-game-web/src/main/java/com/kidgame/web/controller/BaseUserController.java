package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.UserProfile;
import com.kidgame.service.GameRecordService;
import com.kidgame.service.UserService;
import com.kidgame.service.dto.UserLoginDTO;
import com.kidgame.service.dto.UserLoginResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 统一用户控制器 - 处理儿童、家长、管理员
 * 
 * 注意：注册接口已统一到 AuthController (/api/auth/register)
 */
@Slf4j
@Tag(name = "用户管理", description = "统一用户管理接口")
@RestController
@RequestMapping("/api/user")
public class BaseUserController {

    @Autowired
    private com.kidgame.service.UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private GameRecordService gameRecordService;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result<UserLoginResponseDTO> login(@Valid @RequestBody UserLoginDTO dto) {
        UserLoginResponseDTO user = userService.login(dto);
        return Result.success(user);
    }

    @Operation(summary = "验证密码")
    @PostMapping("/verify-password")
    public Result<Boolean> verifyPassword(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "密码") @RequestParam String password) {
        boolean result = userService.verifyPassword(userId, password);
        return Result.success(result);
    }

    @Operation(summary = "修改密码")
    @PutMapping("/password")
    public Result<Void> updatePassword(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "旧密码") @RequestParam String oldPassword,
            @Parameter(description = "新密码") @RequestParam String newPassword) {
        userService.updatePassword(userId, oldPassword, newPassword);
        return Result.success();
    }

    @Operation(summary = "更新用户信息")
    @PutMapping("/update")
    public Result<BaseUser> updateUser(@RequestBody BaseUser user) {
        BaseUser updated = userService.updateUser(user);
        return Result.success(updated);
    }

    @Operation(summary = "获取用户信息")
    @GetMapping("/{userId}")
    public Result<BaseUser> getUser(
            @Parameter(description = "用户ID") @PathVariable Long userId) {
        BaseUser user = userService.getUserById(userId);
        return Result.success(user);
    }

    @Operation(summary = "根据用户名获取用户")
    @GetMapping("/username/{username}")
    public Result<BaseUser> getUserByUsername(
            @Parameter(description = "用户名") @PathVariable String username) {
        BaseUser user = userService.getUserByUsername(username);
        return Result.success(user);
    }

    @Operation(summary = "获取用户扩展信息")
    @GetMapping("/{userId}/profile")
    public Result<UserProfile> getUserProfile(
            @Parameter(description = "用户ID") @PathVariable Long userId) {
        UserProfile profile = userService.getUserProfile(userId);
        return Result.success(profile);
    }

    @Operation(summary = "更新用户扩展信息")
    @PutMapping("/profile")
    public Result<UserProfile> updateUserProfile(@RequestBody UserProfile profile) {
        UserProfile updated = userService.updateUserProfile(profile);
        return Result.success(updated);
    }

    @Operation(summary = "禁用用户")
    @PutMapping("/{userId}/disable")
    public Result<Void> disableUser(
            @Parameter(description = "用户ID") @PathVariable Long userId) {
        userService.disableUser(userId);
        return Result.success();
    }

    @Operation(summary = "启用用户")
    @PutMapping("/{userId}/enable")
    public Result<Void> enableUser(
            @Parameter(description = "用户ID") @PathVariable Long userId) {
        userService.enableUser(userId);
        return Result.success();
    }

    @Operation(summary = "获取所有用户（分页）")
    @GetMapping("/list")
    public Result<Map<String, Object>> listUsers(
            @Parameter(description = "用户类型（可选）") @RequestParam(required = false) String userType,
            @Parameter(description = "状态（可选）") @RequestParam(required = false) String status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size) {
        com.baomidou.mybatisplus.extension.plugins.pagination.Page<BaseUser> mpPage = 
            userService.listUsers(userType, status, page, size);
        
        // 转换为标准分页格式，避免字段名不一致
        Map<String, Object> result = new HashMap<>();
        result.put("records", mpPage.getRecords());
        result.put("total", mpPage.getTotal());
        result.put("size", mpPage.getSize());
        result.put("current", mpPage.getCurrent());
        result.put("pages", mpPage.getPages());
        
        return Result.success(result);
    }

    @Operation(summary = "刷新 Token")
    @PostMapping("/refresh-token")
    public Result<Map<String, String>> refreshToken(
            @Parameter(description = "Refresh Token") @RequestParam String refreshToken) {
        try {
            String newAccessToken = userService.refreshAccessToken(refreshToken, null);
            Map<String, String> result = new HashMap<>();
            result.put("token", newAccessToken);
            result.put("accessToken", newAccessToken);
            return Result.success(result);
        } catch (Exception e) {
            log.error("刷新 Token 失败", e);
            return Result.error("刷新 Token 失败：" + e.getMessage());
        }
    }

    @Operation(summary = "获取用户游玩记录（每个游戏最近一次）")
    @GetMapping("/game-records")
    public Result<List<Map<String, Object>>> getGameRecords(
            @RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userId = Long.parseLong(jwtUtil.getUserId(token));
            List<Map<String, Object>> records = gameRecordService.getUserGameRecords(userId);
            return Result.success(records);
        } catch (Exception e) {
            log.error("获取游戏记录失败", e);
            return Result.error("获取游戏记录失败：" + e.getMessage());
        }
    }
}
