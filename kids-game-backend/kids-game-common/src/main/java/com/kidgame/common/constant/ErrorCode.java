package com.kidgame.common.constant;

/**
 * 错误码常量（扩展版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
public class ErrorCode {

    // 通用错误码 (1000-1999)
    public static final int SUCCESS = 0;
    public static final int BAD_REQUEST = 400;
    public static final int PARAM_ERROR = 1001;
    public static final int SYSTEM_ERROR = 1002;
    public static final int NETWORK_ERROR = 1003;
    public static final int BUSINESS_ERROR = 1004;
    public static final int RESOURCE_NOT_FOUND = 1005;

    // 用户相关错误码 (2000-2999)
    public static final int USER_NOT_FOUND = 2001;
    public static final int USER_ALREADY_EXISTS = 2002;
    public static final int INVALID_PASSWORD = 2003;
    public static final int ACCOUNT_LOCKED = 2004;
    public static final int ACCOUNT_EXPIRED = 2005;

    // 儿童相关错误码 (3000-3999)
    public static final int KID_NOT_FOUND = 3001;
    public static final int KID_NOT_BOUND_PARENT = 3002;
    public static final int KID_ALREADY_BOUND = 3003;

    // 用户关系相关错误码 (3100-3199)
    public static final int RELATION_NOT_FOUND = 3101;
    public static final int RELATION_ALREADY_EXISTS = 3102;

    // 游戏相关错误码 (4000-4999)
    public static final int GAME_NOT_FOUND = 4001;
    public static final int GAME_NOT_AGE_APPROPRIATE = 4002;
    public static final int GAME_BLOCKED_BY_PARENT = 4003;
    public static final int GAME_TIME_NOT_ALLOWED = 4004;
    public static final int DAILY_DURATION_EXCEEDED = 4005;
    public static final int GAME_SESSION_NOT_FOUND = 4006;
    public static final int GAME_ALREADY_RUNNING = 4007;

    // 疲劳点相关错误码 (5000-5999)
    public static final int INSUFFICIENT_FATIGUE_POINTS = 5001;
    public static final int FATIGUE_POINTS_LIMIT = 5002;

    // 答题相关错误码 (6000-6999)
    public static final int QUESTION_NOT_FOUND = 6001;
    public static final int DAILY_ANSWER_LIMIT_EXCEEDED = 6002;

    // 权限相关错误码 (7000-7999)
    public static final int PERMISSION_DENIED = 7001;
    public static final int ROLE_NOT_FOUND = 7002;
    public static final int TOKEN_INVALID = 7003;
    public static final int TOKEN_EXPIRED = 7004;
    public static final int TOKEN_MISSING = 7005;
    public static final int FORBIDDEN = 7006;

    // 限流相关错误码 (8000-8999)
    public static final int TOO_MANY_REQUESTS = 8001;

    private int code;
    private String message;

    public ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    // 常用错误码实例
    public static final ErrorCode PARAM_ERROR_OBJ = new ErrorCode(PARAM_ERROR, "参数错误");
    public static final ErrorCode USER_NOT_FOUND_OBJ = new ErrorCode(USER_NOT_FOUND, "用户不存在");
    public static final ErrorCode GAME_NOT_FOUND_OBJ = new ErrorCode(GAME_NOT_FOUND, "游戏不存在");
    public static final ErrorCode GAME_BLOCKED_BY_PARENT_OBJ = new ErrorCode(GAME_BLOCKED_BY_PARENT, "游戏已被家长屏蔽");
    public static final ErrorCode GAME_TIME_NOT_ALLOWED_OBJ = new ErrorCode(GAME_TIME_NOT_ALLOWED, "当前时间不允许玩游戏");
    public static final ErrorCode DAILY_DURATION_EXCEEDED_OBJ = new ErrorCode(DAILY_DURATION_EXCEEDED, "今日游戏时长已用完");
    public static final ErrorCode INSUFFICIENT_FATIGUE_POINTS_OBJ = new ErrorCode(INSUFFICIENT_FATIGUE_POINTS, "疲劳点不足");

    // 儿童相关错误码实例
    public static final ErrorCode KID_NOT_FOUND_OBJ = new ErrorCode(KID_NOT_FOUND, "儿童不存在");
    public static final ErrorCode KID_NOT_BOUND_PARENT_OBJ = new ErrorCode(KID_NOT_BOUND_PARENT, "儿童未绑定家长");
    public static final ErrorCode KID_ALREADY_BOUND_OBJ = new ErrorCode(KID_ALREADY_BOUND, "儿童已绑定家长");

    // 用户关系相关错误码实例
    public static final ErrorCode RELATION_NOT_FOUND_OBJ = new ErrorCode(RELATION_NOT_FOUND, "用户关系不存在");
    public static final ErrorCode RELATION_ALREADY_EXISTS_OBJ = new ErrorCode(RELATION_ALREADY_EXISTS, "用户关系已存在");

    // 游戏相关错误码实例
    public static final ErrorCode GAME_NOT_AGE_APPROPRIATE_OBJ = new ErrorCode(GAME_NOT_AGE_APPROPRIATE, "游戏不适用该年龄段");
    public static final ErrorCode GAME_SESSION_NOT_FOUND_OBJ = new ErrorCode(GAME_SESSION_NOT_FOUND, "游戏会话不存在");
    public static final ErrorCode GAME_ALREADY_RUNNING_OBJ = new ErrorCode(GAME_ALREADY_RUNNING, "游戏已在运行中");

    // 答题相关错误码实例
    public static final ErrorCode QUESTION_NOT_FOUND_OBJ = new ErrorCode(QUESTION_NOT_FOUND, "题目不存在");
    public static final ErrorCode DAILY_ANSWER_LIMIT_EXCEEDED_OBJ = new ErrorCode(DAILY_ANSWER_LIMIT_EXCEEDED, "今日答题次数已用完");

    // 权限相关错误码实例
    public static final ErrorCode TOKEN_MISSING_OBJ = new ErrorCode(TOKEN_MISSING, "Token缺失");
    public static final ErrorCode FORBIDDEN_OBJ = new ErrorCode(FORBIDDEN, "无权访问");
    public static final ErrorCode TOKEN_INVALID_OBJ = new ErrorCode(TOKEN_INVALID, "Token无效或已过期");
    public static final ErrorCode TOKEN_EXPIRED_OBJ = new ErrorCode(TOKEN_EXPIRED, "Token已过期");
    public static final ErrorCode PERMISSION_DENIED_OBJ = new ErrorCode(PERMISSION_DENIED, "权限不足");
    public static final ErrorCode ROLE_NOT_FOUND_OBJ = new ErrorCode(ROLE_NOT_FOUND, "角色不存在");

    // 限流相关错误码实例
    public static final ErrorCode TOO_MANY_REQUESTS_OBJ = new ErrorCode(TOO_MANY_REQUESTS, "请求过于频繁，请稍后再试");

    // 用户相关错误码实例
    public static final ErrorCode INVALID_PASSWORD_OBJ = new ErrorCode(INVALID_PASSWORD, "密码错误");

    // 通用错误码实例
    public static final ErrorCode BAD_REQUEST_OBJ = new ErrorCode(BAD_REQUEST, "请求参数错误");
    public static final ErrorCode BUSINESS_ERROR_OBJ = new ErrorCode(BUSINESS_ERROR, "业务错误");
    public static final ErrorCode RESOURCE_NOT_FOUND_OBJ = new ErrorCode(RESOURCE_NOT_FOUND, "资源不存在");
}
