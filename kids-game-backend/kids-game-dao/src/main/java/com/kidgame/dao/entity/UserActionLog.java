package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户行为日志实体
 * 记录所有用户操作行为，用于审计和数据分析
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user_action_log")
public class UserActionLog implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 日志 ID
     */
    @TableId(value = "log_id", type = IdType.AUTO)
    private Long logId;

    /**
     * 用户 ID
     */
    private Long userId;

    /**
     * 用户类型：0-儿童，1-家长，2-管理员
     */
    private Integer userType;

    /**
     * 行为类型：LOGIN/LOGOUT/PLAY_GAME/ANSWER/PURCHASE/等
     */
    private String actionType;

    /**
     * 行为描述
     */
    private String actionDesc;

    /**
     * IP 地址
     */
    private String ipAddress;

    /**
     * 设备信息
     */
    private String deviceInfo;

    /**
     * 地理位置
     */
    private String location;

    /**
     * 额外数据（JSON 格式）
     */
    private String extraData;

    /**
     * 创建时间（毫秒时间戳）
     */
    private Long createTime;
}
