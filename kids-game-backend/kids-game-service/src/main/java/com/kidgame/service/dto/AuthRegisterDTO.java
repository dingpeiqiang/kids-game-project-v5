package com.kidgame.service.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 统一注册请求（当前支持家长；儿童请继续走 /api/kid/register 以绑定监护人）
 */
@Data
@Schema(description = "统一注册请求")
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class AuthRegisterDTO {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;

    private String nickname;

    /** 0-KID, 1-PARENT */
    @NotNull(message = "用户类型不能为空")
    private Integer userType;

    /** 家长手机号 */
    private String phone;

    private String realName;
}