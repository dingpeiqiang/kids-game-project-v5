package com.kidgame.service.dto;

import lombok.Data;

/**
 * 家长注册请求
 */
@Data
public class ParentRegisterDTO {

    /**
     * 用户名（登录账号）
     */
    private String username;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 真实姓名
     */
    private String realName;

    /**
     * 密码
     */
    private String password;

    /**
     * 昵称
     */
    private String nickname;
}
