package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户签到记录实体类
 */
@Data
@TableName("t_user_sign_in")
public class UserSignIn implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 签到日期 (格式: yyyy-MM-dd)
     */
    private String signInDate;

    /**
     * 连续签到天数
     */
    private Integer consecutiveDays;

    /**
     * 获得的金币奖励
     */
    private Integer coinsReward;

    /**
     * 获得经验值奖励
     */
    private Integer expReward;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;
}