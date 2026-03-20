package com.kidgame.service.dto;

import com.kidgame.dao.entity.BaseUser;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 统一用户注册DTO
 */
@Data
@Schema(description = "统一用户注册请求对象")
public class UserRegisterDTO {

    @Schema(description = "用户名")
    @NotBlank(message = "用户名不能为空")
    private String username;

    @Schema(description = "密码")
    @NotBlank(message = "密码不能为空")
    private String password;

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "用户类型：KID/PARENT/ADMIN")
    @NotNull(message = "用户类型不能为空")
    private String userType;

    @Schema(description = "邮箱")
    @Email(message = "邮箱格式不正确")
    private String email;

    @Schema(description = "手机号")
    private String phoneNumber;

    @Schema(description = "头像URL")
    private String avatarUrl;

    @Schema(description = "扩展信息JSON")
    private String extInfoJson;
}
