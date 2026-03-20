package com.kidgame.common.constant;

/**
 * 游戏业务常量
 *
 * @author KidsGame
 * @since 1.0.0
 */
public class GameConstants {

    private GameConstants() {
        throw new UnsupportedOperationException("常量类不允许实例化");
    }

    /**
     * 游戏状态
     */
    public interface GameStatus {
        /** 禁用 */
        int DISABLED = 0;
        /** 启用 */
        int ENABLED = 1;
    }

    /**
     * 游戏会话状态
     */
    public interface SessionStatus {
        /** 已结束 */
        int ENDED = 0;
        /** 进行中 */
        int ONGOING = 1;
    }

    /**
     * 疲劳点变化类型
     */
    public interface FatigueChangeType {
        /** 游戏消耗 */
        int GAME_CONSUME = 1;
        /** 答题获取 */
        int ANSWER_GET = 2;
        /** 每日重置 */
        int DAILY_RESET = 3;
    }

    /**
     * 默认值
     */
    public interface Defaults {
        /** 默认每日游戏时长（分钟） */
        int DEFAULT_DAILY_DURATION = 60;
        /** 默认单次游戏时长（分钟） */
        int DEFAULT_SINGLE_DURATION = 30;
        /** 默认允许开始时间 */
        String DEFAULT_TIME_START = "06:00";
        /** 默认允许结束时间 */
        String DEFAULT_TIME_END = "22:00";
        /** 默认答题获得疲劳点数 */
        int DEFAULT_ANSWER_GET_POINTS = 1;
        /** 默认每日答题限制 */
        int DEFAULT_DAILY_ANSWER_LIMIT = 10;
        /** 默认家长 PIN 码 */
        String DEFAULT_PARENT_PIN = "0000";
        /** 默认疲劳点数 */
        int DEFAULT_FATIGUE_POINTS = 10;
    }

    /**
     * 验证规则
     */
    public interface Validation {
        /** 用户名最小长度 */
        int USERNAME_MIN_LENGTH = 2;
        /** 用户名最大长度 */
        int USERNAME_MAX_LENGTH = 20;
        /** 手机号正则 */
        String PHONE_REGEX = "^1[3-9]\\d{9}$";
        /** Redis 缓存过期时间（秒） - 24小时 */
        int CACHE_EXPIRE_SECONDS = 24 * 60 * 60;
    }

    /**
     * 日志前缀
     */
    public interface LogPrefix {
        String FATIGUE_POINTS_CACHE = "kid:fatigue:";
    }

    /**
     * 错误消息
     */
    public interface ErrorMessage {
        String USERNAME_EMPTY = "用户名不能为空";
        String PASSWORD_EMPTY = "密码不能为空";
        String PHONE_EMPTY = "手机号不能为空";
        String PHONE_FORMAT_INVALID = "手机号格式不正确";
        String USERNAME_LENGTH_INVALID = "用户名长度为2-20个字符";
        String KID_NOT_BOUND_PARENT = "该儿童未绑定家长";
        String UPDATE_BLOCKED_LIST_FAILED = "更新屏蔽列表失败";
    }
}
