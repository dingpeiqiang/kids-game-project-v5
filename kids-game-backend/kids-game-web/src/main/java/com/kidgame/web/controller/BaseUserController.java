package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.UserProfile;
import com.kidgame.service.UserService;
import com.kidgame.service.dto.UserLoginDTO;
import com.kidgame.service.dto.UserLoginResponseDTO;
import com.kidgame.service.dto.UserRegisterDTO;
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

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public Result<BaseUser> register(@Valid @RequestBody UserRegisterDTO dto) {
        BaseUser user = userService.register(dto);
        return Result.success(user);
    }

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
    public Result<List<BaseUser>> listUsers(
            @Parameter(description = "用户类型（可选）") @RequestParam(required = false) String userType,
            @Parameter(description = "状态（可选）") @RequestParam(required = false) String status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size) {
        List<BaseUser> users = userService.listUsers(userType, status, page, size);
        return Result.success(users);
    }

    @Operation(summary = "刷新 Token")
    @PostMapping("/refresh-token")
    public Result<Map<String, String>> refreshToken(
            @Parameter(description = "Refresh Token") @RequestParam String refreshToken) {
        try {
            if (!jwtUtil.validateToken(refreshToken)) {
                return Result.error("Refresh Token 已过期或无效");
            }
            
            if (!jwtUtil.isRefreshToken(refreshToken)) {
                return Result.error("无效的 Token 类型");
            }
            
            String userId = jwtUtil.getUserId(refreshToken);
            String newAccessToken = jwtUtil.generateToken(userId);
            
            Map<String, String> result = new HashMap<>();
            result.put("token", newAccessToken);
            
            log.info("用户 {} 刷新 Token 成功", userId);
            return Result.success(result);
        } catch (Exception e) {
            log.error("刷新 Token 失败", e);
            return Result.error("刷新 Token 失败：" + e.getMessage());
        }
    }
}
