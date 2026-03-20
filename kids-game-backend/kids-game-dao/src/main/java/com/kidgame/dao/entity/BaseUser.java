package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 统一用户基类
 * 参考Spring Security UserDetails接口设计
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user")
public class BaseUser implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 用户ID（统一主键）
     */
    @TableId(value = "user_id", type = IdType.AUTO)
    private Long userId;

    /**
     * 用户类型：0-KID, 1-PARENT, 2-ADMIN
     */
    @TableField("user_type")
    private Integer userType;

    /**
     * 登录账号（儿童用户名/家长手机号）
     */
    private String username;

    /**
     * 加密密码
     */
    private String password;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 头像URL
     */
    private String avatar;

    /**
     * 状态：0-禁用, 1-正常, 2-锁定
     */
    private Integer status;

    /**
     * 疲劳点数（所有用户类型通用）
     */
    private Integer fatiguePoints;

    /**
     * 每日答题获得的疲劳点数
     */
    private Integer dailyAnswerPoints;

    /**
     * 疲劳点最后更新时间（毫秒时间戳）
     */
    private Long fatigueUpdateTime;

    /**
     * 账号过期时间（毫秒时间戳）
     */
    private Long accountExpireTime;

    /**
     * 密码过期时间（毫秒时间戳）
     */
    private Long passwordExpireTime;

    /**
     * 最后登录时间
     */
    private Long lastLoginTime;

    /**
     * 最后登录IP
     */
    private String lastLoginIp;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;
}
