package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 通知消息表
 * 用于处理家长绑定孩子、孩子绑定家长等需要确认的场景
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_notification")
public class Notification implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 通知ID
     */
    @TableId(value = "notification_id", type = IdType.AUTO)
    private Long notificationId;

    /**
     * 接收者用户ID（可以是家长ID或儿童ID）
     */
    private Long userId;

    /**
     * 用户类型：0-儿童, 1-家长
     */
    private Integer userType;

    /**
     * 通知类型：BIND_REQUEST-绑定请求, GAME_LIMIT-游戏限制, SYSTEM-系统通知
     */
    private String type;

    /**
     * 标题
     */
    private String title;

    /**
     * 内容
     */
    private String content;

    /**
     * 状态：0-待处理, 1-已接受, 2-已拒绝, 3-已过期
     */
    private Integer status;

    /**
     * 通知状态：0-未读, 1-已读
     */
    private Integer isRead;

    /**
     * 关联的数据ID（如关系ID）
     */
    private Long relatedId;

    /**
     * 发送者ID
     */
    private Long senderId;

    /**
     * 发送者类型：0-儿童, 1-家长
     */
    private Integer senderType;

    /**
     * 扩展数据（JSON格式，存储额外的请求参数）
     */
    private String extraData;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;

    /**
     * 过期时间（用于绑定请求的超时处理）
     */
    private Long expireTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;

    /**
     * 通知类型枚举
     */
    public enum Type {
        BIND_REQUEST("BIND_REQUEST", "绑定请求"),
        GAME_LIMIT("GAME_LIMIT", "游戏限制"),
        SYSTEM("SYSTEM", "系统通知");

        private final String code;
        private final String desc;

        Type(String code, String desc) {
            this.code = code;
            this.desc = desc;
        }

        public String getCode() {
            return code;
        }

        public String getDesc() {
            return desc;
        }

        public static Type fromCode(String code) {
            for (Type type : values()) {
                if (type.code.equals(code)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Unknown notification type code: " + code);
        }
    }

    /**
     * 通知状态枚举
     */
    public enum Status {
        PENDING(0, "待处理"),
        ACCEPTED(1, "已接受"),
        REJECTED(2, "已拒绝"),
        EXPIRED(3, "已过期");

        private final int code;
        private final String desc;

        Status(int code, String desc) {
            this.code = code;
            this.desc = desc;
        }

        public int getCode() {
            return code;
        }

        public String getDesc() {
            return desc;
        }

        public static Status fromCode(int code) {
            for (Status status : values()) {
                if (status.code == code) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unknown notification status code: " + code);
        }
    }
}
