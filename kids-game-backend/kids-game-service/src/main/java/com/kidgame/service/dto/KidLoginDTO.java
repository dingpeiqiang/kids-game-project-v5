package com.kidgame.service.dto;

import lombok.Data;

/**
 * 儿童登录请求
 */
@Data
public class KidLoginDTO {

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;
}
