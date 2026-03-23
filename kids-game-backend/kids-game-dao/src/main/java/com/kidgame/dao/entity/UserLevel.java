package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户等级实体
 * 记录用户等级和经验值信息
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user_level")
public class UserLevel implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 等级记录 ID
     */
    @TableId(value = "level_id", type = IdType.AUTO)
    private Long levelId;

    /**
     * 用户 ID
     */
    private Long userId;

    /**
     * 当前等级
     */
    private Integer currentLevel;

    /**
     * 当前经验值
     */
    private Integer currentExp;

    /**
     * 下一级所需经验值
     */
    private Integer nextLevelExp;

    /**
     * 总经验值
     */
    private Integer totalExp;

    /**
     * 等级称号
     */
    private String levelTitle;

    /**
     * 上次升级时间（毫秒时间戳）
     */
    private Long lastLevelUpTime;

    /**
     * 创建时间（毫秒时间戳）
     */
    private Long createTime;

    /**
     * 更新时间（毫秒时间戳）
     */
    private Long updateTime;
}
