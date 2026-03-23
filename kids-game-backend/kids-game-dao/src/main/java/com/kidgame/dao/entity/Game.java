package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏信息实体
 */
@Data
@TableName("t_game")
public class Game implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 游戏ID
     */
    @TableId(value = "game_id", type = IdType.AUTO)
    private Long gameId;

    /**
     * 游戏编码
     */
    private String gameCode;

    /**
     * 游戏名称
     */
    private String gameName;

    /**
     * 游戏分类
     */
    private String category;

    /**
     * 适龄阶段
     */
    private String grade;
    
    /**
     * 标签列表（逗号分隔）
     */
    private String tags;
    
    /**
     * 游戏图标 URL
     */
    private String iconUrl;

    /**
     * 是否推荐：0-否，1-是
     */
    @TableField("is_featured")
    private Integer isFeatured;
    
    /**
     * 前端模块路径
     */
    private String modulePath;

    /**
     * 状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回
     */
    private Integer status;

    /**
     * 排序
     */
    private Integer sortOrder;

    /**
     * 创建人 ID
     */
    @TableField("creator_id")
    private Long creatorId;

    /**
     * 上架时间
     */
    @TableField("publish_time")
    private Long publishTime;

    /**
     * 每分钟消耗疲劳点数
     */
    private Integer consumePointsPerMinute;

    /**
     * 启动所需最低疲劳度
     */
    @TableField("min_fatigue_to_start")
    private Integer minFatigueToStart;

    /**
     * 在线人数
     */
    private Integer onlineCount;

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
