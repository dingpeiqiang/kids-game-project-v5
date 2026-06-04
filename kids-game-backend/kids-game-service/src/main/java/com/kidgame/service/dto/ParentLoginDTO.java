package com.kidgame.service.dto;

import lombok.Data;

/**
 * 家长登录请求
 */
@Data
public class ParentLoginDTO {

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;
}
