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
     * 游戏图标URL
     */
    private String iconUrl;

    /**
     * 游戏封面URL
     */
    private String coverUrl;

    /**
     * 游戏资源CDN地址
     */
    private String resourceUrl;

    /**
     * 游戏描述
     */
    private String description;

    /**
     * 前端模块路径
     */
    private String modulePath;

    /**
     * 游戏访问地址URL（独立部署时使用）
     */
    @TableField("game_url")
    private String gameUrl;

    /**
     * 游戏密钥（用于签名验证）
     */
    @TableField("game_secret")
    private String gameSecret;

    /**
     * 游戏配置（透传给游戏的JSON配置）
     */
    @TableField("game_config")
    private String gameConfig;

    /**
     * 状态：0-禁用，1-启用
     */
    private Integer status;

    /**
     * 排序
     */
    private Integer sortOrder;

    /**
     * 每分钟消耗疲劳点数
     */
    private Integer consumePointsPerMinute;

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
