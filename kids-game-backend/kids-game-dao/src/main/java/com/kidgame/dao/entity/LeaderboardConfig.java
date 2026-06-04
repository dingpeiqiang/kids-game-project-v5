package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏排行榜配置实体
 */
@Data
@TableName("t_leaderboard_config")
public class LeaderboardConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 配置 ID
     */
    @TableId(value = "config_id", type = IdType.AUTO)
    private Long configId;

    /**
     * 游戏 ID
     */
    private Long gameId;

    /**
     * 维度代码：SCORE/HIGHEST_LEVEL/DURATION/ACCURACY 等
     */
    private String dimensionCode;

    /**
     * 维度名称：如"最高分"/"最高关卡"/"最长时长"/"正确率"
     */
    private String dimensionName;

    /**
     * 排序方式：ASC-升序，DESC-降序
     */
    private String sortOrder;

    /**
     * 数据类型：INT/LONG/DECIMAL
     */
    private String dataType;

    /**
     * 维度图标
     */
    private String icon;

    /**
     * 维度描述
     */
    private String description;

    /**
     * 是否启用：0-否，1-是
     */
    private Integer isEnabled;

    /**
     * 显示顺序
     */
    private Integer displayOrder;

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
