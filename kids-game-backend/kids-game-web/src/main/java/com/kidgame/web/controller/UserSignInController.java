package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.service.UserSignInService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户签到控制器
 */
@Slf4j
@Tag(name = "用户签到", description = "用户签到相关接口")
@RestController
@RequestMapping("/api/signin")
public class UserSignInController {

    @Autowired
    private UserSignInService userSignInService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 用户签到
     */
    @Operation(summary = "用户签到")
    @PostMapping("/collect")
    public Result<Map<String, Object>> collectDailyReward(
            @Parameter(description = "Authorization Bearer Token") @RequestHeader("Authorization") String authorization) {
        try {
            // 从 Token 中获取用户ID
            String token = authorization.replace("Bearer ", "");
            String userIdStr = jwtUtil.getUserId(token);
            Long userId = Long.parseLong(userIdStr);

            log.info("用户 {} 请求签到", userId);

            // 执行签到
            Map<String, Object> result = userSignInService.signIn(userId);

            if ((Boolean) result.get("success")) {
                return Result.success(result);
            } else {
                // 当用户已签到时，返回包含 alreadySignedIn 信息的成功响应
                // 这样前端可以正确处理"今日已签到"的业务逻辑
                if (Boolean.TRUE.equals(result.get("alreadySignedIn"))) {
                    return Result.success(result);
                }
                return Result.error((String) result.get("message"));
            }
        } catch (Exception e) {
            log.error("签到失败", e);
            return Result.error("签到失败：" + e.getMessage());
        }
    }

    /**
     * 获取用户签到信息
     */
    @Operation(summary = "获取用户签到信息")
    @GetMapping("/info")
    public Result<Map<String, Object>> getSignInInfo(
            @Parameter(description = "Authorization Bearer Token") @RequestHeader("Authorization") String authorization) {
        try {
            // 从 Token 中获取用户ID
            String token = authorization.replace("Bearer ", "");
            String userIdStr = jwtUtil.getUserId(token);
            Long userId = Long.parseLong(userIdStr);

            log.info("用户 {} 请求获取签到信息", userId);

            // 获取签到信息
            Map<String, Object> result = userSignInService.getSignInInfo(userId);

            return Result.success(result);
        } catch (Exception e) {
            log.error("获取签到信息失败", e);
            return Result.error("获取签到信息失败：" + e.getMessage());
        }
    }

    /**
     * 检查用户今天是否已签到
     */
    @Operation(summary = "检查用户今天是否已签到")
    @GetMapping("/today")
    public Result<Boolean> hasSignedInToday(
            @Parameter(description = "Authorization Bearer Token") @RequestHeader("Authorization") String authorization) {
        try {
            // 从 Token 中获取用户ID
            String token = authorization.replace("Bearer ", "");
            String userIdStr = jwtUtil.getUserId(token);
            Long userId = Long.parseLong(userIdStr);

            log.info("用户 {} 请求检查今日签到状态", userId);

            // 检查是否已签到
            boolean hasSignedIn = userSignInService.hasSignedInToday(userId);

            return Result.success(hasSignedIn);
        } catch (Exception e) {
            log.error("检查签到状态失败", e);
            return Result.error("检查签到状态失败：" + e.getMessage());
        }
    }
}