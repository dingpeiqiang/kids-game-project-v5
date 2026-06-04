package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * 系统配置表
 */
@Data
@TableName("t_system_config")
public class SystemConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 配置键
     */
    private String configKey;

    /**
     * 配置值
     */
    private String configValue;

    /**
     * 配置类型：STRING-字符串，INT-整数，JSON-JSON对象
     */
    @TableField("config_type")
    private String configType;

    /**
     * 配置描述
     */
    private String description;

    /**
     * 配置分组 (fatigue/game/answer/system)
     */
    @TableField("config_group")
    private String configGroup;

    /**
     * 状态：0-禁用，1-启用
     */
    private Integer status;

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
