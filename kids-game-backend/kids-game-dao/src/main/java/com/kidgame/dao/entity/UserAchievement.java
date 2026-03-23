package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户成就实体
 * 记录用户获得的成就和进度
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user_achievement")
public class UserAchievement implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 成就 ID
     */
    @TableId(value = "achievement_id", type = IdType.AUTO)
    private Long achievementId;

    /**
     * 用户 ID
     */
    private Long userId;

    /**
     * 成就编码
     */
    private String achievementCode;

    /**
     * 成就名称
     */
    private String achievementName;

    /**
     * 成就类型：GENERAL-一般，STUDY-学习，GAME-游戏，SPECIAL-特殊
     */
    private String achievementType;

    /**
     * 成就描述
     */
    private String description;

    /**
     * 成就图标 URL
     */
    private String iconUrl;

    /**
     * 进度值
     */
    private Integer progress;

    /**
     * 目标值
     */
    private Integer targetValue;

    /**
     * 状态：0-进行中，1-已完成，2-已领取
     */
    private Integer status;

    /**
     * 完成时间（毫秒时间戳）
     */
    private Long completedTime;

    /**
     * 领取时间（毫秒时间戳）
     */
    private Long claimedTime;

    /**
     * 创建时间（毫秒时间戳）
     */
    private Long createTime;

    /**
     * 更新时间（毫秒时间戳）
     */
    private Long updateTime;
}
