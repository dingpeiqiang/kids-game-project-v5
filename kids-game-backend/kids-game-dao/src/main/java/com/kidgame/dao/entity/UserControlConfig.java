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
     * 儿童用户 ID
     */
    private Long userId;
        
    /**
     * 儿童昵称（关联查询字段，非表字段）
     */
    @TableField(exist = false)
    private String childNickname;
    
    /**
     * 监护人用户 ID（可为 NULL，表示全局配置）
     */
    private Long guardianId;
        
    /**
     * 监护人昵称（关联查询字段，非表字段）
     */
    @TableField(exist = false)
    private String guardianNickname;

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
     * 答对1题获得的游学币
     */
    private Integer answerGetPoints;

    /**
     * 每日答题赚点上限
     */
    private Integer dailyAnswerLimit;

    /**
     * 屏蔽的游戏 ID 列表（保留 JSON 字段，兼容旧数据）
     * 新增数据建议使用 t_blocked_game 表
     */
    private String blockedGames;
    
    /**
     * 游学币阈值（低于此值不能玩游戏）
     */
    private Integer fatiguePointThreshold;
    
    /**
     * 强制休息时长（分钟）
     */
    private Integer restDuration;
    
    /**
     * 游学币控制模式：SOFT-软性，FORCED-强制，OFF-关闭
     */
    private String fatigueControlMode;
    
    /**
     * 连续游戏提醒间隔（分钟）
     */
    private Integer continuousPlayReminder;
    
    /**
     * 每日游戏次数限制
     */
    private Integer dailyGameLimit;
    
    /**
     * 单次游戏最小间隔（分钟）
     */
    private Integer gameInterval;

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
