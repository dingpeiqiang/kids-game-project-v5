package com.kidgame.service.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
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
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)  // 使用小驼峰命名，与前端保持一致
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

    @Schema(description = "游学币")
    private Integer fatiguePoints;

    @Schema(description = "金币")
    private Integer coins;

    @Schema(description = "经验值")
    private Integer exp;

    @Schema(description = "等级（由经验值计算）")
    private Integer level;

    @Schema(description = "每日答题点数")
    private Integer dailyAnswerPoints;

    @Schema(description = "年级（仅儿童）")
    private String grade;

    @Schema(description = "家长 ID（仅儿童）")
    private Long parentId;

    @Schema(description = "手机号（仅家长，来自 profile）")
    private String phone;
}
