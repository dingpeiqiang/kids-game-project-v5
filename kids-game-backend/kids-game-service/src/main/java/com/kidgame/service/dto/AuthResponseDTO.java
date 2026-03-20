package com.kidgame.service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 认证响应 DTO
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@Builder
@Schema(description = "认证响应对象")
public class AuthResponseDTO {

    @Schema(description = "访问 Token")
    private String accessToken;

    @Schema(description = "刷新 Token")
    private String refreshToken;

    @Schema(description = "Token 类型", example = "Bearer")
    private String tokenType;

    @Schema(description = "过期时间（秒）", example = "3600")
    private Long expiresIn;

    @Schema(description = "用户 ID")
    private Long userId;

    @Schema(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN")
    private Integer userType;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "头像 URL")
    private String avatar;

    @Schema(description = "角色列表")
    private List<String> roles;

    @Schema(description = "疲劳点数")
    private Integer fatiguePoints;

    @Schema(description = "每日答题点数")
    private Integer dailyAnswerPoints;

    @Schema(description = "年级（仅儿童）")
    private String grade;

    @Schema(description = "家长 ID（仅儿童）")
    private Long parentId;
}
