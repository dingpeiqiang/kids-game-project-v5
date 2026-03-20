package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户管控配置表（优化版ParentLimit）
 * 移除冗余的parentId，通过user_id关联到t_user表
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user_control_config")
public class UserControlConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 配置ID
     */
    @TableId(value = "config_id", type = IdType.AUTO)
    private Long configId;

    /**
     * 儿童用户ID
     */
    private Long userId;

    /**
     * 监护人用户ID（可为NULL，表示全局配置）
     */
    private Long guardianId;

    /**
     * 每日时长上限（分钟）
     */
    private Integer dailyDuration;

    /**
     * 单次时长上限（分钟）
     */
    private Integer singleDuration;

    /**
     * 允许游戏开始时间
     */
    private String allowedTimeStart;

    /**
     * 允许游戏结束时间
     */
    private String allowedTimeEnd;

    /**
     * 答对1题获得的疲劳点数
     */
    private Integer answerGetPoints;

    /**
     * 每日答题赚点上限
     */
    private Integer dailyAnswerLimit;

    /**
     * 屏蔽的游戏ID列表（保留JSON字段，兼容旧数据）
     * 新增数据建议使用t_blocked_game表
     */
    private String blockedGames;

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
