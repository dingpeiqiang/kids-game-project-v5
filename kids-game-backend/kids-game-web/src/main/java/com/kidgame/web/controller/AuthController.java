package com.kidgame.web.controller;

import com.kidgame.common.config.RsaKeyConfig;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.RsaUtil;
import com.kidgame.service.UserService;
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
            @Parameter(description = "Refresh Token") 
            @RequestParam String refreshToken,
            HttpServletRequest request) {
        
        try {
            String deviceFingerprint = request.getHeader("X-Device-Fingerprint");
            
            // 调用 Service 刷新 Token
            String newAccessToken = userService.refreshAccessToken(refreshToken, deviceFingerprint);
            
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
