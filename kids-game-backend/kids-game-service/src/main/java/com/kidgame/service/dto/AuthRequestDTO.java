package com.kidgame.service.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 认证请求 DTO
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@Schema(description = "认证请求对象")
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)  // 使用小驼峰命名，与前端保持一致
public class AuthRequestDTO {

    @NotBlank(message = "用户名不能为空")
    @Schema(description = "用户名（儿童用户名/家长手机号）", example = "kid001")
    private String username;

    @Schema(description = "密码（明文，向后兼容）", example = "password123")
    private String password;

    @Schema(description = "加密后的密码（RSA 加密）", example = "MIIB...xxx")
    private String encryptedPassword;

    @Schema(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN（可选，后端会根据用户名自动识别）", example = "0")
    private Integer userType;

    @Schema(description = "密钥索引（用于多代密钥轮换）", example = "0")
    private Integer keyIndex = 0;

    @Schema(description = "设备指纹（可选）", example = "device-abc-123")
    private String deviceFingerprint;

    @Schema(description = "是否记住我（延长 Token 有效期）", example = "true")
    private Boolean rememberMe = false;
}
