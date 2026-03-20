package com.kidgame.service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;

/**
 * 统一用户登录DTO
 */
@Data
@Schema(description = "统一用户登录请求对象")
public class UserLoginDTO {

    @Schema(description = "用户名")
    @NotBlank(message = "用户名不能为空")
    private String username;

    @Schema(description = "密码")
    @NotBlank(message = "密码不能为空")
    private String password;

    @Schema(description = "用户类型：KID/PARENT/ADMIN（可选）")
    private String userType;
}
