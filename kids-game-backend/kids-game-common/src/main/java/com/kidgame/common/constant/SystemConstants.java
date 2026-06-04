package com.kidgame.common.constant;

/**
 * 系统通用常量
 *
 * @author KidsGame
 * @since 1.0.0
 */
public class SystemConstants {

    private SystemConstants() {
        throw new UnsupportedOperationException("常量类不允许实例化");
    }

    /**
     * HTTP 状态码
     */
    public interface HttpStatus {
        /** 成功 */
        int OK = 200;
        /** 未授权 */
        int UNAUTHORIZED = 401;
        /** 禁止访问 */
        int FORBIDDEN = 403;
        /** 未找到 */
        int NOT_FOUND = 404;
        /** 服务器错误 */
        int INTERNAL_ERROR = 500;
    }

    /**
     * 时间常量（毫秒）
     */
    public interface Time {
        /** 一秒 */
        long ONE_SECOND = 1000L;
        /** 一分钟 */
        long ONE_MINUTE = 60 * ONE_SECOND;
        /** 一小时 */
        long ONE_HOUR = 60 * ONE_MINUTE;
        /** 一天 */
        long ONE_DAY = 24 * ONE_HOUR;
    }

    /**
     * 通用前缀
     */
    public interface Prefix {
        /** Token 前缀 */
        String TOKEN_PREFIX = "Bearer ";
    }
}
