package com.kidgame.web.request;

import lombok.Data;
import java.util.Map;

/**
 * 提交游戏结果请求
 */
@Data
public class SubmitGameResultRequest {
    /**
     * 会话ID
     */
    private Long sessionId;

    /**
     * 会话令牌（用于验证）
     */
    private String sessionToken;

    /**
     * 最终分数
     */
    private Integer score;

    /**
     * 游戏时长（秒）
     */
    private Long duration;

    /**
     * 剩余生命（可选）
     */
    private Integer lives;

    /**
     * 当前关卡（可选）
     */
    private Integer level;

    /**
     * 是否胜利（可选）
     */
    private Boolean isWin;

    /**
     * 详细数据（JSON格式，自定义字段）
     */
    private Map<String, Object> details;
}
