package com.kidgame.web.controller;

import com.kidgame.common.config.RsaKeyConfig;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.RsaUtil;
import com.kidgame.service.UserService;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.service.dto.AuthRegisterDTO;
import com.kidgame.service.dto.AuthRequestDTO;
import com.kidgame.service.dto.AuthResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.security.KeyPair;
import java.util.HashMap;
import java.util.Map;

/**
 * 统一认证控制器
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Slf4j
@Tag(name = "认证管理", description = "统一认证管理接口")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    
    @Operation(summary = "获取 RSA 公钥")
    @GetMapping("/public-key")
    public Result<Map<String, Object>> getPublicKey() {
        KeyPair keyPair = RsaKeyConfig.getCurrentKeyPair();
        
        Map<String, Object> result = new HashMap<>();
        result.put("publicKey", RsaUtil.getPublicKeyString(keyPair.getPublic()));
        result.put("keyIndex", RsaKeyConfig.getCurrentKeyIndex());
        result.put("algorithm", "RSA/ECB/PKCS1Padding");
        
        log.info("返回 RSA 公钥，索引：{}", RsaKeyConfig.getCurrentKeyIndex());
        
        return Result.success(result);
    }

    @Operation(summary = "统一注册（当前支持家长）")
    @PostMapping("/register")
    public Result<Map<String, Object>> register(@Valid @RequestBody AuthRegisterDTO dto) {
        BaseUser user = userService.registerPublic(dto);
        Map<String, Object> body = new HashMap<>();
        body.put("userId", user.getUserId());
        body.put("username", user.getUsername());
        body.put("nickname", user.getNickname());
        body.put("userType", user.getUserType());
        return Result.success(body);
    }

    @Operation(summary = "检查用户名是否已存在")
    @GetMapping("/check-username")
    public Result<Map<String, Object>> checkUsername(
            @Parameter(description = "用户名") 
            @RequestParam String username) {
        boolean exists = userService.existsUsername(username);
        Map<String, Object> result = new HashMap<>();
        result.put("exists", exists);
        result.put("available", !exists);
        return Result.success(result);
    }

    @Operation(summary = "统一登录接口")
    @PostMapping("/login")
    public Result<AuthResponseDTO> login(@Valid @RequestBody AuthRequestDTO request) {
        log.info("统一登录请求：username={}, userType={}", 
            request.getUsername(), request.getUserType());
        
        // 调用 Service 层进行认证
        AuthResponseDTO response = userService.authenticate(request);
        
        log.info("登录成功：userId={}, username={}", 
            response.getUserId(), response.getUsername());
        
        return Result.success(response);
    }

    @Operation(summary = "刷新 Token")
    @PostMapping("/refresh")
    public Result<Map<String, String>> refreshToken(
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(required = false) String refreshToken,
            HttpServletRequest request) {

        try {
            // 优先从 request body 读取（推荐），兼容旧客户端的 query 参数
            String token = refreshToken;
            if ((token == null || token.isBlank()) && body != null) {
                token = body.get("refreshToken");
            }
            // query 参数方式已废弃，记录警告
            if (token != null && (body == null || body.get("refreshToken") == null)) {
                log.warn("客户端通过 query 参数传递 refreshToken，该方式已废弃，请改用 request body");
            }
            if (token == null || token.isBlank()) {
                return Result.error("refreshToken 不能为空");
            }

            String deviceFingerprint = request.getHeader("X-Device-Fingerprint");

            // 调用 Service 刷新 Token
            String newAccessToken = userService.refreshAccessToken(token, deviceFingerprint);

            Map<String, String> result = new HashMap<>();
            result.put("accessToken", newAccessToken);

            return Result.success(result);
        } catch (Exception e) {
            log.error("刷新 Token 失败", e);
            return Result.error("刷新 Token 失败：" + e.getMessage());
        }
    }

    @Operation(summary = "登出")
    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        // TODO: 可以将 token 加入黑名单（使用 Redis）
        log.info("用户登出");
        return Result.success();
    }
}
