package com.kidgame.service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 统一用户登录响应 DTO
 */
@Data
@Builder
@Schema(description = "统一用户登录响应对象")
public class UserLoginResponseDTO {

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

    @Schema(description = "JWT Token")
    private String token;

    @Schema(description = "Refresh Token")
    private String refreshToken;

    @Schema(description = "疲劳点数")
    private Integer fatiguePoints;

    @Schema(description = "每日答题获得的疲劳点数")
    private Integer dailyAnswerPoints;

    @Schema(description = "年级（仅儿童）")
    private String grade;

    @Schema(description = "家长 ID（仅儿童）")
    private Long parentId;
}
